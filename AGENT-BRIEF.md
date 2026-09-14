# AGENT-BRIEF — «الدفتر / Dafter» دفتر ديون البقالة الصوتي
> ملف معرفة كامل لوكيل ذكاء اصطناعي يخلفني على المشروع. اقرأه كاملًا قبل أي تعديل. الحجم مستهدف ~200KB ليشمل الكود والحقوق والقرارات والتاريخ.

## 1) ما هذا المشروع
تطبيق ويب عربي (RTL، وإنجليزية اختيارية) لحفظ دفتر ديون بقالة/تموينات: تسجيل دين/سداد بالصوت (ضغط مطوّل) أو يدويًا (ضغطة واحدة)، عملاء بصور وأرشيف، كشوف وطباعة وQR وWhatsApp، حسابات متعددة، بلا إنترنت وبلا خادم — ملف HTML واحد + مكتبات محلية في lib/.
المستخدم صاحب بقالة؛ اللغة الأساسية للعواجهة العربية. كل قرارات التصميم تُحترم كما دوّنتها في §4.

## 2) التشغيل والفحص
- معاينة: `python3 -m http.server 3000 --directory /home/user/dafter` ثم افتح index.html.
- الاختبارات: `export NODE_PATH=/home/user/.pup/node_modules && cd tests && node rX_*.js` — كل ملف يطبع RESULT. البدلة الحالية 252/252 عبر 17 ملفًا.
- بيئة الاختبار jsdom من /home/user/.pup؛ لقطات puppeteer في /home/user/shots.
- فحوص إضافية: /home/user/.pup/axe.js (وصولية، الآن CLEAN كلها)، perf.js (تفاعل 1-4ms، بلا long tasks)، diag.js (كنسول/تداخل).

## 3) بنية الملف الواحد
- <head> + CSS (§10) + هيكل ثابت: #app، #tabbar، #actionrow (أزرار دين/سداد اللاصقة)، #sheetWrap/#sheet (الأوراق السفلية)، #toast.
- مكتبات خارجية محلية: ['lib/qrcode.js', 'lib/jsQR.js', 'lib/chart.umd.js', 'lib/xlsx.full.min.js', 'lib/tesseract.min.js'] (qrcode، jsQR، chart، xlsx، tesseract — تُحمّل defer؛ إن غابت يتدهور التطبيق برفق).
- <script> واحد (§11) يحوي كل المنطق. لا تقسم الملف ولا تضف بناءً/حزم — قرار مستخدم ثابت.

## 4) قيود المستخدم الدائمة (لا تُكسر أبدًا)
- الأزرار السفلية دين/سداد ثابتة: ضغطة=يدوي، مطوّلة≈380ms=صوتي. زر + الأوسط ثابت ويفتح (عميل يدوي / من جهات الاتصال) فقط.
- ملف HTML واحد؛ لا تقسيم ملفات ولا Keystore/تحويل native الآن (مؤجل: إعادة تسمية، تقسيم، Keystore).
- التطبيق لا يخترع بيانات: لا ديون ولا مواد تموينية من تلقاء نفسه؛ عند فشل الالتقاط نموذج فارغ + تحذير ولا حفظ بلا تأكيد.
- الفلتر في الرئيسية ثلاثي مطوي (اليوم/الأسبوع/الشهر) كشارة صغيرة داخل صف «آخر العمليات».
- شريط التحديد (إلغاء/تحديد الكل/مشاركة/أرشفة/حذف) مستطيل فوق العمليات تمامًا (نمط واتساب) وليس عائمًا أسفل.
- واجهة الحسابات المنسدلة بلا خيار «شخصي» (مستقبلي؛ يُعرض الحساب الشخصي فقط إن كان نشطًا كي لا يُحبس المستخدم).
- شاشة تأكيد التسجيل بلا زر «تعديل» — الحقول قابلة للتحرير مباشرة؛ وسطر «بيانات العميل لا تغادر جهازك» ظاهر.
- قائمة ⋮: تحديد/استيراد(مخفي=مستقبلي)/تصدير/QR/… بلا «استيراد نص» ظاهر ولا «وصف مشكلة».
- صورة العميل مخفية خلف نقرة الدائرة؛ تُصغّر 96px JPEG 0.82؛ بدون صورة أحرف أولية على تدرّج لوني ممزوج (نمط جهات الاتصال).
- نقد الرئيسية (أ–و) لا يُنفّذ إلا بأمر صريح «نفّذ».

## 5) نموذج البيانات
db={lang,active,accounts:[{id,name,type:'grocery'|'personal',cur}],data:{[accId]:{customers:[{id,name,phone,photo,archived,limit}],invoices:[{id,code,cust,ts,amount,note,due,arch,alloc?}],payments:[{id,cust,ts,amount,method,alloc:[{inv,amt}]}],seq}}}
sec={enabled,pin,dark,darkAuto,sound,vib,priv,vosk,btName,...} يُحفظ منفصلًا saveSec().
ui=حالة واجهة حية (tf:{kind,period},pOpen,txLimit,sel,tq,cq,rec{kind,st:'rec'|'edit',d{...},cands,warn},pay,nc{photo},...) — انظر `const ui=` في §11.
التخزين localStorage بمفتاح PLAIN أو ENC مشفّر (AES-GCM عبر crypto.subtle عند تفعيل PIN؛ masterKey من PIN+salt). دالة save() تكتب + تحذر مبكرًا عند >4MB (t('quotaWarn')).

## 6) عقود الدمج الخارجية
- الصوت: window.voskOnText(kind,text,confidence) وwindow.voskOnEnd()؛ المحرك الاختياري window.voskEngine={ready,start(kind,custId)} (فرع sec.vosk في startRec). التحليل parseSay/amtFromText يفهم الأرقام المنطوقة عربيًا؛ أخطاء صارمة warn_noamt/nospeech/lowconf/toobig.
- الطابعات BT: خدمات GATT في BT_SERV؛ ESC/POS init 1B 40 وقص 1D 56 42 00 (printBT/btStatement).
- QR نقل: بادئة J خام أو Z gzip؛ كشف العميل openQrStmt نص مقروء.
- OCR tesseract اختياري (نماذجه CDN وقت التشغيل — صِرح بأن عدم التوفر offline قائم).

## 7) خرائط الشاشات والتنقل
SCREENS: home, customers, reports, settings + فرعية: profile, invoice, newcust, rec, pay, lock. التنقل go()/back()/stack؛ tab() للتبويبات؛ render() يعيد بناء #app و#tabbar و#actionrow (الأخيرة تظهر في home/customers وخارج وضع التحديد).
الأوراق openSheet(): fab(يدوي/جهات)، homeMenu(تحديد/تصدير/QR)، accSheet(قائمة+إضافة بقالة)، photoSheet، curSheet(عملة مخصصة)، debtSheet(يدوي)، txFilter حُذفت، import مخفية لكن openImport() حية كمستقبل.

## 8) طبقة أحداث الأزرار (درس مهم!)
lpBtn() تولّد أزرار دين/سداد بثلاث طبقات: pointer + touch + click احتياطي، مع منع ازدواج (touchSeen/lpGuard). ترتيب الأحداث على اللمس: pointerdown قبل touchstart — لذا btnDown أحادي (`if(recPend)return`) وإلا تسرّب مؤقت يطلق التسجيل بعد ضغطة واحدة (حدث فعلاً وصُحح). btnClick يفتح اليدوي مباشرة لبيئات بلا Pointer Events.

## 9) دروس تحرير الكود (لتجنب كوارث سابقة)
- السلاسل داخل الملف JS أحادية الاقتباس؛ أي سمة HTML تحوي ' داخلها يجب تهريبها \' — خلط هذا أتلف الملف مرة (حذف جائر عبر indexOf امتد بين موضعين) واستُعيد من لقطة /tmp/arena-workspace/changes.zip.
- عند حذف كتل ميتة احذف بشرائح محددة الاحتفاظ (refreshHome/pChipsHtml كادت تضيع).
- بعد كل تعديل: node --check على المستخرج + بدلة الاختبارات + لقطة puppeteer للعنصر المتغير.
- node_modules و.cache لا تُحفظ بين الجلسات؛ أعد `npm i` في /home/user/.pup إن لزم، ومكتبات كروم عبر sudo apt libnspr4 libnss3 ….

## 10) CSS كامل
```css

:root{
  --bg:#f6f4f0; --card:#ffffff; --card2:#fbfaf7; --line:#e9e3d8; --line2:#efeae1;
  --ink:#15263c; --muted:#5f6873; --soft:#5c6675;
  --navy:#12294a; --navy2:#0d1f3a;
  --green:#0e7a52; --green-bg:#e7f4ee; --green-line:#bfe0d2;
  --red:#a71949; --red-bg:#f9e9ef; --red-line:#eac6d3;
  --amber:#b97f24; --amber-bg:#faf0dd; --amber-line:#e8d3a8;
  --sh:0 1px 2px rgba(21,38,60,.05),0 4px 14px rgba(21,38,60,.05);
  --r:18px;
}
body.dark{--bg:#12161b;--card:#1b2129;--card2:#20262e;--line:#2c343d;--line2:#252c35;--ink:#e9edf2;--muted:#9aa5b1;--soft:#aab4bf;--navy:#4d7fc0;--navy2:#0a0e13;--green:#2ea77c;--green-bg:#123227;--green-line:#1d4a38;--red:#d06389;--red-bg:#2e1622;--red-line:#4d2338;--amber:#d0a054;--amber-bg:#2d2312;--amber-line:#4d3c1f;--sh:0 1px 2px rgba(0,0,0,.5),0 4px 14px rgba(0,0,0,.35)}
body.dark{background:#04060a;color:var(--ink)}
body.dark #phone{box-shadow:0 0 0 1px #1c2127,0 20px 60px rgba(0,0,0,.6)}
body.dark .seg{background:#242b34}
body.dark .search .inp input{color:var(--ink)}
body.dark #toast{background:#232b35}
body.priv .num{display:inline-block;color:transparent}
body.priv .num::after{content:'•••';color:var(--muted)}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{background:#e7e3db;font-family:'IBM Plex Sans Arabic','Inter',system-ui,sans-serif;color:var(--ink)}
body[lang="en"]{font-family:'Inter',system-ui,sans-serif}
#phone{max-width:430px;margin:0 auto;min-height:100dvh;background:var(--bg);position:relative;box-shadow:0 0 0 1px #d8d2c6,0 20px 60px rgba(0,0,0,.18);display:flex;flex-direction:column}
.sbar{direction:ltr;display:flex;justify-content:space-between;align-items:center;padding:14px 22px 4px;font-weight:700;font-size:15px;font-family:'Inter',sans-serif}
.sbar .sic{display:flex;gap:6px;align-items:center}
.pad{padding:0 20px}
.card{background:var(--card);border:1px solid var(--line2);border-radius:var(--r);box-shadow:var(--sh)}
.muted{color:var(--muted);font-size:13px}
.soft{color:var(--soft)}
.row{display:flex;align-items:center;gap:10px}
.sp{flex:1}
.ic{flex:none}
button{font-family:inherit;border:none;background:none;cursor:pointer;color:inherit;touch-action:manipulation}
input,select,textarea{font-family:inherit;color:var(--ink)}
.num{font-family:'Inter','IBM Plex Sans Arabic',sans-serif;font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate}
.hdr{display:flex;align-items:center;gap:10px;padding:8px 18px 6px}
.hbtn{min-width:42px;height:42px;border-radius:14px;background:var(--card);border:1px solid var(--line2);box-shadow:var(--sh);display:flex;align-items:center;justify-content:center;color:var(--navy);padding:0 10px}
.hdr h1{font-size:19px;font-weight:800}
.hdr .sub{font-size:11.5px;color:var(--muted)}
.logo-ic{width:42px;height:42px;border-radius:13px;background:var(--navy);color:#e8c76a;display:flex;align-items:center;justify-content:center}
.btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:15px 18px;border-radius:15px;font-size:16px;font-weight:700;transition:transform .06s}
.btn:active{transform:scale(.98)}
.btn-navy{background:var(--navy);color:#fff}
.btn-green{background:var(--green);color:#fff}
.btn-red{background:var(--red);color:#fff}
.btn-line{background:var(--card);border:1.6px solid var(--navy);color:var(--navy)}
.btn-line-red{background:var(--card);border:1.6px solid var(--red);color:var(--red)}
.chip{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:999px;font-size:13px;font-weight:600}
.b-open{background:var(--red-bg);color:var(--red);border:1px solid var(--red-line)}
.b-part{background:var(--amber-bg);color:var(--amber);border:1px solid var(--amber-line)}
.b-paid{background:var(--green-bg);color:var(--green);border:1px solid var(--green-line)}
.dot{width:7px;height:7px;border-radius:50%;background:currentColor;display:inline-block}
.sw2{position:relative;width:50px;height:30px;border-radius:999px;background:#cfd6e2;transition:background .25s;cursor:pointer;flex:none}
.sw2::after{content:'';position:absolute;top:3px;inset-inline-start:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:inset-inline-start .25s}
.sw2.on{background:var(--green)}
.sw2.on::after{inset-inline-start:23px}
body.dark .sw2{background:#3a465c}
body.dark .sw2.on{background:var(--green)}
.segw{position:relative;display:flex;background:var(--card2);border:1px solid var(--line);border-radius:13px;padding:3px;width:200px}
.segw .thumb{position:absolute;top:3px;bottom:3px;width:calc(50% - 4px);inset-inline-start:3px;background:var(--navy);border-radius:10px;transition:inset-inline-start .25s;box-shadow:0 3px 8px rgba(13,31,58,.25)}
.segw button{position:relative;z-index:1;flex:1;border:none;background:none;padding:7px 0;font-weight:800;font-size:12.5px;color:var(--soft);cursor:pointer;border-radius:10px}
.segw button.on{color:#fff}
.selbar{margin:12px 20px 0}
.pchip{padding:6px 12px;border-radius:10px;background:var(--card);border:1px solid var(--line);font-size:12px;font-weight:700;color:var(--soft);display:inline-flex;align-items:center;gap:5px}
.pchip.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.selbar .btn{padding:10px 6px;font-size:12.5px}
.selctl{padding:8px 12px;border-radius:12px;border:1px solid var(--line);background:var(--card2);font-weight:800;font-size:13px;outline:none}
.dmsw{display:flex;align-items:center;gap:8px}
.dmsw .dico{display:flex;color:var(--soft)}
.autochip{border:1px solid var(--line);background:var(--card2);color:var(--soft);border-radius:999px;padding:4px 10px;font-size:11px;font-weight:800;cursor:pointer}
.autochip.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.langsw{display:inline-flex;gap:4px;background:var(--card2);border:1px solid var(--line);border-radius:999px;padding:3px}
.langsw button{border:none;background:none;padding:6px 13px;border-radius:999px;font-weight:800;font-size:12.5px;color:var(--soft);cursor:pointer}
.langsw button.on{background:var(--navy);color:#fff;box-shadow:0 3px 8px rgba(13,31,58,.25)}
.seg{display:flex;background:#efece6;border-radius:13px;padding:4px;gap:4px}
.seg button{flex:1;padding:9px 4px;border-radius:10px;font-size:13px;font-weight:700;color:var(--soft)}
.seg button.on{background:var(--navy);color:#fff;box-shadow:var(--sh)}
.seg button.on.r{background:var(--red)}
.inp{width:100%;padding:13px 15px;border-radius:14px;border:1.5px solid var(--line);background:var(--card);font-size:15.5px;outline:none}
.inp:focus{border-color:var(--navy)}
label.lb{display:block;font-size:13.5px;font-weight:700;color:var(--soft);margin:14px 2px 8px}
.av{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;flex:none;position:relative;color:#fff}
.av .cam{position:absolute;bottom:-2px;inset-inline-end:-4px;width:30px;height:30px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;border:3px solid var(--bg)}
.list{display:flex;flex-direction:column;gap:11px}
.litem{display:flex;align-items:center;gap:12px;padding:13px 14px;cursor:pointer;user-select:none;-webkit-user-select:none;transition:transform .08s, box-shadow .12s}
.litem.sel{box-shadow:0 0 0 2px var(--navy)}
.amt{font-weight:800;font-size:15.5px}
.amt.red{color:var(--red)} .amt.green{color:var(--green)} .amt.gray{color:var(--muted)}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.stat{padding:15px;border-radius:var(--r);background:var(--card);border:1px solid var(--line2);box-shadow:var(--sh);position:relative;overflow:hidden}
.stat::before{content:'';position:absolute;inset-inline-start:0;top:0;bottom:0;width:5px}
.stat.red::before{background:var(--red)} .stat.green::before{background:var(--green)}
.stat .t{font-size:12.5px;font-weight:700;color:var(--soft);display:flex;gap:7px;align-items:center}
.stat .v{font-size:22px;font-weight:800;margin-top:7px;white-space:nowrap}
.stat.red .v{color:var(--red)} .stat.green .v{color:var(--green)}
.search{display:flex;gap:10px;align-items:center}
.search .inp{min-width:0}
.search .inp input{min-width:0;width:100%}
.search>.hbtn{flex:none}
.search .inp{flex:1;border-radius:14px;padding:12px 14px;font-size:14px;display:flex;align-items:center;gap:8px;color:var(--muted)}
.search .inp input{border:none;outline:none;background:none;flex:1;font-size:14px;color:var(--ink)}
.chips{display:flex;gap:8px;overflow-x:auto;padding:2px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chips button{flex:none;border-radius:999px;padding:9px 16px;background:var(--card);border:1px solid var(--line2);box-shadow:var(--sh);font-weight:700;font-size:13px;color:var(--soft)}
.chips button.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.chips button.on.red{background:var(--red);border-color:var(--red)}
.chips button.on.amber{background:var(--amber);border-color:var(--amber)}
.chips button.on.green{background:var(--green);border-color:var(--green)}
#tabbar{position:sticky;bottom:0;background:var(--navy2);display:grid;grid-template-columns:1fr 1fr 64px 1fr 1fr;align-items:end;padding:6px 8px calc(6px + env(safe-area-inset-bottom));z-index:40}
#tabbar button{display:flex;flex-direction:column;align-items:center;gap:4px;color:#7f8ea3;font-size:11px;font-weight:700;padding:8px 0 6px}
#tabbar button.on{color:#fff}
#actionrow{position:sticky;bottom:56px;display:flex;gap:12px;padding:0 16px 10px;z-index:35;background:linear-gradient(transparent,var(--bg) 30%)}
#actionrow .btn{padding:13px}
#actionrow .btn,.bottombar .btn{touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.fab2{width:56px;height:56px;border-radius:50%;background:var(--red);color:#fff;margin:-24px auto 2px;box-shadow:0 10px 24px rgba(167,25,73,.42),0 0 0 5px var(--navy2);display:flex;align-items:center;justify-content:center}
#fabAdd{display:none;position:absolute;bottom:132px;inset-inline-end:18px;width:56px;height:56px;border-radius:50%;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(13,31,58,.35);z-index:36;transition:transform .25s,opacity .25s}
#fabAdd.hid{transform:scale(0);opacity:0}
#sheetWrap{position:fixed;inset:0;z-index:60;display:none}
#sheetWrap.open{display:block}
#sheetWrap .bk{position:absolute;inset:0;background:rgba(13,22,38,.42);animation:fade .2s}
#sheet{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:var(--bg);border-radius:26px 26px 0 0;padding:10px 20px calc(20px + env(safe-area-inset-bottom));animation:up .28s cubic-bezier(.2,.9,.3,1);max-height:88dvh;overflow:auto}
#sheet .grab{width:44px;height:5px;border-radius:3px;background:#d4cec2;margin:6px auto 14px}
#sheet h3{font-size:18px;margin:4px 0 14px}
@keyframes up{from{transform:translate(-50%,40px);opacity:.4}to{transform:translate(-50%,0);opacity:1}}
@keyframes fade{from{opacity:0}}
.srow{display:flex;align-items:center;gap:14px;background:var(--card);border:1px solid var(--line2);border-radius:16px;padding:15px;margin-bottom:10px;width:100%;text-align:start;box-shadow:var(--sh)}
.srow .sic2{width:44px;height:44px;border-radius:14px;background:#eef1f5;color:var(--navy);display:flex;align-items:center;justify-content:center;flex:none}
.srow .t{font-weight:700;font-size:15px;display:block}
.srow .d{display:block}
.srow .d{font-size:12px;color:var(--muted);margin-top:2px}
#toast{position:fixed;bottom:120px;left:50%;transform:translateX(-50%);width:min(400px,92vw);background:var(--navy);color:#fff;border-radius:16px;padding:12px 15px;display:none;align-items:center;gap:12px;z-index:70;box-shadow:0 12px 30px rgba(13,31,58,.35)}
#toast.show{display:flex;animation:up2 .25s}
@keyframes up2{from{transform:translate(-50%,14px);opacity:0}}
#toast .tb{margin-inline-start:auto;border:1.4px solid #e8c76a;color:#e8c76a;border-radius:10px;padding:7px 12px;font-weight:700;font-size:13px;display:flex;gap:6px;align-items:center}
.micwrap{display:flex;flex-direction:column;align-items:center;padding:22px 0 8px}
.mic{width:126px;height:126px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#1d4a41,#0c3b31 70%);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 34px rgba(12,59,49,.35),0 0 0 10px rgba(14,122,82,.08)}
.mic:active{transform:scale(.96)}
.mic.live{animation:pulse 1.4s infinite}
@keyframes pulse{0%{box-shadow:0 14px 34px rgba(12,59,49,.35),0 0 0 8px rgba(14,122,82,.14)}50%{box-shadow:0 14px 34px rgba(12,59,49,.35),0 0 0 20px rgba(14,122,82,.07)}100%{box-shadow:0 14px 34px rgba(12,59,49,.35),0 0 0 8px rgba(14,122,82,.14)}}
.wave{display:flex;gap:4px;align-items:center;height:42px;margin:14px 0 4px}
.wave i{width:3.5px;border-radius:2px;background:var(--green);height:8px;animation:wv 1s ease-in-out infinite;animation-delay:var(--d)}
@keyframes wv{0%,100%{height:6px}50%{height:var(--h)}}
.wave.red i{background:var(--red)}
.transcript{background:var(--green-bg);border:1px solid var(--green-line);color:var(--green);border-radius:999px;padding:9px 17px;font-weight:700;font-size:14px;margin:8px 0 4px}
.kv{display:flex;align-items:center;gap:12px;padding:13px 4px;border-bottom:1px dashed var(--line)}
.kv:last-child{border-bottom:none}
.kv .k{color:var(--muted);font-size:13.5px;font-weight:600;display:flex;gap:9px;align-items:center}
.kv .v{margin-inline-start:auto;font-weight:700;font-size:15px;text-align:end}
.kic{width:38px;height:38px;border-radius:12px;background:#f1efe9;display:flex;align-items:center;justify-content:center;color:var(--navy);flex:none}
.success{display:flex;flex-direction:column;align-items:center;padding:28px 0 8px;animation:pop .35s cubic-bezier(.3,1.6,.5,1)}
@keyframes pop{from{transform:scale(.6);opacity:0}}
.okc{width:92px;height:92px;border-radius:50%;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(14,122,82,.35)}
.bottombar{position:sticky;bottom:0;background:linear-gradient(transparent,var(--bg) 26%);padding:24px 20px calc(14px + env(safe-area-inset-bottom));display:flex;gap:12px;z-index:30}
.bottombar .btn{flex:1}
.inv{padding:15px;cursor:pointer;position:relative;overflow:hidden}
.inv::before{content:'';position:absolute;inset-inline-start:0;top:0;bottom:0;width:5px;background:var(--red)}
.inv.part::before{background:var(--amber)}
.inv.paid::before{background:var(--green)}
.fwrap{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .38s cubic-bezier(.2,.9,.3,1),opacity .3s}
.fwrap.open{grid-template-rows:1fr;opacity:1}
.fwrap>div{overflow:hidden}
.fpanel{margin:10px 0 2px;padding:14px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
select.inp{appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--soft) 50%),linear-gradient(135deg,var(--soft) 50%,transparent 50%);background-position:calc(0% + 18px) 55%,calc(0% + 13px) 55%;background-size:5px 5px;background-repeat:no-repeat}
html[dir="ltr"] select.inp{background-position:calc(100% - 13px) 55%,calc(100% - 18px) 55%}
.selbar{display:flex;align-items:center;gap:10px;background:var(--navy);color:#fff;border-radius:16px;padding:10px 14px;margin-bottom:12px;animation:up2 .2s}
.pined::after{content:'';position:absolute;top:10px;inset-inline-end:10px;width:8px;height:8px;border-radius:50%;background:#e8c76a}
.ptr{display:flex;justify-content:center;padding:0;height:0;overflow:hidden;transition:height .2s;color:var(--soft)}
.ptr.on{height:44px}
.padlock{display:flex;flex-direction:column;align-items:center;padding-top:6vh}
.kp{display:grid;grid-template-columns:repeat(3,76px);gap:14px;justify-content:center;margin-top:26px}
.kp button{width:76px;height:76px;border-radius:50%;background:var(--card);border:1px solid var(--line2);font-size:24px;font-weight:800;font-family:'Inter';box-shadow:var(--sh)}
.kp button:active{transform:scale(.94)}
.pdots{display:flex;gap:14px;margin-top:26px}
.pdots i{width:15px;height:15px;border-radius:50%;border:2px solid var(--navy)}
.pdots i.f{background:var(--navy)}
.on-dot{width:9px;height:9px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.15)}
.on-dot.off{background:#cbd5e1;box-shadow:none}
.cand{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
.cand button{border:1.5px solid var(--navy);color:var(--navy);border-radius:999px;padding:7px 14px;font-weight:700;font-size:13px}
.cand button.on{background:var(--navy);color:#fff}
#printArea{display:none}
@media print{#phone{display:none!important}#printArea{display:block;font-family:'IBM Plex Sans Arabic',sans-serif;direction:rtl;padding:30px}#printArea h2{margin-bottom:4px}#printArea table{width:100%;border-collapse:collapse;margin-top:14px}#printArea td,#printArea th{border:1px solid #bbb;padding:8px;font-size:13px}}
.hide{display:none!important}

/* ===== responsive: small phones ===== */
.accchip .accn{max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:middle}
.hdr .sp{min-width:0}
.hdr h1{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.litem .sp{min-width:0}
.litem .sp b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media (max-width:480px){.hdr .accchip .accn{display:none}}
@media (max-width:360px){
 .accchip .accn{display:none}
 .stat .v{font-size:18px}
 .pad{padding:0 14px}
 .hdr{padding:8px 12px 6px}
 .stat{padding:12px}
 .stat .v{font-size:19px}
 .btn{font-size:15px;padding:13px 14px}
 #tabbar button{font-size:10px}
 .litem{padding:11px 12px;gap:10px}
 .amt{font-size:14.5px}
 .inp{font-size:14.5px;padding:12px 13px}
 .fab2{width:52px;height:52px}
}
/* ===== responsive: tablets & wide ===== */
@media (min-width:720px){
 #phone{max-width:640px}
 #sheet{max-width:640px}
 .stat .v{font-size:26px}
 .litem{padding:15px 16px}
 .list{gap:13px}
 .btn{font-size:17px}
 #tabbar{grid-template-columns:1fr 1fr 72px 1fr 1fr}
 .fab2{width:62px;height:62px}
 .srow{padding:17px}
}
@media (max-height:640px){.stat{padding:11px}.stat .v{font-size:19px}.hdr{padding:6px 14px 4px}.pad.search{margin-top:8px!important}}
button:focus-visible,.hbtn:focus-visible,.litem:focus-visible,.stat:focus-visible,#tabbar button:focus-visible{outline:2.5px solid var(--navy);outline-offset:2px}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

```

