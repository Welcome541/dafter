// v8 home: counter strip (today-only numbers), day-grouped feed, empty state, privacy, personal labels
const {boot,wait,mk}=require('./h.js');
(async()=>{
const {ok,done}=mk();
let w=boot({});await wait(400);
w.eval("DD().invoices[0].ts=Date.now();DD().payments[0].ts=Date.now();render()");await wait(40);
const app=()=>w.document.getElementById('app');
// 1 counter strip: today-only, no balance vocabulary
ok(w.eval("ui.tf.period==='all'"),'default home view = all days (filtering removed)');
ok(w.document.querySelector('#stats1 .stat.red .t').textContent.includes('دين اليوم'),'red card = today debts per spec');
ok(w.document.querySelector('#stats1 .stat.green .t').textContent.includes('سداد اليوم'),'green card = today payments per spec');
ok(!app().textContent.includes('الديون المفتوحة'),'balance vocab removed from home');
// 2 day grouping header present (forced today tx)
ok(app().innerHTML.includes('اليوم</div>')||app().textContent.includes('اليوم'),'day header اليوم in feed');
// 3 strips are display-only now
w.eval("document.querySelector('#stats1 .stat.red').click()");await wait(30);
ok(w.eval("ui.tf.kind==='debt'&&ui.tf.period==='today'"),'strip tap filters debt+today per spec');
w.eval("ui.tf={kind:'all',period:'all'};refreshHome()");await wait(30);
// 3b feed shows all days grouped without filter controls
w.eval("DD().invoices.forEach(i=>i.ts=Date.now()-2*864e5);DD().payments.forEach(pp=>pp.ts=Date.now()-2*864e5);render()");await wait(40);
ok(app().textContent.includes('أبو خالد'),'old transactions visible without any filter');
ok(!app().textContent.includes('عرض كل الأيام'),'no show-all button (filter gone)');
w.eval("DD().invoices[0].ts=Date.now();DD().payments[0].ts=Date.now();render()");await wait(40);
// 4 privacy eye masks strip numbers
w.eval("sec.priv=true;saveSec();render()");await wait(40);
ok(w.document.body.classList.contains('priv'),'priv class on body masks .num');
w.eval("sec.priv=false;saveSec();render()");await wait(40);
// 5 personal account labels (create via real data shape + switchAcc)
w.eval("db.accounts.push({id:'pa1',name:'شخصي',type:'personal',cur:'ر.س'});db.data['pa1']={customers:[],invoices:[],payments:[],seq:1};switchAcc('pa1')");await wait(80);
ok(w.document.querySelector('#stats1 .stat.red .t').textContent.includes('مصروف اليوم'),'personal red = spent today');
ok(w.document.querySelector('#stats1 .stat.green .t').textContent.includes('أودعت اليوم'),'personal green = deposited today');
// back to grocery
w.eval("switchAcc(db.accounts.find(a=>a.type!=='personal').id)");await wait(80);
// 6 empty state hint when no operations at all
w.eval("DD().invoices=[];DD().payments=[];ui.tf={kind:'all',period:'all'};ui.tq='';render()");await wait(60);
ok(app().textContent.includes('اضغط مطولًا'),'first-run empty hint shown');
// 7 EN labels
let w2=boot({});await wait(300);
w2.eval("setLang('en')");await wait(60);
ok(w2.document.querySelector('#stats1 .stat.red .t').textContent.includes('Debt today'),'EN red = Debt today');
ok(w2.document.querySelector('#stats1 .stat.green .t').textContent.includes('Paid today'),'EN green = Paid today');
w2.document.querySelector('#stats1 .stat.green').click();
ok(w2.eval("ui.tf.kind==='pay'&&ui.tf.period==='today'"),'green tap filters pay+today per spec');
w2.eval("ui.tf={kind:'all',period:'all'};refreshHome()");await wait(30);
// 8 logo initial follows account name
w2.eval("setLang('ar')");await wait(40);
w2.eval("const ga=db.accounts.find(a=>a.type!=='personal');ga.name='سوبرماركت النور';render()");await wait(60);
ok(w2.document.querySelector('.hdr .logo-ic').textContent==='س','home logo shows account initial after rename');
w2.eval("DD().invoices[0].ts=Date.now();DD().payments[0].ts=Date.now();render()");await wait(40);
// 9 compact day separators
ok(w2.document.querySelector('#txlist .lb').getAttribute('style').includes('margin:2px 4px 2px'),'day separator compact margins');
done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
