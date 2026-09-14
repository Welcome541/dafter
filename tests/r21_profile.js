const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
const txt=()=>d.getElementById('app').textContent;
const E=x=>w.eval(x);
(async()=>{
 await wait(1000);
 // build a rich history for one customer: opening + debt + edit + payment
 E("(function(){const c=DD().customers.find(x=>!x.archived);window.__cid=c.id;addOpening(c.id,2000)})()");
 E("(function(){const c=cust(window.__cid);const i={id:uid(),code:'A'+(DD().seq++),cust:c.id,ts:Date.now()-5*D,amount:10000,note:'مؤونة'};DD().invoices.push(i);window.__iid=i.id;save()})()");
 E("(function(){DD().invoices.find(i=>i.id===window.__iid).edits=[{ts:Date.now()-4*D,from:10000,to:9000,note:'كسر كيس',kind:'return'}];save()})()");
 E("(function(){DD().payments.push({id:uid(),cust:window.__cid,ts:Date.now()-2*D,amount:4000,method:'cash',alloc:[{inv:window.__iid,amt:4000}]});save()})()");
 w.eval("stack=[{s:'profile',p:{id:window.__cid}}];render()"); await wait(80);
 ok(E("curScr().s==='profile'"),'on profile');
 // full log present with correct count
 const expN=E("custInvoices(window.__cid).length + custInvoices(window.__cid).reduce((s,i)=>s+(i.edits||[]).length,0) + DD().payments.filter(p=>p.cust===window.__cid).length");
 ok(d.getElementById('pfeed'),'transaction log section exists');
 const rows=[...d.querySelectorAll('#pfeed .litem')];
 ok(rows.length===expN,'log rows = invoices + edits + payments ('+expN+')');
 ok(txt().includes('سجل المعاملات'),'section titled سجل المعاملات');
 // labels per type
 const ft=d.getElementById('pfeed').textContent;
 ok(/رصيد من الدفتر السابق|رصيد/.test(ft),'opening entry labelled');
 ok(/سداد/.test(ft),'payment entry labelled سداد');
 ok(/مرتجع/.test(ft),'return/edit entry labelled مرتجع');
 // signs: payments +, debts -
 ok(/سداد/.test(rows.find(r=>/سداد/.test(r.textContent)).textContent)&&rows.find(r=>/سداد/.test(r.textContent)).textContent.includes('+'),'payment row signed +');
 const debtRow=rows.find(r=>/مؤونة/.test(r.textContent));
 ok(debtRow&&debtRow.textContent.includes('-'),'debt row signed -');
 // chronological order (desc)
 const ts=E("[...document.querySelectorAll('#pfeed .litem')].length&&custFeed(window.__cid).map(e=>e.ts)");
 ok(ts.every((v,i,a)=>i===0||a[i-1]>=v),'log sorted newest first');
 // tapping payment row opens details sheet with allocation
 const payRow=rows.find(r=>/سداد/.test(r.textContent));
 payRow.click(); await wait(60);
 ok(/تفاصيل السداد/.test(d.getElementById('sheet').textContent),'payment tap -> details sheet');
 ok(/A\d+/.test(d.getElementById('sheet').textContent),'details list allocated invoice code');
 // allocation row navigates to that invoice
 d.querySelector('#sheet .srow').click(); await wait(60);
 ok(E("curScr().s==='invoice'"),'allocation tap opens invoice');
 // tapping debt row from feed opens invoice
 w.eval("stack=[{s:'profile',p:{id:window.__cid}}];render()"); await wait(60);
 [...d.querySelectorAll('#pfeed .litem')].find(r=>/مؤونة/.test(r.textContent)).click(); await wait(60);
 ok(E("curScr().s==='invoice'"),'debt tap opens invoice');
 // invoices section still present with status seg below the log
 w.eval("stack=[{s:'profile',p:{id:window.__cid}}];render()"); await wait(60);
 ok(txt().includes('الفواتير')&&d.querySelectorAll('.seg button').length>=4,'invoices section with filters kept');
 // archived customer also shows full log
 E("cust(window.__cid).archived=true;save()");
 w.eval("stack=[{s:'profile',p:{id:window.__cid}}];render()"); await wait(60);
 ok(d.getElementById('pfeed')&&d.getElementById('pfeed').querySelectorAll('.litem').length===expN,'archived customer keeps full history');
 E("cust(window.__cid).archived=false;save()");
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
