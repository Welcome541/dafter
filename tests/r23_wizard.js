const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
const E=x=>w.eval(x);
const sh=()=>d.getElementById('sheet');
const vis=id=>{const e=d.getElementById(id);return !!e&&e.style.display!=='none'};
(async()=>{
 await wait(1100);
 E("tab('home')"); await wait(80);

 /* ---------- the stepped manual entry ---------- */
 E("openWiz('debt')"); await wait(140);
 ok(E("!!ui.wiz&&ui.wiz.kind==='debt'&&ui.wiz.step===1"),'debt wizard opens on step 1');
 const steps=[...sh().querySelectorAll('.wiz-st')];
 ok(steps.length===3,'the flow is presented as three steps');
 ok(steps.map(s=>s.querySelector('.wiz-lb').textContent).join()===[E("t('cust')"),E("t('amount')"),E("t('confirmReg')")].join(),'steps are labelled customer / amount / confirm');
 ok(steps[0].classList.contains('on')&&steps[0].getAttribute('aria-current')==='step','the current step is marked for assistive tech');
 ok(sh().querySelectorAll('.wiz-bar').length===2,'the steps are joined by progress bars');
 ok(sh().textContent.includes(E("t('stepLbl')")),'the sheet states which step you are on');

 /* ---------- step 1: a real customer picker ---------- */
 const picks=()=>[...sh().querySelectorAll('#wzlist .wiz-pick')];
 const total=E("DD().customers.filter(c=>!c.archived).length");
 ok(picks().length===total,'every active customer is offered');
 ok(picks().every(p=>p.tagName==='BUTTON'),'each customer is a real button');
 ok(picks().every(p=>!!p.querySelector('.wiz-nm')&&!!p.querySelector('.wiz-bal')),'each row shows the name and the balance');
 ok(!!d.getElementById('wzq'),'the picker has a search field');
 const first=E("DD().customers.find(c=>!c.archived).name");
 E("wizQ("+JSON.stringify(first.slice(0,2))+")"); await wait(60);
 ok(picks().length>=1&&picks().length<total,'searching narrows the list');
 E("wizQ('قققنادر')"); await wait(60);
 ok(picks().length===0&&sh().textContent.includes(E("t('noCustQ')")),'an unmatched search says so instead of showing a blank list');
 E("wizQ('')"); await wait(60);

 /* ---------- step 2: the keyboard comes up on its own ---------- */
 const cid=E("DD().customers.find(c=>!c.archived).id");
 E("wizPick('"+cid+"')"); await wait(300);
 ok(E("ui.wiz.step")===2,'picking a customer advances to step 2');
 ok(vis('wz2')&&!vis('wz1'),'only the amount panel is shown');
 ok(d.activeElement&&d.activeElement.id==='md_a','the amount field takes focus so the keyboard opens');
 ok(d.getElementById('md_a').getAttribute('inputmode')==='decimal','the amount field asks for a decimal keypad');
 ok(!!d.getElementById('md_n')&&!!d.getElementById('md_d'),'the note and due-date fields are there');
 ok(E("document.getElementById('md_c').value")===cid,'the hidden select carries the chosen customer for the save path');
 ok(sh().textContent.includes(first.split(' ')[0]),'the chosen customer is shown above the form');
 ok(!!sh().querySelector('[onclick="wizGo(1)"]'),'the chosen customer can be changed');
 const st2=[...sh().querySelectorAll('.wiz-st')];
 ok(st2[0].classList.contains('done')&&!!st2[0].querySelector('svg'),'a finished step shows a check mark');
 ok(st2[1].classList.contains('on'),'and the current step is highlighted');

 /* ---------- validation ---------- */
 E("wizNext()"); await wait(90);
 ok(E("ui.wiz.step")===2,'you cannot reach the review without an amount');
 ok(d.getElementById('toast').textContent.includes(E("t('enterAmt')")),'and you are told why');

 /* ---------- step 3: review, then save ---------- */
 d.getElementById('md_a').value='125.50';
 d.getElementById('md_n').value='رز وسكر';
 d.getElementById('md_d').value='2026-10-01';
 E("wizNext()"); await wait(170);
 ok(E("ui.wiz.step")===3&&vis('wz3'),'a valid amount opens the review step');
 const rows=[...sh().querySelectorAll('.wiz-row')].map(r=>r.textContent.replace(/\s+/g,' ').trim());
 ok(rows.some(r=>r.includes(first)),'the review names the customer');
 ok(rows.some(r=>r.includes('125.50')),'the review shows 125.50, not 12550 minor units');
 ok(rows.some(r=>r.includes('رز وسكر')),'the review shows the note');
 ok(rows.some(r=>r.includes(E("t('afterOp')"))),'the review projects the balance after the entry');
 E("wizGo(2)"); await wait(220);
 ok(d.getElementById('md_a').value==='125.50'&&d.getElementById('md_n').value==='رز وسكر','going back keeps what was typed');
 E("wizNext()"); await wait(170);
 const n0=E("DD().invoices.length");
 E("wizSave()"); await wait(220);
 ok(E("DD().invoices.length")===n0+1,'confirming records exactly one debt');
 const inv=E("DD().invoices[DD().invoices.length-1]");
 ok(inv.amount===12550,'stored as 12550 minor units = 125.50');
 ok(inv.cust===cid&&inv.note==='رز وسكر','stored against the right customer with the note');
 ok(!d.getElementById('sheetWrap').classList.contains('open'),'the sheet closes after saving');
 ok(E("ui.wiz")===null,'the wizard state is cleared');

 /* ---------- the payment wizard ---------- */
 E("openWiz('pay')"); await wait(140);
 E("wizPick('"+cid+"')"); await wait(300);
 ok(!!d.getElementById('qp_a'),'the payment step has its own amount field');
 ok(d.activeElement&&d.activeElement.id==='qp_a','and it takes focus too');
 const methods=[...sh().querySelectorAll('.seg button')].map(b=>b.textContent.trim());
 ok(methods.join()===[E("t('cash')"),E("t('transfer')"),E("t('cardpay')")].join(),'the three payment methods are offered');
 const owed=E("custOpen('"+cid+"')");
 d.getElementById('qp_a').value='30'; E("wizImp()"); await wait(70);
 ok((d.getElementById('wzimp').textContent||'').trim().length>0,'typing an amount previews how it will be allocated');
 E("wizM('transfer')"); await wait(220);
 ok(E("ui.qpM")==='transfer','the method is recorded');
 ok(d.getElementById('qp_a').value==='30','changing the method does not lose the amount');
 E("wizNext()"); await wait(170);
 ok([...sh().querySelectorAll('.wiz-row')].some(r=>r.textContent.includes(E("t('transfer')"))),'the review shows the chosen method');
 const p0=E("DD().payments.length");
 E("wizSave()"); await wait(220);
 ok(E("DD().payments.length")===p0+1,'one payment is recorded');
 const py=E("DD().payments[DD().payments.length-1]");
 ok(py.amount===3000&&py.method==='transfer','30.00 by transfer');
 ok(Array.isArray(py.alloc)&&py.alloc.reduce((a,b)=>a+b.amt,0)<=3000,'the payment is allocated to invoices without exceeding the amount');
 ok(E("custOpen('"+cid+"')")===owed-3000,'the balance drops by exactly 30.00');

 /* ---------- the real buttons lead here ---------- */
 E("closeSheet();tab('home')"); await wait(90);
 E("btnClick('debt')"); await wait(170);
 ok(E("!!ui.wiz&&ui.wiz.kind==='debt'"),'the debt button opens the wizard');
 ok(sh().textContent.includes(E("t('manualDebt')")),'and is titled as manual entry');
 E("closeSheet();ui.wiz=null;btnClick('pay')"); await wait(170);
 ok(E("!!ui.wiz&&ui.wiz.kind==='pay'"),'the payment button opens the wizard');
 E("closeSheet();ui.wiz=null;btnDown('debt')"); await wait(60); E("btnUp('debt')"); await wait(170);
 ok(E("!!ui.wiz&&ui.wiz.kind==='debt'"),'a short press on the long-press button also opens the wizard');
 ok(!!d.getElementById('md_a'),'with the amount field ready to type into');
 E("closeSheet();ui.wiz=null");

 /* ---------- personal account: no customer step ---------- */
 E("curAcc().type='personal';save();render()"); await wait(120);
 E("openWiz('debt')"); await wait(220);
 ok(E("ui.wiz.step")===2,'a personal account skips the customer step');
 ok(!d.getElementById('md_c'),'and has no hidden customer select');
 d.getElementById('md_a').value='15'; E("wizNext()"); await wait(170);
 ok([...sh().querySelectorAll('.wiz-row')].some(r=>r.textContent.includes(E("t('personal')"))),'the review says it is the personal account');
 const n1=E("DD().invoices.length"); E("wizSave()"); await wait(200);
 ok(E("DD().invoices.length")===n1+1&&E("DD().invoices[DD().invoices.length-1].amount")===1500,'the expense is recorded as 15.00');
 E("curAcc().type='grocery';save();render()"); await wait(100);

 /* ---------- an account with no customers is handled ---------- */
 E("window.__snap=JSON.parse(JSON.stringify(db.data[db.active]));db.data[db.active]={customers:[],invoices:[],payments:[],seq:1};save()");
 E("openWiz('debt')"); await wait(140);
 ok(E("!ui.wiz"),"the wizard does not open with no customers");
 ok(d.getElementById('toast').textContent.includes(E("t('noCustomers')")),'the user is told there are no customers yet');
 E("db.data[db.active]=JSON.parse(JSON.stringify(window.__snap));save();render()");
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
