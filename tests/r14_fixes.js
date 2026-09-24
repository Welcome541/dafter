const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
(async()=>{
 await wait(1000);
 // a11y names
 w.eval("tab('settings')"); await wait(80);
 ok([...d.querySelectorAll('[role=switch]')].every(x=>x.getAttribute('aria-label')),'all switches named');
 ok([...d.querySelectorAll('select')].every(x=>x.getAttribute('aria-label')),'all selects named');
 // dead UI gone
 ok(w.eval("typeof openTxFilter==='function'&&S_home().indexOf('openTxFilter()')>=0&&txFilterBtn().indexOf('openTxFilter()')>=0"),'openTxFilter is live code, wired into the home filter icon');
 ok(w.eval("typeof refreshHome")==='function','refreshHome kept');
 // accurate badge + show more
 w.eval("tab('home')"); await wait(60);
 const cid=w.eval("DD().customers[0].id");
 w.eval("for(let i=0;i<70;i++)DD().invoices.push({id:'q'+i,code:'Q'+i,cust:'"+cid+"',ts:Date.now()-i*36e5,amount:1,note:'q'});render()"); await wait(80);
 const full=w.eval("txAll().length");
 ok(parseInt(d.getElementById('txn').textContent)===full,'badge shows true total ('+full+')');
 ok(d.getElementById('txlist').textContent.includes(w.eval("t('showMore')")),'show-more appears past 60');
 const rows0=w.eval("document.querySelectorAll('#txlist .litem').length");
 w.eval("ui.txLimit=130;refreshHome()"); await wait(60);
 ok(w.eval("document.querySelectorAll('#txlist .litem').length")>rows0,'show-more grows the list');
 w.eval("for(let i=0;i<70;i++)DD().invoices=DD().invoices.filter(x=>x.id!=='q'+i);ui.txLimit=60;render()"); await wait(60);
 // currency via sheet not prompt
 w.eval("openCurSheet()"); await wait(60);
 ok(!!d.getElementById('curIn'),'currency sheet has input (no prompt())');
 d.getElementById('curIn').value='د.ك';
 w.eval("saveCur()"); await wait(60);
 ok(w.eval("curAcc().cur")==='د.ك','custom currency saved via sheet');
 w.eval("setCur('ر.س')");
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
