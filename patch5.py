# -*- coding: utf-8 -*-
import re, json, urllib.parse
p='index.html'
s=open(p,encoding='utf-8').read()
orig=s
def rep(old,new,n=1):
    global s
    assert old in s, 'ANCHOR NOT FOUND: '+old[:80]
    s=s.replace(old,new,n)

i180=open('/tmp/i180.b64').read().strip()
i512=open('/tmp/i512.b64').read().strip()

# ---- 1) head: icons / title / manifest ----
s=re.sub(r'<link rel="icon" type="image/png" href="data:image/png;base64,[^"]*">',
         '<link rel="icon" type="image/png" href="data:image/png;base64,'+i180+'">',s,count=1)
s=re.sub(r'<link rel="apple-touch-icon" href="data:image/png;base64,[^"]*">',
         '<link rel="apple-touch-icon" href="data:image/png;base64,'+i180+'">',s,count=1)
rep('<meta name="apple-mobile-web-app-title" content="دَفتَر">',
    '<meta name="apple-mobile-web-app-title" content="دَفتَري">')
rep('<title>دَفتَر — Daftar</title>','<title>دَفتَري — Daftari</title>')
man={"name":"دَفتَري — دفتر حسابات البقالة","short_name":"دَفتَري","start_url":".","display":"standalone",
     "background_color":"#0d1f3a","theme_color":"#0d1f3a",
     "icons":[{"src":"data:image/png;base64,"+i512,"sizes":"512x512","type":"image/png","purpose":"any"}]}
s=re.sub(r'<link rel="manifest" href="data:application/manifest\+json,[^"]*">',
         '<link rel="manifest" href="data:application/manifest+json,'+urllib.parse.quote(json.dumps(man,ensure_ascii=False))+'">',s,count=1)

# ---- 2) lib script tags (xlsx was missing entirely!) ----
rep('<script src="lib/jsQR.js"></script>',
    '<script src="lib/jsQR.js"></script>\n<script src="lib/chart.umd.js"></script>\n<script src="lib/xlsx.full.min.js" defer></script>\n<script src="lib/tesseract.min.js" defer></script>')

# ---- 3) STR ar ----
rep("about:'عن التطبيق',aboutD:'دَفتَر — دفتر ديون يعمل محليًا 100% ويبقى معك.',",
    "about:'عن التطبيق',aboutD:'دَفتَري — دفتر ديون يعمل محليًا 100% ويبقى معك.',appName:'دَفتَري',tagline:'دفتر ديون البقالة',m6:'آخر 6 أشهر: دين جديد مقابل تحصيل',ocrBtn:'صورة دفتر قديم (OCR)',ocrRun:'جارٍ قراءة الصورة… قد يستغرق دقيقة',ocrNo:'تعذّرت القراءة — محرّك OCR يحتاج الإنترنت عند أول استخدام',quota:'امتلأت مساحة التخزين — صدِّر نسخة احتياطية الآن',")
rep("about:'About',aboutD:'Daftar — a 100% on-device debt ledger.',",
    "about:'About',aboutD:'Daftari — a 100% on-device debt ledger.',appName:'Daftari',tagline:'Grocery debt book',m6:'Last 6 months: new debt vs collected',ocrBtn:'Old ledger photo (OCR)',ocrRun:'Reading photo… may take a minute',ocrNo:'OCR failed — engine needs internet on first use',quota:'Storage full — export a backup now',")

# ---- 4) rebrand strings ----
rep("document.title=db.lang==='ar'?'دَفتَر':'Daftar'",
    "document.title=db.lang==='ar'?'دَفتَري':'Daftari'")
rep('<h1 style="margin-top:14px">دَفتَر</h1>','<h1 style="margin-top:14px">دَفتَري</h1>')
rep('دَفتَر Daftar · ','دَفتَري Daftari · ')

# ---- 5) save() quota guard ----
rep("""function save(){
 if(sec.enabled&&masterKey){encJSON(db,masterKey).then(p=>{try{localStorage.setItem(ENC,JSON.stringify(p));localStorage.removeItem(PLAIN)}catch(e){}})}
 else{try{localStorage.setItem(PLAIN,JSON.stringify(db));localStorage.removeItem(ENC)}catch(e){}}
}""",
"""function save(){
 if(sec.enabled&&masterKey){encJSON(db,masterKey).then(p=>{try{localStorage.setItem(ENC,JSON.stringify(p));localStorage.removeItem(PLAIN)}catch(e){toastMsg(t('quota'))}})}
 else{try{localStorage.setItem(PLAIN,JSON.stringify(db));localStorage.removeItem(ENC)}catch(e){toastMsg(t('quota'))}}
}""")

# ---- 6) S_reports weekly: canvas w/ fallback ----
rep(""" +'<div class="row" style="align-items:flex-end;gap:8px;height:90px">'+days.map((v,i)=>'<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px"><div style="width:100%;background:'+(i===6?'var(--green)':'var(--green-line)')+';border-radius:6px;height:'+Math.max(6,v/mx*70)+'px"></div><span class="muted" style="font-size:10px">'+(i===6?'·':(6-i))+'</span></div>').join('')+'</div></div></div>'""",
""" +(chartOK()?'<div style="position:relative;height:170px"><canvas id="chW"></canvas></div></div></div>'
 :'<div class="row" style="align-items:flex-end;gap:8px;height:90px">'+days.map((v,i)=>'<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px"><div style="width:100%;background:'+(i===6?'var(--green)':'var(--green-line)')+';border-radius:6px;height:'+Math.max(6,v/mx*70)+'px"></div><span class="muted" style="font-size:10px">'+(i===6?'·':(6-i))+'</span></div>').join('')+'</div></div></div>')""")

