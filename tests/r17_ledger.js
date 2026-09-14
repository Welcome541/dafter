const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
(async()=>{
 await wait(1000);
 const E=(x)=>w.eval(x);
 w.eval("DD().customers.push({id:'L1',name:'عميل السيناريوهات',phone:'',since:'2026',archived:false,pinned:false});render()");
 const inv=(a,ts,extra)=>E("DD().invoices.push(Object.assign({id:'s'+Math.random().toString(36).slice(2,7),code:'S1',cust:'L1',ts:"+(ts||"Date.now()")+",amount:"+a+"},"+(extra||"{}")+"));render()");
 const pay=(a)=>E("DD().payments.push({id:'p'+Math.random().toString(36).slice(2,7),cust:'L1',ts:Date.now(),amount:"+a+",method:'cash',alloc:[]});render()");
 const bal=()=>E("Ledger.bal(DD(),'L1')");
 // scenario 1
 inv(7000); ok(bal()===7000,'S1 debt 70 -> 7000');
 inv(3000); ok(bal()===10000,'S1 +30 -> 10000');
 pay(4000); ok(bal()===6000,'S1 pay 40 -> 6000');
 pay(10000); ok(bal()===-4000,'S1 overpay -> -4000 credit kept');
 inv(2500); ok(bal()===-1500,'S1 +25 -> -1500');
 // scenario 2: opening balance not in today's debts
 const td0=E("(()=>{const a=new Date();a.setHours(0,0,0,0);return Ledger.todayDebt(DD(),a.getTime(),a.getTime()+86400000)})()");
 E("addOpening('L1',35000)");
 const td1=E("(()=>{const a=new Date();a.setHours(0,0,0,0);return Ledger.todayDebt(DD(),a.getTime(),a.getTime()+86400000)})()");
 ok(bal()===33500,'S2 opening counted in balance');
 ok(td1===td0,'S2 opening NOT in today debts');
 // scenario 3: old paper debt changes balance not today
 const td2=td1;
 inv(5000,"Date.now()-86400000","{src:'paper'}");
 ok(bal()===38500,'S3 old debt in balance');
 ok(E("(()=>{const a=new Date();a.setHours(0,0,0,0);return Ledger.todayDebt(DD(),a.getTime(),a.getTime()+86400000)})()")===td2,'S3 old debt not in today');
 // scenario 4: double save -> exactly one entry (manual sheet dedupe)
 w.eval("openDebtSheet('L1')"); await wait(40);
 d.getElementById('md_a').value='12';
 w.eval("manualDebtSave();manualDebtSave();manualDebtSave();"); await wait(60);
 ok(E("DD().invoices.filter(i=>i.cust==='L1'&&i.amount===1200).length")===1,'S4 triple-tap -> one entry');
 // scenario 5: return reverses exactly, original kept
 const n0=E("DD().invoices.length");
 w.eval("openReturnSheet('"+''+"')"); // noop safe
 const iid=E("DD().invoices.filter(i=>i.cust==='L1'&&i.amount===1200)[0].id");
 const b0=bal();
 w.eval("applyReturn('"+iid+"',2)"); await wait(60);
 ok(bal()===b0-200,'S5 return reverses exactly 2.00');
 ok(E("DD().invoices.length")===n0+0+ (E("DD().invoices.filter(i=>i.cust==='L1').length")?0:0)&&E("DD().invoices.some(i=>i.id==='"+iid+"')"),'S5 original entry kept');
 ok(E("DD().invoices.find(i=>i.id==='"+iid+"').edits.length")===1,'S5 audit edit logged');
 // scenario 6+7 in r18; property test
 let good=true;
 const seq=E("(()=>{let s=0;const ops=[];for(let i=0;i<2000;i++){const debt=Math.random()<0.55;const a=(1+Math.floor(Math.random()*50000));ops.push([debt,a]);s+=debt?a:-a}return {ops,expect:s}})()");
 E("DD().customers.push({id:'L2',name:'عشوائي',phone:'',since:'2026',archived:false,pinned:false})");
 E("window.__ops="+JSON.stringify(seq.ops));
 E("__ops.forEach(o=>{if(o[0])DD().invoices.push({id:'r'+Math.random().toString(36).slice(2,8),code:'R',cust:'L2',ts:Date.now()-1000000,amount:o[1],src:'test'});else DD().payments.push({id:'q'+Math.random().toString(36).slice(2,8),cust:'L2',ts:Date.now()-1000000,amount:o[1],method:'cash',alloc:[]})})");
 ok(E("Ledger.bal(DD(),'L2')")===seq.expect,'property: 2000-op random sequence recomputes exactly');
 // invariants on whole db
 ok(E("Invariants.check(db)")==='','invariants pass on live db');
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
