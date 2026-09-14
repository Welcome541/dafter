// Runner واحد لكل حزمة الاختبارات: npm test
const {spawnSync}=require('child_process');
const path=require('path');
const fs=require('fs');
const here=__dirname;
const files=fs.readdirSync(here).filter(f=>/^r\d+_.*\.js$|^test\d+\.js$/.test(f)).sort();
let tp=0,tf=0,failed=[];
for(const f of files){
  const r=spawnSync(process.execPath,[path.join(here,f)],{
    encoding:'utf8',
    env:Object.assign({},process.env,{NODE_PATH:process.env.NODE_PATH||path.join(here,'..','..','.pup','node_modules')})
  });
  const out=(r.stdout||'')+(r.stderr||'');
  const m=out.match(/(\d+) passed, (\d+) failed/);
  const p=m?+m[1]:0, fl=m?+m[2]:1;
  tp+=p; tf+=fl;
  console.log(f.padEnd(20), m?m[0]:'NO RESULT'+(r.status?' (exit '+r.status+')':''));
  if(!m||fl>0||r.status)failed.push(f);
}
console.log('────────────────────────────────');
console.log('TOTAL: '+tp+' passed, '+tf+' failed ('+files.length+' files)');
process.exit(tf||failed.length?1:0);
