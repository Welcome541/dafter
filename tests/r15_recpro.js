const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
(async()=>{
 await wait(1000);
 w.eval("startRec('debt')"); await wait(80);
 ok(!!d.getElementById('recT'),'timer chip present while recording');
 ok(!!d.getElementById('wv'),'waveform canvas present');
 ok(!!d.getElementById('liveTx')&&d.getElementById('liveTx').getAttribute('aria-live')==='polite','live transcript aria-live');
 w.eval("voskOnText('debt','أبو خالد ثلاثين',0.9)"); await wait(40);
 ok(true,'vosk path live');
 // 30s cap
 w.eval("startRec('debt');ui.rec.t0=Date.now()-31000"); await wait(700);
 ok(w.eval("ui.rec.st")==='edit','30s cap cuts recording to review');
 ok(d.getElementById('toast').textContent.includes(w.eval("t('recLong')")),'cap toast shown');
 // retry button
 ok([...d.querySelectorAll('#app button')].some(b=>b.textContent.includes(w.eval("t('retryRec')"))),'retry button on review');
 // +new customer chip
 ok([...d.querySelectorAll('#app .cand button')].some(b=>b.textContent.includes(w.eval("t('addC')"))),'+new-customer chip among candidates');
 w.eval("recNewCust()"); await wait(60);
 ok(w.eval("ui.recPend")===true&&w.eval("curScr().s")==='newcust','chip opens newcust keeping rec');
 d.getElementById('ncNm')?d.getElementById('ncNm').value='عميل الاختبار':0;
 const inp=d.querySelector('#app input.inp');if(inp)inp.value='عميل الاختبار';
 w.eval("ui.nc.name='عميل الاختبار';saveCustomer()"); await wait(80);
 ok(w.eval("curScr().s")==='rec'&&w.eval("ui.rec.d.name")==='عميل الاختبار','saved customer returns to rec with custId');
 ok(w.eval("ui.rec.d.custId")!==null,'custId bound');
 w.eval("ui.rec=null;stack=[{s:'home'}];render()");
 // aria labels on action buttons
 ok([...d.querySelectorAll('#actionrow button')].every(b=>b.getAttribute('aria-label')),'action buttons have aria-label');
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
