/* Local Whisper integration for the dafter 2.20 UI. */
(function(){
  'use strict';
  var KEY='dafter2.whisper.enabled', session=null, initDone=false;
  var enabled=function(){try{return localStorage.getItem(KEY)==='1'}catch(e){return false}};
  var lang=function(){try{return document.documentElement.lang==='en'||(typeof db!=='undefined'&&db.lang==='en')?'en':'ar'}catch(e){return 'ar'}};
  var txt=function(ar,en){return lang()==='en'?en:ar};
  function toast(s){try{if(typeof toastMsg==='function')toastMsg(s);else alert(s)}catch(e){}}
  function setStatus(){
    var status=document.getElementById('whisperModelStatus'), toggle=document.getElementById('whisperUseBtn');
    if(status){
      var e=window.whisperEngine;
      status.textContent=e&&e.hasModel?(e.modelName+' · '+e.formatBytes(e.modelSize)):
        txt('لم يُستورد نموذج بعد','No model imported');
    }
    if(toggle)toggle.textContent=enabled()?txt('Whisper مفعّل للتسجيل','Whisper selected for recording'):txt('استخدام Whisper للتسجيل','Use Whisper for recording');
  }
  function inject(){
    try{
      if(typeof curScr!=='function'||curScr().s!=='settings')return;
      var app=document.getElementById('app');if(!app||document.getElementById('whisperSettingsCard'))return;
      var card=document.createElement('div');card.id='whisperSettingsCard';card.className='card';card.style.cssText='margin-top:16px;padding:12px 16px';
      card.innerHTML='<div style="font-weight:800;font-size:15px;margin:2px 0 8px">Whisper دون إنترنت (GGML)</div>'+
        '<div id="whisperModelStatus" class="muted" style="font-size:12px;line-height:1.8;margin-bottom:10px"></div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
        '<button id="whisperImportBtn" class="btn btn-soft" type="button">استيراد ggml-tiny.bin</button>'+
        '<button id="whisperUseBtn" class="btn btn-line" type="button"></button>'+
        '<button id="whisperRemoveBtn" class="btn btn-line" type="button">إزالة نموذج Whisper</button></div>'+
        '<input id="whisperModelFile" type="file" accept=".bin,application/octet-stream" style="display:none">'+
        '<div class="muted" style="font-size:11px;line-height:1.8;margin-top:8px">اختر نموذج Whisper بصيغة GGML مثل ggml-tiny.bin. يبقى الملف على هذا الهاتف؛ لا تستخدم GGUF أو ملف Vosk هنا.</div>';
      app.appendChild(card);
      card.querySelector('#whisperImportBtn').addEventListener('click',function(){card.querySelector('#whisperModelFile').click()});
      card.querySelector('#whisperModelFile').addEventListener('change',window.importWhisperModel);
      card.querySelector('#whisperUseBtn').addEventListener('click',window.toggleWhisperMode);
      card.querySelector('#whisperRemoveBtn').addEventListener('click',window.removeWhisperModel);
      setStatus();
    }catch(e){console.error('Whisper settings UI',e)}
  }
  window.importWhisperModel=async function(input){
    var f=input&&input.files&&input.files[0];if(!f)return;
    try{
      toast(txt('جارٍ فحص وحفظ النموذج محليًا…','Checking and saving model locally…'));
      await window.whisperEngine.importModel(f);
      await window.whisperEngine.loadMeta();
      toast(txt('تم استيراد النموذج. جهّز Whisper عند أول تسجيل.','Model imported. Whisper will initialize on first recording.'));
    }catch(e){toast(txt('فشل الاستيراد: ','Import failed: ')+(e&&e.message||e))}
    finally{input.value='';setStatus()}
  };
  window.toggleWhisperMode=function(){
    if(!window.whisperEngine||!window.whisperEngine.hasModel){toast(txt('استورد ggml-tiny.bin أولًا.','Import ggml-tiny.bin first.'));return}
    try{localStorage.setItem(KEY,enabled()?'0':'1')}catch(e){toast(txt('تعذّر حفظ الإعداد.','Could not save setting.'));return}
    setStatus();toast(enabled()?txt('سيُستخدم Whisper للتسجيل الصوتي.','Whisper will be used for voice recording.'):txt('تم إيقاف Whisper؛ سيعمل محرك Vosk/الهاتف.','Whisper disabled; Vosk/phone engine will be used.'));
  };
  window.removeWhisperModel=async function(){
    if(!confirm(txt('إزالة نموذج Whisper المخزن من هذا الهاتف؟','Remove the stored Whisper model from this phone?')))return;
    try{await window.whisperEngine.removeModel();localStorage.setItem(KEY,'0');toast(txt('تمت إزالة النموذج.','Model removed.'))}
    catch(e){toast(txt('تعذّرت الإزالة: ','Could not remove: ')+(e&&e.message||e))}
    setStatus();
  };
  window.addEventListener('whisper-model-change',setStatus);
  var oldRender=window.render;
  if(typeof oldRender==='function')window.render=function(){var r=oldRender.apply(this,arguments);inject();return r};

  function installRecordingHooks(){
    if(initDone||typeof window.startRec!=='function'||typeof window.endRec!=='function')return;
    initDone=true;
    var originalStart=window.startRec, originalEnd=window.endRec, originalCancel=window.cancelRec;
    var originalMeter=window.startMicMeter, originalTry=window.tryWebASR;
    window.startRec=function(kind,custId){
      if(!enabled())return originalStart.apply(this,arguments);
      if(!window.whisperEngine||!window.whisperEngine.hasModel){toast(txt('استورد نموذج Whisper أولًا أو أوقف خيار Whisper.','Import a Whisper model or turn Whisper off.'));return}
      if(session){toast(txt('يوجد تسجيل صوتي جارٍ.','A recording is already active.'));return}
      session={kind:kind,custId:custId||null,promise:null,ending:false};
      var oldVosk;
      try{oldVosk=sec.vosk;sec.vosk=false}catch(e){}
      window.startMicMeter=function(){};
      window.tryWebASR=function(){return true};
      try{originalStart.apply(this,arguments)}catch(e){session=null;window.startMicMeter=originalMeter;window.tryWebASR=originalTry;toast(String(e));return}
      window.startMicMeter=originalMeter;window.tryWebASR=originalTry;
      try{sec.vosk=oldVosk}catch(e){}
      try{if(typeof ui!=='undefined'&&ui.rec)ui.rec.whisper=true}catch(e){}
      var current=session;
      current.promise=window.whisperEngine.prepare().then(function(){return window.whisperEngine.start(kind,custId,lang())});
      current.promise.catch(function(e){
        if(session!==current||current.ending)return;
        current.ending=true;session=null;
        try{if(typeof stopMicMeter==='function')stopMicMeter();if(window.__recTick)clearInterval(window.__recTick);originalEnd.call(window)}catch(err){}
        toast(txt('تعذّر بدء Whisper: ','Whisper could not start: ')+(e&&e.message||e));
      });
    };
    window.endRec=function(){
      if(!session)return originalEnd.apply(this,arguments);
      var current=session;if(current.ending)return;current.ending=true;
      try{if(typeof stopMicMeter==='function')stopMicMeter();if(window.__recTick)clearInterval(window.__recTick)}catch(e){}
      window.whisperEngine.stop().catch(function(){});
      Promise.resolve(current.promise).then(function(text){
        if(session!==current)return;session=null;
        if(typeof window.voskOnText==='function')window.voskOnText(current.kind,text,1);
        else{originalEnd.call(window);toast(txt('لم يمكن تمرير النص إلى التطبيق.','Could not pass text to the app.'))}
      }).catch(function(e){
        if(session!==current)return;session=null;originalEnd.call(window);
        toast(txt('تعذّر التعرف: ','Transcription failed: ')+(e&&e.message||e));
      });
    };
    if(typeof originalCancel==='function')window.cancelRec=function(){if(session){window.whisperEngine.cancel();session=null}return originalCancel.apply(this,arguments)};
  }
  installRecordingHooks();
  document.addEventListener('DOMContentLoaded',function(){installRecordingHooks();inject()});
  setTimeout(function(){installRecordingHooks();inject()},0);
})();
