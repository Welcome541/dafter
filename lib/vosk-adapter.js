/* دَفتَر — Vosk adapter
   يفعَّل تلقائيًا إذا وُجدت ملفات vosk-browser + model-ar (راجع VOSK-SETUP.md).
   يعرّف window.voskEngine={ready,start} الذي يستدعيه التطبيق عند اختيار محرك VOSK. */
(function(){
  if(window.voskEngine)return;
  var ready=false,rec=null,modelP=null;
  function hasVosk(){return typeof window.createModel==='function'||typeof window.voskKaldi==='function'||(window.vosk&&typeof window.vosk.createModel==='function')}
  try{
    if(hasVosk()){
      var mk=(window.createModel||window.vosk.createModel);
      modelP=mk('model-ar').then(function(m){rec=m;ready=true;});
    }
  }catch(e){}
  window.voskEngine={
    get ready(){return !!ready},
    start:function(kind,custId){
      if(!ready)return;
      var SR=window.AudioContext||window.webkitAudioContext;
      navigator.mediaDevices.getUserMedia({audio:true}).then(function(st){
        var ctx=new SR(),src=ctx.createMediaStreamSource(st),proc=ctx.createScriptProcessor(4096,1,1);
        src.connect(proc);proc.connect(ctx.destination);
        rec.setWords&&rec.setWords('');
        proc.onaudioprocess=function(e){
          if(rec.acceptWaveform&&rec.acceptWaveform(e.inputBuffer.getChannelData(0))){
            var r=JSON.parse(rec.result()).text||'';
            if(r){proc.onaudioprocess=null;st.getTracks().forEach(function(t){t.stop()});
              if(window.onVoskText)window.onVoskText(r,kind,custId);}
          }
        };
      });
    }
  };
  /* جسر إلى منطق التطبيق: يعيد استخدام parseSay/endRec الموجودين في التطبيق */
  window.onVoskText=function(text,kind,custId){
    if(typeof parseSay==='function'&&typeof ui!=='undefined'&&ui.rec){
      var pr=parseSay(text);
      ui.rec.d=kind==='debt'?{name:pr.name,amt:pr.amt,note:pr.note,due:null,say:text,custId:pr.custId}
                            :{name:pr.name,amt:pr.amt,method:'cash',say:text,custId:pr.custId};
      ui.rec.st='edit';render();
    }
  };
})();