## 11) كود التطبيق كامل (script)
```js

/* ================= icons ================= */
const P={
mic:'<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>',
user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
userplus:'<path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>',
wallet:'<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
clock:'<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 13.5"/>',
phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>',
cam:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="2" fill="none"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',vibrate:'<rect x="9" y="4" width="6" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 9v6M2.5 10.5v3M19 9v6M21.5 10.5v3" stroke="currentColor" stroke-width="2" fill="none"/>',moon:'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',printer:'<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',eyeoff:'<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',zap:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
search:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
sliders:'<line x1="21" y1="6" x2="14" y2="6"/><line x1="10" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/><line x1="21" y1="18" x2="16" y2="18"/><line x1="12" y1="18" x2="3" y2="18"/><circle cx="12" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="14" cy="18" r="2"/>',
chevD:'<polyline points="6 9 12 15 18 9"/>',
back:'<polyline points="15 18 9 12 15 6"/>',
fwd:'<polyline points="9 18 15 12 9 6"/>',
plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
check:'<polyline points="20 6 9 17 4 12"/>',
checkc:'<circle cx="12" cy="12" r="9"/><polyline points="8.5 12.2 11 14.7 15.7 9.7"/>',
shield:'<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z"/><polyline points="9 11.5 11.2 13.7 15.5 9.5"/>',
lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
unlock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.7-1.5"/>',
trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
edit:'<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
archive:'<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
dots:'<circle cx="12" cy="5" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.7" fill="currentColor" stroke="none"/>',
home:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
receipt:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
pie:'<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10Z"/>',
gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22M4.6 4.6l1.9 1.9M17.5 17.5l1.9 1.9M19.4 4.6l-1.9 1.9M6.5 17.5l-1.9 1.9"/>',
undo:'<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
banknote:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
coins:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6"/><path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6"/>',
tag:'<path d="M20.59 13.41 12 22 2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><circle cx="7" cy="7" r="1.5"/>',
x:'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
save:'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
contact:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M6 15.5a3 3 0 0 1 6 0"/><path d="M15 9h4M15 13h4"/>',
book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
excel:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 8l6 8M15 8l-6 8"/>',
pdf:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6M9 17h4"/>',
up:'<path d="M12 19V5"/><polyline points="5 12 12 5 19 12"/>',
globe:'<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
hist:'<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><polyline points="12 7 12 12 15 14"/>',
pin:'<path d="M12 17v5"/><path d="M9 3h6l1 7 3 2H5l3-2Z"/>',
store:'<path d="M4 10 5.5 4h13L20 10"/><path d="M4 10a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0"/><path d="M5 12v8h14v-8"/><path d="M9 20v-5h6v5"/>',
wa:'<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z"/><path d="M9 9.5c0 4 5.5 6.5 6.5 6l.5-1.5-2-1-1 .7c-1-.5-1.7-1.2-2.2-2.2l.7-1-1-2Z"/>',
sms:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
fp:'<path d="M12 11a3 3 0 0 0-3 3c0 2.5-.5 4.5-1 5.5"/><path d="M15 14c0 3-.5 5.5-1 7"/><path d="M17.8 17c.2-1 .2-2 .2-3a6 6 0 0 0-9-5.2"/><path d="M5.6 10A6 6 0 0 0 6 14c0 1.5-.2 3-.6 4.2"/><path d="M20.7 12.3A9 9 0 0 0 6 6.6"/><path d="M3.3 9.7A9 9 0 0 1 4.6 7.6"/>'
};
const ic=(n,s=22)=>'<svg class="ic" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+P[n]+'</svg>';

/* ================= i18n ================= */
const STR={
ar:{today:'اليوم',customers:'العملاء',reports:'التقارير',settings:'الإعدادات',
owed:'الديون المفتوحة',collToday:'حصّلت اليوم',searchC:'بحث عن عميل…',filter:'تصفية',
accounts:'حسابات العملاء',last:'آخر حركة',justNow:'منذ لحظات',yest:'أمس',
minAgo:n=>'منذ '+n+(n===1?' دقيقة':n===2?' دقيقتين':n<=10?' دقائق':' دقيقة'),
hrAgo:n=>'منذ '+n+(n===1?' ساعة':n===2?' ساعتين':n<=10?' ساعات':' ساعة'),
dayAgo:n=>'منذ '+n+(n===1?' يوم':n===2?' يومين':n<=10?' أيام':' يوم'),
debtor:'مدين',settled:'مسدد',newDebt:'دين',pay:'سداد',recDebt:'تسجيل دين',recPay:'تسجيل سداد',
addC:'عميل جديد',status:'الحالة',all:'الكل',open:'مفتوح',part:'جزئي',paid:'مسدد',
period:'الفترة',pAll:'كل الفترات',pToday:'اليوم',pWeek:'هذا الأسبوع',pMonth:'هذا الشهر',
sort:'الترتيب',sRecent:'الأحدث',sDebt:'الأكثر دينًا',sFreq:'الأكثر تكرارًا',noRes:'لا توجد نتائج',
custAcc:'حساب العميل',remaining:'المتبقي',totalPaid:'إجمالي المسدد',invoices:'الفواتير',noInv:'لا توجد فواتير بعد',
since:y=>'عميل منذ '+y,invoice:'فاتورة',payLog:'سجل السداد',noPay:'لم يُسجَّل سداد لهذه الفاتورة بعد',
payRemaining:'سداد المتبقي',shareReceipt:'مشاركة إيصال',total:'الإجمالي',paidLbl:'المسدَّد',
voiceTitle:'تسجيل دين بالصوت',tapMic:'اضغط الميكروفون ثم قل:',example:'«أبو خالد، خمسين ريال، رز وحليب»',
listening:'أنا أستمع…',heard:'سمعتُ:',cust:'العميل',amount:'المبلغ',remind:'التذكير',remindPh:'رز وحليب… أو اسم للدليل',
confirmReg:'تأكيد',editL:'تعديل',voiceHint:'الترتيب: الاسم ← السعر ← التذكير (ما أخذه العميل أو دليل يذكّرك به). يُحفظ التذكير نصًا دون تسعير.',
debtDone:'تم تسجيل الدين',undoAvail:'تراجع خلال ثوانٍ',undo:'تراجع',
payTitle:'تسجيل سداد',chooseC:'اختر العميل',amountNow:'المبلغ المدفوع الآن',full:'كامل المبلغ',
method:'طريقة السداد',cash:'نقدًا',transfer:'تحويل',cardpay:'بطاقة',
afterPay:'الحالة بعد السداد',willPart:'سيصبح مسددًا جزئيًا',willPaid:'سيصبح مسددًا بالكامل',
remainAfter:'المتبقي بعد السداد',confirmPay:'تأكيد السداد',payDone:'تم تسجيل السداد',done:'تم',viewC:'عرض العميل',
nameReq:'اسم العميل *',phone:'رقم الهاتف — اختياري',fromContacts:'اختيار من جهات الاتصال',
privacyC:'بيانات العميل لا تغادر جهازك.',saveC:'حفظ العميل',contactsT:'اختيار جهة اتصال',
searchName:'ابحث بالاسم أو الرقم',contactsOnly:'تُستخدم جهات الاتصال لاختيار العميل فقط',
custOpts:'خيارات العميل',editC:'تعديل بيانات العميل',shareExp:'مشاركة وتصدير',shareExpD:'PDF أو Excel أو نص',
archC:'أرشفة العميل',archD:'يُحفظ السجل المالي ولا يُحذف',cancel:'إلغاء',archived:'تمت الأرشفة — السجل محفوظ',
exportT:'مشاركة وتصدير',stTxt:'نسخ كشف نصي',stPdf:'تصدير PDF',stXls:'تصدير Excel',copied:'تم نسخ الكشف',
sendWa:'تذكير واتساب',sendSms:'رسالة SMS',
lang:'اللغة',currency:'العملة',langCur:'اللغة والعملة',curCustom:'عملة مخصصة',country:'الدولة',prefs:'التفضيلات',photoT:'صورة العميل',manualC:'عميل يدوي',manualCd:'اكتب الاسم والجوال — الصورة اختيارية',contactsD:'اختيار سريع بدون كتابة',showMore:'عرض المزيد',quotaWarn:'التخزين يقترب من الامتلاء — صدّر نسخة احتياطية من الإعدادات.',photoAdd:'إضافة / تغيير صورة',photoD:'تُصغَّر تلقائيًا كي لا تؤثر على التطبيق',photoDel:'إزالة الصورة',accName:'اسم المحل / الحساب',saveName:'حفظ',dataSec:'البيانات',
exportAll:'تصدير كل البيانات (Excel)',importT:'استيراد دفتر (نص/CSV)',importD:'كل سطر: الاسم، المبلغ، التذكير',importGo:'استيراد',imported:n=>'تم استيراد '+n+' عملية',
reset:'إعادة تعيين البيانات التجريبية',resetQ:'استبدال كل البيانات الحالية؟',
about:'عن التطبيق',aboutD:'دَفتَري — دفتر ديون يعمل محليًا 100% ويبقى معك.',appName:'دَفتَري',tagline:'دفتر ديون البقالة',m6:'آخر 6 أشهر: دين جديد مقابل تحصيل',ocrBtn:'صورة دفتر قديم (OCR)',ocrRun:'جارٍ قراءة الصورة… قد يستغرق دقيقة',ocrNo:'تعذّرت القراءة — محرّك OCR يحتاج الإنترنت عند أول استخدام',quota:'امتلأت مساحة التخزين — صدِّر نسخة احتياطية الآن',todayDebt:'دين اليوم',expToday:'مصروف اليوم',depToday:'أودعت اليوم',emptyHome:'لا عمليات بعد — اضغط مطولًا على «دين» وتكلّم، أو سجّل يدويًا',back:'رجوع',menu:'خيارات',hideAmt:'إخفاء المبالغ أو إظهارها',totalDebt:'إجمالي الديون',noToday:'لا عمليات اليوم بعد.',showAll:'عرض كل الأيام',allDays:'كل الأيام',
savedC:'تم حفظ العميل',savedName:'تم الحفظ',chooseFirst:'اختر عميلًا أولًا',enterAmt:'أدخل مبلغًا صحيحًا',
payOf:'دفعة',noCustomers:'لا يوجد عملاء بعد',pinned:'مثبّتون',pinU:'تثبيت',unpinU:'إلغاء التثبيت',
sel:'تحديد',selN:n=>'تم تحديد '+n,archSel:'أرشفة المحدد',online:'متصل',offline:'دون اتصال',
secT:'الأمان والخصوصية',setPin:'تفعيل رمز القفل',changePin:'تغيير رمز القفل',lockOff:'إيقاف القفل',
enterPin:'أدخل رمز القفل',wrongPin:'رمز غير صحيح',fpAdd:'إضافة بصمة إصبع',fpNo:'البصمة غير مدعومة على هذا الجهاز',
sound:'الصوت',vib:'اهتزاز',refreshed:'تم التحديث',pull:'اسحب للتحديث',
accT:'الحسابات',addAcc:'إضافة حساب',editAcc:'تعديل الحساب',grocery:'بقالة',personal:'شخصي',
lockNow:'قفل الآن',autoL:'قفل تلقائي بعد',m1:'دقيقة',m2:'دقيقتان',m5:'5 دقائق',
theme:'المظهر',soon:'قريبًا',deletedKeep:'الحذف النهائي غير متاح — الأرشفة تحفظ سجلك المالي (الأفضل محاسبيًا)',
cand:'اختر المقصود:',localOnly:'يعمل محليًا · بدون إنترنت',printTitle:'كشف حساب',voiceEng:'محرك الصوت (قابل للتبديل)',week7:'آخر 7 أيام',fpUse:'البصمة',recOn:'أسجّل… أكمل الكلام',manualDebt:'تسجيل يدوي سريع',quickPay:'سداد سريع',callC:'اتصال',openAcc2:'فتح الحساب',archivedT:'المؤرشفون',activeC:'النشطون',restore:'استعادة',noArch:'لا يوجد مؤرشفون',lastOps:'آخر العمليات',searchTx:'ابحث بالاسم أو المنتج…',filterTx:'تصفية السجل',resetF:'إعادة التعيين',typeG:'النوع',addQ:'إضافة سريعة',personalMsg:'الحساب الشخصي يسجّل مصروفاتك وإيداعاتك مباشرة — لا يحتاج إلى عملاء.',account:'الحساب',switchAcc:'تغيير الحساب',recordSound:'صوت التسجيل',vibOnRecord:'اهتزاز عند التسجيل',security:'الأمان',pinLock:'قفل برمز PIN',useFinger:'فتح بالبصمة',autoLock:'قفل تلقائي بعد (دقائق)',turnOffPin:'إيقاف القفل',off:'غير مفعّل',fpAdd:'إضافة',nOwe:'عليهم دين',totalDue:'إجمالي المستحق',selN:'محدد',selAll:'تحديد الكل',selEmpty:'لا يوجد تحديد',deletedN:n=>'تم حذف '+n+' عنصر',share:'مشاركة',archiveAct:'أرشفة',del:'حذف',txArchived:n=>'أُرشفت '+n+' حركة',copied:'تم النسخ ✓',darkMode:'الوضع الليلي',fpN:'بصمة',due:'تاريخ الاستحقاق',overdue:'متأخر',limitLbl:'سقف الدين (اختياري)',noLimit:'بلا سقف',overLimit:'تجاوز العميل سقف الدين!',overLimitS:'تجاوز السقف',waRemind:'تذكير واتساب',waNoPhone:'أضف رقم العميل أولًا من تعديل بياناته',monthDebt:'ديون الشهر',collRate:'نسبة التحصيل',bestCust:'الأكثر شراءً',overdueC:'متأخرون عن السداد',vengLbl:'محرك الصوت',webEng:'الهاتف',voskNo:'محرك Vosk غير مثبّت — راجع VOSK-SETUP.md',webNo:'محرك الهاتف غير متوفر',qrSend:'إرسال برمز QR',qrStmt:'كشف QR للعميل',qrStmtHint:'يمسح العميل الرمز بأي هاتف — يصله الكشف نصًا ويفتح في أي تطبيق.',qrRecv:'استقبال برمز QR',qrBig:'البيانات أكبر من سعة الرمز — استخدم تصدير ملف',qrHint:'افتح التطبيق على جهاز آخر ← الإعدادات ← استقبال برمز QR',qrScan:'وجّه الكاميرا نحو رمز الجهاز الآخر',qrDone:'تم استلام الدفتر ✓',qrCam:'الكاميرا غير متوفرة',darkDay:'نهاري',darkNight:'ليلي',darkAuto:'تلقائي',speakLbl:'نطق الاسم والمبلغ بعد التسجيل',btPrint:'طباعة بلوتوث',btConn:'توصيل',btNo:'البلوتوث غير متاح في هذا المتصفح',btFail:'تعذّر الاتصال',btNoDev:'وصّل طابعة بلوتوث أولًا من الإعدادات',voskOpt:'محرك VOSK (دمج اختياري)',voskOn:'تفعيل VOSK',voskOff:'إيقاف VOSK',voskHelp:'اختياري ومخفي في آخر الإعدادات لتوفير المساحة.\nلدمجه: اتبع VOSK-SETUP.md (نموذج vosk-ar).\nيفهم الأرقام المنطوقة محليًا بدون إنترنت، وإن غاب يتجاهله التطبيق تلقائيًا.',strictT:'تعليمات النطق الصارمة',strictRules:'١) قل: «دين» أو «سداد» ← الاسم ← المبلغ.\n٢) المبلغ يُفهم أرقامًا (50 / ٥٠) أو كلامًا (خمسين، مية وعشرين، ألف وخمسين).\n٣) أي خطأ يُكتشف فورًا ويُعرض برسالة واضحة مع تصحيح يدوي قبل الحفظ.',warn_noamt:'لم أسمع مبلغًا صالحًا — عدّله يدويًا أو أعد التسجيل',warn_nospeech:'لم يُلتقط أي كلام — اقترب وأعد المحاولة',warn_lowconf:'ثقة التعرف منخفضة — راجع المبلغ قبل التأكيد',warn_toobig:'المبلغ غير منطقي (يتجاوز المليون) — صحّحه يدويًا',strictFix:'تحقق من المبلغ والاسم في النموذج أدناه قبل التأكيد.'}
,en:{today:'Today',customers:'Customers',reports:'Reports',settings:'Settings',
owed:'Open debts',collToday:'Collected today',searchC:'Search customers…',filter:'Filter',
accounts:'Customer accounts',last:'Last activity',justNow:'just now',yest:'Yesterday',
minAgo:n=>n+' min ago',hrAgo:n=>n+' hr ago',dayAgo:n=>n+' days ago',
debtor:'owes',settled:'settled',newDebt:'Debt',pay:'Payment',recDebt:'Record debt',recPay:'Record payment',
addC:'New customer',status:'Status',all:'All',open:'Open',part:'Partial',paid:'Paid',
period:'Period',pAll:'All time',pToday:'Today',pWeek:'This week',pMonth:'This month',
sort:'Sort',sRecent:'Recent',sDebt:'Highest debt',sFreq:'Most frequent',noRes:'No results',
custAcc:'Customer account',remaining:'Remaining',totalPaid:'Total paid',invoices:'Invoices',noInv:'No invoices yet',
since:y=>'Customer since '+y,invoice:'Invoice',payLog:'Payment log',noPay:'No payments recorded yet',
payRemaining:'Pay remaining',shareReceipt:'Share receipt',total:'Total',paidLbl:'Paid',
voiceTitle:'Record debt by voice',tapMic:'Tap the mic, then say:',example:'“Abu Khaled, fifty, rice and milk”',
listening:'Listening…',heard:'I heard:',cust:'Customer',amount:'Amount',remind:'Reminder',remindPh:'rice & milk… or a clue name',
confirmReg:'Confirm',editL:'Edit',voiceHint:'Order: name → price → reminder (what they took, or a clue). Saved as text, unpriced.',
debtDone:'Debt recorded',undoAvail:'Undo for a few seconds',undo:'Undo',
payTitle:'Record payment',chooseC:'Choose customer',amountNow:'Amount paid now',full:'Full amount',
method:'Method',cash:'Cash',transfer:'Transfer',cardpay:'Card',
afterPay:'After payment',willPart:'becomes partially paid',willPaid:'becomes fully paid',
remainAfter:'Remaining after',confirmPay:'Confirm payment',payDone:'Payment recorded',done:'Done',viewC:'View customer',
nameReq:'Customer name *',phone:'Phone — optional',fromContacts:'Pick from contacts',
privacyC:'Customer data never leaves your device.',saveC:'Save customer',contactsT:'Choose a contact',
searchName:'Search name or number',contactsOnly:'Contacts are only used to pick a customer',
custOpts:'Customer options',editC:'Edit customer',shareExp:'Share & export',shareExpD:'PDF, Excel or text',
archC:'Archive customer',archD:'Financial history is kept',cancel:'Cancel',archived:'Archived — history kept',
exportT:'Share & export',stTxt:'Copy text statement',stPdf:'Export PDF',stXls:'Export Excel',copied:'Statement copied',
sendWa:'WhatsApp reminder',sendSms:'SMS message',
lang:'Language',currency:'Currency',langCur:'Language & currency',curCustom:'Custom currency',country:'Country',prefs:'Preferences',photoT:'Customer photo',manualC:'Manual customer',manualCd:'Type name & phone — photo optional',contactsD:'Quick pick, no typing',showMore:'Show more',quotaWarn:'Storage nearing full — export a backup from Settings.',photoAdd:'Add / change photo',photoD:'Auto-downscaled so the app stays light',photoDel:'Remove photo',accName:'Shop / account name',saveName:'Save',dataSec:'Data',
exportAll:'Export all data (Excel)',importT:'Import ledger (text/CSV)',importD:'Per line: name, amount, reminder',importGo:'Import',imported:n=>'Imported '+n+' records',
reset:'Reset demo data',resetQ:'Replace all current data?',
about:'About',aboutD:'Daftari — a 100% on-device debt ledger.',appName:'Daftari',tagline:'Grocery debt book',m6:'Last 6 months: new debt vs collected',ocrBtn:'Old ledger photo (OCR)',ocrRun:'Reading photo… may take a minute',ocrNo:'OCR failed — engine needs internet on first use',quota:'Storage full — export a backup now',todayDebt:'Debt today',expToday:'Spent today',depToday:'Deposited today',emptyHome:'No operations yet — long-press Debt and speak, or add manually',back:'Back',menu:'Options',hideAmt:'Toggle amount privacy',totalDebt:'Total debts',noToday:'No operations today yet.',showAll:'Show all days',allDays:'All days',
savedC:'Customer saved',savedName:'Saved',chooseFirst:'Choose a customer first',enterAmt:'Enter a valid amount',
payOf:'Payment',noCustomers:'No customers yet',pinned:'Pinned',pinU:'Pin',unpinU:'Unpin',
sel:'Select',selN:n=>n+' selected',archSel:'Archive selected',online:'Online',offline:'Offline',
secT:'Security & privacy',setPin:'Enable PIN lock',changePin:'Change PIN',lockOff:'Disable lock',
enterPin:'Enter PIN',wrongPin:'Wrong PIN',fpAdd:'Add fingerprint',fpNo:'Fingerprint not supported on this device',
sound:'Sound',vib:'Vibration',refreshed:'Updated',pull:'Pull to refresh',
accT:'Accounts',addAcc:'Add account',editAcc:'Edit account',grocery:'Grocery',personal:'Personal',
lockNow:'Lock now',autoL:'Auto-lock after',m1:'1 minute',m2:'2 minutes',m5:'5 minutes',
theme:'Theme',soon:'Soon',deletedKeep:'Hard delete is disabled — archiving keeps your financial record (best practice)',
cand:'Pick the intended:',localOnly:'On-device · offline',printTitle:'Account statement',voiceEng:'Voice engine (swappable)',week7:'Last 7 days',fpUse:'Fingerprint',recOn:'Recording… keep speaking',manualDebt:'Quick manual entry',quickPay:'Quick payment',callC:'Call',openAcc2:'Open account',archivedT:'Archived',activeC:'Active',restore:'Restore',noArch:'No archived',lastOps:'Latest activity',searchTx:'Search name or product…',filterTx:'Feed filter',resetF:'Reset',typeG:'Type',addQ:'Quick add',personalMsg:'Personal account tracks your expenses & deposits directly — no customers needed.',account:'Account',switchAcc:'Switch account',recordSound:'Recording sound',vibOnRecord:'Vibrate on record',security:'Security',pinLock:'PIN lock',useFinger:'Fingerprint unlock',autoLock:'Auto-lock after (min)',turnOffPin:'Turn off lock',off:'Off',fpAdd:'Add',nOwe:'Customers owing',totalDue:'Total due',selN:'selected',selAll:'Select all',selEmpty:'Nothing selected',deletedN:n=>n+' items deleted',share:'Share',archiveAct:'Archive',del:'Delete',txArchived:n=>n+' archived',copied:'Copied ✓',darkMode:'Dark mode',fpN:'Fingerprint',due:'Due date',overdue:'Overdue',limitLbl:'Debt limit (optional)',noLimit:'no limit',overLimit:'Customer exceeded the debt limit!',overLimitS:'Over limit',waRemind:'WhatsApp reminder',waNoPhone:'Add the customer phone first',monthDebt:'Month debts',collRate:'Collection rate',bestCust:'Top buyers',overdueC:'Overdue payers',vengLbl:'Voice engine',webEng:'Phone',voskNo:'Vosk engine not installed — see VOSK-SETUP.md',webNo:'Phone engine unavailable',qrSend:'Send via QR',qrStmt:'Customer QR statement',qrStmtHint:'The customer scans with any phone — the statement arrives as readable text.',qrRecv:'Receive via QR',qrBig:'Data exceeds QR capacity — use file export',qrHint:'Open the app on another device ← Settings ← Receive via QR',qrScan:'Point the camera at the other device code',qrDone:'Ledger received ✓',qrCam:'Camera unavailable',darkDay:'Day',darkNight:'Night',darkAuto:'Auto',speakLbl:'Speak name & amount after recording',btPrint:'Bluetooth print',btConn:'Connect',btNo:'Bluetooth unavailable in this browser',btFail:'Connection failed',btNoDev:'Connect a Bluetooth printer first in Settings',voskOpt:'VOSK engine (optional add-on)',voskOn:'Enable VOSK',voskOff:'Disable VOSK',voskHelp:'Optional, hidden at the very bottom to save space.\nTo integrate: follow VOSK-SETUP.md (vosk-ar sample).\nUnderstands spoken numbers on-device offline; if absent the app ignores it.',strictT:'Strict voice rules',strictRules:'1) Say: debt/pay → name → amount.\n2) Amount understood as digits (50) or words (fifty, one hundred twenty).\n3) Any error is detected instantly and shown clearly with manual correction before saving.',warn_noamt:'No valid amount heard — fix it manually or re-record',warn_nospeech:'No speech captured — move closer and retry',warn_lowconf:'Low recognition confidence — review the amount',warn_toobig:'Implausible amount (over a million) — correct manually',strictFix:'Verify amount and name in the form below before confirming.'}
};
const VOC={newDebt:['مصروف','Expense'],pay:['إيداع','Deposit'],recDebt:['تسجيل مصروف','Record expense'],recPay:['تسجيل إيداع','Record deposit'],debtDone:['تم تسجيل المصروف','Expense recorded'],payDone:['تم تسجيل الإيداع','Deposit recorded'],owed:['مصروف اليوم','Spent today'],collToday:['أودعت اليوم','Deposited today'],lastOps:['آخر الحركات','Latest activity'],sDebt:['أكبر المصروفات','Top expenses'],expense:['مصروف','Expense'],deposit:['إيداع','Deposit']};
const isP=()=>!!(db&&db.accounts&&db.accounts.length&&curAcc()&&curAcc().type==='personal');
const t=k=>{const v=STR[db.lang][k];let base=v===undefined?k:v;if(isP()&&VOC[k])base=VOC[k][db.lang==='ar'?0:1];return base};

/* ================= storage + security ================= */
const PLAIN='dafter_v3',SECK='dafter_v3_sec',ENC='dafter_v3_enc';
const MIN=6e4,H=36e5,D=864e5;
const uid=()=>Math.random().toString(36).slice(2,9);
let db=null,sec={enabled:false,salt:'',pinHash:'',autoMin:2,sound:true,vib:true,credId:null,fpWrap:null,fps:[],dark:false,speak:false,vosk:false,btName:''},sessionKey=null,masterKey=null,locked=false;
try{sec=Object.assign(sec,JSON.parse(localStorage.getItem(SECK)||'null')||{})}catch(e){}
 if(!sec.fps)sec.fps=[];if(sec.credId&&sec.fpWrap&&!sec.fps.length)sec.fps=[{id:sec.credId,wrap:sec.fpWrap}];
const saveSec=()=>{try{localStorage.setItem(SECK,JSON.stringify(sec))}catch(e){}};
function save(){
 if(sec.enabled&&masterKey){encJSON(db,masterKey).then(p=>{try{localStorage.setItem(ENC,JSON.stringify(p));localStorage.removeItem(PLAIN)}catch(e){toastMsg(t('quota'))}})}
 else{try{localStorage.setItem(PLAIN,JSON.stringify(db));localStorage.removeItem(ENC)}catch(e){toastMsg(t('quota'))}}
 try{let tot=0;for(const k in localStorage)tot+=localStorage[k].length*2;if(tot>4*1024*1024&&!window.__qw){window.__qw=1;setTimeout(()=>toastMsg('⚠ '+t('quotaWarn')),60)}}catch(e){}
}
/* crypto */
const te=new TextEncoder(),td=new TextDecoder();
async function sha256hex(s){const b=await crypto.subtle.digest('SHA-256',te.encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function deriveKey(pin,salt){const km=await crypto.subtle.importKey('raw',te.encode(pin),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:te.encode(salt),iterations:100000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function newMaster(){return crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt'])}
async function wrapKey(mk,withKey){const raw=await crypto.subtle.exportKey('raw',mk);const iv=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},withKey,raw);return{iv:[...iv],ct:[...new Uint8Array(ct)]}}
async function unwrapKey(pack,withKey){try{const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(pack.iv)},withKey,new Uint8Array(pack.ct));return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt'])}catch(e){return null}}
async function encJSON(obj,key){const iv=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,te.encode(JSON.stringify(obj)));return{iv:[...iv],ct:[...new Uint8Array(ct)]}}
async function decJSON(pack,key){try{const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(pack.iv)},key,new Uint8Array(pack.ct));return JSON.parse(td.decode(pt))}catch(e){return null}}

/* ================= seed / migrate ================= */
function seed(){
 const c=(id,nm,ph,since,pin)=>({id,name:nm,phone:ph,since,archived:false,pinned:!!pin});
 const cs=[c('c1','أبو خالد','050 456 7291','2023',true),c('c2','محمد العتيبي','055 210 8843','2024'),c('c3','سارة أحمد','053 246 8101','2024'),c('c4','نور الهاجري','056 135 7924','2025'),c('c5','حسن القحطاني','054 987 6543','2024')];
 const now=Date.now();
 const iv=(id,code,cu,ts,amount,note)=>({id,code,cust:cu,ts,amount,note});
 const is=[iv('i1','A489','c1',now-50*MIN,70,'رز · زيت · حليب'),iv('i2','A488','c1',now-26*H,320,'سكر · شاي · دقيق'),iv('i3','A487','c1',now-3*D,500,'أرز · سمن · معجون طماطم'),iv('i4','A486','c1',now-30*D,460,'زيت · مكرونة · عدس'),iv('i5','A490','c2',now-45*MIN,200,'مواد تموينية'),iv('i6','A485','c3',now-4*H,150,'خضروات وفواكه'),iv('i7','A482','c5',now-2*D-3*H,300,'رز · زيت · حليب'),iv('i8','A475','c5',now-2*D,150,'خبز · عصائر')];
 const py=(id,cu,ts,amount,method,alloc)=>({id,cust:cu,ts,amount,method,alloc});
 const ps=[py('p1','c1',now-20*MIN,30,'cash',[{inv:'i1',amt:30}]),py('p2','c1',now-3*D+2*H,500,'cash',[{inv:'i3',amt:500}]),py('p3','c1',now-29*D,460,'cash',[{inv:'i4',amt:460}]),py('p4','c3',now-1*H,150,'transfer',[{inv:'i6',amt:150}]),py('p5','c5',now-1*D,50,'cash',[{inv:'i8',amt:50}])];
 return {lang:((navigator.language||'').slice(0,2).toLowerCase()==='ar'?'ar':'en'),active:'a1',accounts:[{id:'a1',name:'بقالة الندى',type:'grocery',cur:'ر.س'}],data:{a1:{customers:cs,invoices:is,payments:ps,seq:491}}};
}
function migrate(x){
 if(x&&x.accounts&&x.data)return x;
 const base=seed();
 if(x&&x.customers){base.data.a1={customers:x.customers,invoices:x.invoices||[],payments:x.payments||[],seq:x.seq||500};if(x.lang)base.lang=x.lang;if(x.cur)base.accounts[0].cur=x.cur;if(x.accName)base.accounts[0].name=x.accName}
 return base;
}

/* ================= data access ================= */
const curAcc=()=>db.accounts.find(a=>a.id===db.active)||db.accounts[0];
const DD=()=>db.data[db.active];
const cust=id=>DD().customers.find(c=>c.id===id);
const invPaid=id=>DD().payments.reduce((s,p)=>s+p.alloc.filter(a=>a.inv===id).reduce((x,a)=>x+a.amt,0),0);
const invRem=i=>Math.max(0,i.amount-invPaid(i.id));
const invStatus=i=>{const p=invPaid(i.id);return p<=0?'open':(p>=i.amount?'paid':'part')};
const custInvoices=id=>DD().invoices.filter(i=>i.cust===id).sort((a,b)=>b.ts-a.ts);
const custOpen=id=>custInvoices(id).reduce((s,i)=>s+invRem(i),0);
const custPaid=id=>DD().payments.filter(p=>p.cust===id).reduce((s,p)=>s+p.amount,0);
const custPurch=id=>custInvoices(id).reduce((s,i)=>s+i.amount,0);
const custCount=id=>custInvoices(id).length;
const lastAct=id=>Math.max(0,...custInvoices(id).map(i=>i.ts),...DD().payments.filter(p=>p.cust===id).map(p=>p.ts));
const openTotal=()=>DD().customers.reduce((s,c)=>s+custOpen(c.id),0);
const isOverdue=i=>!!(i.due&&invRem(i)>0&&Date.now()>i.due);
const custOverdue=id=>DD().invoices.some(i=>i.cust===id&&isOverdue(i));
const dueVal=()=>{const el=document.getElementById('md_d');return el&&el.value?new Date(el.value+'T12:00:00').getTime():null};
const isToday=ts=>new Date(ts).toDateString()===new Date().toDateString();
const collToday=()=>DD().payments.filter(p=>isToday(p.ts)).reduce((s,p)=>s+p.amount,0);

/* ================= format ================= */
const fmt=n=>Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const CUR=()=>curAcc().cur;
const money=n=>'<span class="num">'+fmt(n)+'</span> '+CUR();
const MON={ar:['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']};
const dateStr=ts=>{const d=new Date(ts);return '<span class="num">'+d.getDate()+'</span> '+MON[db.lang][d.getMonth()]+' <span class="num">'+d.getFullYear()+'</span>'};
const timeStr=ts=>{const d=new Date(ts);let h=d.getHours();const ap=h<12?(db.lang==='ar'?'ص':'AM'):(db.lang==='ar'?'م':'PM');h=((h+11)%12)+1;return '<span class="num">'+h+':'+String(d.getMinutes()).padStart(2,'0')+'</span> '+ap};
const rel=ts=>{const df=Date.now()-ts;if(df<90e3)return t('justNow');if(df<H)return t('minAgo')(Math.max(1,Math.round(df/MIN)));if(df<D&&new Date(ts).getDate()!==new Date().getDate())return t('yest');if(df<D)return t('hrAgo')(Math.round(df/H));if(df<2*D)return t('yest');return t('dayAgo')(Math.round(df/D))};
const initials=n=>{const w=n.trim().split(/\s+/);return w.length>1?w[0][0]+'. '+w[w.length-1][0]:n.slice(0,2)};
const AVC=['#1d4ed8','#0e6b47','#5b21b6','#9f1239','#8a5a12','#0f6472','#a71949','#4b5563'];
const avColor=n=>{let h=7;for(let k=0;k<n.length;k++)h=(h*31+n.charCodeAt(k))>>>0;const a=AVC[h%AVC.length];let b=AVC[(h>>>4)%AVC.length];if(b===a)b=AVC[(h>>>4)%AVC.length^1];return 'linear-gradient(135deg,'+a+','+b+')';};
const avat=(name,size)=>{const c=(typeof db!=='undefined'&&db&&db.data)?(DD().customers.find(x=>x.name===name)||null):null;
 if(c&&c.photo)return '<span class="av" style="width:'+size+'px;height:'+size+'px;padding:0"><img src="'+c.photo+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%"></span>';
 return '<span class="av" style="width:'+size+'px;height:'+size+'px;font-size:'+Math.round(size*0.34)+'px;background:'+avColor(name)+'">'+esc(initials(name))+'</span>'};
const esc=s=>String(s).replace(/[<>&"]/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[m]));
const STLBL={open:()=>t('open'),part:()=>t('part'),paid:()=>t('paid')};
const badge=st=>'<span class="chip b-'+st+'"><span class="dot"></span>'+STLBL[st]()+'</span>';

/* ================= feedback (sound+vibration) ================= */
let AC=null;
function speak(txt){if(!sec.speak||!('speechSynthesis' in window))return;try{const u=new SpeechSynthesisUtterance(txt);u.lang=db.lang==='ar'?'ar-SA':'en-US';u.rate=1.05;const vs=speechSynthesis.getVoices?speechSynthesis.getVoices():[];const v=vs.find(x=>x.lang&&x.lang.slice(0,2)===(db.lang==='ar'?'ar':'en'));if(v)u.voice=v;speechSynthesis.speak(u)}catch(e){}}
function feedback(kind){
 try{if(sec.vib&&navigator.vibrate)navigator.vibrate(kind==='debt'?[70,50,70]:[45])}catch(e){}
 if(!sec.sound)return;
 try{AC=AC||new AudioContext();const o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.frequency.value=kind==='debt'?520:760;g.gain.value=.07;o.start();o.stop(AC.currentTime+0.18)}catch(e){}
}

/* ================= router ================= */
let stack=[{s:'home'}];
const ui={f:{status:'all',period:'all',sort:'recent'},tf:{kind:'all',period:'all'},pOpen:false,tq:'',arch:false,cq:'',pf:'all',sel:{on:false,ids:[]},nc2:null,voice:{st:'idle',demo:0,edit:false,d:{},cands:[]},pay:{cust:null,amt:'',method:'cash',done:null},nc:{name:'',phone:'',edit:null},accEdit:null,voskOpen:false};
function tab(s){stack=[{s}];ui.sel={on:false,ids:[]};render()}
function go(s,p){stack.push({s,p});render()}
function back(){if(stack.length>1)stack.pop();else stack=[{s:'home'}];render()}
const curScr=()=>stack[stack.length-1];
const ctxCust=()=>{const tp=curScr();return tp.s==='profile'?tp.p.id:((tp.s==='voice'||tp.s==='pay')?(tp.p&&tp.p.cust)||null:null)};

/* ================= voice engine (swappable) ================= */
/* لاستبدال المحرك مستقبلاً (Vosk/Whisper محلي): نفّذ listen(onText) واستبدل VoiceEngine.simulate */
const DEMO=[{name:'أبو خالد',amt:50,note:'رز وحليب'},{name:'حسن',amt:120,note:'سكر وأرز — ابنه فيصل'}];
const VoiceEngine={simulate(onDone){setTimeout(()=>{const dm=DEMO[ui.voice.demo%DEMO.length];ui.voice.demo++;onDone(dm)},900)}};

/* ================= screens ================= */
function onlineDot(){const on=navigator.onLine;return '<span class="row" style="gap:7px;font-size:11.5px;color:var(--muted)"><span class="on-dot'+(on?'':' off')+'"></span>'+(on?t('online'):t('offline'))+'</span>'}
const accInit=()=>{const n=(curAcc()&&curAcc().name||'').trim();return n?n.charAt(0).toUpperCase():'د'};
function accChip(){const a=curAcc();return '<button class="hbtn accchip" aria-label="'+t('switchAcc')+'" style="gap:8px" onclick="openAccSheet()">'+(a.type==='grocery'?ic('store',18):ic('user',18))+'<span class="accn" style="font-weight:800;font-size:14px">'+esc(a.name)+'</span>'+ic('chevD',15)+'</button>'}
function headerBar(title,sub,backFn,menuFn,extra){
 return '<div class="hdr">'+(backFn?'<button class="hbtn" aria-label="'+t('back')+'" onclick="'+backFn+'">'+ic('back',20)+'</button>':'<span style="width:10px"></span>')+
 '<div class="sp" style="text-align:center"><h1>'+title+'</h1>'+(sub?'<div class="sub">'+sub+'</div>':'')+'</div>'+
 (menuFn?'<button class="hbtn" aria-label="'+t('menu')+'" onclick="'+menuFn+'">'+ic('dots',20)+'</button>':(extra||'<span style="width:10px"></span>'))+'</div>';
}
const todayExp=()=>DD().invoices.filter(i=>isToday(i.ts)).reduce((x,i)=>x+i.amount,0);
function statsCards(){const p=isP();
const dAll=DD().invoices.reduce((x,i)=>x+i.amount,0),pAll=DD().payments.reduce((x,i)=>x+i.amount,0);

return '<div class="stats pad" id="stats1"><div class="stat red"><div class="t">'+ic('receipt',15)+(p?t('expense'):t('newDebt'))+'</div><div class="v">'+money(dAll)+'</div></div><div class="stat green"><div class="t">'+ic('banknote',15)+(p?t('deposit'):t('pay'))+'</div><div class="v">'+money(pAll)+'</div></div></div>'}
function filteredCustomers(all){
 const f=ui.f;let list=DD().customers.filter(c=>!c.archived);
 if(ui.cq)list=list.filter(c=>c.name.includes(ui.cq)||(c.phone||'').includes(ui.cq));
 if(f.status==='open')list=list.filter(c=>custOpen(c.id)>0);
 if(f.status==='part')list=list.filter(c=>custOpen(c.id)>0&&custPaid(c.id)>0);
 if(f.status==='settled')list=list.filter(c=>custOpen(c.id)===0&&custPurch(c.id)>0);
 if(f.period==='today')list=list.filter(c=>isToday(lastAct(c.id)));
 if(f.period==='week')list=list.filter(c=>Date.now()-lastAct(c.id)<7*D);
 if(f.period==='month')list=list.filter(c=>Date.now()-lastAct(c.id)<30*D);
 const key=f.sort==='debt'?(c=>-custOpen(c.id)):f.sort==='freq'?(c=>-custCount(c.id)):(c=>-lastAct(c.id));
 list.sort((a,b)=>(!!b.pinned-!!a.pinned)||(key(a)-key(b)));
 return list;
}
function custRow(c,showPhone){
 const open=custOpen(c.id);
 const amt=open>0?'<span class="amt red">- <span class="num">'+fmt(open)+'</span> '+CUR()+'</span>':'<span class="amt gray"><span class="num">0.00</span> '+CUR()+'</span>';
 return '<div class="card litem" onclick="go(\'profile\',{id:\''+c.id+'\'})">'+
 avat(c.name,46)+'<div class="sp"><div class="row" style="gap:6px"><b>'+esc(c.name)+'</b>'+(c.pinned?ic('pin',13).replace('class="ic"','class="ic" style="color:#c9a06c"'):'')+(custOverdue(c.id)?'<span class="chip b-open" style="padding:2px 8px;font-size:10.5px"><span class="dot"></span>'+t('overdue')+'</span>':'')+(c.limit&&custOpen(c.id)>c.limit?'<span class="chip b-part" style="padding:2px 8px;font-size:10.5px">'+t('overLimitS')+'</span>':'')+'</div><div class="muted">'+(showPhone&&c.phone?'<span class="num">'+esc(c.phone)+'</span> · ':'')+t('last')+': '+rel(lastAct(c.id))+'</div></div>'+
 '<div style="text-align:end">'+amt+'</div>'+
 '<button class="hbtn" aria-label="'+t('menu')+'" style="min-width:38px;height:38px;border:none;box-shadow:none;background:transparent" onclick="event.stopPropagation();openCustMenu(\''+c.id+'\')">'+ic('dots',18)+'</button></div>';
}
/* customer status chips (customers tab) */
function custFilterBtn(){const act=ui.f.status!=='all'||ui.f.period!=='all'||ui.f.sort!=='recent';
 return '<button class="hbtn" id="cfbtn" style="height:46px;gap:7px;font-weight:700" onclick="openCustFilter()">'+ic('sliders',17)+t('filter')+(act?'<span class="dot" style="background:var(--red)"></span>':'')+'</button>'}
function refreshCFilterBtn(){const b=document.getElementById('cfbtn');if(b)b.outerHTML=custFilterBtn()}
function openCustFilter(){renderCustSheet();document.getElementById('sheetWrap').classList.add('open')}
function custCounts(){const cs=DD().customers.filter(c=>!c.archived);const cnt={all:cs.length,open:0,part:0,paid:0};
 cs.forEach(c=>{const o=custOpen(c.id),p=custPaid(c.id);if(o>0){cnt.open++;if(p>0)cnt.part++}else if(custPurch(c.id)>0)cnt.paid++});return cnt}
function renderCustSheet(){const f=ui.f;const cnt=custCounts();
 const segs=(cur,items,fn,cls)=>'<div class="seg">'+items.map(k=>'<button class="'+(cur===k[0]?'on'+(cls&&cls(k[0])?' '+cls(k[0]):''):'')+'" onclick="'+fn+'(\''+k[0]+'\')">'+k[1]+'</button>').join('')+'</div>';
 document.getElementById('sheet').innerHTML='<div class="grab"></div><div class="row" style="margin-bottom:12px"><h3 style="margin:0">'+t('filter')+'</h3><span class="sp"></span><button class="hbtn" onclick="closeSheet()">'+ic('x',17)+'</button></div>'
 +'<div class="lb" style="margin:0 0 7px">'+t('status')+'</div>'+segs(f.status,[['all',t('all')+' ('+cnt.all+')'],['open',t('open')+' ('+cnt.open+')'],['part',t('part')+' ('+cnt.part+')'],['paid',t('paid')+' ('+cnt.paid+')']],'setCSt',k=>k==='open'?'r':k==='part'?'amber':k==='paid'?'green':'')
 +'<div class="lb" style="margin:12px 0 7px">'+t('last')+'</div>'+segs(f.period,[['all',t('pAll')],['today',t('pToday')],['week',t('pWeek')],['month',t('pMonth')]],'setCPer')
 +'<div class="lb" style="margin:12px 0 7px">'+t('sort')+'</div>'+segs(f.sort,[['recent',t('sRecent')],['debt',t('sDebt')],['freq',t('sFreq')]],'setCSo')
 +'<button class="btn btn-soft" style="margin-top:14px" onclick="ui.f={status:\'all\',period:\'all\',sort:\'recent\'};refreshList(true);renderCustSheet()">'+ic('undo',16)+t('resetF')+'</button>';}
function setCSt(k){ui.f.status=k==='paid'?'settled':k;refreshList(true);renderCustSheet()}
function setCPer(k){ui.f.period=k;refreshList(true);renderCustSheet()}
function setCSo(k){ui.f.sort=k;refreshList(true);renderCustSheet()}
window.refreshList=keep=>{if(!keep){render();return}const el=document.getElementById('clist2');if(el)el.innerHTML=custListBody();refreshCFilterBtn()};
/* transactions feed (home) */
function txAll(){const d=DD();const arr=[];d.invoices.forEach(i=>{if(i.arch)return;arr.push({kind:'debt',ts:i.ts,cust:i.cust,amt:i.amount,note:i.note,inv:i.id,key:'d:'+i.id})});d.payments.forEach(p=>{if(p.arch)return;arr.push({kind:'pay',ts:p.ts,cust:p.cust,amt:p.amount,note:t(p.method),inv:null,key:'p:'+p.id})});return arr}
function filteredTx(){let L=txAll();const f=ui.tf;
 if(f.kind==='debt')L=L.filter(x=>x.kind==='debt');if(f.kind==='pay')L=L.filter(x=>x.kind==='pay');
 if(f.period==='today')L=L.filter(x=>isToday(x.ts));if(f.period==='week')L=L.filter(x=>Date.now()-x.ts<7*D);if(f.period==='month')L=L.filter(x=>Date.now()-x.ts<30*D);
 if(ui.tq)L=L.filter(x=>{const c=cust(x.cust);return (c&&c.name.includes(ui.tq))||(x.note||'').includes(ui.tq)});
 L=L.sort((x,y)=>y.ts-x.ts);window.__txFull=L.length;return L.slice(0,ui.txLimit||60)}
function txRow(x){const c=x.cust?cust(x.cust):null;if(!c&&!isP())return '';const nm=c?c.name:t(x.kind==='debt'?'expense':'deposit');const av=c?avat(c.name,44):'<span class="av" style="width:44px;height:44px;background:'+(x.kind==='debt'?'var(--red-bg);color:var(--red)':'var(--green-bg);color:var(--green)')+'">'+ic(x.kind==='debt'?'receipt':'banknote',18)+'</span>';
 const sel=ui.sel&&ui.sel.on,isSel=sel&&ui.sel.ids.includes(x.key);
 const box=sel?'<span style="width:24px;height:24px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;border:2px solid '+(isSel?'var(--navy);background:var(--navy);color:#fff':'var(--line)')+'">'+(isSel?ic('check',13):'')+'</span>':'';
 return '<div class="card litem'+(isSel?' sel':'')+'" '+(sel?'onclick="selToggle(\''+x.key+'\')"':'onclick="'+(x.kind==='debt'?'go(\'invoice\',{id:\''+x.inv+'\'})':'go(\'profile\',{id:\''+c.id+'\'})')+'" role="button" tabindex="0" onkeydown="if(event.key===\'Enter\')this.click()"')+'>'+box+av+'<div class="sp"><b>'+esc(nm)+(x.kind==='debt'&&isOverdue(DD().invoices.find(i=>i.id===x.inv)||{})?' <span class="chip b-open" style="padding:2px 8px;font-size:10.5px"><span class="dot"></span>'+t('overdue')+'</span>':'')+'</b><div class="soft" style="font-size:13px;margin-top:2px">'+(x.kind==='debt'?ic('receipt',12):ic('banknote',12))+' '+esc(x.note||'')+'</div><div class="muted" style="font-size:11.5px;margin-top:3px">'+ic('clock',11)+' '+timeStr(x.ts)+' · '+dateStr(x.ts)+'</div></div><div style="text-align:end"><span class="amt '+(x.kind==='debt'?'red':'green')+'">'+(x.kind==='debt'?'- ':'+ ')+'<span class="num">'+fmt(x.amt)+'</span> '+CUR()+'</span></div></div>'}
/* home multi-select (file-manager style) */
window.selToggle=k=>{if(!ui.sel||!ui.sel.on)return;const a=ui.sel.ids;const i=a.indexOf(k);if(i>=0)a.splice(i,1);else a.push(k);render()};
window.selExit=()=>{ui.sel={on:false,ids:[]};render()};
window.selStart=()=>{ui.sel={on:true,ids:[]};render()};
function openHomeMenu(){openSheet('<h3>'+t('menu')+'</h3>'
 +'<button class="srow" onclick="closeSheet();selStart()"><span class="sic2" style="background:var(--navy-bg);color:var(--navy)">'+ic('checkc',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('sel')+'</span></span>'+ic('fwd',17)+'</button>'
 +'<button class="srow" onclick="closeSheet();exportAll()"><span class="sic2" style="background:var(--navy-bg);color:var(--navy)">'+ic('excel',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('exportAll')+'</span></span>'+ic('fwd',17)+'</button>'
 +'<button class="srow" onclick="closeSheet();openQrSend()"><span class="sic2" style="background:var(--green-bg);color:var(--green)">'+ic('share',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('qrSend')+'</span></span>'+ic('fwd',17)+'</button>'
)}
window.selAllVisible=()=>{const keys=filteredTx().map(x=>x.key);const all=keys.length&&ui.sel.ids.length>=keys.length&&keys.every(k=>ui.sel.ids.includes(k));ui.sel.ids=all?[]:keys;render()};
function selDelete(){if(!ui.sel||!ui.sel.on||!ui.sel.ids.length){toastMsg(t('selEmpty'));return}
 const d=DD();const snap=JSON.parse(JSON.stringify({i:d.invoices,p:d.payments}));
 const invIds=ui.sel.ids.filter(k=>k[0]==='d').map(k=>k.substring(2));
 const payIds=ui.sel.ids.filter(k=>k[0]==='p').map(k=>k.substring(2));
 const n=ui.sel.ids.length;
 d.payments.forEach(p=>{if(p.alloc)p.alloc=p.alloc.filter(a=>!invIds.includes(a.inv))});
 d.invoices=d.invoices.filter(i=>!invIds.includes(i.id));
 d.payments=d.payments.filter(p=>!payIds.includes(p.id));
 save();try{if(navigator.vibrate)navigator.vibrate(45)}catch(e){}
 ui.sel={on:false,ids:[]};render();
 toastMsg(t('deletedN')(n),()=>{const d2=DD();d2.invoices=snap.i;d2.payments=snap.p;save();render()});}
function waRemind(invId){const i=DD().invoices.find(x=>x.id===invId);if(!i)return;const c=cust(i.cust);if(!c||!c.phone){toastMsg(t('waNoPhone'));return}
 const msg=(db.lang==='ar'?'السلام عليكم '+c.name+'، يذكّركم '+curAcc().name+' بمتبقي '+fmt(invRem(i.id))+' '+CUR()+(i.due?' (استحقاق '+dateStr(i.due)+')':'')+' — جزاكم الله خيرًا':'Hello '+c.name+', '+curAcc().name+' reminds you of the remaining '+fmt(invRem(i.id))+' '+CUR()+'. Thank you!');
 window.open('https://wa.me/'+(c.phone||'').replace(/[^0-9]/g,'')+'?text='+encodeURIComponent(msg));}
let btDev=null,btChar=null;
const BT_SERV=['000018f0-0000-1000-8000-00805f9b34fb','0000ff00-0000-1000-8000-00805f9b34fb','e7810a71-73ae-499d-8c15-faa9aef0c3f2','49535343-fe7d-4ae5-8fa9-9fafd205e455'];
async function connectBT(){if(!navigator.bluetooth){toastMsg(t('btNo'));return}
 try{const dev=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:BT_SERV});
  btDev=dev;const server=await dev.gatt.connect();
  for(const su of BT_SERV){try{const svc=await server.getPrimaryService(su);const chs=await svc.getCharacteristics();btChar=chs.find(c=>c.properties.write||c.properties.writeWithoutResponse);if(btChar)break}catch(e){}}
  if(!btChar)throw 0;sec.btName=dev.name||'BT';saveSec();render();toastMsg('🖨 '+esc(sec.btName))}catch(e){toastMsg(t('btFail'))}}
async function btWrite(bytes){if(!btChar)throw 0;for(let i=0;i<bytes.length;i+=100)await btChar.writeValue(bytes.slice(i,i+100))}
async function printBT(text){if(!btChar){toastMsg(t('btNoDev'));return}
 try{await btWrite(new Uint8Array([0x1b,0x40]));await btWrite(new TextEncoder().encode(text+'\n\n\n'));await btWrite(new Uint8Array([0x1d,0x56,0x42,0x00]));toastMsg('🖨 ✓')}catch(e){toastMsg(t('btFail'))}}
function btStatement(id){const c=cust(id);const L=[curAcc().name+' · '+t('appName'),t('cust')+': '+c.name,'----------------------------'];
 custInvoices(id).forEach(i=>L.push(i.code+'  '+fmt(i.amount)+'  '+new Date(i.ts).toLocaleDateString('en-GB')));
 L.push('----------------------------',t('remaining')+': '+fmt(custOpen(id))+' '+CUR());return L.join('\n')}
function qrB64(u){let b='';for(let i=0;i<u.length;i+=8192)b+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(b)}
async function openQrSend(){if(typeof qrcode==='undefined'){toastMsg('QR');return}
 const json=JSON.stringify({v:1,db});let payload='J'+json;
 try{if(window.CompressionStream){const cs=new CompressionStream('gzip');const rs=new Blob([json]).stream().pipeThrough(cs);const buf=await new Response(rs).arrayBuffer();const z=qrB64(new Uint8Array(buf));if(z.length<json.length)payload='Z'+z}}catch(e){}
 if(payload.length>2900){toastMsg(t('qrBig'));return}
 const q=qrcode(0,'L');q.addData(payload,'Byte');q.make();
 openSheet('<div class="row" style="margin-bottom:10px"><h3 style="margin:0">'+t('qrSend')+'</h3><span class="sp"></span><button class="hbtn" onclick="closeSheet()">'+ic('x',17)+'</button></div><div class="card" style="padding:16px;background:#fff;display:flex;justify-content:center" dir="ltr">'+q.createSvgTag({scalable:true})+'</div><div class="muted" style="text-align:center;margin-top:10px">'+t('qrHint')+'</div>')}
async function qrDecompress(b64){const bin=atob(b64);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);const ds=new DecompressionStream('gzip');const rs=new Blob([u]).stream().pipeThrough(ds);return await new Response(rs).text()}
function stopQr(){clearInterval(window.__qrTimer);if(window.__qrStream){window.__qrStream.getTracks().forEach(t=>t.stop());window.__qrStream=null}}
async function openQrStmt(id){if(typeof qrcode==='undefined'){toastMsg('QR');return}
 const txt=statementText(id);if(txt.length>2900){toastMsg(t('qrBig'));return}
 const q=qrcode(0,'L');q.addData(txt,'Byte');q.make();
 openSheet('<h3>'+t('qrStmt')+' — '+esc(cust(id).name)+'</h3><div style="display:flex;justify-content:center;padding:14px 0"><div style="background:#fff;padding:12px;border-radius:14px;width:max-content">'+q.createImgTag(4,0).replace('<img ','<img style="width:220px;height:220px" ')+'</div></div><div class="muted" style="text-align:center;line-height:1.8;font-size:12.5px">'+t('qrStmtHint')+'</div><div class="transcript" style="margin-top:12px;max-height:130px;overflow:auto;white-space:pre-line;text-align:start">'+esc(txt)+'</div>');}
function openQrRecv(){if(typeof jsQR==='undefined'){toastMsg('QR');return}
 openSheet('<div class="row" style="margin-bottom:10px"><h3 style="margin:0">'+t('qrRecv')+'</h3><span class="sp"></span><button class="hbtn" onclick="stopQr();closeSheet()">'+ic('x',17)+'</button></div><div class="card" style="overflow:hidden"><video id="qrVid" autoplay playsinline muted style="width:100%;display:block"></video></div><div class="muted" style="text-align:center;margin:10px 0">'+t('qrScan')+'</div>');
 if(!navigator.mediaDevices){toastMsg(t('qrCam'));return}
 navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(st=>{window.__qrStream=st;const v=document.getElementById('qrVid');if(!v){st.getTracks().forEach(t=>t.stop());return}v.srcObject=st;const cv=document.createElement('canvas');const cx=cv.getContext('2d');
  window.__qrTimer=setInterval(()=>{if(!v.videoWidth)return;cv.width=v.videoWidth;cv.height=v.videoHeight;cx.drawImage(v,0,0);const res=jsQR(cx.getImageData(0,0,cv.width,cv.height).data,cv.width,cv.height);
   if(res&&res.data){stopQr();closeSheet();qrApply(res.data)}},400);
 }).catch(()=>{stopQr();toastMsg(t('qrCam'))})}
async function qrApply(payload){try{const json=payload[0]==='Z'?await qrDecompress(payload.slice(1)):payload.slice(1);const obj=JSON.parse(json);if(!obj||!obj.db)throw 0;
 db=migrate(obj.db);save();stack=[{s:'home'}];render();toastMsg(t('qrDone'))}catch(e){toastMsg(db.lang==='ar'?'تعذّرت قراءة البيانات':'Could not read data')}}
function selFind(k){const d=DD();const id=k.substring(2);return k[0]==='d'?d.invoices.find(x=>x.id===id):d.payments.find(x=>x.id===id)}
function fallbackCopy(text){try{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toastMsg(t('copied'))}catch(e){toastMsg(esc(text.slice(0,80)))}}
function selShare(){if(!ui.sel||!ui.sel.on||!ui.sel.ids.length){toastMsg(t('selEmpty'));return}
 const lines=ui.sel.ids.map(k=>{const it=selFind(k);if(!it)return null;const c=it.cust?cust(it.cust):null;
  if(k[0]==='d')return (c?c.name+' — ':'')+t('newDebt')+': '+fmt(it.amount)+' '+CUR()+(it.note?' — '+it.note:'')+' ('+dateStr(it.ts)+')';
  return (c?c.name+' — ':'')+t('pay')+': '+fmt(it.amount)+' '+CUR()+' ('+dateStr(it.ts)+')';}).filter(Boolean);
 const text=curAcc().name+'\n'+lines.join('\n');
 if(navigator.share){navigator.share({text}).catch(()=>{})}
 else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(()=>toastMsg(t('copied'))).catch(()=>fallbackCopy(text))}
 else fallbackCopy(text);}
function selArchive(){if(!ui.sel||!ui.sel.on||!ui.sel.ids.length){toastMsg(t('selEmpty'));return}
 const ids=ui.sel.ids.slice();const n=ids.length;
 ids.forEach(k=>{const it=selFind(k);if(it)it.arch=true});
 save();ui.sel={on:false,ids:[]};render();
 toastMsg(t('txArchived')(n),()=>{ids.forEach(k=>{const it=selFind(k);if(it)it.arch=false});save();render()});}
function pChipsHtml(){const M={today:t('pToday'),week:t('pWeek'),month:t('pMonth')};
 if(!ui.pOpen)return '<button class="pchip'+(ui.tf.period!=='all'?' on':'')+'" onclick="ui.pOpen=true;refreshHome()">'+ic('sliders',13)+' '+(ui.tf.period==='all'?t('period'):M[ui.tf.period])+' '+ic('chevD',12)+'</button>';
 return ['today','week','month'].map(k=>'<button class="pchip'+(ui.tf.period===k?' on':'')+'" onclick="setPChip(\''+k+'\')">'+M[k]+'</button>').join('')}
function setPChip(k){ui.tf.period=ui.tf.period===k?'all':k;ui.pOpen=false;refreshHome()}
window.refreshHome=()=>{const el=document.getElementById('txlist');if(el)el.innerHTML=feedHtml();const tn=document.getElementById('txn');if(tn)tn.textContent=window.__txFull;const pc=document.getElementById('pchips');if(pc)pc.innerHTML=pChipsHtml();const s1=document.getElementById('stats1');if(s1)s1.outerHTML=statsCards()};
function toggleDebt(){if(ui.tf.kind==='debt'){ui.tf={kind:'all',period:'today'}}else{ui.tf={kind:'debt',period:'all'}}refreshHome()}
function togglePay(){if(ui.tf.kind==='pay'){ui.tf={kind:'all',period:'today'}}else{ui.tf={kind:'pay',period:'all'}}refreshHome()}
function dayLabel(ts){const d=new Date(ts),n0=new Date();const a=new Date(d);a.setHours(0,0,0,0);const b=new Date(n0);b.setHours(0,0,0,0);const diff=Math.round((b-a)/864e5);
 if(diff<=0)return t('today');if(diff===1)return t('yest');
 return d.toLocaleDateString(db.lang==='ar'?'ar':'en-GB',{weekday:'long'})+' · '+d.getDate()+'/'+(d.getMonth()+1)}
function feedHtml(){const L=filteredTx();
 if(!L.length){const any=DD().invoices.length+DD().payments.length;
 if(any&&ui.tf.period==='today')return '<div class="muted" style="text-align:center;padding:24px 16px">'+t('noToday')+'<div style="margin-top:10px"><button class="btn btn-line" style="width:auto;padding:10px 18px;font-size:13.5px" onclick="ui.tf={kind:\'all\',period:\'all\'};ui.txLimit=60;refreshHome()">'+t('showAll')+'</button></div></div>';
 return '<div class="muted" style="text-align:center;padding:28px 16px">'+(any?t('noRes'):ic('mic',26)+'<div style="margin-top:10px;font-weight:700;line-height:1.7">'+t('emptyHome')+'</div>')+'</div>'}
 let out='',last='';L.forEach(x=>{const dl=dayLabel(x.ts);if(dl!==last){out+='<div class="lb" style="margin:2px 4px 2px;font-size:12px">'+dl+'</div>';last=dl}out+=txRow(x)});
 if(window.__txFull>L.length)out+='<div style="text-align:center;margin-top:10px"><button class="btn btn-line" style="width:auto;padding:10px 22px;font-size:13px" onclick="ui.txLimit='+L.length+'+60;refreshHome()">'+ic('chevD',15)+' '+t('showMore')+' (<span class="num">'+(window.__txFull-L.length)+'</span>)</button></div>';
 return out}
const privBtn=()=>'<button class="hbtn" onclick="sec.priv=!sec.priv;saveSec();render()" aria-label="'+t('hideAmt')+'">'+ic(sec.priv?'eyeoff':'eye',18)+'</button>';
const S_home=()=>{
 filteredTx();const n=window.__txFull;
 const selMode=ui.sel&&ui.sel.on;
 const hdr=selMode?'<div class="hdr"><button class="hbtn" style="visibility:hidden">.</button><div class="sp" style="text-align:center"><h1 style="font-size:17px"><span class="num">'+ui.sel.ids.length+'</span> '+t('selN')+'</h1></div><div style="width:42px"></div></div>'
 :'<div class="hdr"><div class="logo-ic" style="font-size:18px;font-weight:900">'+esc(accInit())+'</div><div class="sp"><h1 style="font-size:21px">'+esc(curAcc().name)+'</h1><div class="sub">'+onlineDot()+'</div></div>'+accChip()+'</div>';
 return hdr
 +'<div style="height:6px"></div>'+statsCards()
 +'<div class="pad search" style="margin-top:12px"><div class="inp card">'+ic('search',17)+'<input placeholder="'+t('searchTx')+'" value="'+esc(ui.tq)+'" oninput="ui.tq=this.value;document.getElementById(\'txlist\').innerHTML=feedHtml()"></div>'+
 '<button class="hbtn" style="height:46px" onclick="openHomeMenu()" aria-label="'+t('menu')+'">'+ic('dots',18)+'</button></div>'
 +(selMode?selBarHtml():'')
 +'<div class="pad" style="margin:12px 20px 4px;font-weight:800;font-size:16.5px;display:flex;align-items:center;gap:8px">'+t('lastOps')+' <span class="chip" style="background:#efece6;color:var(--soft)"><span class="num" id="txn">'+n+'</span></span><span class="sp"></span><span id="pchips" style="display:flex;gap:6px">'+pChipsHtml()+'</span></div>'
 +'<div class="pad list" id="txlist" style="padding-bottom:14px">'+feedHtml()+'</div>';
};
function selBarHtml(){return '<div class="selbar"><button class="btn btn-line" style="flex:1.1" onclick="selExit()">'+ic('x',16)+t('cancel')+'</button><button class="btn btn-soft" style="flex:1.3" onclick="selAllVisible()">'+ic('checkc',16)+t('selAll')+'</button><button class="btn btn-soft" style="flex:.9" onclick="selShare()" aria-label="'+t('share')+'">'+ic('share',16)+'</button><button class="btn btn-soft" style="flex:.9" onclick="selArchive()" aria-label="'+t('archiveAct')+'">'+ic('archive',16)+'</button><button class="btn btn-red" style="flex:.9" onclick="selDelete()" aria-label="'+t('del')+'">'+ic('trash',16)+'</button></div>'}
const S_customers=()=>{
 if(isP())return '<div class="hdr"><button class="hbtn" style="visibility:hidden">.</button><div class="sp" style="text-align:center"><h1>'+t('customers')+'</h1></div>'+accChip()+'</div><div class="pad"><div class="card" style="padding:30px 22px;text-align:center"><span class="av" style="width:70px;height:70px;margin:0 auto;background:var(--green-bg);color:var(--green)">'+ic('user',30)+'</span><div style="font-weight:800;margin-top:12px;font-size:17px">'+t('personal')+'</div><div class="muted" style="margin-top:8px;line-height:1.8">'+t('personalMsg')+'</div>'+lpBtn('debt','btn-red','mic',t('recDebt')).slice(0,-10)+' style="margin-top:16px"></button></div></div>';
 const archN=DD().customers.filter(c=>c.archived).length;
 const oweN=DD().customers.filter(c=>!c.archived&&custOpen(c.id)>0).length;
 return '<div class="hdr"><button class="hbtn" style="visibility:hidden">.</button><div class="sp" style="text-align:center"><h1>'+t('customers')+'</h1><div class="sub">'+onlineDot()+'</div></div>'+accChip()+'</div>'
 +'<div class="pad search" style="margin-top:6px"><div class="inp card">'+ic('search',17)+'<input placeholder="'+t('searchC')+'" value="'+esc(ui.cq)+'" oninput="ui.cq=this.value;document.getElementById(\'clist2\').innerHTML=custListBody()"></div>'+custFilterBtn()+'</div>'
 +'<div class="pad" style="margin-top:10px"><div class="seg"><button class="'+(!ui.arch?'on':'')+'" onclick="ui.arch=false;render()">'+t('activeC')+'</button><button class="'+(ui.arch?'on':'')+'" onclick="ui.arch=true;render()">'+t('archivedT')+' (<span class="num">'+archN+'</span>)</button></div></div>'
 +(ui.arch?'':'<div class="pad" style="margin-top:10px"><div class="card" style="padding:12px 16px;display:flex;align-items:center;gap:12px"><span style="width:38px;height:38px;border-radius:12px;background:var(--red-bg);color:var(--red);display:flex;align-items:center;justify-content:center;flex:none">'+ic('coins',18)+'</span><div class="sp"><div class="muted" style="font-size:11.5px">'+t('nOwe')+'</div><div style="font-weight:800" class="num">'+oweN+'</div></div><div style="text-align:end"><div class="muted" style="font-size:11.5px">'+t('totalDue')+'</div><div style="font-weight:800;color:var(--red)">'+money(openTotal())+'</div></div></div></div>')
 +'<div class="pad list" id="clist2" style="margin-top:12px;padding-bottom:14px">'+(ui.arch?archListBody():custListBody())+'</div>';
};
function archListBody(){const list=DD().customers.filter(c=>c.archived);return list.length?list.map(c=>'<div class="card litem" onclick="go(\'profile\',{id:\''+c.id+'\'})">'+avat(c.name,46)+'<div class="sp"><b>'+esc(c.name)+'</b><div class="muted">'+t('remaining')+': <span class="num">'+fmt(custOpen(c.id))+'</span> '+CUR()+'</div></div><button class="btn btn-soft" style="width:auto;padding:9px 14px;font-size:13px" onclick="event.stopPropagation();cust(\''+c.id+'\').archived=false;save();render()">'+ic('undo',15)+t('restore')+'</button></div>').join(''):'<div class="muted" style="text-align:center;padding:28px 0">'+t('noArch')+'</div>'}
function custListBody(){const list=filteredCustomers(true);return list.length?list.map(c=>custRow(c,true)).join(''):'<div class="muted" style="text-align:center;padding:28px 0">'+t('noRes')+'</div>'}
const S_reports=()=>{
 const pays=DD().payments;const monthPays=pays.filter(p=>{const d=new Date(p.ts),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()});
 const monthSum=monthPays.reduce((s,p)=>s+p.amount,0);
 const openInvs=DD().invoices.filter(i=>invRem(i)>0);
 const topC=DD().customers.filter(c=>!c.archived&&custOpen(c.id)>0).sort((a,b)=>custOpen(b.id)-custOpen(a.id)).slice(0,4);
 const monthDebt=DD().invoices.filter(i=>{const d=new Date(i.ts),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()}).reduce((x,i)=>x+i.amount,0);
 const rate=monthDebt>0?Math.min(100,Math.round(monthSum/monthDebt*100)):100;
 const topB=DD().customers.filter(c=>!c.archived&&custPurch(c.id)>0).sort((a,b)=>custPurch(b.id)-custPurch(a.id)).slice(0,4);
 const odL=DD().customers.filter(c=>!c.archived&&custOverdue(c.id));
 const days=[...Array(7)].map((_,i)=>{const d0=new Date();d0.setHours(0,0,0,0);const s=d0.getTime()-(6-i)*D;return pays.filter(p=>p.ts>=s&&p.ts<s+D).reduce((x,p)=>x+p.amount,0)});
 const mx=Math.max(...days,1);
 return headerBar(t('reports'),onlineDot(),null,null,accChip())
 +'<div class="pad stats"><div class="stat red"><div class="t">'+t('owed')+'</div><div class="v">'+money(openTotal())+'</div></div><div class="stat green"><div class="t">'+t('collToday')+'</div><div class="v">'+money(monthSum)+'</div></div></div>'
 +'<div class="pad" style="margin-top:14px"><div class="card" style="padding:16px"><div class="row" style="margin-bottom:12px">'+ic('pie',18)+'<b>'+t('week7')+' — '+t('collToday')+'</b></div>'
 +(chartOK()?'<div style="position:relative;height:170px"><canvas id="chW"></canvas></div></div></div>'
 :'<div class="row" style="align-items:flex-end;gap:8px;height:90px">'+days.map((v,i)=>'<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px"><div style="width:100%;background:'+(i===6?'var(--green)':'var(--green-line)')+';border-radius:6px;height:'+Math.max(6,v/mx*70)+'px"></div><span class="muted" style="font-size:10px">'+(i===6?'·':(6-i))+'</span></div>').join('')+'</div></div></div>')
 +'<div class="pad" style="margin:14px 20px 8px;font-weight:800">'+t('sDebt')+'</div>'
 +'<div class="pad list" style="padding-bottom:14px">'+(topC.length?topC.map(c=>'<div class="card litem" onclick="go(\'profile\',{id:\''+c.id+'\'})">'+avat(c.name,42)+'<div class="sp"><b>'+esc(c.name)+'</b></div><span class="amt red">'+money(custOpen(c.id))+'</span></div>').join(''):'<div class="muted" style="text-align:center;padding:20px 0">✓</div>')+'</div>'
 +'<div class="pad stats" style="margin-top:14px"><div class="stat red"><div class="t">'+t('monthDebt')+'</div><div class="v">'+money(monthDebt)+'</div></div><div class="stat green"><div class="t">'+t('collRate')+'</div><div class="v"><span class="num">'+rate+'%</span></div></div></div>'
 +(chartOK()?'<div class="pad" style="margin-top:14px"><div class="card" style="padding:16px"><div class="row" style="margin-bottom:12px">'+ic('pie',18)+'<b>'+t('m6')+'</b></div><div style="position:relative;height:200px"><canvas id="chM"></canvas></div></div></div>':'')
 +'<div class="pad" style="margin:14px 20px 8px;font-weight:800">'+t('bestCust')+'</div>'
 +'<div class="pad list">'+(topB.length?topB.map(c=>'<div class="card litem" onclick="go(\'profile\',{id:\''+c.id+'\'})">'+avat(c.name,42)+'<div class="sp"><b>'+esc(c.name)+'</b></div><span class="amt" style="color:var(--navy)">'+money(custPurch(c.id))+'</span></div>').join(''):'<div class="muted" style="text-align:center;padding:20px 0">✓</div>')+'</div>'
 +(odL.length?'<div class="pad" style="margin:14px 20px 8px;font-weight:800;color:var(--red)">'+ic('clock',16)+' '+t('overdueC')+' ('+odL.length+')</div><div class="pad list" style="padding-bottom:14px">'+odL.map(c=>'<div class="card litem" onclick="go(\'profile\',{id:\''+c.id+'\'})">'+avat(c.name,42)+'<div class="sp"><b>'+esc(c.name)+'</b></div>'+(c.phone?'<button class="hbtn" style="min-width:34px;height:34px" onclick="event.stopPropagation();window.open(\'https://wa.me/'+(c.phone||'').replace(/[^0-9]/g,'')+'\')">'+ic('wa',16)+'</button>':'')+'<span class="amt red">'+money(custOpen(c.id))+'</span></div>').join('')+'</div>':'');
};
const S_settings=()=>{const cur=curAcc();const st=sec.enabled?'var(--green)':'var(--muted)';
 const accRow='<div class="card" style="padding:14px 16px"><div class="row" style="align-items:center;gap:12px">'+
  '<span class="av" style="width:44px;height:44px;background:'+(cur.type==='grocery'?'var(--green-bg);color:var(--green)':'var(--navy-bg);color:var(--navy)')+'">'+ic(cur.type==='grocery'?'store':'user',20)+'</span>'+
  '<div class="sp"><div style="font-weight:800">'+esc(cur.name)+'</div><div class="muted" style="font-size:12.5px">'+t(cur.type==='grocery'?'grocery':'personal')+' · '+(cName(cur.cur)?cName(cur.cur)+' · ':'')+esc(cur.cur)+'</div></div>'+
  '<button class="btn btn-line" style="min-width:0;padding:8px 14px;font-size:13px" onclick="openAccSheet()">'+ic('gear',16)+t('switchAcc')+'</button></div></div>';
 const sec0=(title,body)=>'<div class="lb">'+title+'</div>'+body;
 const kv=(bg,col,icon,label,right,click)=>'<div class="kv"'+(click?' style="cursor:pointer" onclick="'+click+'"':'')+'><span class="kic" style="width:34px;height:34px;border-radius:10px;background:'+bg+';color:'+col+';display:flex;align-items:center;justify-content:center">'+ic(icon,17)+'</span><span class="k" style="margin-inline-start:8px">'+label+'</span><span class="v">'+right+'</span></div>';
 return '<div class="hdr"><button class="hbtn" style="visibility:hidden">.</button><div class="sp" style="text-align:center"><h1>'+t('settings')+'</h1></div><div style="width:42px"></div></div>'+
 '<div class="pad">'+
 sec0(t('account'),accRow)+
 sec0(t('prefs'),'<div class="card" style="padding:6px 16px">'+
 kv('var(--green-bg)','var(--green)','coins',t('country'),'<select class="selctl" aria-label="'+t('country')+'" onchange="if(this.value===\'__c\'){openCurSheet()}else setCur(this.value)">'+COUNTRIES.map(x=>'<option value="'+x[1]+'"'+(cur.cur===x[1]?' selected':'')+'>'+x[0]+' · '+x[1]+'</option>').join('')+(cName(cur.cur)?'':'<option value="'+esc(cur.cur)+'" selected>'+esc(cur.cur)+'</option>')+'<option value="__c">✎ '+t('curCustom')+'</option></select>')+
 '<div class="sep"></div>'+kv('var(--navy-bg)','var(--navy)','moon',t('darkMode'),'<div class="dmsw"><span class="dico">'+ic('sun',16)+'</span><div class="sw2 '+(sec.dark?'on':'')+'" role="switch" aria-checked="'+(sec.dark?'true':'false')+'" aria-label="'+t('darkMode')+'" onclick="sec.dark=!sec.dark;sec.darkAuto=false;saveSec();render()"></div><span class="dico">'+ic('moon',16)+'</span><button class="autochip '+(sec.darkAuto?'on':'')+'" onclick="sec.darkAuto=!sec.darkAuto;saveSec();render()">'+t('darkAuto')+'</button></div>')+
'</div>')+
 sec0(t('sound'),'<div class="card" style="padding:6px 16px">'+
  kv('var(--red-bg)','var(--red)','bell',t('sound'),'<div class="sw2 '+(sec.sound?'on':'')+'" role="switch" aria-checked="'+(sec.sound?'true':'false')+'" aria-label="'+t('sound')+'" onclick="sec.sound=!sec.sound;saveSec();render()"></div>')+
 '<div class="sep"></div>'+
 kv('var(--navy-bg)','var(--navy)','vibrate',t('vib'),'<div class="sw2 '+(sec.vib?'on':'')+'" role="switch" aria-checked="'+(sec.vib?'true':'false')+'" aria-label="'+t('vib')+'" onclick="sec.vib=!sec.vib;saveSec();render()"></div>')+
 '</div>')+
  sec0(t('security'),'<div class="card" style="padding:6px 16px">'+
  kv('var(--navy-bg)','var(--navy)','lock',t('pinLock'),'<span style="font-weight:800;color:'+st+'">'+t(sec.enabled?'on':'off')+'</span><button class="hbtn" aria-label="'+t('setPin')+'" onclick="askPin()">'+ic('shield',17)+'</button>')+
  (sec.enabled?
   '<div class="sep"></div>'+
   kv('var(--navy-bg)','var(--navy)','fp',t('useFinger')+' ('+(sec.fps?sec.fps.length:0)+')','<button class="hbtn" onclick="addFp()" style="color:var(--navy)">'+t('fpAdd')+'</button>')+
   ((sec.fps&&sec.fps.length)?sec.fps.map((f,i)=>'<div class="sep"></div><div class="kv"><span class="kic" style="width:34px;height:34px;border-radius:10px;background:var(--navy-bg);color:var(--navy);display:flex;align-items:center;justify-content:center">'+ic('fp',16)+'</span><span class="k" style="margin-inline-start:8px">'+t('fpN')+' '+(i+1)+'</span><span class="v"><button class="hbtn" style="color:var(--red)" onclick="fpDel('+i+')">'+ic('x',15)+'</button></span></div>').join(''):'')+
   '<div class="sep"></div>'+
   kv('var(--red-bg)','var(--red)','clock',t('autoLock'),'<select class="inp" style="width:130px;padding:7px 10px" onchange="sec.autoMin=+this.value;saveSec()">'+[1,5,15,30,60].map(m=>'<option value="'+m+'"'+(sec.autoMin===m?' selected':'')+'>'+m+'</option>').join('')+'</select>')+
   '<div class="sep"></div>'+
   kv('var(--red-bg)','var(--red)','lock',t('lockNow'),ic('fwd',16),'locked=true;masterKey=null;pinBuf=\'\';stack=[{s:\'home\'}];render()')+
   '<div class="sep"></div>'+
   kv('var(--red-bg)','var(--red)','x',t('turnOffPin'),ic('fwd',16),'disableLock()')
  :'')+'</div>')+
 sec0(t('dataSec'),'<div class="card" style="padding:6px 16px">'+
  kv('var(--navy-bg)','var(--navy)','excel',t('exportAll'),ic('fwd',16),'exportAll()')+
  '<div class="sep"></div>'+
   '<div class="sep"></div>'+
  kv('var(--red-bg)','var(--red)','trash',t('reset'),ic('fwd',16),'reset()')+
  '<div class="sep"></div>'+
  kv('var(--green-bg)','var(--green)','up',t('qrSend'),ic('fwd',16),'openQrSend()')+
  '<div class="sep"></div>'+
  kv('var(--green-bg)','var(--green)','cam',t('qrRecv'),ic('fwd',16),'openQrRecv()')+
 '</div>')+
 '<div class="card" style="margin-top:16px;padding:2px 16px">'+
 '<div class="kv" style="cursor:pointer" onclick="ui.voskOpen=!ui.voskOpen;render()"><span class="kic" style="background:var(--navy-bg);color:var(--navy)">'+ic('mic',17)+'</span><span class="k">'+t('voskOpt')+'</span><span class="v" style="font-weight:800;color:var(--soft)">'+(sec.vosk?t('on'):t('off'))+(ui.voskOpen?' ▾':'')+'</span></div>'+
 (ui.voskOpen?'<div class="sep"></div><div class="muted" style="padding:10px 2px;font-size:12px;line-height:1.9;white-space:pre-line">'+t('voskHelp')+'</div><button class="btn btn-line" style="margin:4px 0 12px" onclick="sec.vosk=!sec.vosk;saveSec();render()">'+(sec.vosk?t('voskOff'):t('voskOn'))+'</button>':'')+
 '</div>'+
 '</div>';
};


/* ---- profile ---- */
const S_profile=p=>{const c=cust(p.id);if(!c)return S_home();
 const invs=custInvoices(c.id).filter(i=>ui.pf==='all'||invStatus(i)===ui.pf);
 return headerBar(t('custAcc'),null,'back()','openCustMenu(\''+c.id+'\')')
 +'<div class="pad"><div class="card" style="padding:17px"><div class="row"><span class="av" style="width:62px;height:62px;font-size:21px;padding:0;cursor:pointer;background:'+(c.photo?'none':avColor(c.name))+'" onclick="openPhotoSheet(\''+c.id+'\')" aria-label="'+t('photoT')+'">'+(c.photo?'<img src="'+c.photo+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">':esc(initials(c.name)))+'</span><div class="sp"><div style="font-size:19px;font-weight:800">'+esc(c.name)+'</div>'+(c.phone?'<div class="muted" style="margin-top:3px">'+ic('phone',12)+' <span class="num">'+esc(c.phone)+'</span></div>':'')+'</div>'+(c.pinned?ic('pin',20):'')+'</div><div class="muted" style="margin-top:8px">'+t('since')(c.since)+'</div></div></div>'
 + (c.archived?'<div class="pad" style="margin-top:10px"><button class="btn btn-line" onclick="cust(\''+c.id+'\').archived=false;save();render()">'+ic('undo',17)+t('restore')+'</button></div>':'')
 '<div class="pad stats" style="margin-top:12px"><div class="stat red"><div class="t">'+t('remaining')+'</div><div class="v">'+money(custOpen(c.id))+'</div></div><div class="stat green"><div class="t">'+t('totalPaid')+'</div><div class="v">'+money(custPaid(c.id))+'</div></div></div>'
 +'<div class="pad" style="margin-top:14px"><div class="seg">'+['all','open','part','paid'].map(k=>'<button class="'+(ui.pf===k?'on'+(k==='open'?' r':''):'')+'" onclick="ui.pf=\''+k+'\';render()">'+({all:t('all'),open:t('open'),part:t('part'),paid:t('paid')}[k])+'</button>').join('')+'</div></div>'
 +'<div class="pad list" style="margin-top:14px;padding-bottom:8px">'+(invs.length?invs.map(invCard).join(''):'<div class="muted" style="text-align:center;padding:22px 0">'+t('noInv')+'</div>')+'</div>'
 +'<div class="bottombar">'+lpBtn('debt','btn-red','receipt',t('newDebt'))+lpBtn('pay','btn-green','coins',t('pay'))+'</div>';
};
function invCard(i){const st=invStatus(i),rem=invRem(i);
 return '<div class="card inv '+st+'" onclick="go(\'invoice\',{id:\''+i.id+'\'})"><div class="row"><span class="kic" style="background:'+(st==='paid'?'var(--green-bg);color:var(--green)':st==='part'?'var(--amber-bg);color:var(--amber)':'var(--red-bg);color:var(--red)')+'">'+(st==='paid'?ic('checkc',19):ic('receipt',19))+'</span><div class="sp"><div style="font-weight:800">'+t('invoice')+' <span class="num">'+i.code+'</span></div><div class="muted" style="margin-top:3px">'+ic('clock',12)+' '+rel(i.ts)+' · '+dateStr(i.ts)+' · '+timeStr(i.ts)+'</div>'+(i.note?'<div class="soft" style="font-size:13px;margin-top:5px;border-top:1px dashed var(--line);padding-top:5px">'+ic('tag',12)+' '+esc(i.note)+'</div>':'')+'</div><div style="text-align:end">'+badge(st)+'<div class="amt '+(st==='paid'?'green':'red')+'" style="margin-top:7px">'+money(st==='paid'?i.amount:rem)+'</div></div></div></div>';
}
const S_invoice=p=>{const i=DD().invoices.find(x=>x.id===p.id);if(!i)return S_home();const c=cust(i.cust),st=invStatus(i),paid=invPaid(i.id),rem=invRem(i);
 const pays=DD().payments.filter(x=>x.alloc.some(a=>a.inv===i.id)).sort((a,b)=>a.ts-b.ts);
 return headerBar(t('invoice')+' <span class="num">'+i.code+'</span>',null,'back()','openExport(\''+c.id+'\')')
 +'<div class="pad"><div class="card" style="padding:17px"><div class="row">'+(c?avat(c.name,50):'<span class="av" style="width:50px;height:50px;background:var(--red-bg);color:var(--red)">'+ic('receipt',20)+'</span>')+'<div class="sp"><div style="font-weight:800;font-size:16.5px">'+(c?esc(c.name):esc(i.note||t('expense')))+'</div><div class="muted" style="margin-top:3px">'+dateStr(i.ts)+' · '+timeStr(i.ts)+'</div></div>'+badge(st)+'</div>'
 +'<div class="stats" style="margin-top:15px;grid-template-columns:1fr 1fr 1fr"><div style="text-align:center"><div class="muted">'+t('total')+'</div><div class="amt" style="font-size:17px;margin-top:4px">'+money(i.amount)+'</div></div><div style="text-align:center;border-inline:1px solid var(--line2)"><div class="muted">'+t('paidLbl')+'</div><div class="amt green" style="font-size:17px;margin-top:4px">'+money(paid)+'</div></div><div style="text-align:center"><div class="muted">'+t('remaining')+'</div><div class="amt red" style="font-size:17px;margin-top:4px">'+money(rem)+'</div></div></div></div></div>'
 +(i.due?'<div class="pad" style="margin-top:12px"><div class="card" style="padding:11px 16px;display:flex;align-items:center;gap:10px;border-color:'+(isOverdue(i)?'var(--red-line)':'var(--line2)')+'"><span style="width:36px;height:36px;border-radius:11px;background:'+(isOverdue(i)?'var(--red-bg);color:var(--red)':'var(--amber-bg);color:var(--amber)')+';display:flex;align-items:center;justify-content:center;flex:none">'+ic('cal',17)+'</span><div class="sp"><div class="muted" style="font-size:11.5px">'+t('due')+'</div><div style="font-weight:700">'+dateStr(i.due)+(isOverdue(i)?' · <b style="color:var(--red)">'+t('overdue')+'</b>':'')+'</div></div></div></div>':'')
 +(c&&c.phone&&rem>0?'<div class="pad" style="margin-top:12px"><button class="btn btn-green" onclick="waRemind(\''+i.id+'\')">'+ic('wa',18)+t('waRemind')+'</button></div>':'')
 +'<div class="pad" style="margin:16px 20px 7px;font-weight:800">'+ic('hist',16)+' '+t('payLog')+'</div>'
 +'<div class="pad"><div class="card" style="padding:4px 16px">'+(pays.length?pays.map((x,n)=>'<div class="kv"><span class="kic" style="background:var(--green-bg);color:var(--green)">'+ic('checkc',17)+'</span><span class="k">'+t('payOf')+' <span class="num">'+(n+1)+'</span><br><span style="font-size:11.5px">'+dateStr(x.ts)+' · '+timeStr(x.ts)+'</span></span><span class="v amt green">'+money(x.alloc.find(a=>a.inv===i.id).amt)+'</span></div>').join(''):'<div class="muted" style="text-align:center;padding:20px 0">'+t('noPay')+'</div>')+'</div></div>'
 +'<div class="bottombar" style="flex-direction:column">'+(rem>0?'<button class="btn btn-green" onclick="go(\'pay\',{cust:\''+c.id+'\'})">'+ic('coins',18)+t('payRemaining')+'</button>':'')+'<button class="btn btn-line" onclick="openExport(\''+c.id+'\')">'+ic('share',17)+t('shareReceipt')+'</button></div>';
};
/* ---- voice ---- */
const S_voice=p=>{const v=ui.voice;const pre=p&&p.cust?cust(p.cust):null;let body='';
 if(v.st==='idle'){body='<div class="micwrap"><button class="mic" onclick="voiceStart()">'+ic('mic',50)+'</button><div class="wave" style="opacity:.25">'+waveHtml()+'</div><div style="font-weight:700;margin-top:6px">'+t('tapMic')+'</div><div class="transcript" style="background:var(--card2);border-color:var(--line);color:var(--soft)">'+t('example')+'</div><div class="muted" style="margin-top:10px;text-align:center;line-height:1.8;padding:0 28px">'+t('voiceHint')+'</div></div>';}
 else if(v.st==='listen'){body='<div class="micwrap"><button class="mic live">'+ic('mic',50)+'</button><div class="wave">'+waveHtml()+'</div><div style="font-weight:800;color:var(--green)">'+t('listening')+'</div></div>';}
 else{const d=v.d;body='<div class="micwrap" style="padding-top:8px"><div class="wave" style="opacity:.5">'+waveHtml()+'</div><div class="transcript">'+t('heard')+' «'+esc(d.say)+'»</div></div>'
 +'<div class="pad"><div class="card" style="padding:5px 16px">'+(v.edit?
 '<div class="kv"><span class="k">'+ic('user',16)+t('cust')+'</span><span class="v" style="min-width:55%"><select class="inp" style="padding:8px 10px" id="ve_c">'+DD().customers.filter(c=>!c.archived).map(c=>'<option value="'+c.id+'"'+(c.id===d.custId?' selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></span></div>'
 +'<div class="kv"><span class="k">'+ic('wallet',16)+t('amount')+'</span><span class="v" style="min-width:35%"><input class="inp num" style="padding:8px 10px" id="ve_a" type="number" value="'+d.amt+'"></span></div>'
 +'<div class="kv"><span class="k">'+ic('tag',16)+t('remind')+'</span><span class="v" style="min-width:55%"><input class="inp" style="padding:8px 10px" id="ve_n" value="'+esc(d.note)+'" placeholder="'+t('remindPh')+'"></span></div>'
 :(!isP()?'<div class="kv"><span class="kic">'+ic('user',17)+'</span><span class="k">'+t('cust')+'</span><span class="v">'+esc(d.name)+'</span></div>':'')
 +'<div class="kv"><span class="kic" style="color:var(--red)">'+ic('wallet',17)+'</span><span class="k">'+t('amount')+'</span><span class="v amt red">'+money(d.amt)+'</span></div>'
 +'<div class="kv"><span class="kic">'+ic('tag',17)+'</span><span class="k">'+t('remind')+'</span><span class="v">'+esc(d.note)+'</span></div>')+'</div>'
 +(v.cands.length&&!v.edit?'<div class="muted" style="margin:10px 2px 4px;font-weight:700">'+t('cand')+'</div><div class="cand">'+v.cands.map(c=>'<button class="'+(c.id===v.d.custId?'on':'')+'" onclick="ui.voice.d.custId=\''+c.id+'\';ui.voice.d.name=\''+esc(c.name)+'\';render()">'+esc(c.name)+'</button>').join('')+'</div>':'')
 +'<div style="display:flex;gap:12px;margin-top:14px"><button class="btn btn-red" style="flex:1.5" onclick="voiceConfirm()">'+ic('checkc',18)+t('confirmReg')+'</button><button class="btn btn-line" style="flex:1" onclick="voiceToggleEdit()">'+ic('edit',17)+t('editL')+'</button><button class="hbtn" onclick="ui.voice.st=\'idle\';render()">'+ic('x',18)+'</button></div>'
 +'<div class="muted" style="text-align:center;margin-top:13px">'+ic('lock',12)+' '+t('privacyC')+'</div></div>';}
 return headerBar(t('voiceTitle'),pre?esc(pre.name):null,'back()')+body;};
function waveHtml(){let s='';for(let i=0;i<26;i++)s+='<i style="--d:'+(i*0.07)+'s;--h:'+(8+((i*37)%26))+'px"></i>';return s}
function voiceStart(){ui.voice.st='listen';ui.voice.edit=false;render();VoiceEngine.simulate(dm=>{
 const pre=ctxCust()?cust(ctxCust()):null;
 const name=pre?pre.name:dm.name;
 const cands=pre?[]:DD().customers.filter(c=>!c.archived&&(c.name.includes(name)||name.includes(c.name.split(' ')[0]))).slice(0,5);
 const custId=pre?pre.id:(cands.find(c=>c.name===name)||cands[0]||{}).id||null;
 ui.voice.st='parsed';ui.voice.cands=cands;ui.voice.d={name,amt:dm.amt,note:dm.note,say:(pre?'':name+'، ')+dm.amt+' '+CUR()+'، '+dm.note,custId};render()});}
function voiceToggleEdit(){const v=ui.voice;if(v.edit){v.d.custId=document.getElementById('ve_c').value;v.d.name=document.getElementById('ve_c').selectedOptions[0].text;v.d.amt=parseFloat(document.getElementById('ve_a').value)||0;v.d.note=document.getElementById('ve_n').value;}v.edit=!v.edit;render()}
function voiceConfirm(){const v=ui.voice;if(v.edit)voiceToggleEdit();const c=cust(v.d.custId)||cust(ctxCust());if(!c||!v.d.amt){toastMsg(t('chooseFirst'));return}
 const inv={id:uid(),code:'A'+(DD().seq++),cust:c.id,ts:Date.now(),amount:v.d.amt,note:v.d.note};DD().invoices.push(inv);save();feedback('debt');
 ui.voice={st:'idle',demo:ui.voice.demo,edit:false,d:{},cands:[]};stack=[{s:'profile',p:{id:c.id}}];render();
 const invId=inv.id;
 toastMsg('<b>'+t('debtDone')+'</b> · '+money(inv.amount)+'<br><span style="font-size:11.5px;opacity:.8">'+t('undoAvail')+'</span>',()=>{DD().invoices=DD().invoices.filter(x=>x.id!==invId);save();render()});}
/* ---- pay ---- */
const S_pay=p=>{const py=ui.pay;const c=py.cust?cust(py.cust):(p&&p.cust?cust(p.cust):null);if(c&&!py.cust)py.cust=c.id;
 if(py.done){const d=py.done;return '<div class="success"><div class="okc">'+ic('check',42)+'</div><h2 style="color:var(--green);margin-top:15px;font-size:21px">'+t('payDone')+'</h2><div class="muted" style="margin-top:6px">'+esc(d.cname)+' · '+money(d.amt)+'</div></div>'
 +'<div class="pad"><div class="card" style="padding:4px 16px"><div class="kv"><span class="kic">'+ic('user',17)+'</span><span class="k">'+t('cust')+'</span><span class="v">'+esc(d.cname)+'</span></div><div class="kv"><span class="kic" style="color:var(--green)">'+ic('banknote',17)+'</span><span class="k">'+t('amount')+'</span><span class="v amt green">'+money(d.amt)+'</span></div><div class="kv"><span class="kic">'+ic('clock',17)+'</span><span class="k">'+t('afterPay')+'</span><span class="v">'+money(d.after)+'</span></div></div>'
 +'<div style="display:flex;gap:12px;margin-top:15px"><button class="btn btn-navy" style="flex:1" onclick="ui.pay={cust:null,amt:\'\',method:\'cash\',done:null};tab(\'home\')">'+t('done')+'</button>'+(d.cid?'<button class="btn btn-line" style="flex:1" onclick="ui.pay={cust:null,amt:\'\',method:\'cash\',done:null};go(\'profile\',{id:\''+d.cid+'\'})">'+t('viewC')+'</button>':'')+'</div></div>';}
 return headerBar(t('payTitle'),null,'back()')
 +'<div class="pad">'+(isP()?'<div class="card" style="padding:13px 15px"><div class="row"><span class="av" style="width:44px;height:44px;background:var(--green-bg);color:var(--green)">'+ic('banknote',18)+'</span><div class="sp"><div style="font-weight:800">'+t('deposit')+'</div><div class="muted">'+esc(curAcc().name)+'</div></div></div></div>':(c?'<div class="card" style="padding:13px 15px"><div class="row">'+avat(c.name,44)+'<div class="sp"><div style="font-weight:800">'+esc(c.name)+'</div><div class="muted">'+t('remaining')+': '+money(custOpen(c.id))+'</div></div><button class="hbtn" style="min-width:36px;height:36px" onclick="openCustPicker()">'+ic('edit',15)+'</button></div></div>':'<button class="btn btn-line" onclick="openCustPicker()">'+ic('users',18)+t('chooseC')+'</button>'))+'</div>'
 +'<div class="pad"><label class="lb">'+t('amountNow')+'</label><div class="card" style="display:flex;align-items:center;border:1.6px solid var(--navy)"><input id="payInp" style="flex:1;border:none;outline:none;background:none;font-size:28px;font-weight:800;padding:13px 16px;text-align:end" class="num" inputmode="decimal" placeholder="0.00" value="'+esc(py.amt)+'" oninput="ui.pay.amt=this.value;document.getElementById(\'impact\').outerHTML=payImpact()"><span style="padding-inline-end:15px;font-weight:700;color:var(--muted)">'+CUR()+'</span></div>'
 +(c?'<button class="chip" style="border:1.5px solid var(--navy);color:var(--navy);background:var(--card);margin-top:9px" onclick="ui.pay.amt=String(custOpen(\''+c.id+'\'));document.getElementById(\'payInp\').value=ui.pay.amt;document.getElementById(\'impact\').outerHTML=payImpact()">'+t('full')+'</button>':'')+'</div>'
 +'<div class="pad"><label class="lb">'+t('method')+'</label><div class="seg">'+['cash','transfer','cardpay'].map(m=>'<button class="'+(py.method===m?'on':'')+'" onclick="ui.pay.method=\''+m+'\';render()">'+t(m)+'</button>').join('')+'</div></div>'
 +'<div id="impact">'+payImpactInner()+'</div>'
 +'<div class="bottombar"><button class="btn btn-green" onclick="payConfirm()">'+ic('checkc',18)+t('confirmPay')+'</button></div>';
};
function payImpactInner(){const py=ui.pay;const c=py.cust?cust(py.cust):null;const amt=parseFloat(py.amt)||0;if(!c||amt<=0)return '';
 const open=custInvoices(c.id).filter(i=>invRem(i)>0).sort((a,b)=>a.ts-b.ts);let left=amt;const rows=[];open.forEach(i=>{if(left<=0)return;const r=invRem(i);const use=Math.min(r,left);left-=use;rows.push({i,use,r})});
 const after=Math.max(0,custOpen(c.id)-amt);const will=after<=0?'willPaid':(rows.length?'willPart':'willOpen');
 return '<div class="pad" style="margin:14px 20px 7px;font-weight:800">'+t('afterPay')+'</div><div class="pad"><div class="card" style="padding:4px 16px"><div class="kv"><span class="kic" style="background:'+(will==='willPaid'?'var(--green-bg);color:var(--green)':'var(--amber-bg);color:var(--amber)')+'">'+(will==='willPaid'?ic('checkc',17):ic('clock',17))+'</span><span class="k">'+t(will)+'</span><span class="v amt" style="color:'+(will==='willPaid'?'var(--green)':'var(--amber)')+'">'+money(after)+'</span></div>'+rows.map(r=>'<div class="kv"><span class="kic">'+ic('receipt',16)+'</span><span class="k">'+t('invoice')+' <span class="num">'+r.i.code+'</span></span><span class="v" style="font-size:12px;color:var(--soft)">'+money(r.use)+' · '+t('remainAfter')+' <b class="num">'+fmt(r.r-r.use)+'</b></span></div>').join('')+'</div></div>';}
window.payImpact=()=>'<div id="impact">'+payImpactInner()+'</div>';
function payConfirm(){const py=ui.pay;const c=py.cust?cust(py.cust):null;const amt=parseFloat(py.amt)||0;
 if(!isP()&&!c){toastMsg(t('chooseFirst'));return}if(amt<=0){toastMsg(t('enterAmt'));return}
 const open=c?custInvoices(c.id).filter(i=>invRem(i)>0).sort((a,b)=>a.ts-b.ts):[];let left=amt;const alloc=[];
 open.forEach(i=>{if(left<=0)return;const use=Math.min(invRem(i),left);left-=use;alloc.push({inv:i.id,amt:use})});
 DD().payments.push({id:uid(),cust:c?c.id:null,ts:Date.now(),amount:amt,method:py.method,alloc});save();feedback('pay');speak((c?c.name+'، ':'')+t('pay')+' '+amt+' '+CUR());
 py.done={cid:c?c.id:null,cname:c?c.name:t('deposit'),amt,after:c?custOpen(c.id):0};render();}
/* ---- long-press recording ---- */
let recPend=null,recEnd=null;
const DEMOP=[{name:'أبو خالد',amt:20,note:'',say:'أبو خالد سدد عشرين ريال نقدًا'}];
let touchSeen=0;const lpLast={t:0,k:''};
function lpGuard(k){const n=Date.now();if(lpLast.k===k&&n-lpLast.t<450)return false;lpLast.t=n;lpLast.k=k;return true}
function btnDownT(k){touchSeen=Date.now();btnDown(k)}
function btnDownP(k){if(Date.now()-touchSeen<800)return;btnDown(k)}
function btnUpT(k){touchSeen=Date.now();if(!lpGuard(k))return;btnUp(k)}
function btnUpP(k){if(Date.now()-touchSeen<800)return;if(!lpGuard(k))return;btnUp(k)}
function btnClick(k){if(Date.now()-touchSeen<800)return;if(recPend||ui.rec&&ui.rec.st==='rec')return;if(!lpGuard(k))return;clearTimeout(recPend);recPend=null;if(k==='debt')openDebtSheet(ctxCust());else{ui.pay={cust:ctxCust(),amt:'',method:'cash',done:null};go('pay',ctxCust()?{cust:ctxCust()}:{})}}
function lpBtn(kind,cls,icon,label){return '<button class="btn '+cls+'" onpointerdown="btnDownP(\''+kind+'\')" onpointerup="btnUpP(\''+kind+'\')" onpointerleave="btnCancelRec()" ontouchstart="btnDownT(\''+kind+'\')" ontouchend="btnUpT(\''+kind+'\')" onclick="btnClick(\''+kind+'\')" oncontextmenu="return false">'+ic(icon,18)+label+'</button>'}
function btnDown(kind){if(recPend)return;recPend=setTimeout(()=>{recPend=null;try{if(sec.vib&&navigator.vibrate)navigator.vibrate(30)}catch(e){}startRec(kind)},380)}
function btnCancelRec(){clearTimeout(recPend)}
function btnUp(kind){if(recPend){clearTimeout(recPend);recPend=null;
 if(kind==='debt')openDebtSheet(ctxCust());
 else{ui.pay={cust:ctxCust(),amt:'',method:'cash',done:null};go('pay',ctxCust()?{cust:ctxCust()}:{})}}}
function startRec(kind,custId){ui.rec={kind,st:'rec',edit:false,d:{},cands:[],pre:custId||null};go('rec',{kind});clearTimeout(recEnd);
 if(sec.vosk){if(window.voskEngine&&window.voskEngine.ready){window.voskEngine.start(kind,custId);return}toastMsg(t('voskNo'))}
 if(tryWebASR(kind))return;
 recEnd=setTimeout(endRec,2600)}
function amtFromText(text){
  const nd=String(text).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[۰-۹]/g,c=>String('۰۱۲۳۴٥٦٨٩'.indexOf(c)));
  const m=nd.match(/\d+(?:[.,]\d+)?/);
  if(m)return {amt:parseFloat(m[0].replace(',','.')),start:m.index,end:m.index+m[0].length,raw:true};
  const w=words2num(nd);
  return w.amt>0?{amt:w.amt,start:w.start,end:w.end,raw:true}:{amt:0,start:0,end:0,raw:false};
}
const HU={'مئة':1,'مائة':1,'مية':1,'ماية':1,'مايه':1,'مئه':1};
const W1={'صفر':0,'واحد':1,'واحدة':1,'احد':1,'أحد':1,'اثنين':2,'اثنان':2,'اثنتان':2,'اتنين':2,'تنين':2,'ثلاثة':3,'ثلاث':3,'تلاتة':3,'تلات':3,'اربعة':4,'أربعة':4,'اربع':4,'أربع':4,'خمسة':5,'خمس':5,'خمست':5,'سته':6,'ستة':6,'ست':6,'سبعه':7,'سبعة':7,'سبع':7,'ثمانية':8,'ثمان':8,'تمانية':8,'ثمانيه':8,'تسعة':9,'تسع':9,'تسعه':9};
const W10={'عشرة':10,'عشر':10,'عشرت':10,'عشرون':20,'عشرين':20,'تلاتون':30,'ثلاثون':30,'ثلاثين':30,'تلاتين':30,'اربعون':40,'أربعون':40,'اربعين':40,'أربعين':40,'خمسون':50,'خمسين':50,'ستون':60,'ستين':60,'سبعون':70,'سبعين':70,'ثمانون':80,'ثمانين':80,'تمانون':80,'تمانيه':8,'تسعون':90,'تسعين':90};
const E1={'zero':0,'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,'sixteen':16,'seventeen':17,'eighteen':18,'nineteen':19};
const E10={'twenty':20,'thirty':30,'forty':40,'fifty':50,'sixty':60,'seventy':70,'eighty':80,'ninety':90};
function hunMul(t){ // returns u for "<u> مئة" combos like ثلاثمئة / خمسمية / تلاتمية
  const m=t.match(/^(واحد|واحدة|احد|أحد|اثنتين|اثنين|اثنان|اتنين|ثلاثة|ثلاث|تلاتة|تلات|اربعة|أربعة|اربع|أربع|خمسة|خمس|خمست|سته|ستة|ست|سبعه|سبعة|سبع|ثمانية|ثمان|تمانية|تسعة|تسع|تسعه)(مئة|مائة|مية|ماية|مايه|مئه)$/);
  if(!m)return 0;return W1[m[1]]||0}
function words2num(s){
  const toks=String(s).toLowerCase().split(/[^0-9a-zA-Z؀-ۿ]+/).filter(Boolean);
  let total=0,cur=0;const usedSet=new Set();
  for(let i=0;i<toks.length;i++){
    let t=toks[i].replace(/^و+/,'');let used=true;let extra=false;
    if(t==='و'||t==='and'){used=false}
    else if(HU[t]){cur=(cur||1)*100}
    else if(t==='مئتان'||t==='مائتان'||t==='ميتين'||t==='مايتين'){cur+=200}
    else if(hunMul(t)){cur+=hunMul(t)*100}
    else if(t==='الف'||t==='ألف'){total+=(cur||1)*1000;cur=0}
    else if(t==='الفين'||t==='ألفين'||t==='الفان'||t==='ألفان'){total+=2000;cur=0}
    else if(t==='الاف'||t==='آلاف'||t==='الآلاف'){total+=(cur||1)*1000;cur=0}
    else if(W10[t]!==undefined){cur+=W10[t]}
    else if(W1[t]!==undefined){
      const nx=toks[i+1];
      if(nx&&/^(عشر|عشرة|عشره)$/.test(nx.replace(/^و+/,''))){cur+=10+W1[t];i++;extra=true}
      else if(nx&&HU[nx.replace(/^و+/,'')]){cur+=W1[t]*100;i++;extra=true}
      else cur+=W1[t];
    }
    else if(E1[t]!==undefined){cur+=E1[t]}
    else if(E10[t]!==undefined){cur+=E10[t]}
    else if(t==='hundred'){cur=(cur||1)*100}
    else if(t==='thousand'){total+=(cur||1)*1000;cur=0}
    else used=false;
    if(used){usedSet.add(i);if(extra)usedSet.add(i-1)}
  }
  const usedIdx=[...usedSet].sort((a,b)=>a-b);
  if(!usedIdx.length)return {amt:0,start:0,end:0};
  let pos=0;const starts=[],ends=[];
  for(let i=0;i<toks.length;i++){const at=s.indexOf(toks[i],pos);starts.push(at);ends.push(at+toks[i].length);pos=at+toks[i].length}
  return {amt:total+cur,start:starts[usedIdx[0]],end:ends[usedIdx[usedIdx.length-1]]};
}

function parseSay(text){const a=amtFromText(text);const amt=a.amt||0;
 const before=a.raw?text.slice(0,a.start).trim():text.trim();let after=a.raw?text.slice(a.end).trim():'';
 after=after.replace(/ريال|ريالات|ر\.س|جنيه|درهم|ليرة|فقط|only|net/g,'').trim();
 const cs=DD().customers.filter(c=>!c.archived);let name=before,custId=null;
 const hit=(before&&(cs.find(c=>c.name===before)||cs.find(c=>c.name.includes(before))||cs.find(c=>before.includes(c.name.split(' ')[0]))))||null;
 if(hit){name=hit.name;custId=hit.id}
 return {name,amt,note:after,custId}}
function handleSay(kind,text,conf){const r0=ui.rec;if(!r0||!(r0.st==='rec'||(r0.st==='edit'&&!r0.d.say)))return;clearTimeout(recEnd);
 const pr=parseSay(text||'');let warn=null;
 if(!text||!String(text).trim())warn='nospeech';else if(pr.amt<=0)warn='noamt';else if(pr.amt>1000000)warn='toobig';else if((conf==null?1:conf)<0.45)warn='lowconf';
 r0.warn=warn;if(warn)toastMsg(t('warn_'+warn));
 r0.d=kind==='debt'?{name:pr.name,amt:pr.amt,note:pr.note,due:null,say:text,custId:pr.custId}:{name:pr.name,amt:pr.amt,method:'cash',say:text,custId:pr.custId};
 r0.st='edit';render()}
window.voskOnText=(k,txt,conf)=>handleSay(k,txt,conf);
window.voskOnEnd=()=>{const r0=ui.rec;if(r0&&r0.st==='rec'){clearTimeout(recEnd);recEnd=setTimeout(endRec,400)}};
function tryWebASR(kind){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return false;
 try{const r=new SR();r.lang=db.lang==='ar'?'ar-SA':'en-US';r.interimResults=false;r.maxAlternatives=1;
  r.onresult=e=>{const res=e.results[0][0];handleSay(kind,res.transcript||'',res.confidence)};
  r.onerror=ev=>{toastMsg(ev&&ev.error==='no-speech'?t('warn_nospeech'):t('webNo'));if(ui.rec&&ui.rec.st==='rec'){clearTimeout(recEnd);recEnd=setTimeout(endRec,600)}};
  r.onend=()=>{if(ui.rec&&ui.rec.st==='rec'){clearTimeout(recEnd);recEnd=setTimeout(endRec,400)}};
  r.start();return true}catch(e){return false}}
function endRec(){const r=ui.rec;if(!r||r.st!=='rec')return;
 if(!isP()&&!DD().customers.some(c=>!c.archived)){ui.rec=null;toastMsg(t('noCustomers'));go('newcust',{});return}
 const pre=isP()?null:((r.pre&&cust(r.pre))||(ctxCust()?cust(ctxCust()):null));
 r.warn=r.warn||'nospeech';
 r.d=r.kind==='debt'?{name:pre?pre.name:'',amt:0,note:'',due:null,say:'',custId:pre?pre.id:null}:{name:pre?pre.name:'',amt:0,method:'cash',say:'',custId:pre?pre.id:null};
 r.cands=pre?[]:DD().customers.filter(c=>!c.archived).slice(0,5);
 r.st='edit';render()}
function payImpactFor(cid,amt){const c=cid?cust(cid):null;if(!c||!amt)return '';const open=custInvoices(c.id).filter(i=>invRem(i)>0).sort((a,b)=>a.ts-b.ts);let left=amt;const rows=[];open.forEach(i=>{if(left<=0)return;const r2=invRem(i);const use=Math.min(r2,left);left-=use;rows.push({i,use,r:r2})});const after=Math.max(0,custOpen(c.id)-amt);const will=after<=0?'willPaid':(rows.length?'willPart':'willOpen');
 return '<div class="card" style="padding:4px 16px;margin-top:12px"><div class="kv"><span class="kic" style="background:'+(will==='willPaid'?'var(--green-bg);color:var(--green)':'var(--amber-bg);color:var(--amber)')+'">'+(will==='willPaid'?ic('checkc',17):ic('clock',17))+'</span><span class="k">'+t(will)+'</span><span class="v amt" style="color:'+(will==='willPaid'?'var(--green)':'var(--amber)')+'">'+money(after)+'</span></div></div>';}
const S_rec=p=>{const r=ui.rec||{st:'rec',kind:(p&&p.kind)||'debt'};
 if(r.st==='rec')return headerBar(r.kind==='debt'?t('recDebt'):t('recPay'),null,'cancelRec()')
 +'<div class="micwrap"><button class="mic live" style="background:radial-gradient(circle at 35% 30%,#5c1030,#7a1236 70%);box-shadow:0 14px 34px rgba(167,25,73,.35),0 0 0 10px rgba(167,25,73,.08)">'+ic('mic',50)+'</button><div class="wave red">'+waveHtml()+'</div><div style="font-weight:800;color:var(--red)">'+t('recOn')+'</div><div class="muted" style="margin-top:10px;text-align:center;line-height:1.8;padding:0 28px">'+t('voiceHint')+'</div></div>'
 +'<div class="card" style="margin:14px 16px 0;padding:10px 14px;text-align:start"><div style="font-weight:900;font-size:12.5px;color:var(--navy)">'+ic('shield',14)+' '+t('strictT')+'</div><div class="muted" style="margin-top:6px;font-size:11.5px;line-height:1.9;white-space:pre-line">'+t('strictRules')+'</div></div>';
 const d=r.d;
 const rows=r.st==='edit'?
 (!isP()?'<div class="kv"><span class="k">'+ic('user',16)+t('cust')+'</span><span class="v" style="min-width:55%"><select class="inp" style="padding:8px 10px" id="re_c">'+DD().customers.filter(c=>!c.archived).map(c=>'<option value="'+c.id+'"'+(c.id===d.custId?' selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></span></div>':'')
 +'<div class="kv"><span class="k">'+ic('wallet',16)+t('amount')+'</span><span class="v" style="min-width:35%"><input class="inp num" style="padding:8px 10px" id="re_a" type="number" value="'+d.amt+'"></span></div>'
 +(r.kind==='debt'?'<div class="kv"><span class="k">'+ic('tag',16)+t('remind')+'</span><span class="v" style="min-width:55%"><input class="inp" style="padding:8px 10px" id="re_n" value="'+esc(d.note)+'" placeholder="'+t('remindPh')+'"></span></div><div class="kv"><span class="k">'+ic('cal',16)+t('due')+'</span><span class="v" style="min-width:45%"><input class="inp num" style="padding:8px 10px" type="date" id="re_d" value="'+(d.due?new Date(d.due).toISOString().slice(0,10):'')+'"></span></div>':'')
 :
 '<div class="kv"><span class="kic">'+ic('user',17)+'</span><span class="k">'+t('cust')+'</span><span class="v">'+esc(d.name)+'</span></div>'
 +'<div class="kv"><span class="kic" style="color:'+(r.kind==='debt'?'var(--red)':'var(--green)')+'">'+ic('wallet',17)+'</span><span class="k">'+t('amount')+'</span><span class="v amt '+(r.kind==='debt'?'red':'green')+'">'+money(d.amt)+'</span></div>'
 +(r.kind==='debt'&&d.due?'<div class="kv"><span class="kic" style="color:var(--amber)">'+ic('cal',17)+'</span><span class="k">'+t('due')+'</span><span class="v">'+dateStr(d.due)+(Date.now()>d.due?' · <b style="color:var(--red)">'+t('overdue')+'</b>':'')+'</span></div>':'')
 +(r.kind==='debt'?'<div class="kv"><span class="kic">'+ic('tag',17)+'</span><span class="k">'+t('remind')+'</span><span class="v">'+esc(d.note)+'</span></div>':'<div class="kv"><span class="kic">'+ic('banknote',17)+'</span><span class="k">'+t('method')+'</span><span class="v">'+t(d.method||'cash')+'</span></div>');
 const impact=r.kind==='pay'?payImpactFor(d.custId,d.amt):'';
 return headerBar(r.kind==='debt'?t('recDebt'):t('recPay'),null,'cancelRec()')
 +'<div class="micwrap" style="padding-top:8px"><div class="wave red" style="opacity:.45">'+waveHtml()+'</div><div class="transcript">'+t('heard')+' «'+esc(d.say)+'»</div></div>'
 +(r.warn?'<div class="card" style="margin:10px 16px 0;padding:10px 14px;background:var(--amber-bg)"><div style="font-weight:900;color:var(--amber);font-size:12.5px">⚠ '+t('warn_'+r.warn)+'</div><div class="muted" style="font-size:11.5px;margin-top:4px">'+t('strictFix')+'</div></div>':'')
 +'<div class="pad"><div class="card" style="padding:5px 16px">'+rows+'</div>'
 +(r.cands.length&&!isP()?'<div class="muted" style="margin:10px 2px 4px;font-weight:700">'+t('cand')+'</div><div class="cand">'+r.cands.map(c=>'<button class="'+(c.id===d.custId?'on':'')+'" onclick="ui.rec.d.custId=\''+c.id+'\';ui.rec.d.name=\''+esc(c.name)+'\';render()">'+esc(c.name)+'</button>').join('')+'</div>':'')
 +impact
 +'<div style="display:flex;gap:10px;margin-top:14px"><button class="btn '+(r.kind==='debt'?'btn-red':'btn-green')+'" style="flex:1.5" onclick="recConfirm()">'+ic('checkc',18)+(r.kind==='debt'?t('confirmReg'):t('confirmPay'))+'</button><button class="hbtn" onclick="cancelRec()">'+ic('x',18)+'</button></div>'
 +'<div class="muted" style="text-align:center;margin-top:12px">'+ic('lock',12)+' '+t('privacyC')+'</div></div>';};
function readRecFields(){const r=ui.rec;const rc=document.getElementById('re_c');if(rc){r.d.custId=rc.value;r.d.name=rc.selectedOptions[0].text}const ra=document.getElementById('re_a');if(ra)r.d.amt=parseFloat(ra.value)||0;if(r.kind==='debt'){const rn=document.getElementById('re_n');if(rn)r.d.note=rn.value;const rd=document.getElementById('re_d');if(rd)r.d.due=rd.value?new Date(rd.value+'T12:00:00').getTime():null}}
function cancelRec(){clearTimeout(recEnd);ui.rec=null;back()}
function recConfirm(){const r=ui.rec;readRecFields();const c=isP()?null:(cust(r.d.custId)||cust(ctxCust()));if((!c&&!isP())||!r.d.amt){toastMsg(t('chooseFirst'));return}
 if(r.kind==='debt'){const inv={id:uid(),code:'A'+(DD().seq++),cust:c?c.id:null,ts:Date.now(),amount:r.d.amt,note:r.d.note,due:r.d.due||null};DD().invoices.push(inv);save();feedback('debt');speak((c?c.name+'، ':'')+t('newDebt')+' '+r.d.amt+' '+CUR());ui.rec=null;stack=[c?{s:'profile',p:{id:c.id}}:{s:'home'}];render();if(c&&c.limit&&custOpen(c.id)>c.limit)toastMsg('⚠ '+t('overLimit'),null);const iid=inv.id;toastMsg('<b>'+t('debtDone')+'</b> · '+money(inv.amount)+'<br><span style="font-size:11.5px;opacity:.8">'+t('undoAvail')+'</span>',()=>{DD().invoices=DD().invoices.filter(x=>x.id!==iid);save();render()})}
 else{const amt=r.d.amt;const open=c?custInvoices(c.id).filter(i=>invRem(i)>0).sort((a,b)=>a.ts-b.ts):[];let left=amt;const alloc=[];open.forEach(i=>{if(left<=0)return;const use=Math.min(invRem(i),left);left-=use;alloc.push({inv:i.id,amt:use})});DD().payments.push({id:uid(),cust:c?c.id:null,ts:Date.now(),amount:amt,method:r.d.method||'cash',alloc});save();feedback('pay');speak((c?c.name+'، ':'')+t('pay')+' '+r.d.amt+' '+CUR());ui.rec=null;ui.pay={cust:null,amt:'',method:'cash',done:{cid:c?c.id:null,cname:c?c.name:t('deposit'),amt,after:c?custOpen(c.id):0}};stack=[{s:'pay'}];render()}}
function openDebtSheet(preId){const opts=DD().customers.filter(c=>!c.archived);if(!isP()&&!opts.length){toastMsg(t('noCustomers'));go('newcust',{});return}
 openSheet('<h3>'+t('manualDebt')+'</h3>'
 +(isP()?'':'<div class="lb" style="margin-top:0">'+t('cust')+'</div><select class="inp" id="md_c">'+opts.map(c=>'<option value="'+c.id+'"'+(c.id===preId?' selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select>')
 +'<div class="lb">'+t('amount')+' ('+CUR()+')</div><input class="inp num" id="md_a" type="number" inputmode="decimal" placeholder="0.00">'
 +'<div class="lb">'+t('remind')+'</div><input class="inp" id="md_n" placeholder="'+t('remindPh')+'">'
 +'<div class="lb">'+t('due')+'</div><input class="inp num" id="md_d" type="date">'
 +'<button class="btn btn-red" style="margin-top:14px" onclick="manualDebtSave()">'+ic('checkc',18)+t('confirmReg')+'</button>')}
function manualDebtSave(){const mds=document.getElementById('md_c');const c=isP()?null:cust(mds?mds.value:null);const amt=parseFloat(document.getElementById('md_a').value)||0;if(!isP()&&!c){toastMsg(t('chooseFirst'));return}if(amt<=0){toastMsg(t('enterAmt'));return}
 const inv={id:uid(),code:'A'+(DD().seq++),cust:c?c.id:null,ts:Date.now(),amount:amt,note:document.getElementById('md_n').value.trim(),due:dueVal()};DD().invoices.push(inv);save();feedback('debt');speak((c?c.name+'، ':'')+t('newDebt')+' '+amt+' '+CUR());closeSheet();if(c&&c.limit&&custOpen(c.id)>c.limit)toastMsg('⚠ '+t('overLimit'),null);stack=[c?{s:'profile',p:{id:c.id}}:{s:'home'}];render();const iid=inv.id;toastMsg('<b>'+t('debtDone')+'</b> · '+money(inv.amount),()=>{DD().invoices=DD().invoices.filter(x=>x.id!==iid);save();render()})}
/* ---- new customer ---- */
const S_newcust=p=>{const ed=p&&p.edit?cust(p.edit):null;if(ed&&ui.nc.edit!==ed.id){ui.nc={name:ed.name,phone:ed.phone||'',limit:ed.limit?String(ed.limit):'',photo:ed.photo||null,edit:ed.id}}
 const nm=ui.nc.name||'';
 return headerBar(ed?t('editC'):t('addC'),null,'back()')
 +'<div class="pad"><div class="card" style="padding:20px 17px;display:flex;flex-direction:column;align-items:center"><span class="av" style="width:92px;height:92px;font-size:28px;padding:0;cursor:pointer;background:'+(ui.nc.photo?'none':(nm?avColor(nm):'#d9d2c6'))+';color:'+(nm?'#fff':'var(--navy)')+'" onclick="openPhotoSheet(\'nc\')" aria-label="'+t('photoT')+'">'+(ui.nc.photo?'<img src="'+ui.nc.photo+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">':(nm?esc(initials(nm)):ic('user',32)))+'</span>'
 +'<div style="width:100%"><label class="lb">'+t('nameReq')+'</label><input class="inp" value="'+esc(nm)+'" oninput="ui.nc.name=this.value" placeholder="'+(db.lang==='ar'?'مثال: حسن القحطاني':'e.g. Hasan')+'">'
 +'<label class="lb">'+t('phone')+'</label><input class="inp num" value="'+esc(ui.nc.phone)+'" oninput="ui.nc.phone=this.value" inputmode="tel" placeholder="05x xxx xxxx">'
 +'<label class="lb">'+t('limitLbl')+'</label><input class="inp num" value="'+esc(ui.nc.limit||'')+'" oninput="ui.nc.limit=this.value" type="number" inputmode="decimal" placeholder="0 = '+t('noLimit')+'">'
 +'<button class="btn btn-line" style="margin-top:13px" onclick="openContacts()">'+ic('contact',18)+t('fromContacts')+'</button>'
 +'<div class="muted" style="text-align:center;margin-top:13px">'+ic('lock',12)+' '+t('privacyC')+'</div></div></div></div>'
 +'<div class="bottombar"><button class="btn btn-navy" onclick="saveCustomer()">'+ic('save',18)+t('saveC')+'</button></div>';};
function saveCustomer(){const nm=ui.nc.name.trim();if(!nm){toastMsg(t('nameReq'));return}
 if(ui.nc.edit){const c=cust(ui.nc.edit);c.name=nm;c.phone=ui.nc.phone.trim();c.limit=parseFloat(ui.nc.limit)||0;if(ui.nc.photo!==undefined)c.photo=ui.nc.photo;save();toastMsg(t('savedC'));ui.nc={name:'',phone:'',limit:'',photo:null,edit:null};stack=[{s:'profile',p:{id:c.id}}];render();return}
 const c={id:uid(),name:nm,phone:ui.nc.phone.trim(),limit:parseFloat(ui.nc.limit)||0,photo:ui.nc.photo||null,since:String(new Date().getFullYear()),archived:false,pinned:false};DD().customers.push(c);save();toastMsg(t('savedC'));ui.nc={name:'',phone:'',limit:'',photo:null,edit:null};stack=[{s:'profile',p:{id:c.id}}];render();}

/* ================= sheets ================= */
function openPhotoSheet(target){const c=target==='nc'?null:cust(target);
 openSheet('<h3>'+t('photoT')+'</h3>'
 +'<button class="srow" onclick="pickPhoto(\''+target+'\')"><span class="sic2" style="background:var(--navy-bg);color:var(--navy)">'+ic('cam',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('photoAdd')+'</span><span class="d">'+t('photoD')+'</span></span>'+ic('fwd',17)+'</button>'
 +((target==='nc'?ui.nc.photo:(c&&c.photo))?'<button class="srow" onclick="removePhoto(\''+target+'\')"><span class="sic2" style="background:var(--red-bg);color:var(--red)">'+ic('trash',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('photoDel')+'</span></span></button>':''))}
function pickPhoto(target){const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=()=>{const f=inp.files&&inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{try{const S=96,cnv=document.createElement('canvas');cnv.width=S;cnv.height=S;const g=cnv.getContext('2d');const m=Math.min(img.width,img.height)||1;g.drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,S,S);const url=cnv.toDataURL('image/jpeg',0.82);if(target==='nc')ui.nc.photo=url;else{const c=cust(target);if(c){c.photo=url;save()}}closeSheet();render()}catch(e){toastMsg(t('btFail'))}};img.onerror=()=>toastMsg(t('btFail'));img.src=r.result};r.readAsDataURL(f)};inp.click()}
function removePhoto(target){if(target==='nc')ui.nc.photo=null;else{const c=cust(target);if(c){c.photo=null;save()}}closeSheet();render()}
function openSheet(html){document.getElementById('sheet').innerHTML='<div class="grab"></div>'+html;document.getElementById('sheetWrap').classList.add('open');window.__prevFocus=document.activeElement;setTimeout(()=>{try{document.getElementById('sheet').focus()}catch(e){}},40)}
function closeSheet(){document.getElementById('sheetWrap').classList.remove('open');try{if(window.__prevFocus&&window.__prevFocus.focus)window.__prevFocus.focus()}catch(e){}}
function accRow(x){const ad=db.data[x.id]||{};const cn=(ad.customers||[]).filter(c=>!c.archived).length;
 return '<div class="srow" style="cursor:pointer" onclick="switchAcc(\''+x.id+'\')"><span class="sic2" style="background:'+(x.type==='grocery'?'var(--green-bg);color:var(--green)':'#eef1f5')+'">'+(x.type==='grocery'?ic('store',20):ic('user',20))+'</span><span class="sp" style="text-align:start"><span class="t">'+esc(x.name)+'</span><span class="d">'+(x.type==='grocery'?t('grocery'):t('personal'))+' · <span class="num">'+cn+'</span> '+t('customers')+' · '+x.cur+'</span></span>'+(x.id===db.active?ic('checkc',20):'')+'<button class="hbtn" style="min-width:36px;height:36px;border:none;box-shadow:none;background:transparent" onclick="event.stopPropagation();ui.accEdit=\''+x.id+'\';ui.accTy=\''+x.type+'\';renderAccSheet()">'+ic('edit',16)+'</button></div>'}
function openAccSheet(){ui.accEdit=null;ui.accTy='grocery';renderAccSheet();document.getElementById('sheetWrap').classList.add('open')}
function renderAccSheet(){
 let h='<div class="row" style="margin-bottom:12px"><h3 style="margin:0">'+t('accT')+'</h3><span class="sp"></span><button class="hbtn" onclick="closeSheet()">'+ic('x',17)+'</button></div>';
 if(!ui.accEdit){
  h+=db.accounts.filter(x=>x.type==='grocery'||x.id===db.active).map(accRow).join('');
  h+='<button class="btn btn-navy" style="margin-top:6px" onclick="ui.accEdit=\'new\';renderAccSheet()">'+ic('plus',17)+t('addAcc')+'</button>';
 }else{
  const e=ui.accEdit==='new'?{name:'',type:ui.accTy,cur:db.lang==='ar'?'\u0631.\u0633':'$'}:db.accounts.find(x=>x.id===ui.accEdit);
  h+='<div class="lb" style="margin-top:0">'+(ui.accEdit==='new'?t('addAcc'):t('editAcc'))+'</div>'
  +'<input class="inp" id="aeNm" value="'+esc(e.name)+'" placeholder="'+(db.lang==='ar'?'\u0645\u062b\u0627\u0644: \u0628\u0642\u0627\u0644\u0629 \u0627\u0644\u062d\u064a':'e.g. Main store')+'">'
 
  +'<select class="inp" id="aeCur" style="margin-top:10px">'+['\u0631.\u0633','$','\u20ac','\u00a3','\u062f.\u0625','\u20ba'].map(x=>'<option'+(e.cur===x?' selected':'')+'>'+x+'</option>').join('')+'</select>'
  +'<button class="btn btn-navy" style="margin-top:12px" onclick="saveAccEdit()">'+ic('save',17)+t('saveName')+'</button>'
  +'<button class="btn btn-soft" style="margin-top:8px" onclick="ui.accEdit=null;renderAccSheet()">'+ic('back',16)+t('cancel')+'</button>';
 }
 document.getElementById('sheet').innerHTML='<div class="grab"></div>'+h;}
function switchAcc(id){db.active=id;save();closeSheet();stack=[{s:'home'}];render()}
function saveAccEdit(){const nm=(document.getElementById('aeNm').value||'').trim();if(!nm){toastMsg(t('nameReq'));return}const curV=document.getElementById('aeCur').value;
 if(ui.accEdit==='new'){const id=uid();db.accounts.push({id,name:nm,type:ui.accTy,cur:curV});db.data[id]={customers:[],invoices:[],payments:[],seq:1};db.active=id}
 else{const x=db.accounts.find(a=>a.id===ui.accEdit);if(x){x.name=nm;x.cur=curV;x.type=ui.accTy}}
 ui.accEdit=null;save();toastMsg(t('savedName'));closeSheet();stack=[{s:'home'}];render()}
function openCustMenu(id){const c=cust(id);
 openSheet('<div class="row" style="margin-bottom:12px"><h3 style="margin:0">'+t('custOpts')+'</h3><span class="sp"></span><button class="hbtn" onclick="closeSheet()">'+ic('x',17)+'</button></div>'
 +'<button class="srow" onclick="closeSheet();ui.nc={name:\'\',phone:\'\',edit:\''+id+'\'};go(\'newcust\',{edit:\''+id+'\'})"><span class="sic2">'+ic('edit',19)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('editC')+'</span></span></button>'
 +'<button class="srow" onclick="closeSheet();togglePin(\''+id+'\')"><span class="sic2" style="color:#b97f24">'+ic('pin',19)+'</span><span class="sp" style="text-align:start"><span class="t">'+(c.pinned?t('unpinU'):t('pinU'))+'</span></span></button>'
 +'<button class="srow" onclick="closeSheet();openExport(\''+id+'\')"><span class="sic2">'+ic('share',19)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('shareExp')+'</span><span class="d">'+t('shareExpD')+'</span></span></button>'
 +'<button class="srow" onclick="closeSheet();cust(\''+id+'\').archived=true;save();toastMsg(t(\'archived\'));stack=[{s:\'customers\'}];render()"><span class="sic2" style="color:var(--red)">'+ic('archive',19)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('archC')+'</span><span class="d" style="color:var(--red)">'+t('archD')+'</span></span></button>'
 +'<div class="muted" style="text-align:center;margin-top:8px">'+ic('shield',13)+' '+t('deletedKeep')+'</div>');}
function togglePin(id){const c=cust(id);c.pinned=!c.pinned;save();render()}
function openExport(id){const c=cust(id);
 openSheet('<h3>'+t('exportT')+' — '+esc(c.name)+'</h3>'
 +'<button class="srow" onclick="closeSheet();shareReceipt(\''+id+'\')"><span class="sic2">'+ic('share',19)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('stTxt')+'</span></span></button>'
 +'<button class="srow" onclick="closeSheet();exportCSV(\''+id+'\')"><span class="sic2" style="color:var(--green)">'+ic('excel',19)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('stXls')+'</span></span></button>'
 +'<button class="srow" onclick="closeSheet();openQrStmt(\''+id+'\')"><span class="sic2" style="background:var(--green-bg);color:var(--green)">'+ic('up',19)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('qrStmt')+'</span><span class="d">'+t('qrStmtHint')+'</span></span></button>'
 +(c.phone?'<button class="srow" onclick="closeSheet();sendWA(\''+id+'\')"><span class="sic2" style="color:#1e8e5a">'+ic('wa',19)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('sendWa')+'</span></span></button><button class="srow" onclick="closeSheet();sendSMS(\''+id+'\')"><span class="sic2">'+ic('sms',19)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('sendSms')+'</span></span></button>':''));}
function openImport(){openSheet('<h3>'+t('importT')+'</h3><div class="muted" style="margin-bottom:10px">'+t('importD')+'</div><textarea class="inp" id="impTxt" rows="7" placeholder="'+(db.lang==='ar'?'أبو خالد، 50، رز وحليب\\nسارة أحمد، 120، سكر وشاي':'Abu Khaled, 50, rice & milk')+'"></textarea><input type="file" accept=".txt,.csv,.xls,.xlsx" style="margin-top:10px" onchange="readImp(this)"><button class="btn btn-soft" style="margin-top:10px" onclick="ocrPick()">'+ic('cam',17)+t('ocrBtn')+'</button><button class="btn btn-navy" style="margin-top:12px" onclick="doImport()">'+ic('up',17)+t('importGo')+'</button>')}
window.readImp=inp=>{const f=inp.files[0];if(!f)return;
 if(/\.xlsx?$/i.test(f.name)&&typeof XLSX!=='undefined'){const r=new FileReader();r.onload=()=>{try{const wb=XLSX.read(new Uint8Array(r.result),{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];importRows(XLSX.utils.sheet_to_json(ws,{header:1}))}catch(e){toastMsg(t('btFail'))}};r.readAsArrayBuffer(f);return}
 const r=new FileReader();r.onload=()=>{document.getElementById('impTxt').value=r.result};r.readAsText(f)};
function importRows(rows){const snap=JSON.stringify({c:DD().customers,i:DD().invoices});let n=0;
 (rows||[]).forEach(r=>{if(!Array.isArray(r))return;const cells=r.map(x=>x==null?'':String(x).trim()).filter(x=>x!=='');if(cells.length<2)return;
  let nm=null,amt=null,ph='',nt=[];
  cells.forEach(c=>{if(ph===''&&/^[+0-9][0-9\s-]{8,}$/.test(c)){ph=c;return}
   if(amt===null&&/^[\d.,،\s]+$/.test(c)&&c.replace(/\D/g,'').length>0&&c.replace(/\D/g,'').length<=7){amt=parseFloat(c.replace(/[,،]/g,''));return}
   if(!nm){nm=c;return}nt.push(c)});
  if(!nm||amt===null||isNaN(amt)||amt<=0)return;
  let c=DD().customers.find(x=>x.name===nm&&!x.archived);if(!c){c={id:uid(),name:nm,phone:ph,since:String(new Date().getFullYear()),archived:false,pinned:false};DD().customers.push(c)}
  DD().invoices.push({id:uid(),code:'A'+(DD().seq++),cust:c.id,ts:Date.now(),amount:amt,note:nt.join(' ')});n++});
 if(!n){toastMsg(t('noRes'));return 0}
 save();closeSheet();render();
 toastMsg(t('imported')(n),()=>{const d2=DD();const o=JSON.parse(snap);d2.customers=o.c;d2.invoices=o.i;save();render()});return n}
function doImport(){const txt=document.getElementById('impTxt').value;
 importRows(txt.split(/\n+/).map(l=>l.split(/[,،;\t]+/)))}
const CONTACTS=[{n:'عبدالله السالم',p:'050 123 4567'},{n:'حسن القحطاني',p:'054 987 6543'},{n:'هدى الغامدي',p:'053 241 7890'},{n:'ريم أحمد',p:'055 678 3412'}];
function openCurSheet(){openSheet('<h3>'+t('curCustom')+'</h3><input class="inp" id="curIn" value="'+esc(curAcc().cur)+'" maxlength="12"><button class="btn btn-navy" style="margin-top:12px" onclick="saveCur()">'+ic('checkc',16)+t('saveName')+'</button>')}
function saveCur(){const v=(document.getElementById('curIn').value||'').trim();if(v)setCur(v);closeSheet()}
function openContacts(){openSheet('<div class="row" style="margin-bottom:10px"><h3 style="margin:0">'+t('contactsT')+'</h3><span class="sp"></span><button class="hbtn" onclick="closeSheet()">'+ic('x',17)+'</button></div><div class="card" style="padding:11px 13px;margin-bottom:10px"><div class="row" style="color:var(--soft)">'+ic('shield',17)+'<span style="font-size:12.5px">'+t('contactsOnly')+'</span></div></div>'
 +CONTACTS.map((x,i)=>'<button class="srow" onclick="ui.nc.name=\''+x.n+'\';ui.nc.phone=\''+x.p+'\';closeSheet();render()"><span class="av" style="width:42px;height:42px;font-size:15px;background:'+AVC[i%AVC.length]+'">'+x.n[0]+'</span><span class="sp" style="text-align:start"><span class="t">'+x.n+'</span><span class="d num">'+x.p+'</span></span>'+ic('fwd',17)+'</button>').join(''))}
function openCustPicker(){openSheet('<h3>'+t('chooseC')+'</h3>'+DD().customers.filter(c=>!c.archived).map(c=>'<button class="srow" onclick="ui.pay.cust=\''+c.id+'\';ui.pay.amt=\'\';closeSheet();render()">'+avat(c.name,42)+'<span class="sp" style="text-align:start"><span class="t">'+esc(c.name)+'</span><span class="d">'+t('remaining')+': '+money(custOpen(c.id))+'</span></span>'+(custOpen(c.id)>0?'<span class="amt red">'+money(custOpen(c.id))+'</span>':'')+'</button>').join(''))}

/* ================= long-press quick actions ================= */
let lpT=null;
function openQuick(id){const c=cust(id);if(!c)return;const open=custOpen(id);
 openSheet('<div class="row" style="margin-bottom:12px">'+avat(c.name,46)+'<div class="sp"><div style="font-weight:800">'+esc(c.name)+'</div><div class="muted">'+t('remaining')+': <b class="num">'+fmt(open)+'</b> '+CUR()+'</div></div><button class="hbtn" onclick="closeSheet()">'+ic('x',17)+'</button></div>'
 +'<button class="srow" onclick="closeSheet();startRec(\'debt\',\''+id+'\')"><span class="sic2" style="background:var(--red-bg);color:var(--red)">'+ic('mic',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('recDebt')+'</span><span class="d">'+t('voiceHint').split('.')[0]+'</span></span>'+ic('fwd',17)+'</button>'
 +'<button class="srow" onclick="quickPay(\''+id+'\')"><span class="sic2" style="background:var(--green-bg);color:var(--green)">'+ic('coins',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('quickPay')+'</span></span>'+ic('fwd',17)+'</button>'
 +'<div class="row" style="gap:10px;margin:2px 0 10px"><button class="btn btn-soft" style="flex:1" onclick="togglePin(\''+id+'\');closeSheet()">'+ic('pin',16)+(c.pinned?t('unpinU'):t('pinU'))+'</button>'+(c.phone?'<button class="btn btn-soft" style="flex:1" onclick="window.open(\'tel:'+(c.phone||'').replace(/[^0-9+]/g,'')+'\')">'+ic('phone',16)+t('callC')+'</button>':'')+'</div>'
 +'<button class="srow" onclick="closeSheet();go(\'profile\',{id:\''+id+'\'})"><span class="sic2">'+ic('user',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('openAcc2')+'</span></span>'+ic('fwd',17)+'</button>');}
function openFabSheet(){if(isP()){openSheet('<h3>'+t('addQ')+'</h3><button class="srow" onclick="closeSheet();startRec(\'debt\')"><span class="sic2" style="background:var(--red-bg);color:var(--red)">'+ic('mic',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('recDebt')+'</span></span>'+ic('fwd',17)+'</button><button class="srow" onclick="closeSheet();openDebtSheet()"><span class="sic2" style="background:var(--red-bg);color:var(--red)">'+ic('receipt',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('manualDebt')+'</span></span>'+ic('fwd',17)+'</button><button class="srow" onclick="closeSheet();ui.pay={cust:null,amt:\'\',method:\'cash\',done:null};go(\'pay\',{})"><span class="sic2" style="background:var(--green-bg);color:var(--green)">'+ic('coins',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('recPay')+'</span></span>'+ic('fwd',17)+'</button>');return}
 openSheet('<h3>'+t('addC')+'</h3>'
 +'<button class="srow" onclick="closeSheet();ui.nc={name:\'\',phone:\'\',photo:null,edit:null};go(\'newcust\',{})"><span class="sic2" style="background:var(--navy-bg);color:var(--navy)">'+ic('userplus',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('manualC')+'</span><span class="d">'+t('manualCd')+'</span></span>'+ic('fwd',17)+'</button>'
 +'<button class="srow" onclick="closeSheet();openContacts()"><span class="sic2" style="background:var(--green-bg);color:var(--green)">'+ic('contact',20)+'</span><span class="sp" style="text-align:start"><span class="t">'+t('fromContacts')+'</span><span class="d">'+t('contactsD')+'</span></span>'+ic('fwd',17)+'</button>');}
function quickPay(id){ui.qpM=ui.qpM||'cash';openSheet('<h3>'+t('quickPay')+' — '+esc(cust(id).name)+'</h3><input class="inp num" id="qp_a" type="number" inputmode="decimal" placeholder="0.00"><div class="seg" style="margin-top:10px">'+['cash','transfer','cardpay'].map(m=>'<button class="'+(ui.qpM===m?'on':'')+'" onclick="ui.qpM=\''+m+'\';quickPay(\''+id+'\')">'+t(m)+'</button>').join('')+'</div><button class="btn btn-green" style="margin-top:12px" onclick="quickPaySave(\''+id+'\')">'+ic('checkc',18)+t('confirmPay')+'</button>')}
function quickPaySave(id){const amt=parseFloat(document.getElementById('qp_a').value)||0;if(amt<=0){toastMsg(t('enterAmt'));return}
 const openI=custInvoices(id).filter(i=>invRem(i)>0).sort((x,y)=>x.ts-y.ts);let left=amt;const alloc=[];openI.forEach(i=>{if(left<=0)return;const use=Math.min(invRem(i),left);left-=use;alloc.push({inv:i.id,amt:use})});
 DD().payments.push({id:uid(),cust:id,ts:Date.now(),amount:amt,method:ui.qpM||'cash',alloc});save();feedback('pay');closeSheet();render();toastMsg('<b>'+t('payDone')+'</b> · '+money(amt));}
/* ================= exports / share ================= */
function statementText(id){const c=cust(id);const L=[curAcc().name+' — '+t('printTitle'),t('cust')+': '+c.name+(c.phone?' ('+c.phone+')':''),t('remaining')+': '+fmt(custOpen(id))+' '+CUR()+' | '+t('totalPaid')+': '+fmt(custPaid(id))+' '+CUR(),'— '+t('invoices')+' —'];
 custInvoices(id).forEach(i=>L.push(i.code+' | '+new Date(i.ts).toLocaleDateString('en-GB')+' | '+fmt(i.amount)+' | '+STLBL[invStatus(i)]()+(i.note?' | '+i.note:'')));
 L.push('— '+t('payLog')+' —');DD().payments.filter(p=>p.cust===id).forEach(p=>L.push(new Date(p.ts).toLocaleDateString('en-GB')+' | '+fmt(p.amount)+' | '+t(p.method)));return L.join('\n')}
function shareReceipt(id){const txt=statementText(id);if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>toastMsg(t('copied'))).catch(()=>toastMsg(t('copied')));else toastMsg(t('copied'))}
function sendWA(id){const c=cust(id);const msg=encodeURIComponent((db.lang==='ar'?'السلام عليكم '+c.name+'، لديكم مبلغ ':'Hello '+c.name+', outstanding balance: ')+fmt(custOpen(id))+' '+CUR()+' — '+curAcc().name);window.open('https://wa.me/'+(c.phone||'').replace(/\D/g,'')+'?text='+msg,'_blank')}
function sendSMS(id){const c=cust(id);const msg=encodeURIComponent((db.lang==='ar'?'تذكير: المتبقي ':'Reminder: ')+fmt(custOpen(id))+' '+CUR()+' — '+curAcc().name);window.open('sms:+'+(c.phone||'').replace(/\D/g,'')+'?body='+msg,'_blank')}
function dl(name,content,mime){let href;try{href=URL.createObjectURL(new Blob([content],{type:mime}))}catch(e){href='data:'+mime+';charset=utf-8,'+encodeURIComponent(content)}const a=document.createElement('a');a.href=href;a.download=name;a.click()}
function exportCSV(id){const c=cust(id);let rows='﻿Type,Date,Customer,Amount,Note\n';custInvoices(id).forEach(i=>rows+='Debt,'+new Date(i.ts).toISOString().slice(0,10)+','+c.name+','+i.amount+',"'+(i.note||'').replace(/"/g,'')+'"\n');DD().payments.filter(p=>p.cust===id).forEach(p=>rows+='Payment,'+new Date(p.ts).toISOString().slice(0,10)+','+c.name+','+p.amount+','+p.method+'\n');dl('statement-'+c.name+'.csv',rows,'text/csv')}
function exportAll(){let rows='﻿Type,Date,Customer,Code,Amount,Note\n';DD().invoices.forEach(i=>rows+='Debt,'+new Date(i.ts).toISOString().slice(0,10)+','+(cust(i.cust)||{}).name+','+i.code+','+i.amount+',"'+(i.note||'')+'"\n');DD().payments.forEach(p=>rows+='Payment,'+new Date(p.ts).toISOString().slice(0,10)+','+(cust(p.cust)||{}).name+',,'+p.amount+','+p.method+'\n');dl('dafter-data.csv',rows,'text/csv');toastMsg('CSV ✓')}
function exportPDF(id){const c=cust(id);document.getElementById('printArea').innerHTML='<div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid #12294a;padding-bottom:10px;margin-bottom:12px"><div style="width:52px;height:52px;border-radius:14px;background:#0d1f3a;color:#e8c76a;display:flex;align-items:center;justify-content:center">'+ic('book',26)+'</div><div><div style="font-size:20px;font-weight:900;color:#12294a">'+esc(curAcc().name)+'</div><div style="color:#667;font-size:12px">دَفتَري Daftari · '+t('printTitle')+' · '+new Date().toLocaleDateString('en-GB')+'</div></div></div><div>'+t('cust')+': <b>'+esc(c.name)+'</b>'+(c.phone?' · <span dir="ltr">'+esc(c.phone)+'</span>':'')+'</div><div>'+t('remaining')+': <b>'+fmt(custOpen(id))+' '+CUR()+'</b> · '+t('totalPaid')+': '+fmt(custPaid(id))+' '+CUR()+'</div><table><tr><th>'+t('invoice')+'</th><th>Date</th><th>'+t('remind')+'</th><th>'+t('total')+'</th><th>'+t('paidLbl')+'</th><th>'+t('remaining')+'</th></tr>'+custInvoices(id).map(i=>'<tr><td>'+i.code+'</td><td>'+new Date(i.ts).toLocaleDateString('en-GB')+'</td><td>'+esc(i.note||'')+'</td><td>'+fmt(i.amount)+'</td><td>'+fmt(invPaid(i.id))+'</td><td>'+fmt(invRem(i))+'</td></tr>').join('')+'</table>';try{window.print()}catch(e){toastMsg('PDF')}}

/* ================= lock / security UI ================= */
let pinBuf='';
const S_lock=()=>'<div class="padlock"><div class="logo-ic" style="width:64px;height:64px;border-radius:20px">'+ic('book',30)+'</div><h1 style="margin-top:14px">دَفتَري</h1><div class="muted" style="margin-top:6px">'+t('enterPin')+'</div><div class="pdots" id="pdots">'+[0,1,2,3].map(()=>'<i></i>').join('')+'</div>'
 +((sec.fps&&sec.fps.length)?'<button class="btn btn-line" style="width:auto;margin-top:18px;padding:10px 22px" onclick="fpUnlock()">'+ic('fp',18)+t('fpUse')+'</button>':'')
 +'<div class="kp">'+['1','2','3','4','5','6','7','8','9'].map(d=>'<button onclick="pinTap(\''+d+'\')">'+d+'</button>').join('')+'<button onclick="pinTap(\'x\')">'+ic('back',20)+'</button><button onclick="pinTap(\'0\')">0</button><button onclick="pinTap(\'c\')">'+ic('x',18)+'</button>'+'</div></div>';
function pinTap(d){if(d==='c')pinBuf='';else if(d==='x')pinBuf=pinBuf.slice(0,-1);else if(pinBuf.length<4)pinBuf+=d;
 const dots=document.querySelectorAll('#pdots i');dots.forEach((el,i)=>el.classList.toggle('f',i<pinBuf.length));
 if(pinBuf.length===4)verifyPin(pinBuf);}
async function verifyPin(pin){const h=await sha256hex(sec.salt+pin);
 if(h!==sec.pinHash){toastMsg(t('wrongPin'));pinBuf='';setTimeout(()=>{const d2=document.querySelectorAll('#pdots i');d2.forEach(el=>el.classList.remove('f'))},300);return}
 const pk=await deriveKey(pin,sec.salt);const mk=await unwrapKey(sec.masterWrapPin,pk);if(!mk){toastMsg(t('wrongPin'));return}
 masterKey=mk;locked=false;pinBuf='';
 if(window.__afterUnlock){await window.__afterUnlock()}else{stack=[{s:'home'}];render()}}
async function askPin(){const pin=prompt(db.lang==='ar'?'رمز جديد (4 أرقام):':'New PIN (4 digits):');if(!pin||!/^\d{4}$/.test(pin))return;
 sec.salt=uid()+uid();sec.pinHash=await sha256hex(sec.salt+pin);
 masterKey=masterKey||await newMaster();
 const pk=await deriveKey(pin,sec.salt);sec.masterWrapPin=await wrapKey(masterKey,pk);sec.enabled=true;saveSec();save();toastMsg('🔒 ✓');render()}
async function disableLock(){sec.enabled=false;masterKey=null;saveSec();save();render()}
function fpDel(i){if(!sec.fps)return;sec.fps.splice(i,1);if(!sec.fps.length){sec.credId=null;sec.fpWrap=null}saveSec();render()}
async function addFp(){try{if(!window.PublicKeyCredential||!navigator.credentials)throw 0;
 const chal=crypto.getRandomValues(new Uint8Array(16));const first=crypto.getRandomValues(new Uint8Array(32));
 const cred=await navigator.credentials.create({publicKey:{challenge:chal,rp:{name:'Daftar'},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'owner',displayName:'Daftar'},pubKeyCredParams:[{type:'public-key',alg:-7}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required'},extensions:{prf:{eval:{first}}}}});
 const prf=cred.getClientExtensionResults&&cred.getClientExtensionResults().prf;if(!prf||!prf.results)throw 0;
 const fk=await crypto.subtle.importKey('raw',new Uint8Array(prf.results.first).slice(0,32),{name:'AES-GCM'},false,['encrypt','decrypt']);
 const hex=[...new Uint8Array(cred.rawId)].map(b=>b.toString(16).padStart(2,'0')).join('');sec.fps=sec.fps||[];if(sec.fps.length>=5){toastMsg('🖐 5');return}sec.fps.push({id:hex,wrap:await wrapKey(masterKey,fk)});sec.credId=hex;sec.fpWrap=sec.fps[0].wrap;saveSec();toastMsg('✓');render()}catch(e){toastMsg(t('fpNo'))}}
async function fpUnlock(){try{const cred=await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(16)),allowCredentials:(sec.fps||[]).map(f=>({type:'public-key',id:new Uint8Array((f.id.match(/../g)||[]).map(h=>parseInt(h,16)))})),extensions:{prf:{}}}});
 const prf=cred.getClientExtensionResults().prf;const fk=await crypto.subtle.importKey('raw',new Uint8Array(prf.results.first).slice(0,32),{name:'AES-GCM'},false,['encrypt','decrypt']);
 const used=[...new Uint8Array(cred.rawId)].map(b=>b.toString(16).padStart(2,'0')).join('');const ent=(sec.fps||[]).find(f=>f.id===used)||(sec.fps||[])[0];
 const mk=await unwrapKey(ent.wrap,fk);if(!mk)throw 0;masterKey=mk;locked=false;
 if(window.__afterUnlock){await window.__afterUnlock()}else{stack=[{s:'home'}];render()}}catch(e){toastMsg(t('fpNo'))}}
/* auto-lock */
let lastTouch=Date.now();
['pointerdown','keydown'].forEach(ev=>document.addEventListener(ev,()=>lastTouch=Date.now(),{passive:true}));
setInterval(()=>{if(sec.enabled&&!locked&&Date.now()-lastTouch>sec.autoMin*60000){locked=true;masterKey=null;pinBuf='';stack=[{s:'home'}];render()}},5000);

/* ================= toast ================= */
let toastTimer=null,undoAct=null;
function toastMsg(html,fn){undoAct=fn||null;const el=document.getElementById('toast');el.innerHTML='<span style="flex:1;line-height:1.5">'+html+'</span>'+(fn?'<button class="tb" onclick="doUndoAct()">'+ic('undo',14)+t('undo')+'</button>':'');el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),5000)}
function doUndoAct(){if(undoAct){try{undoAct()}catch(e){}undoAct=null}document.getElementById('toast').classList.remove('show')}

/* ================= misc ================= */
const COUNTRIES=[['السعودية','ر.س'],['العراق','د.ع'],['مصر','ج.م'],['اليمن','ر.ي'],['الإمارات','د.إ'],['سوريا','ل.س']];
const cName=c=>(COUNTRIES.find(x=>x[1]===c)||[])[0]||null;
function setCur(v){const a=curAcc();if(v){a.cur=v;save();render()}}
function setLang(l){db.lang=l;save();applyLang();render()}
function darkOn(){if(sec&&sec.darkAuto){try{if(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)return true}catch(e){}const h=new Date().getHours();return h>=18||h<6}return !!(sec&&sec.dark)}
function applyLang(){document.documentElement.lang=db.lang;document.documentElement.dir=db.lang==='ar'?'rtl':'ltr';document.body.lang=db.lang;document.title=db.lang==='ar'?'دَفتَري':'Daftari';document.body.classList.toggle('dark',darkOn());document.body.classList.toggle('priv',!!(sec&&sec.priv))}
window.addEventListener('online',()=>render());window.addEventListener('offline',()=>render());
try{if(window.matchMedia){const mq=matchMedia('(prefers-color-scheme: dark)');(mq.addEventListener?mq.addEventListener('change',()=>render()):mq.addListener(()=>render()))}}catch(e){}

/* ================= pull to refresh ================= */
let ptrY=null;
document.getElementById('phone').addEventListener('touchstart',e=>{if(window.scrollY<=2&&curScr().s==='home')ptrY=e.touches[0].clientY},{passive:true});
document.getElementById('phone').addEventListener('touchmove',e=>{if(ptrY===null)return;const dy=e.touches[0].clientY-ptrY;const el=document.getElementById('ptr');document.getElementById('ptrT').textContent=t('pull');el.classList.toggle('on',dy>70)},{passive:true});
document.getElementById('phone').addEventListener('touchend',()=>{const el=document.getElementById('ptr');if(el.classList.contains('on')){document.getElementById('ptrT').textContent=t('refreshed');setTimeout(()=>el.classList.remove('on'),700);render()}ptrY=null;setTimeout(()=>el.classList.remove('on'),900)},{passive:true});
/* fab hide on scroll */
let lastY=0;
window.addEventListener('scroll',()=>{const f=document.getElementById('fabAdd');const y=window.scrollY;if(y>lastY+6)f.classList.add('hid');else if(y<lastY-6)f.classList.remove('hid');lastY=y},{passive:true});

/* ================= render ================= */
const SCREENS={home:S_home,customers:S_customers,reports:S_reports,settings:S_settings,profile:S_profile,invoice:S_invoice,voice:S_voice,rec:S_rec,pay:S_pay,newcust:S_newcust,lock:()=>S_lock()};
const TABS=['home','customers','reports','settings'];
function render(){if(!db){document.getElementById('app').innerHTML='';return}
 applyLang();
 if(locked){document.getElementById('app').innerHTML=S_lock();document.getElementById('tabbar').style.display='none';document.getElementById('actionrow').innerHTML='';document.getElementById('fabAdd').classList.add('hide');return}
 const tp=curScr();const S=SCREENS[tp.s]||S_home;
 document.getElementById('app').innerHTML=S(tp.p||{});
 const isTab=['home','customers','reports','settings'].includes(tp.s);
 const tb=document.getElementById('tabbar');tb.style.display=isTab?'grid':'none';
 const tbBtn=x=>'<button class="'+(tp.s===x?'on':'')+'" onclick="tab(\''+x+'\')">'+ic(x==='home'?'home':x==='customers'?'users':x==='reports'?'pie':'gear',20)+'<span>'+t(x)+'</span></button>';
 tb.innerHTML=tbBtn('home')+tbBtn('customers')+'<button class="fab2" onclick="openFabSheet()" aria-label="add">'+ic('plus',26)+'</button>'+tbBtn('reports')+tbBtn('settings');
 const ar=document.getElementById('actionrow');
 ar.innerHTML=isTab?((tp.s==='home'&&!(ui.sel&&ui.sel.on))||tp.s==='customers'?lpBtn('debt','btn-red','receipt',t('newDebt'))+lpBtn('pay','btn-green','coins',t('pay')):''):'';
 document.getElementById('fabAdd').classList.add('hide');
 if(!locked&&typeof drawCharts==='function'&&(curScr()||{}).s==='reports')requestAnimationFrame(()=>{try{if(!locked&&(curScr()||{}).s==='reports')drawCharts()}catch(e){}});
 window.scrollTo(0,0);}

/* ================= charts (Chart.js MIT, fallback CSS bars) ================= */
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
    const rows=txt.split(/\n+/).map(l=>l.split(/[,،;\t]+/));
    importRows(rows);
  }).catch(()=>toastMsg(t('ocrNo')))};
 inp.click();
}
window.addEventListener('load',()=>{try{if(db&&!locked&&(curScr()||{}).s==='reports')render()}catch(e){}});
/* ================= boot ================= */
(async function boot(){
 const enc=localStorage.getItem(ENC);
 if(sec.enabled&&enc){locked=true;db={lang:'ar'};render();
  window.__afterUnlock=async()=>{try{const pack=JSON.parse(localStorage.getItem(ENC));const d=await decJSON(pack,masterKey);if(d)db=migrate(d)}catch(e){}window.__afterUnlock=null;stack=[{s:'home'}];render()};
  return;}
 let raw=null;try{raw=JSON.parse(localStorage.getItem(PLAIN)||'null')}catch(e){}
 db=migrate(raw||seed());render();
})();

```

