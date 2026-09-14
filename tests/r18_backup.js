const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
(async()=>{
 await wait(1000);
 const E=x=>w.eval(x);
 const name0=E("curAcc().name");
 // export -> verify
 const o=await E("Backup.obj()");
 ok(o.formatVersion===1&&!!o.checksum,'backup has formatVersion+checksum');
 ok(await E("Backup.verify("+JSON.stringify(o)+")")==='','verify accepts clean backup');
 // tamper -> checksum mismatch
 const bad=JSON.parse(JSON.stringify(o)); bad.data[bad.active].customers[0].name='تلاعب';
 ok((await E("Backup.verify("+JSON.stringify(bad)+")"))==='checksum-mismatch','tampered backup rejected by checksum');
 // corrupt json -> bad-format
 ok((await E("Backup.verify({format:'x'})"))==='bad-format','wrong format rejected');
 // restore clean with a change (recompute checksum legitimately)
 const o2=await E("(async()=>{const o=await Backup.obj();o.accounts[0].name='بقالة مستعادة';o.checksum=await sha256hex(JSON.stringify({a:o.accounts,d:o.data,s:o.settings}));return o})()");
 ok(await E("Backup.restore("+JSON.stringify(o2)+")")===true,'restore returns true');
 ok(E("curAcc().name")==='بقالة مستعادة','restore applied');
 ok(E("localStorage.getItem('safety-backup')")!==null,'safety backup created before restore');
 // restore tampered -> refused, db untouched
 ok(await E("Backup.restore("+JSON.stringify(bad)+")")===false,'tampered restore refused');
 ok(E("curAcc().name")==='بقالة مستعادة','db untouched after refused restore');
 // invariants after all
 ok(E("Invariants.check(db)")==='','invariants hold post-restore');
 // migration registry present
 ok(E("(db.meta||{}).schemaVersion")===2,'schemaVersion=2 in live db');
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});
