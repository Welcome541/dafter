const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
const txt=()=>d.getElementById('app').textContent;
const rows=()=>[...d.querySelectorAll('#clist2 .litem')].map(e=>e.querySelector('b')?e.querySelector('b').textContent:'');
const E=x=>w.eval(x);
(async()=>{
 await wait(1000);
 w.tab('customers'); await wait(80);
 // structure: no online status, quick filters, summary wording
 ok(!/متصل|دون اتصال/.test(txt()),'no online dot on customers screen');
 const segs=[...d.querySelectorAll('.seg button')].map(b=>b.textContent);
 ok(segs.includes('الكل')&&segs.includes('عليه دين')&&segs.includes('متأخر'),'quick filters الكل/عليه دين/متأخر');
 ok(!/النشطون|المؤرشفون \(/.test(txt()),'active/archived seg removed');
 ok(/عليهم دين/.test(txt())&&/إجمالي الديون/.test(txt())&&!/إجمالي المستحق/.test(txt()),'summary: عليهم دين + إجمالي الديون');
 ok(/عملاء/.test(txt()),'count with عملاء unit');
 // amounts positive (no minus sign on customer debt)
 const amts=[...d.querySelectorAll('#clist2 .litem .amt')].map(e=>e.textContent.trim());
 ok(amts.length>0&&amts.every(a=>!a.startsWith('-')),'amounts shown positive (no minus)');
 ok(/آخر عملية:/.test(txt()),'last activity single sentence آخر عملية:');
 // phone visible on its own line
 ok(/[٠-٩0-9]{3}/.test(d.querySelector('#clist2 .litem .sp').textContent),'phone line present');
 // quick filter owed
 w.eval("setQuick('owed')"); await wait(60);
 ok(E("ui.f.status==='owed'")&&rows().length===E("DD().customers.filter(c=>!c.archived&&custOpen(c.id)>0).length"),'quick owed filter');
 ok(d.getElementById('fchips'),'applied filter chips row shown');
 ok(/×/.test(d.getElementById('fchips').textContent),'chip has × to clear');
 w.eval("clearFCond('owed')"); await wait(60);
 ok(E("ui.f.status==='all'")&&!d.getElementById('fchips'),'chip × clears condition');
 // late summary swap (seed may have 0 overdue -> labels must still swap)
 E("(function(){const c=DD().customers.find(x=>!x.archived);const i={id:uid(),code:'A'+(DD().seq++),cust:c.id,ts:Date.now()-9*D,amount:5000,note:'',due:Date.now()-3*D};DD().invoices.push(i);save()})()");
 w.eval("setQuick('late')"); await wait(80);
 ok(/المتأخرون/.test(txt())&&/المبلغ المتأخر/.test(txt()),'late filter swaps summary labels');
 ok(/متأخر 50\.00/.test(txt()),'overdue shows overdue amount (50.00), not total');
 ok(/منذ 3 أيام|منذ ٣ أيام/.test(txt()),'overdue shows since-days');
 w.eval("setQuick('all')"); await wait(60);
 // near/over limit warnings
 E("(function(){const c=DD().customers.find(x=>!x.archived&&x.name!=='أبو خالد');c.limit=50000;const need=46000-custOpen(c.id);if(need>0)DD().invoices.push({id:uid(),code:'A'+(DD().seq++),cust:c.id,ts:Date.now(),amount:need,note:''});save()})()");
 await wait(30); w.eval("render()"); await wait(80);
 ok(/بقي .*على سقف الدين/.test(txt()),'near limit warning with remaining amount');
 E("(function(){const c=DD().customers.find(x=>x.limit===50000);DD().invoices.push({id:uid(),code:'A'+(DD().seq++),cust:c.id,ts:Date.now(),amount:10000,note:''});save()})()");
 w.eval("render()"); await wait(80);
 ok(/تجاوز سقف الدين بـ/.test(txt()),'over limit warning with excess amount');
 // phone search: last 4 digits find customer
 E("DD().customers[0].phone='055 219 7777';save()");
 E("ui.cq='7777';document.getElementById('clist2').innerHTML=custListBody()"); await wait(40);
 ok(rows().length===1,'phone last-4 search finds customer');
 E("ui.cq='+966 55 219 7777';document.getElementById('clist2').innerHTML=custListBody()"); await wait(40);
 ok(rows().length===1,'intl-format (+966) phone search finds same customer');
 E("ui.cq='';render()"); await wait(60);
 // arabic normalization search
 E("ui.cq='ابو';document.getElementById('clist2').innerHTML=custListBody()"); await wait(40);
 ok(rows().some(r=>r.includes('أبو')),'normalized search ابو finds أبو');
 E("ui.cq='';render()"); await wait(60);
 // no-result state with add shortcut
 E("ui.cq='عبدالرحمن';document.getElementById('clist2').innerHTML=custListBody()"); await wait(40);
 ok(/لا يوجد عميل باسم/.test(d.getElementById('clist2').textContent)&&/إضافة عبدالرحمن/.test(d.getElementById('clist2').textContent),'no-result state + add shortcut');
 E("ui.cq='';render()"); await wait(60);
 // filter button badge (count, not dot)
 ok(!d.getElementById('cfbtn').innerHTML.includes('999px'),'no badge without filters');
 w.eval("openCustFilter()"); await wait(60);
 const st=d.getElementById('sheet').textContent;
 ok(/الحالة/.test(st)&&/بدون دين/.test(st)&&/قريب من السقف/.test(st)&&/الاسم/.test(st)&&/مسح/.test(st)&&/عرض /.test(st),'filter sheet: status/limit/sort/clear/show-N');
 w.eval("toggleFLim('near')"); await wait(80);
 ok(E("ui.f.near===true")&&d.getElementById('cfbtn').innerHTML.includes('999px'),'badge count shown when filter active');
 w.eval("toggleFLim('near');closeSheet()"); await wait(60);
 // customer ⋮ menu = exactly 3 items
 w.eval("openCustMenu(DD().customers.find(c=>!c.archived).id)"); await wait(60);
 const sr=[...d.querySelectorAll('#sheet .srow')].map(b=>b.textContent);
 ok(sr.length===3&&sr.some(x=>/تعديل بيانات/.test(x))&&sr.some(x=>/مشاركة/.test(x))&&sr.some(x=>/أرشفة/.test(x)),'⋮ menu trimmed to 3 items');
 w.eval("closeSheet()");
 // archive confirm warns about balance
 E("(function(){const c=DD().customers.find(x=>!x.archived&&custOpen(x.id)>0);window.__aid=c.id})()");
 w.eval("confirmArchive(window.__aid)"); await wait(60);
 ok(/أرشفة العميل؟/.test(d.getElementById('sheet').textContent)&&/لا يزال عليه/.test(d.getElementById('sheet').textContent),'archive confirm shows remaining balance');
 w.eval("closeSheet()"); ok(!E("cust(window.__aid).archived"),'cancel keeps customer active');
 w.eval("confirmArchive(window.__aid)"); await wait(60);
 d.querySelector('#sheet .btn-navy').click(); await wait(80);
 ok(!rows().includes(E("cust(window.__aid).name")),'archived customer leaves main list');
 // archived screen via ⋮ nav menu
 w.eval("openCustNavMenu()"); await wait(60);
 ok(/العملاء المؤرشفون/.test(d.getElementById('sheet').textContent)&&/نقل من الدفتر/.test(d.getElementById('sheet').textContent),'⋮ nav menu: archived + paper import');
 w.eval("closeSheet();ui.arch=true;ui.archQ='';render()"); await wait(80);
 ok(/العملاء المؤرشفون/.test(txt())&&rows().some(r=>r===E("cust(window.__aid).name")),'archived list shows customer');
 w.eval("confirmRestore(window.__aid)"); await wait(60);
 ok(/استعادة العميل؟/.test(d.getElementById('sheet').textContent),'restore confirm shown');
 d.querySelector('#sheet .btn-navy').click(); await wait(60);
 w.eval("ui.arch=false;render()"); await wait(80);
 ok(rows().includes(E("cust(window.__aid).name")),'restored to main list');
 // duplicate name gate
 E("ui.nc={name:'أبو خالد',phone:'',limit:'',photo:null,edit:null,forceDup:false};window.__n0=DD().customers.length");
 w.eval("saveCustomer()"); await wait(60);
 ok(/يوجد عميل بهذا الاسم/.test(d.getElementById('sheet').textContent)&&/هل هو نفس العميل؟/.test(d.getElementById('sheet').textContent),'duplicate name warning shown');
 ok(E("DD().customers.length===window.__n0"),'no customer created before choice');
 w.eval("ui.nc.forceDup=true;saveCustomer()"); await wait(80);
 ok(E("DD().customers.length===window.__n+1".replace('__n+1','__n0+1')),'add-new proceeds after explicit choice');
 // cleanup: remove the duplicate
 E("(function(){const cs=DD().customers.filter(x=>x.name==='أبو خالد');const dpl=cs[cs.length-1];DD().customers=DD().customers.filter(x=>x!==dpl);save()})()");
 // quiet CTA + pagination hooks
 w.tab('customers'); await wait(80);
 ok(/إضافة عميل/.test(txt()),'add-customer CTA present');
 ok(E("typeof ui.cmax==='number'"),'pagination counter initialized');
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
