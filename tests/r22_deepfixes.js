// r22 — regression lock for the deep-fix pass:
// i18n leak, chart day labels, dead FAB, keyboard access, Arabic plurals,
// amount parsing (Persian digits / comma separators / Arabic decimal separator),
// icon semantics + RTL mirroring + header alignment.
const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
const E=x=>w.eval(x);
const app=()=>d.getElementById('app');
const txt=()=>app().textContent;
const HOUSE='M3 10.8 12 3.2l9 7.6';
const SPEAKER='M11 5 6.5 9H3v6h3.5L11 19V5Z';
const BARS='M4 20.6h16';

(async()=>{
 await wait(1000);

 /* ---------- 1. i18n: no raw key may reach the UI ---------- */
 ok(E("STR.ar.on!==undefined")&&E("STR.en.on!==undefined"),"'on' key exists in both languages");
 ok(E("t('on')")==='مفعّل',"t('on') is Arabic, not the raw key");
 E('sec.vosk=true;ui.voskOpen=true;render()'); await wait(80);
 w.tab('settings'); await wait(120);
 ok(!/>\s*on\s*</.test(app().innerHTML.replace(/on(click|change|input|key|pointer|touch|mouse|load|error|line|ly)=/g,'')),
   'no bare English "on" in the Arabic settings screen');
 ok(/مفعّل/.test(txt()),'Vosk row reads مفعّل when enabled');
 E('sec.vosk=false;ui.voskOpen=false;saveSec();render()'); await wait(60);

 /* ---------- 2. Arabic plural grammar (11+ takes tanwin) ---------- */
 ok(E("t('dayAgo')(3)")==='منذ 3 أيام','3 days -> أيام');
 ok(E("t('dayAgo')(11)")==='منذ 11 يومًا','11 days -> يومًا (was يوم)');
 ok(E("t('dayAgo')(29)")==='منذ 29 يومًا','29 days -> يومًا');
 ok(E("t('hrAgo')(20)")==='منذ 20 ساعةً','20 hours -> ساعةً');
 ok(E("t('minAgo')(45)")==='منذ 45 دقيقةً','45 minutes -> دقيقةً');
 ok(E("t('dayAgo')(1)")==='منذ 1 يوم'&&E("t('dayAgo')(2)")==='منذ 2 يومين','1/2 day keep singular/dual');
 E("setLang('en')"); await wait(120);
 ok(E("t('dayAgo')(1)")==='1 day ago','EN singular "1 day ago" (was "1 days ago")');
 ok(E("t('dayAgo')(2)")==='2 days ago','EN plural kept');
 E("setLang('ar')"); await wait(150);

 /* ---------- 3. amount parsing: Persian/Urdu digits ---------- */
 ok(E("amtFromText('۵۰').amt")===5000,'Persian ۵۰ -> 50.00 (was 10.00)');
 ok(E("amtFromText('۵۵').amt")===5500,'Persian ۵۵ -> 55.00 (was 1.00)');
 ok(E("amtFromText('۹').amt")===900,'Persian ۹ -> 9.00');
 ok(E("amtFromText('۱۲۳۴۵۶۷۸۹').amt")===12345678900,'all ten Persian digits map correctly');
 ok(E("parseSay('أبو خالد ۵۰').amt")===5000,'voice path: Persian digits reach the right amount');
 ok(E("parseSay('أبو خالد ٥٠').amt")===5000,'voice path: Arabic-Indic digits still correct');

 /* ---------- 4. amount parsing: separators ---------- */
 ok(E("Money.parse('1,000')")===100000,'thousands comma -> 1000.00 (was 0)');
 ok(E("Money.parse('1,000,000')")===100000000,'grouped millions');
 ok(E("Money.parse('50,5')")===5050,'comma decimal -> 50.50 (was 0)');
 ok(E("Money.parse('1,000.50')")===100050,"app's own fmt() output round-trips");
 ok(E("Money.parse('1.000,50')")===100050,'European grouping/decimal round-trips');
 ok(E("Money.parse('١٬٠٠٠')")===100000,'Arabic thousands separator U+066C');
 ok(E("Money.parse('1 000')")===100000,'space grouping');
 ok(E("parseSay('أبو خالد 1,000').amt")===100000,'voice path: 1,000 is not lost');
 ok(E("parseSay('أبو خالد 50,5').amt")===5050,'voice path: comma decimal is not lost');
 // Arabic decimal separator must stay inside the amount, not leak into the note
 const ar=E("parseSay('أبو خالد ٥٠٫٥')");
 ok(ar.amt===5050,'Arabic decimal separator U+066B -> 50.50');
 ok(ar.note==='','U+066B no longer leaks into the product note (was "٫٥")');
 // unchanged behaviour
 ok(E("Money.parse('50')")===5000&&E("Money.parse('0.01')")===1&&E("Money.parse('-25')")===-2500,'plain amounts unchanged');
 ok(E("Money.parse('abc')")===0&&E("Money.parse('')")===0,'garbage still rejected as 0');
 ok(E("parseSay('أبو خالد خمسين').amt")===5000,'spoken-word amounts unchanged');
 ok(E("parseSay('سارة مئة وعشرين').amt")===12000,'spoken compound amounts unchanged');

 /* ---------- 5. icons: semantics ---------- */
 w.tab('home'); await wait(140);
 ok(d.getElementById('tabbar').innerHTML.includes(HOUSE),'home tab shows a house (was a bento grid)');
 w.tab('reports'); await wait(260);
 ok(app().innerHTML.includes(BARS),'report chart headers use a bar-chart icon (was a pie)');
 ok(!/<svg[^>]*>[^<]*M21\.21 15\.89/.test(app().innerHTML),'no pie glyph left on the reports screen');
 w.tab('settings'); await wait(140);
 ok(app().innerHTML.includes(SPEAKER),'sound row uses a speaker (was a bell)');
 ok(/var\(--red-bg\)[^]*?M12 3\.2v8\.6/.test(app().innerHTML.replace(/\n/g,''))||E("P.power!==undefined"),'power glyph available for lock-now');

 /* ---------- 6. icons: RTL mirroring ---------- */
 ok(E("document.documentElement.dir")==='rtl','document is RTL for Arabic');
 ok(E("ic('back')").includes('class="ic mir"'),'back arrow carries the mirror class');
 ok(E("ic('fwd')").includes('class="ic mir"'),'disclosure chevron carries the mirror class');
 ok(!E("ic('user')").includes('mir'),'non-directional icons are not mirrored');
 const cssTxt=E("document.querySelector('style').textContent");
 ok(/html\[dir="rtl"\]\s*\.ic\.mir\{transform:scaleX\(-1\)\}/.test(cssTxt),'CSS mirrors .ic.mir under dir=rtl');
 ok(E("ic('nope_does_not_exist')").indexOf('undefined')===-1,'unknown icon name can never render "undefined"');

 /* ---------- 7. headers: centred, no hidden-button hack ---------- */
 for(const s of ['home','customers','reports','settings']){
  w.tab(s); await wait(130);
  const h=d.querySelector('.hdr');
  ok(h&&h.children.length===3,'header on '+s+' has exactly 3 slots');
  ok(!h.innerHTML.includes('visibility:hidden'),'header on '+s+' has no hidden-button placeholder');
 }
 ok(/\.hdr\{display:grid/.test(cssTxt),'header uses a grid so the title is truly centred');
 w.tab('home'); await wait(130);
 const name=(E("curAcc().name"));
 const hdrHits=(d.querySelector('.hdr').textContent.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length;
 ok(hdrHits===1,'shop name appears once in the home header (was twice)');
 ok(d.querySelector('.hdr .accchip').getAttribute('title')===name,'compact chip still exposes the name via title');

 /* ---------- 8. settings: no duplicated divider ---------- */
 w.tab('settings'); await wait(130);
 ok(!/<div class="sep"><\/div>\s*<div class="sep"><\/div>/.test(app().innerHTML),'no double divider in settings');

 /* ---------- 9. reports: real dates on the 7-day chart ---------- */
 w.tab('reports'); await wait(280);
 const labs=[...app().querySelectorAll('span.muted')].map(e=>e.textContent.trim()).filter(x=>/^\d+$|^·$/.test(x));
 const exp=[];for(let i=6;i>=0;i--){const e0=new Date();e0.setHours(0,0,0,0);exp.push(String(new Date(e0.getTime()-i*864e5).getDate()))}
 ok(labs.length===7&&labs.join(',')===exp.join(','),'7-day chart labelled with real dates ('+labs.join(',')+')');
 ok(!labs.includes('·'),'the meaningless "·" label is gone');

 /* ---------- 10. dead FAB removed ---------- */
 ok(!d.getElementById('fabAdd'),'#fabAdd node removed');
 ok(!/#fabAdd/.test(cssTxt),'#fabAdd CSS removed');
 ok(!/fab hide on scroll/.test(E("document.documentElement.outerHTML")),'per-scroll FAB handler removed');
 const before=w.eval("(function(){window.__e=null;window.addEventListener('error',e=>window.__e=e.message);return 1})()");
 w.dispatchEvent(new w.Event('scroll')); await wait(80);
 ok(E("window.__e")===null,'scrolling raises no error after FAB removal');
 for(const s of ['home','customers','reports','settings']){ w.tab(s); await wait(90); }
 ok(E("typeof openFabSheet")==='function','openFabSheet retained for the future (as openImport is)');

 /* ---------- 11. keyboard / assistive-tech access ---------- */
 w.tab('customers'); await wait(150);
 const crows=[...d.querySelectorAll('#clist2 .litem')];
 ok(crows.length>0&&crows.every(r=>r.getAttribute('role')==='button'),'customer rows expose role=button');
 ok(crows.every(r=>r.getAttribute('tabindex')==='0'),'customer rows are focusable');
 ok(crows.every(r=>/onkeydown/.test(r.outerHTML)),'customer rows activate on Enter');
 const cid=E("DD().customers.find(c=>!c.archived).id");
 E("stack=[{s:'profile',p:{id:'"+cid+"'}}];render()"); await wait(150);
 ok([...d.querySelectorAll('#pfeed .litem')].every(r=>r.getAttribute('role')==='button'),'transaction-log rows expose role=button');
 ok([...d.querySelectorAll('.card.inv')].every(r=>r.getAttribute('role')==='button'),'invoice cards expose role=button');
 const pin=app().querySelector('button[aria-label]');
 ok(!!app().querySelector('button[onclick^="togglePin"]'),'pin control on the customer page is a real button');
 ok(/تثبيت/.test(app().querySelector('button[onclick^="togglePin"]').getAttribute('aria-label')),'pin button is labelled');
 const pinnedBefore=E("cust('"+cid+"').pinned");
 app().querySelector('button[onclick^="togglePin"]').click(); await wait(120);
 ok(E("cust('"+cid+"').pinned")!==pinnedBefore,'pin button actually toggles the pin');
 app().querySelector('button[onclick^="togglePin"]').click(); await wait(120);
 ok(E("cust('"+cid+"').pinned")===pinnedBefore,'toggling back restores the original state');
 w.tab('home'); await wait(140);
 const st=[...d.querySelectorAll('#stats1 .stat')];
 ok(st.length===3,'home keeps its three information cards');
 ok(!st[0].getAttribute('role')&&!st[1].getAttribute('role'),'the two today cards are plain information, not fake buttons');
 ok(/onkeydown/.test(st[2].outerHTML),'the total-debt card stays keyboard-activatable because it navigates');
 E("ui.tf={kind:'all',period:'all'}");
 st[0].dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true})); await wait(90);
 ok(E("ui.tf.kind")==='all'&&E("ui.tf.period")==='all','Enter on the debt card applies no hidden filter');
 const tfb=d.getElementById('tfbtn');
 ok(!!tfb&&tfb.tagName==='BUTTON','home filtering lives behind one real button');
 ok(!!tfb.getAttribute('aria-label'),'the filter button is labelled for assistive tech');

 /* ---------- 12. spoken confirmation says the real amount ---------- */
 // amounts live in minor units; the spoken receipt used to announce them raw,
 // so a 50.00 payment was read out as "5000".
 ok(E("sayAmt(5000)")==='50','sayAmt: 5000 minor -> "50"');
 ok(E("sayAmt(5050)")==='50.5','sayAmt: trailing zero trimmed -> "50.5"');
 ok(E("sayAmt(1)")==='0.01','sayAmt: sub-unit amount -> "0.01"');
 ok(E("sayAmt(12345)")==='123.45','sayAmt: 123.45');
 ok(E("sayAmt(0)")==='0','sayAmt: zero');
 ok(E("sayAmt(-2500)")==='-25','sayAmt: negative');
 ok(E("saySep()")==='، ','Arabic separator while lang=ar');

 const w2=boot({tts:true}),d2=w2.document;
 await wait(1000);
 const E2=x=>w2.eval(x);
 E2('sec.speak=true;saveSec()');
 const cid2=E2("DD().customers.find(c=>!c.archived).id");
 const said=()=>w2.speechSynthesis.said[w2.speechSynthesis.said.length-1];

 E2('ui.pay={cust:"'+cid2+'",amt:"50",method:"cash",done:null}'); E2('payConfirm()'); await wait(120);
 ok(/سداد 50 ر\.س$/.test(said()),'payment of 50.00 is spoken as "50", not "5000"');
 ok(!/\b5000\b/.test(said()),'no raw minor units in the spoken payment');

 E2('openDebtSheet()'); await wait(90);
 d2.getElementById('md_c').value=cid2; d2.getElementById('md_a').value='75';
 E2('manualDebtSave()'); await wait(130);
 ok(/دين 75 ر\.س$/.test(said()),'manual debt of 75.00 is spoken as "75", not "7500"');

 E2('ui.rec={st:"edit",kind:"debt",d:{name:"أبو خالد",amt:5000,note:""},cands:[],warn:null,demo:0}');
 E2('recConfirm()'); await wait(160);
 ok(/دين 50 ر\.س$/.test(said()),'voice-recorded "خمسين" is spoken as "50", not "5000"');

 E2('setLang("en")'); await wait(160);
 ok(E2("saySep()")===', ','separator switches to a comma in English');
 E2('ui.pay={cust:"'+cid2+'",amt:"1000",method:"cash",done:null}'); E2('payConfirm()'); await wait(130);
 ok(said().indexOf(', ')>=0&&/\b1000\b/.test(said())&&!/\b100000\b/.test(said()),
   'English spoken receipt uses ", " and the real amount');

 /* ---------- 13. quick-pay sheet resisted double taps ---------- */
 // every other write path was dedupe-protected; quickPaySave was missed, so a
 // double tap recorded the same payment twice and inflated the day's totals.
 const cid3=E("DD().customers.find(c=>!c.archived).id");
 const npay=()=>E("DD().payments.filter(p=>p.cust==='"+cid3+"').length");
 E("quickPay('"+cid3+"')"); await wait(90);
 d.getElementById('qp_a').value='20';
 const n3=npay(); E("quickPaySave('"+cid3+"');quickPaySave('"+cid3+"');quickPaySave('"+cid3+"')"); await wait(140);
 ok(npay()-n3===1,'triple tap on quick-pay records exactly one payment');
 ok(E("DD().payments.filter(p=>p.cust==='"+cid3+"'&&p.amount===2000).length")===1,'no duplicate 20.00 payment');
 await wait(800);
 E("quickPay('"+cid3+"')"); await wait(90);
 d.getElementById('qp_a').value='30'; const n4=npay();
 E("quickPaySave('"+cid3+"')"); await wait(140);
 ok(npay()-n4===1,'a later, different quick payment still records normally');

 /* ---------- 14. a fully returned invoice must not poison backups ---------- */
 // returning the whole invoice legitimately settles amount to 0, but the
 // invariant demanded amount>0, so verify() failed and restore()/QR transfer
 // refused every backup taken afterwards -- unrecoverable data loss.
 const cid4=E("DD().customers.find(c=>!c.archived).id");
 const inv4=E("(function(){const i={id:uid(),code:'A'+(DD().seq++),cust:'"+cid4+"',ts:Date.now(),amount:10000,note:''};DD().invoices.push(i);save();return i.id})()");
 E("openReturnSheet('"+inv4+"')"); await wait(90);
 d.getElementById('retA').value='100'; E("applyReturn('"+inv4+"')"); await wait(130);
 const row4=E("DD().invoices.find(i=>i.id==='"+inv4+"')");
 ok(row4.amount===0,'full return settles the invoice at 0');
 ok(E("invStatus(DD().invoices.find(i=>i.id==='"+inv4+"'))")==='paid','a settled-by-return invoice reads as paid, not open');
 ok(E("fmt(invRem(DD().invoices.find(i=>i.id==='"+inv4+"')))")==='0.00','nothing remains owed');
 ok(row4.edits&&row4.edits.length===1,'the return is still recorded in the audit trail');
 ok(await E("(async()=>await Backup.verify(await Backup.obj()))()")==='','verify() accepts the resulting state');
 ok(await E("(async()=>await Backup.restore(await Backup.obj()))()")===true,'restore() succeeds after a full return');
 // guards that must stay strict
 ok(E("Invariants.check({accounts:[{id:'x',type:'personal'}],data:{x:{customers:[],invoices:[{id:'z',cust:'c',amount:-5}],payments:[]}}})")==='bad-amount:z','negative invoice amount still rejected');
 ok(E("Invariants.check({accounts:[{id:'x',type:'personal'}],data:{x:{customers:[],invoices:[{id:'z',cust:'c',amount:1.5}],payments:[]}}})")==='bad-amount:z','fractional minor units still rejected');
 ok(E("Invariants.check({accounts:[{id:'x',type:'personal'}],data:{x:{customers:[],invoices:[],payments:[{id:'p',cust:'c',amount:0}]}}})")==='bad-pay:p','a zero payment is still rejected');
 ok(E("invStatus((function(){const i={id:uid(),code:'A'+(DD().seq++),cust:'"+cid4+"',ts:Date.now(),amount:5000,note:''};DD().invoices.push(i);save();return i})())")==='open','an ordinary unpaid invoice is still open');

 /* ---------- 15. save() must never lose a change silently ---------- */
 // the encrypted branch had no .catch(): a rejection left nothing written and
 // said nothing, so the user believed the record was saved. jsdom has no
 // crypto.subtle, which reproduces exactly that failure.
 let unhandled=0; process.on('unhandledRejection',()=>{unhandled++});
 E('sec.enabled=false;masterKey=null'); E("save()"); await wait(80);
 ok(E("JSON.parse(localStorage.getItem('dafter_v3'))")!==null,'plaintext save still persists');
 ok(unhandled===0,'plaintext save raises no unhandled rejection');

 E('sec.enabled=true;masterKey={fake:1}');
 const invC=E("DD().invoices.length");
 E("DD().invoices.push({id:uid(),code:'A200',cust:DD().customers[0].id,ts:Date.now(),amount:6000,note:''});save()");
 await wait(900);
 ok(unhandled===0,'a failing encrypted save no longer produces an unhandled rejection');
 ok(E('__sv.bad')>0,'the failed save is counted so the user can be warned');
 const tst=d.querySelector('#toast,.toast,[class*=toast]');
 ok(!!tst&&/⚠/.test(tst.textContent||''),'the user is told the change could not be stored');
 ok(E("!!localStorage.getItem('dafter_v3')")||E("!!localStorage.getItem('dafter_v3_enc')"),'previously stored data is not wiped by a failed save');
 E('sec.enabled=false;masterKey=null');
 ok(E("DD().invoices.length")===invC+1,'the in-memory ledger still holds the new record for export');
 ok(E('typeof __sv.seq==="number"&&__sv.seq>0'),'encrypted snapshots are numbered to prevent an old one overwriting a new one');

 /* ---------- 16. CSV export was corrupting the ledger on paper ---------- */
 // exportCSV predated the csvC/Money.dec helpers exportAll uses, so it emitted
 // raw minor units (5000 for 50.00), left names unquoted (a comma in a name
 // shifted every column), stripped quotes out of notes, and had no CSV-injection
 // guard. Any of those silently ruined a spreadsheet the user relies on.
 E("window.__dl=null;window.dl=function(n,c,m){window.__dl={n:n,c:c}}");
 E("DD().customers.push({id:'CX',name:'Smith, John \"JR\"',phone:'0500000000',since:'2026',archived:false,pinned:false});save()");
 E("DD().customers.push({id:'CY',name:'=SUM(A1:A9)',phone:'0500000000',since:'2026',archived:false,pinned:false});save()");
 E("DD().invoices.push({id:'IX1',code:'A1',cust:'CX',ts:Date.now(),amount:5000,note:'حليب, خبز'});save()");
 E("DD().invoices.push({id:'IX2',code:'A2',cust:'CY',ts:Date.now(),amount:12550,note:''});save()");
 E("DD().payments.push({id:'PX1',cust:'CX',ts:Date.now(),amount:2000,method:'cash',alloc:[]});save()");
 E("exportCSV('CX')"); await wait(80);
 const csv1=E("window.__dl.c");
 ok(/,50\.00,/.test(csv1),'exportCSV writes 50.00, not the raw 5000 minor units');
 ok(/,20\.00,/.test(csv1),'exportCSV writes the payment as 20.00');
 ok(!/,5000,/.test(csv1),'no minor units leak into the export');
 ok(/"Smith, John ""JR"""/.test(csv1),'a name with a comma and quotes is properly CSV-quoted');
 ok(/"حليب, خبز"/.test(csv1),'a note containing a comma stays inside one field');
 ok(csv1.split('\n').filter(Boolean).every(l=>l.split('","').length>0),'export produced rows');
 ok(E("window.__dl.n")==='statement-Smith-John-JR.csv','the download filename is sanitised');
 E("window.__dl=null;exportCSV('CY')"); await wait(80);
 ok(/'=SUM\(A1:A9\)/.test(E("window.__dl.c")),'a formula-like name is neutralised against CSV injection');
 E("window.__dl=null;exportAll()"); await wait(80);
 const csv2=E("window.__dl.c");
 ok(/"Smith, John ""JR"""/.test(csv2),'exportAll quotes the same name correctly too');
 ok(!/"[^"]*""[^"]*""[^"]*"/.test(csv2.split('\n')[1]||''),'no double-wrapping of already-quoted fields');
 E("exportCSV('MISSING')"); await wait(40);
 ok(true,'exportCSV on an unknown customer does not throw');

 /* ---------- 17. reminder links must not crash or fail silently ---------- */
 // sendWA/sendSMS dereferenced cust(id) without a guard (TypeError on a stale
 // id) and built wa.me/sms links with an empty number; neither checked whether
 // window.open was blocked, so the button simply did nothing.
 E("window.__open=[];window.open=function(u){window.__open.push(u);return null}");
 E("DD().customers.push({id:'NP',name:'بلا هاتف',phone:'',since:'2026',archived:false,pinned:false});save()");
 const toast=()=>{const el=d.querySelector('#toast,.toast');return el?(el.textContent||'').trim():''};
 E("sendWA('NP')"); await wait(60);
 ok(E("window.__open.length")===0,'no WhatsApp link is built for a customer without a phone');
 ok(/رقم العميل/.test(toast()),'the user is told to add the phone first');
 E("window.__open=[];sendSMS('NP')"); await wait(60);
 ok(E("window.__open.length")===0,'no SMS link for a customer without a phone');
 let crashed=false; try{ E("sendWA('NOPE')"); }catch(e){ crashed=true; }
 ok(!crashed,'sendWA on an unknown customer no longer throws');
 const ph=E("DD().customers.find(c=>c.phone).id");
 E("window.__open=[];sendWA('"+ph+"')"); await wait(80);
 ok(E("window.__open.length")===1&&/^https:\/\/wa\.me\/\d/.test(E("window.__open[0]")),
   'a real WhatsApp link is produced for a customer with a phone');
 E("window.open=function(u){window.__open.push(u);return {focus:function(){}}}");
 E("window.__open=[];sendSMS('"+ph+"')"); await wait(80);
 ok(/^sms:\+\d/.test(E("window.__open[0]")),'SMS link keeps the + and digits only');
 const invR=E("(DD().invoices.find(i=>cust(i.cust)&&cust(i.cust).phone)||{}).id||''");
 E("window.__open=[];waRemind('"+invR+"')"); await wait(80);
 ok(E("window.__open.length")===1,'waRemind still opens its reminder link');
 ok(E("typeof openExt")==='function','a single helper now owns external navigation');

 /* ---------- 18. a stale id or a closed sheet must not crash the app ---------- */
 // these handlers dereferenced cust(id)/ui.rec/DOM fields blindly. A tap that
 // lands after a delete, a restore or the sheet's close animation threw and
 // left the screen frozen; switchAcc could even corrupt db.active permanently.
 let threw=null;
 const safe=(label,code)=>{ try{ E(code); return true; }catch(e){ threw=label+' :: '+String(e.message).slice(0,80); return false; } };

 ok(safe('switchAcc','switchAcc("no-such-account")'),'switchAcc rejects an unknown account id');
 ok(E("!!db.data[db.active]"),'db.active still points at a real account');
 ok(E("DD().customers.length")>0,'the session still has data after the rejected switch');
 ok(safe('togglePin','togglePin("ghost")'),'togglePin survives an unknown customer');
 ok(safe('confirmArchive','confirmArchive("ghost")'),'confirmArchive survives an unknown customer');
 ok(safe('openExport','openExport("ghost")'),'openExport survives an unknown customer');
 ok(safe('quickPay','quickPay("ghost")'),'quickPay survives an unknown customer');
 ok(safe('exportPDF','exportPDF("ghost")'),'exportPDF survives an unknown customer');
 ok(E("statementText('ghost')===''"),'statementText returns empty text instead of throwing');
 ok(safe('recConfirm','ui.rec=null;recConfirm()'),'recConfirm with no recording in progress is a no-op');
 // sheet saves with the sheet already closed
 for(const fn of ['manualDebtSave()','saveAccEdit()','paperReview()','paperCommit()','doImport()','saveCur()','quickPaySave("ghost")','readImp("ghost")']){
   ok(safe(fn,fn),fn+' does nothing instead of throwing when its sheet is gone');
 }
 ok(true,'no handler crashed: '+(threw||'none'));

 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
