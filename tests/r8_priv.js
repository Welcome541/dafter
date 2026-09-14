const {boot,wait,mk}=require('./h');
const w=boot({darkMq:true}),d=w.document;const {ok,done}=mk();
(async()=>{
 await wait(1000);
 ok(![...d.querySelectorAll('.hdr .hbtn')].some(b=>(b.getAttribute('onclick')||'').includes('sec.priv')),'eye option removed from home');
 w.tab('customers'); await wait(50);
 ok(![...d.querySelectorAll('.hdr .hbtn')].some(b=>(b.getAttribute('onclick')||'').includes('sec.priv')),'eye option removed from customers');
 w.tab('settings'); await wait(50);
 // appearance row: renamed, dynamic icon, no crescent in control
 ok(!!d.querySelector('.dmsw .sw2[role="switch"]'),'appearance is a toggle switch');
 ok(d.getElementById('app').textContent.includes(w.eval("t('theme')")),'row renamed to Appearance');
 ok(!d.getElementById('app').textContent.includes(w.eval("t('darkMode')")),'old Dark-mode label removed');
 const kicHtml=()=>d.querySelector('.dmsw').closest('.kv').querySelector('.kic').innerHTML;
 ok(kicHtml().includes('circle'),'light -> sun icon on row chip');
 ok(!d.querySelector('.dmsw').innerHTML.includes('dico'),'crescent removed from the control');
 ok(/تلقائي/.test(d.getElementById('app').textContent),'auto chip present');
 ok(!d.body.classList.contains('dark'),'light by default');
 w.eval("sec.dark=true;sec.darkAuto=false;saveSec();render()"); await wait(40);
 ok(d.body.classList.contains('dark'),'switch on -> dark');
 ok(d.querySelector('.dmsw .sw2').classList.contains('on'),'switch reflects on state');
 ok(kicHtml().includes('M21 12.79'),'dark -> moon icon on row chip');
 w.eval("sec.darkAuto=true;sec.dark=true;saveSec();render()"); await wait(40);
 ok(d.body.classList.contains('dark'),'auto follows system dark (mq dark)');
 w.eval("sec.darkAuto=false;sec.dark=false;saveSec();render()"); await wait(40);
 ok(!d.body.classList.contains('dark'),'back to light');
 done();
})().catch(e=>{console.log('ERROR:',e);process.exit(1)});
