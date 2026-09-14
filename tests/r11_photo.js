const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
(async()=>{
 await wait(1000);
 // contacts-like blended gradient initials
 ok(w.eval("avColor('أبو خالد')").startsWith('linear-gradient'),'avatar background is blended gradient');
 ok(w.eval("avColor('أبو خالد')")!==w.eval("avColor('سارة')"),'different names -> different blends');
 ok(!w.eval("DD().customers[0].photo"),'no photo by default');
 ok(!w.eval("avat('أبو خالد',46)").includes('<img'),'avatar shows initials without photo');
 // hidden photo option behind tapping the circle (profile)
 const cid=w.eval("DD().customers[0].id");
 w.eval("go('profile',{id:'"+cid+"'})"); await wait(60);
 const av=d.querySelector('.pad .av');
 ok((av.getAttribute('onclick')||'').includes('openPhotoSheet'),'profile circle tappable for photo');
 av.click(); await wait(60);
 ok(d.getElementById('sheet').textContent.includes(w.eval("t('photoAdd')")),'tapping circle reveals add-photo option');
 w.eval("closeSheet()");
 // set photo -> avatar becomes image everywhere
 w.eval("cust('"+cid+"').photo='data:image/jpeg;base64,/9j/4AAQSkZJRg==';save();render()"); await wait(60);
 ok(w.eval("avat('"+w.eval("DD().customers[0].name")+"',46)").includes('<img'),'avatar renders stored photo');
 w.eval("tab('customers')"); await wait(60);
 ok(!!d.querySelector('#clist2 img'),'customer list shows the photo');
 // remove photo via sheet
 w.eval("go('profile',{id:'"+cid+"'})"); await wait(50);
 w.eval("openPhotoSheet('"+cid+"')"); await wait(50);
 ok(d.getElementById('sheet').textContent.includes(w.eval("t('photoDel')")),'remove option appears when photo exists');
 w.eval("removePhoto('"+cid+"')"); await wait(50);
 ok(!w.eval("cust('"+cid+"').photo"),'photo removed');
 // newcust circle opens the same hidden option
 w.eval("ui.nc={name:'تجربة',phone:'',limit:'',photo:null,edit:null};go('newcust',{})"); await wait(60);
 d.querySelector('.pad .av').click(); await wait(60);
 ok(d.getElementById('sheet').textContent.includes(w.eval("t('photoAdd')")),'newcust circle reveals add-photo');
 w.eval("closeSheet()");
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