# ---- 7) monthly chart card after month stats ----
rep("""+'<div class="pad stats" style="margin-top:14px"><div class="stat red"><div class="t">'+t('monthDebt')+'</div><div class="v">'+money(monthDebt)+'</div></div><div class="stat green"><div class="t">'+t('collRate')+'</div><div class="v"><span class="num">'+rate+'%</span></div></div></div>'""",
"""+'<div class="pad stats" style="margin-top:14px"><div class="stat red"><div class="t">'+t('monthDebt')+'</div><div class="v">'+money(monthDebt)+'</div></div><div class="stat green"><div class="t">'+t('collRate')+'</div><div class="v"><span class="num">'+rate+'%</span></div></div></div>'
 +(chartOK()?'<div class="pad" style="margin-top:14px"><div class="card" style="padding:16px"><div class="row" style="margin-bottom:12px">'+ic('pie',18)+'<b>'+t('m6')+'</b></div><div style="position:relative;height:200px"><canvas id="chM"></canvas></div></div></div>':'')""")

# ---- 8) chart helpers + drawCharts ----
rep('/* ================= boot ================= */',
"""/* ================= charts (Chart.js MIT, fallback CSS bars) ================= */
function chartOK(){try{return typeof Chart!=='undefined'&&!!document.createElement('canvas').getContext('2d')}catch(e){return false}}
let __chW=null,__chM=null;
function drawCharts(){if(!chartOK())return;
 const pays=DD().payments;
 const days=[...Array(7)].map((_,i)=>{const d0=new Date();d0.setHours(0,0,0,0);const s0=d0.getTime()-(6-i)*864e5;return pays.filter(pp=>pp.ts>=s0&&pp.ts<s0+864e5).reduce((x,pp)=>x+pp.amount,0)});
 const cw=document.getElementById('chW');
 if(cw){if(__chW)__chW.destroy();
  __chW=new Chart(cw,{type:'bar',data:{labels:[...Array(7)].map((_,i)=>i===6?'·':String(6-i)),datasets:[{data:days,backgroundColor:days.map((v,i)=>i===6?'#0e7a52':'#bfe0d2'),borderRadius:6,maxBarThickness:34}]},options:{maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:'rgba(128,128,128,.15)'}}}}});}
 const now=new Date();const lbls=[],debtD=[],collD=[];
 for(let k=5;k>=0;k--){const m=new Date(now.getFullYear(),now.getMonth()-k,1);
  lbls.push(m.toLocaleDateString(db.lang==='ar'?'ar':['en'],{month:'short'}));
  debtD.push(DD().invoices.filter(i=>{const d=new Date(i.ts);return d.getMonth()===m.getMonth()&&d.getFullYear()===m.getFullYear()}).reduce((x,i)=>x+i.amount,0));
  collD.push(pays.filter(pp=>{const d=new Date(pp.ts);return d.getMonth()===m.getMonth()&&d.getFullYear()===m.getFullYear()}).reduce((x,pp)=>x+pp.amount,0));}
 const cm=document.getElementById('chM');
 if(cm){if(__chM)__chM.destroy();
  __chM=new Chart(cm,{type:'bar',data:{labels:lbls,datasets:[{label:t('owed'),data:debtD,backgroundColor:'#e08585',borderRadius:5,maxBarThickness:22},{label:t('collToday'),data:collD,backgroundColor:'#7fc8a4',borderRadius:5,maxBarThickness:22}]},options:{maintainAspectRatio:false,plugins:{legend:{labels:{boxWidth:12,font:{size:11}}}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:'rgba(128,128,128,.15)'}}}}});}
}
/* ================= OCR import (Tesseract.js Apache-2.0) ================= */
function ocrPick(){
 if(typeof Tesseract==='undefined'){toastMsg(t('ocrNo'));return}
 const inp=document.createElement('input');inp.type='file';inp.accept='image/*';
 inp.onchange=()=>{const f=inp.files&&inp.files[0];if(!f)return;toastMsg(t('ocrRun'));
  Tesseract.recognize(f,'ara+eng',{}).then(r=>{
    const txt=String(r&&r.data&&r.data.text||'');
    const rows=txt.split(/\\n+/).map(l=>l.split(/[,،;\\t]+/));
    importRows(rows);
  }).catch(()=>toastMsg(t('ocrNo')))};
 inp.click();
}
/* ================= boot ================= */""")

# ---- 9) render hook ----
rep(" window.scrollTo(0,0);}",
    " if(!locked&&typeof drawCharts==='function'&&(curScr()||{}).s==='reports')drawCharts();\n window.scrollTo(0,0);}")

# ---- 10) OCR button in import sheet ----
rep('<input type="file" accept=".txt,.csv,.xls,.xlsx" style="margin-top:10px" onchange="readImp(this)">',
    '<input type="file" accept=".txt,.csv,.xls,.xlsx" style="margin-top:10px" onchange="readImp(this)"><button class="btn btn-soft" style="margin-top:10px" onclick="ocrPick()">\'+ic(\'cam\',17)+t(\'ocrBtn\')+\'</button>')

assert s!=orig
open(p,'w',encoding='utf-8').write(s)
print('PATCH5 OK, new size', len(s))
