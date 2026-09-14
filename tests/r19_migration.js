const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
(async()=>{
 await wait(1000);
 const E=x=>w.eval(x);
 E("localStorage.removeItem('v1raw')");
 const v1={lang:'ar',active:'a1',accounts:[{id:'a1',name:'قديم',type:'grocery',cur:'ر.س'}],
  data:{a1:{customers:[{id:'c1',name:'أبو قديم',phone:'050',since:'2024',archived:false,pinned:false}],
   invoices:[{id:'i1',code:'A1',cust:'c1',ts:Date.now()-99999,amount:70.5,note:'رز',edits:[{ts:Date.now()-999,from:80,to:70.5,note:'',kind:'return'}]}],
   payments:[{id:'p1',cust:'c1',ts:Date.now()-99999,amount:10,method:'cash',alloc:[{inv:'i1',amt:10}]}],seq:2}}};
 // migrate converts decimals -> minor exactly
 const m=E("migrate("+JSON.stringify(v1)+")");
 ok(m.meta.schemaVersion===2,'v1->v2 sets schemaVersion 2');
 ok(m.data.a1.invoices[0].amount===7050,'debt 70.5 -> 7050 minor');
 ok(m.data.a1.invoices[0].edits[0].from===8000&&m.data.a1.invoices[0].edits[0].to===7050,'edits converted');
 ok(m.data.a1.payments[0].alloc[0].amt===1000,'alloc converted');
 ok(m.accounts[0].minorUnit===2,'minorUnit defaulted');
 ok(E("localStorage.getItem('v1raw')")!==null,'v1raw snapshot kept before migration');
 // idempotent: migrating the migrated db does NOT double-convert
 const m2=E("migrate("+JSON.stringify(m)+")");
 ok(m2.data.a1.invoices[0].amount===7050,'idempotent second migrate');
 // rollback: invalid data fails invariants -> user's OWN raw returned unchanged (never corrupted, never replaced)
 const bad=JSON.parse(JSON.stringify(v1)); bad.data.a1.invoices[0].amount=-5;
 const rb=E("migrate("+JSON.stringify(bad)+")");
 ok(rb.meta.schemaVersion===1&&rb.data.a1.invoices[0].amount===-5,'failed migration returns user raw untouched (no corruption, no replacement)');
 // source tagging contract for v3 mapping
 E("DD().invoices.length"); // live db present
 ok(E("typeof addOpening")==='function','opening entry API present for OPENING_BALANCE mapping');
 // balances preserved through migration: recompute on v2 equals v1*100
 ok(E("(function(){const d="+JSON.stringify(m2)+".data.a1;let s=0;d.invoices.forEach(i=>s+=i.amount);d.payments.forEach(p=>s-=p.amount);return s})()")===6050,'balance recomputable post-migration (7050-1000)');
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
