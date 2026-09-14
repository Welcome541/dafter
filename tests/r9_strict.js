const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
const txt=()=>d.getElementById('app').textContent;
(async()=>{
 await wait(1000);
 // --- strict number understanding (digits + arabic words + colloquial) ---
 const cases=[['50',5000],['٥٠',5000],['خمسين',5000],['خمسة وعشرين',2500],['مئة وعشرين',12000],['مية وخمسين',15000],['ألف وخمسين',105000],['ثلاثمية',30000],['عشرين',2000],['twenty five',2500]];
 let allnum=true;
 for(const [t,v] of cases){const r=w.eval("amtFromText("+JSON.stringify(t)+").amt");if(r!==v){allnum=false;console.log('  numfail',t,r,v)}}
 ok(allnum,'amtFromText understands digits & spoken arabic/colloquial/en numbers');
 ok(w.eval("amtFromText('أبو خالد خمسين ريال').amt")===5000,'amount extracted inside sentence');
 ok(w.eval("parseSay('أبو خالد خمسين').amt")===5000,'parseSay: spoken amount 5000');
 ok(w.eval("parseSay('أبو خالد خمسين').name")==='أبو خالد','parseSay: name before spoken amount');
 ok(w.eval("parseSay('سارة مئة وعشرين ر.س').amt")===12000&&w.eval("parseSay('سارة مئة وعشرين ر.س').note")==='','parseSay: currency word stripped from note');
 // --- strict errors detection ---
 ok(w.eval("parseSay('أبو خالد').amt")===0,'no amount -> 0 (triggers warn path)');
 w.eval("ui.rec={kind:'debt',st:'confirm',warn:'noamt',cands:[],d:{name:'أبو خالد',amt:0,note:'',due:null,say:'أبو خالد'}};stack=[{s:'rec',p:{kind:'debt'}}];render()");
 ok(txt().includes(w.eval("t('warn_noamt')")),'no-amount warning banner shown');
 ok(txt().includes(w.eval("t('strictFix')")),'strict fix instruction shown with warning');
 w.eval("ui.rec={kind:'debt',st:'confirm',warn:'toobig',cands:[],d:{name:'x',amt:2000000,note:'',due:null,say:'x'}};stack=[{s:'rec',p:{kind:'debt'}}];render()");
 ok(txt().includes(w.eval("t('warn_toobig')")),'implausible amount warning shown');
 // --- rec screen shows strict rules card ---
 w.eval("ui.rec={kind:'debt',st:'rec',cands:[],d:{}};stack=[{s:'rec',p:{kind:'debt'}}];render()");
 ok(txt().includes(w.eval("t('strictT')")),'recording screen shows strict voice rules');
 ok(txt().includes(w.eval("t('strictRules')")),'rules list visible while recording');
 w.eval("cancelRec()");
 // --- vosk option: present, last, collapsed by default ---
 w.eval("sec.vosk=false;saveSec();tab('settings')");await wait(80);
 const st=txt();
 ok(st.includes(w.eval("t('voskOpt')")),'VOSK option row present in settings');
 ok(!st.includes(w.eval("t('voskHelp')")),'VOSK collapsed by default (no space taken)');
 const stt=txt();
 ok(stt.indexOf(w.eval("t('voskOpt')"))>stt.indexOf(w.eval("t('qrRecv')")),'VOSK row is after data/QR section (last)');
 w.eval("ui.voskOpen=true;render()");await wait(60);
 ok(txt().includes(w.eval("t('voskHelp')")),'expanding shows VOSK instructions');
 ok(txt().includes(w.eval("t('voskOn')")),'enable button visible when expanded');
 w.eval("ui.voskOpen=false;render()");
 // --- startRec with vosk enabled but engine absent: graceful fallback + toast ---
 w.eval("sec.vosk=true;saveSec()");
 w.eval("stack=[{s:'home'}];render()");
 w.eval("startRec('debt')");await wait(80);
 ok(w.eval("ui.rec&&ui.rec.st==='rec'"),'recording still starts when VOSK missing');
 w.eval("cancelRec()");w.eval("sec.vosk=false;saveSec()");
 // --- ASR onresult warn wiring (simulated) ---
 w.eval("startRec('debt')");await wait(50);
 const fake={results:[[{transcript:'أبو خالد',confidence:0.9}]],[0]:'x'};
 w.eval("ui.rec.warn=null; (function(){const res={transcript:'أبو خالد',confidence:0.9};const pr=parseSay(res.transcript);let warn=null;if(!res.transcript.trim())warn='nospeech';else if(pr.amt<=0)warn='noamt';else if(pr.amt>1000000)warn='toobig';else if(res.confidence<0.45)warn='lowconf';window.__w=warn})()");
 ok(w.eval("window.__w")==='noamt','warn logic flags missing amount');
 w.eval("cancelRec()");
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
