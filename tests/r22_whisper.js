const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
(async()=>{
 await wait(1000);
 w.tab('settings');await wait(40);
 ok(/Whisper.*\(GGML\)/.test(d.getElementById('app').textContent),'Whisper integration appears in Settings');
 w.eval('ui.whisperOpen=true;render()');await wait(30);
 const input=d.getElementById('whisperModelFile');
 ok(!!input&&input.accept.includes('.bin'),'model picker accepts .bin files');
 w.eval("window.whisperEngine={hasModel:false,ready:false,modelName:'',modelSize:0,formatBytes:n=>Math.round(n/1048576)+' MB',importModel:async f=>{window.__importedName=f.name;window.whisperEngine.hasModel=true;window.whisperEngine.ready=true;return true},prepare:async()=>true,removeModel:async()=>true,start:(k,c,l)=>Promise.resolve('أبو خالد 50 رز'),stop:async()=>{},cancel:()=>{}};");
 await w.eval("importWhisperModel({files:[{name:'ggml-tiny.bin'}],value:'test'})");await wait(40);
 ok(w.eval("window.__importedName==='ggml-tiny.bin'&&sec.whisper===true"),'successful import enables Whisper');
 const cid=w.eval('DD().customers[0].id');
 w.eval("db.lang='ar';startRec('debt','"+cid+"')");await wait(60);
 ok(w.eval("ui.rec&&ui.rec.st==='edit'&&ui.rec.d.amt===5000"),'recognized Whisper text enters the reviewed amount form');
 ok(w.eval("window.whisperEngine.ready===true"),'engine readiness gates recording');
 w.eval('cancelRec()');
 done();
})().catch(e=>{console.log('ERROR:',e);process.exit(1)});
