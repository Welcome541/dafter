const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
const txt=()=>d.getElementById('app').textContent;
(async()=>{
 await wait(1000);
 w.eval("tab('settings')");await wait(80);
 ok(txt().includes(w.eval("t('prefs')")),'preferences section title shown');
 ok(!txt().includes('English')&&!d.querySelector('.segw'),'language option fully removed');
 // one card holds language segmented + currency select
 const same=w.eval("(function(){const g=document.querySelector('select.selctl');const card=g&&g.closest('.card');return !!card&&!!card.querySelector('.dmsw')})()");
 ok(same,'country & appearance controls share one card');
 // currency as native select
 const sel=w.eval("!!document.querySelector('select.selctl')");
 ok(sel,'currency is a dropdown select');
 ok(w.eval("document.querySelector('select.selctl').value")==='ر.س','select reflects current currency');
 w.eval("setCur('ج.م')");await wait(60);
 ok(w.eval("document.querySelector('select.selctl').value")==='ج.م'&&w.eval("CUR()")==='ج.م','setCur syncs select & CUR()');
 w.eval("setCur('ل.س')");await wait(60);
 ok(w.eval("document.querySelector('select.selctl').value")==='ل.س','custom currency becomes selected option');
 ok(w.eval("[...document.querySelector('select.selctl').options].some(o=>o.value==='__c')"),'custom option (✎) present');
 ok(w.eval("['السعودية','العراق','مصر','اليمن','الإمارات','سوريا'].every(n=>[...document.querySelector('select.selctl').options].some(o=>o.textContent.includes(n)))"),'all six countries listed');
 ok(w.eval("setCur('ر.س');[...document.querySelector('select.selctl').options].find(o=>o.selected).textContent").includes('السعودية'),'ر.س shows as السعودية');
 w.eval("setCur('ر.س')");await wait(50);
 // sound card: two switches (sound + vibration)
 w.eval("tab('settings')");
 const two=w.eval("(function(){const cards=[...document.querySelectorAll('.card')];const c=cards.find(x=>x.textContent.includes(t('sound'))&&x.textContent.includes(t('vib')));return c?c.querySelectorAll('.sw2[role=switch]').length:0})()");
 ok(two===2,'sound card has two switches (sound + vibration)');
 ok(w.eval("sec.sound===true&&sec.vib===true"),'both default on');
 w.eval("sec.sound=false;saveSec();render()");await wait(40);
 ok(w.eval("(function(){const c=[...document.querySelectorAll('.card')].find(x=>x.textContent.includes(t('sound')));return [...c.querySelectorAll('.sw2')][0].classList.contains('on')===false})()"),'sound switch toggles off');
 w.eval("feedback('debt')"); // must not throw with sound off
 ok(true,'feedback() safe with sound off');
 w.eval("sec.sound=true;saveSec();render()");
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
