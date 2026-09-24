const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
(async()=>{
 await wait(1000);
 w.eval("tab('home')"); await wait(80);
 const app=()=>d.getElementById('phone');
 const sheet=()=>d.getElementById('sheet');

 /* --- home carries no inline filtering at all --- */
 ok(!d.getElementById('pchips'),'the old inline period chips are gone from home');
 ok(!app().querySelector('.seg'),'no segmented control on home');
 ok(![...app().querySelectorAll('button')].some(b=>/كل الأيام|هذا الأسبوع|هذا الشهر/.test(b.textContent)),'no period options scattered on home');
 ok(!d.querySelector('#stats1 .stat.red[onclick]'),'the debt card is not a filter shortcut');
 ok(!d.querySelector('#stats1 .stat.green[onclick]'),'the payment card is not a filter shortcut');

 /* --- one filter icon, in the search row --- */
 const btn=d.getElementById('tfbtn');
 ok(!!btn,'home has a single filter icon');
 ok(btn.tagName==='BUTTON','the filter icon is a real button');
 ok(!!btn.getAttribute('aria-label'),'the filter icon is labelled for screen readers');
 ok(btn.textContent.includes(w.eval("t('filter')")),'the filter icon is captioned');
 const searchRow=btn.closest('.pad');
 ok(!!searchRow&&!!searchRow.querySelector('input'),'the filter icon sits beside the search field');

 /* --- the sheet holds kind + period, nothing else --- */
 w.eval("openTxFilter()"); await wait(90);
 ok(sheet().textContent.includes(w.eval("t('filterTx')")),'the sheet is titled as the feed filter');
 const segs=[...sheet().querySelectorAll('.seg')];
 ok(segs.length===2,'exactly two groups: kind and period');
 const labels=s=>[...s.querySelectorAll('button')].map(b=>b.textContent.trim());
 ok(labels(segs[0]).join()===[w.eval("t('all')"),w.eval("t('newDebt')"),w.eval("t('pay')")].join(),'group 1 = all / debt / payment');
 ok(labels(segs[1]).join()===[w.eval("t('all')"),w.eval("t('pToday')"),w.eval("t('pWeek')"),w.eval("t('pMonth')")].join(),'group 2 = all / today / week / month');
 ok(!!sheet().querySelector('[onclick^="clearTF"]'),'the sheet offers a reset');

 /* --- choosing really filters --- */
 w.eval("db.data[db.active].invoices.push({id:'oldx',cust:db.data[db.active].customers[0].id,amount:5,ts:Date.now()-40*864e5,note:'q'})");
 const allN=w.eval("ui.tf={kind:'all',period:'all'};filteredTx().length");
 w.eval("setTFKind('debt')"); await wait(70);
 ok(w.eval("ui.tf.kind")==='debt','kind=debt recorded');
 ok(w.eval("filteredTx().every(x=>x.kind==='debt')"),'only debts remain');
 w.eval("setTFPeriod('month')"); await wait(70);
 ok(w.eval("ui.tf.period")==='month','period=month recorded');
 ok(!w.eval("filteredTx().some(x=>x.key==='d:oldx')"),'a 40-day-old entry is excluded by month');
 w.eval("setTFPeriod('week')"); await wait(70);
 ok(!w.eval("filteredTx().some(x=>x.key==='d:oldx')"),'…and by week as well');
 ok(w.eval("tfCount()")===2,'two active conditions are counted');
 w.eval("closeSheet();refreshHome()"); await wait(70);
 ok(d.getElementById('tfbtn').textContent.includes('2'),'the icon badges how many conditions are active');
 ok(d.getElementById('tfbtn').querySelector('.num'),'the badge is a numeric chip');

 /* --- reset --- */
 w.eval("openTxFilter();clearTF()"); await wait(80);
 ok(w.eval("ui.tf.kind==='all'&&ui.tf.period==='all'"),'reset clears both groups');
 ok(w.eval("filteredTx().length")===allN,'everything is visible again, including the old entry');
 w.eval("closeSheet();refreshHome()"); await wait(60);
 ok(!d.getElementById('tfbtn').querySelector('.num'),'the badge disappears when no filter is active');
 w.eval("db.data[db.active].invoices=db.data[db.active].invoices.filter(i=>i.id!=='oldx')");

 /* --- tapping an active choice turns it off --- */
 w.eval("openTxFilter();setTFKind('pay')"); await wait(70);
 ok(w.eval("ui.tf.kind")==='pay','payment selected');
 w.eval("setTFKind('pay')"); await wait(70);
 ok(w.eval("ui.tf.kind")==='all','selecting it again switches back to all');
 w.eval("closeSheet()");
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