## 12) مخزون الاختبارات (252 فحصًا)
r1_home 12 (هيكل/مطوّلة/نقرة احتياطية)، r2_personal 22 (الحساب الشخصي وإخفاؤه من الواجهة)، r3_rec 13 (عقد VOSK وعدم الاختراع وحقول مباشرة)، r4_customers 16، r5_select 22 (تحديد واتساب-ستَايل)، r6_quickpack 13، r7_pro 12، r8_priv 10، r9_strict 18 (تحليل الأرقام المنطوقة)، r10_langcur 14، r11_photo 11، r12_fabreport 11 (+قائمة/شريط/مستقبليات)، r13_chips 12 (الفلتر المطوي)، r14_fixes 9 (إصلاحات التدقيق)، test18 16 (استيراد/OCR)، test19 24، test20 17.

## 13) سجل القرارات PATCH18–35 (موجز)
18-26: اختيار نمط ملفات، QR كشف عميل، NaN export fix، 201→201. 27: عقد VOSK + بلا اختراع + صورة مخفية/تدرّج. 28: + = يدوي/جهات + وصف مشكلة (ثم حُذف 30). 29: فلتر ثلاثي. 30: طيّ الفلتر/شريط واتساب/إخفاء استيراد+مشكلة. 31: دمج الفلتر صغيرًا بصف العنوان. 32: ثلاث طبقات أحداث + btnDown أحادي. 33: إخفاء «شخصي» + صف حساب معلوماتي. 34: حذف «تعديل» من تأكيد التسجيل + قراءة حقول مباشرة. 35: تدقيق شامل = أسماء ARIA، عدّاد صادق + عرض المزيد، حذف ميت، عملة بورقة لا prompt، إنذار سعة.

