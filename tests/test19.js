// v7 checks: rebrand دَفتَري, Chart.js charts + fallback, OCR import, quota guard, TTS on debt record
const {boot,wait,mk}=require('./h.js');
(async()=>{
const {ok,done}=mk();

// --- window 1: rebrand + fallback + OCR guard + TTS debt + quota ---
let w=boot({tts:true});w.eval('sec.speak=true');
await wait(300);
ok(w.document.title==='دَفتَري','title ar = دَفتَري');
w.tab('settings');await wait(60);
const home=w.document.getElementById('app').innerHTML;
ok(!home.includes('دَفتَري'),'settings brand card removed (future option)');
ok(!home.includes('دفتر ديون البقالة'),'tagline removed with brand card');
ok(!home.includes('>appName<'),'no raw appName key leaked');
w.tab('home');await wait(40);
w.tab('reports');await wait(60);
let html=w.document.getElementById('app').innerHTML;
ok(!html.includes('<canvas id="chW">'),'fallback: no canvas when Chart.js absent');
ok(html.includes('align-items:flex-end'),'fallback CSS bars rendered');
ok(w.eval('chartOK()')===false,'chartOK() false without Chart');
w.openImport();await wait(40);
ok(w.document.getElementById('sheet').innerHTML.includes('صورة دفتر قديم (OCR)'),'OCR button present in import sheet');
w.ocrPick();await wait(40);
ok(w.document.getElementById('toast').textContent.includes('تعذّرت القراءة'),'ocrNo toast when Tesseract missing');
w.closeSheet();await wait(30);
// TTS on debt record via recConfirm
const nm=w.eval('DD().customers[0].name');
w.eval('ui.rec={kind:"debt",edit:false,cands:[],d:{custId:DD().customers[0].id,amt:77,note:"رز",say:"رز 77"}};recConfirm();');
await wait(80);
const said=w.speechSynthesis.said.join('|');
ok(said.includes(nm),'TTS spoke customer name on debt record ('+nm+')');
ok(/77/.test(said),'TTS spoke amount on debt record');
ok(said.includes(w.eval('t("newDebt")')),'TTS spoke debt word');
// quota guard
w.eval('const __ls=localStorage;Object.defineProperty(window,"localStorage",{configurable:true,value:{getItem:k=>__ls.getItem(k),removeItem:k=>__ls.removeItem(k),setItem:()=>{throw new Error("QuotaExceeded")}}})');
w.save();await wait(40);
ok(w.document.getElementById('toast').textContent.includes('امتلأت مساحة التخزين'),'quota toast when save fails');

// --- window 2: charts positive path with stubbed Chart + canvas ---
let w2=boot({});
await wait(300);
w2.HTMLCanvasElement.prototype.getContext=function(){return{}};
w2.eval('window.__made=[];window.Chart=function(cv,cfg){this.cfg=cfg;window.__made.push(cfg.type);this.destroy=function(){window.__made.push("d")}};');
ok(w2.eval('chartOK()')===true,'chartOK() true with Chart + canvas');
w2.eval('ui.repMore=true');w2.tab('reports');await wait(80);
let h2=w2.document.getElementById('app').innerHTML;
ok(h2.includes('<canvas id="chW">'),'weekly canvas rendered');
ok(h2.includes('<canvas id="chM">'),'monthly canvas rendered');
ok(h2.includes(w2.eval('t("m6")')),'monthly chart card title shown');
ok(w2.eval('window.__made.filter(x=>x==="bar").length')>=2,'Chart instantiated for week + month');

// --- window 3: OCR positive path with Tesseract stub ---
let w3=boot({});
await wait(300);
const before=w3.eval('DD().customers.length');
w3.eval('window.__cap=null;const _ce=document.createElement.bind(document);document.createElement=t=>{const el=_ce(t);if(t==="input")window.__cap=el;return el};');
w3.Tesseract={recognize:()=>Promise.resolve({data:{text:'عليOCR، 45، خبز\nمنىOCR، 120'}})};
w3.ocrPick();await wait(40);
const cap=w3.__cap;
ok(!!cap&&cap.type==='file','ocrPick created file input');
Object.defineProperty(cap,'files',{value:[{name:'x.jpg'}],configurable:true});
cap.onchange();await wait(150);
const after=w3.eval('DD().customers.length');
ok(after===before+2,'OCR text imported 2 customers (got '+(after-before)+')');
ok(w3.eval("DD().customers.some(c=>c.name==='منىOCR')"),'OCR customer name parsed');
ok(w3.eval("DD().invoices.some(i=>i.amount===4500)"),'OCR amount parsed');

// --- window 4: EN rebrand ---
let w4=boot({});await wait(200);
w4.eval("setLang('en')");await wait(60);
ok(w4.document.title==='Daftari','title en = Daftari');
w4.tab('settings');await wait(60);
ok(!w4.document.getElementById('app').innerHTML.includes('Daftari'),'EN settings brand card removed');
done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