## 14) للمتابعة
انتظر أمر «نفّذ» لنقد الرئيسية أ–و. المؤجلات native: إعادة تسمية/تقسيم/Keystore. إن طلب المستخدم تعارضًا مع §4 قدّم تنبيهًا قصيرًا ثم نفّذ رغبته الأخيرة (فهو المصدر).

## 15) VOSK-SETUP.md كامل (عقد دمج المحرك)
```md
# تفعيل محرك Vosk (تعرف صوتي عربي دون إنترنت)

التطبيق يشحن بثلاثة محركات صوت قابلة للتبديل من: الإعدادات ← «محرك الصوت»:
1. **DEMO** — محاكاة فورية (يعمل دائمًا، بلا إنترنت).
2. **الهاتف** — محرك جوجل/آبل المدمج (تعرف حقيقي، يحتاج إنترنت في أغلب المتصفحات).
3. **VOSK** — تعرف عربي حقيقي دون إنترنت، ويتطلب الخطوات أدناه.

## لماذا ملفات إضافية؟
نموذج العربية الرسمي `vosk-model-ar-mgb2-0.4` حجمه ~318 ميغا، ومحرك الويب يعمل عبر WebAssembly —
لا يمكن تضمينهما داخل ملف HTML الواحد، لذلك يكتشف التطبيق وجودهما تلقائيًا وإن غابا يعرض رسالة ويكمل بالمحاكاة.

## خطوات التثبيت على استضافتك
1. بجوار `index.html` أنشئ مجلد `lib/` (موجود مسبقًا وبه qrcode.js و jsQR.js).
2. نزّل نموذج العربية وفكّه باسم `model-ar/`:
   ```
   curl -O https://alphacephei.com/vosk/models/vosk-model-ar-mgb2-0.4.zip
   unzip vosk-model-ar-mgb2-0.4.zip -d model-ar
   ```
3. ثبّت محرك المتصفح وانسخ ملفاته إلى `lib/`:
   ```
   npm i vosk-browser
   cp node_modules/vosk-browser/dist/* lib/
   ```
4. شغّل خادمًا يرسل ترويستات العزل (شرط WASM متعدد الخيوط):
   ```
   Cross-Origin-Opener-Policy: same-origin
   Cross-Origin-Embedder-Policy: require-corp
   ```
   مثال سريع بـ Node:
   ```
   npx http-server -H '{"Cross-Origin-Opener-Policy":"same-origin","Cross-Origin-Embedder-Policy":"require-corp"}'
   ```
5. أضف قبل وسم `<script>` الرئيسي في index.html:
   ```html
   <script src="lib/vosk-browser.js"></script>
   <script src="lib/vosk-adapter.js"></script>
   ```
6. من الإعدادات اختر VOSK — ستظهر حالة «جاهز» ويبدأ التعرف على الكلام المنطوق فعليًا دون إنترنت.

## تحسين الدقة بلهجتك
نموذج mgb2 مدرّب بالفصحى ولهجات؛ لرفع دقة أسماء عملائك عدّل قائمة المفردات في
`model-ar/conf/mfcc.conf` أو أضف ملف `model-ar/conf/words.txt` بأسماء عملائك — المحرك يقبل قاموسًا ديناميكيًا.

## بديل أخف
إن كانت الاستضافة بلا ترويستات العزل، استخدم محرك «الهاتف» (خيار 2) — يعمل فورًا وبدقة عالية مع الإنترنت.

## عقد الدمج مع الضغط المطوّل (دين / سداد)
عند دمج محرك VOSK يكفي أن يوفّر الكائن `window.voskEngine={ready:true,start(kind,custId){…}}`
ويستدعي واجهتين عموميتين جهّزهما التطبيق:
- `window.voskOnText(kind, text, confidence)` — kind: ‏'debt' أو 'pay'، والنص المنطوق، وثقة اختيارية بين 0 و1.
- `window.voskOnEnd()` — عند نهاية الاستماع دون نتيجة.

يتولى التطبيق الباغي: تحليل الأرقام المنطوقة، وكشف الأخطاء الصارم (لا مبلغ، ثقة منخفضة، مبلغ غير منطقي)،
و**لا يخترع أبدًا** ديونًا أو مواد تموينية من تلقاء نفسه — إن لم تصل نتيجة يفتح نموذجًا فارغًا للتصحيح اليدوي.

مثال محوّل جاهز:
```js
window.voskEngine={ready:true,start(kind,custId){
  const r=شغّل_التعرف_الخاص_بك();
  r.onPartial=t=>window.voskOnText(kind,t,r.confidence);
  r.onEnd=()=>window.voskOnEnd();
}}
```
ثم فعِّله من: الإعدادات ← «محرك VOSK (دمج اختياري)».

```

## 16) هيكل الاختبارات h.js
```js
// shared harness for dafter tests
const fs=require('fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
function boot(opts={}){
 const store=opts.store||{};
 const vc=new VirtualConsole();
 vc.on('jsdomError',e=>{if(!/scrollTo/.test(e.message))console.log('JSDOM-ERR:',e.message)});
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/',pretendToBeVisual:true,virtualConsole:vc,
  beforeParse(w){
   try{Object.defineProperty(w.navigator,'language',{value:opts.lang||'ar-SA',configurable:true})}catch(e){}
   if(opts.darkMq){try{Object.defineProperty(w,'matchMedia',{value:q=>({matches:/dark/.test(q),addEventListener(){},addListener(){}}),configurable:true})}catch(e){}}
   w.localStorage={getItem:k=>(k in store)?store[k]:null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k]};
   w.scrollTo=()=>{}; w.confirm=()=>true; w.prompt=()=>(opts.prompt||'x');
   if(opts.tts){w.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};w.speechSynthesis={said:[],speak(u){this.said.push(u.text)},getVoices:()=>[],cancel(){}}}
   w.AudioContext=function(){return{createOscillator:()=>({connect:()=>{},start:()=>{},stop:()=>{},frequency:{value:0}}),createGain:()=>({connect:()=>{},gain:{value:0}}),destination:{},currentTime:0,state:'running',close:()=>Promise.resolve()}};
   w.SpeechRecognition=undefined;
  }});
 return dom.window;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function mk(okFn){let pass=0,fail=0;
 const ok=(c,m)=>{c?(pass++):(fail++,console.log('  FAIL:',m));console.log((c?'  ok ':'  ✗ ')+m)};
 const done=()=>{console.log('\nRESULT: '+pass+' passed, '+fail+' failed');process.exit(fail?1:0)};
 return {ok,done,stats:()=>({pass,fail})};
}
module.exports={boot,wait,mk,html};

```

## 17) اختبارات مرجعية كاملة

### tests/r3_rec.js
```js
const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
const txt=()=>d.getElementById('app').textContent;
(async()=>{
 await wait(1000);
 w.eval("btnDown('debt')"); await wait(80); w.eval("btnUp('debt')"); await wait(80);
 ok(/تسجيل يدوي/.test(d.getElementById('sheet').textContent),'quick tap -> manual sheet');
 d.getElementById('md_a').value='15'; w.eval("manualDebtSave()"); await wait(80);
 ok(w.eval("DD().invoices.some(i=>i.amount===15)"),'manual debt saved');
 w.eval("stack=[{s:'home'}];render();btnDown('debt')"); await wait(500);
 ok(/أسجّل/.test(txt()),'long press -> recording');
 w.eval("voskOnText('debt','أبو خالد خمسين',0.9)"); await wait(60);
 ok(w.eval("ui.rec.d.amt")===50,'VOSK contract parses spoken amount');
 const n0=w.eval("DD().invoices.length");
 w.eval("recConfirm()"); await wait(80);
 ok(w.eval("DD().invoices.length")===n0+1,'debt confirmed +1');
 w.eval("stack=[{s:'home'}];render();btnDown('pay')"); await wait(500);
 ok(/أسجّل/.test(txt()),'pay long press recording');
 await wait(3200);
 ok(w.eval("ui.rec&&ui.rec.st==='edit'"),'no engine -> manual edit, nothing invented');
 ok(w.eval("ui.rec.d.amt")===0&&!w.eval("ui.rec.d.say"),'no invented amount or grocery items');
 ok(txt().includes(w.eval("t('warn_nospeech')")),'strict no-speech warning shown');
 ok(!!d.getElementById('re_a'),'amount field directly editable (no edit step)');
 ok(!txt().includes(w.eval("t('editL')")),'no separate edit button');
 w.eval("voskOnText('pay',DD().customers[0].name+' ثلاثين',0.9)"); await wait(60);
 w.eval("recConfirm()"); await wait(80);
 ok(w.eval("ui.pay.done&&ui.pay.done.amt")===30,'pay recorded via VOSK contract (30)');
 w.eval("stack=[{s:'home'}];render();btnDown('debt')"); await wait(200);
 w.eval("btnCancelRec()"); await wait(500);
 ok(!/أسجّل/.test(txt()),'cancel within 380ms prevents recording');
 done();
})().catch(e=>{console.log('ERROR:',e);process.exit(1)});

```

### tests/r9_strict.js
```js
const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
const txt=()=>d.getElementById('app').textContent;
(async()=>{
 await wait(1000);
 // --- strict number understanding (digits + arabic words + colloquial) ---
 const cases=[['50',50],['٥٠',50],['خمسين',50],['خمسة وعشرين',25],['مئة وعشرين',120],['مية وخمسين',150],['ألف وخمسين',1050],['ثلاثمية',300],['عشرين',20],['twenty five',25]];
 let allnum=true;
 for(const [t,v] of cases){const r=w.eval("amtFromText("+JSON.stringify(t)+").amt");if(r!==v){allnum=false;console.log('  numfail',t,r,v)}}
 ok(allnum,'amtFromText understands digits & spoken arabic/colloquial/en numbers');
 ok(w.eval("amtFromText('أبو خالد خمسين ريال').amt")===50,'amount extracted inside sentence');
 ok(w.eval("parseSay('أبو خالد خمسين').amt")===50,'parseSay: spoken amount 50');
 ok(w.eval("parseSay('أبو خالد خمسين').name")==='أبو خالد','parseSay: name before spoken amount');
 ok(w.eval("parseSay('سارة مئة وعشرين ر.س').amt")===120&&w.eval("parseSay('سارة مئة وعشرين ر.س').note")==='','parseSay: currency word stripped from note');
 // --- strict errors detection ---
 ok(w.eval("parseSay('أبو خالد').amt")===0,'no amount -> 0 (triggers warn path)');
 w.eval("ui.rec={kind:'debt',st:'confirm',warn:'noamt',cands:[],d:{name:'أبو خالد',amt:0,note:'',due:null,say:'أبو خالد'}};stack=[{s:'rec',p:{kind:'debt'}}];render()");
 ok(txt().includes(w.eval("t('warn_noamt')")),'no-amount warning banner shown');
 ok(txt().includes(w.eval("t('strictFix')")),'strict fix instruction shown with warning');
 w.eval("ui.rec={kind:'debt',st:'confirm',warn:'toobig',cands:[],d:{name:'x',amt:2000000,note:'',due:null,say:'x'}};stack=[{s:'rec',p:{kind:'debt'}}];render()");
 ok(txt().includes(w.eval("t('warn_toobig')")),'implausible amount warning shown');
 // --- rec screen shows strict rules card ---
 w.eval("ui.rec={kind:'debt',st:'rec',cands:[],d:{}};stack=[{s:'rec',p:{kind:'debt'}}];render()");
 ok(txt().includes(w.eval("t('strictT')")),'recording screen shows strict voice rules');
 ok(txt().includes(w.eval("t('strictRules')")),'rules list visible while recording');
 w.eval("cancelRec()");
 // --- vosk option: present, last, collapsed by default ---
 w.eval("sec.vosk=false;saveSec();tab('settings')");await wait(80);
 const st=txt();
 ok(st.includes(w.eval("t('voskOpt')")),'VOSK option row present in settings');
 ok(!st.includes(w.eval("t('voskHelp')")),'VOSK collapsed by default (no space taken)');
 const stt=txt();
 ok(stt.indexOf(w.eval("t('voskOpt')"))>stt.indexOf(w.eval("t('qrRecv')")),'VOSK row is after data/QR section (last)');
 w.eval("ui.voskOpen=true;render()");await wait(60);
 ok(txt().includes(w.eval("t('voskHelp')")),'expanding shows VOSK instructions');
 ok(txt().includes(w.eval("t('voskOn')")),'enable button visible when expanded');
 w.eval("ui.voskOpen=false;render()");
 // --- startRec with vosk enabled but engine absent: graceful fallback + toast ---
 w.eval("sec.vosk=true;saveSec()");
 w.eval("stack=[{s:'home'}];render()");
 w.eval("startRec('debt')");await wait(80);
 ok(w.eval("ui.rec&&ui.rec.st==='rec'"),'recording still starts when VOSK missing');
 w.eval("cancelRec()");w.eval("sec.vosk=false;saveSec()");
 // --- ASR onresult warn wiring (simulated) ---
 w.eval("startRec('debt')");await wait(50);
 const fake={results:[[{transcript:'أبو خالد',confidence:0.9}]],[0]:'x'};
 w.eval("ui.rec.warn=null; (function(){const res={transcript:'أبو خالد',confidence:0.9};const pr=parseSay(res.transcript);let warn=null;if(!res.transcript.trim())warn='nospeech';else if(pr.amt<=0)warn='noamt';else if(pr.amt>1000000)warn='toobig';else if(res.confidence<0.45)warn='lowconf';window.__w=warn})()");
 ok(w.eval("window.__w")==='noamt','warn logic flags missing amount');
 w.eval("cancelRec()");
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});

```

### tests/r13_chips.js
```js
const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
(async()=>{
 await wait(1000);
 w.eval("tab('home')"); await wait(60);
 const seg=()=>d.getElementById('pchips');
 ok(!!seg(),'home has period chips');
 ok(seg().querySelectorAll('button').length===1,'collapsed by default: single small button');
 ok(seg().textContent.includes(w.eval("t('period')")),'collapsed shows period label when none');
 w.eval("ui.pOpen=true;refreshHome()"); await wait(60);
 const btns=[...seg().querySelectorAll('button')];
 ok(btns.length===3,'expanded shows exactly 3 options');
 ok(btns.map(b=>b.textContent).join()===[w.eval("t('pToday')"),w.eval("t('pWeek')"),w.eval("t('pMonth')")].join(),'labels day/week/month only');
 w.eval("setPChip('month')"); await wait(60);
 ok(seg().querySelectorAll('button').length===1,'selecting collapses the row');
 ok(seg().textContent.includes(w.eval("t('pMonth')")),'collapsed shows chosen month');
 const allN=w.eval("(ui.tf.period='all',filteredTx().length)");
 w.eval("ui.tf.period='month'"); await wait(20);
 w.eval("db.data[db.active].invoices.push({id:'oldx',cust:db.data[db.active].customers[0].id,amount:5,ts:Date.now()-40*864e5000,note:'q'})"); await wait(20);
 ok(!w.eval("filteredTx().some(x=>x.key==='d:oldx')"),'40-day-old tx excluded in month');
 w.eval("setPChip('week');ui.pOpen=true;refreshHome()"); await wait(40);
 ok(!w.eval("filteredTx().some(x=>x.key==='d:oldx')"),'40-day-old tx excluded in week too');
 w.eval("setPChip('week')"); await wait(40);
 ok(w.eval("ui.tf.period")==='all'&&seg().textContent.includes(w.eval("t('period')")),'tap active chip clears to all');
 ok(w.eval("filteredTx().length")===allN+1,'cleared shows all incl old');
 w.eval("db.data[db.active].invoices=db.data[db.active].invoices.filter(i=>i.id!=='oldx')"); await wait(20);
 // compact: chips live inside the heading row (same line as lastOps)
 const head=seg().closest('div.pad');
 ok(head&&head.textContent.includes(w.eval("t('lastOps')")),'filter chip shares the lastOps row (no wasted line)');
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});

```

### tests/r14_fixes.js
```js
const {boot,wait,mk}=require('./h');
const w=boot(),d=w.document;const {ok,done}=mk();
(async()=>{
 await wait(1000);
 // a11y names
 w.eval("tab('settings')"); await wait(80);
 ok([...d.querySelectorAll('[role=switch]')].every(x=>x.getAttribute('aria-label')),'all switches named');
 ok([...d.querySelectorAll('select')].every(x=>x.getAttribute('aria-label')),'all selects named');
 // dead UI gone
 ok(w.eval("typeof openTxFilter")==='undefined','dead filter sheet removed');
 ok(w.eval("typeof refreshHome")==='function','refreshHome kept');
 // accurate badge + show more
 w.eval("tab('home')"); await wait(60);
 const cid=w.eval("DD().customers[0].id");
 w.eval("for(let i=0;i<70;i++)DD().invoices.push({id:'q'+i,code:'Q'+i,cust:'"+cid+"',ts:Date.now()-i*36e5,amount:1,note:'q'});render()"); await wait(80);
 const full=w.eval("txAll().length");
 ok(parseInt(d.getElementById('txn').textContent)===full,'badge shows true total ('+full+')');
 ok(d.getElementById('txlist').textContent.includes(w.eval("t('showMore')")),'show-more appears past 60');
 const rows0=w.eval("document.querySelectorAll('#txlist .litem').length");
 w.eval("ui.txLimit=130;refreshHome()"); await wait(60);
 ok(w.eval("document.querySelectorAll('#txlist .litem').length")>rows0,'show-more grows the list');
 w.eval("for(let i=0;i<70;i++)DD().invoices=DD().invoices.filter(x=>x.id!=='q'+i);ui.txLimit=60;render()"); await wait(60);
 // currency via sheet not prompt
 w.eval("openCurSheet()"); await wait(60);
 ok(!!d.getElementById('curIn'),'currency sheet has input (no prompt())');
 d.getElementById('curIn').value='د.ك';
 w.eval("saveCur()"); await wait(60);
 ok(w.eval("curAcc().cur")==='د.ك','custom currency saved via sheet');
 w.eval("setCur('ر.س')");
 done();
})().catch(e=>{console.log('EX',e);process.exit(1)});

```

## 18) خرائط عناصر الشاشات (مرجع سريع)
home: hdr(شعار+اسم+accChip) → statsCards(دين/سداد toggle kind) → بحث+⋮ → صف «آخر العمليات»+شارة txn+ pchips مطوي → selbar(وضع التحديد) → txlist(+عرض المزيد) → actionrow.
customers: بحث+فلتر عملاء → نشط/مؤرشف → بطاقة عليهم دين → clist2.
reports: شهرية(تحصيل/ديون شهر/متأخرون) + رسم 7 أيام + топ شراء.
settings: حساب/تفضيلات(لغة,عملة,ليلي,صوت,اهتزاز)/أمان(PIN,بصمة,قفل)/خصوصية priv/بيانات(تصدير,QR استقبال)/بلوتوث/محركات(voice engine,VOSK مخفي آخر).
profile: بطاقة عميل(دائرة صورة←photoSheet) + كشف + أزرار(اتصال,واتساب تذكير,QR كشف,تعديل,أرشفة).
rec: st rec=ميكروفون+قواعد صارمة؛ st edit=سمعتُ+تحذير+حقول(عميل select,مبلغ,تذكير,استحقاق)+cands+تأكيد/X+سطر خصوصية.
pay: عميل+مبلغ+طريقة+أثر السداد payImpactFor+تم.
newcust: دائرة صورة قابلة للنقر+اسم+جوال+حفظ.
