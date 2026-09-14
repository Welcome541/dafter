# PHASE 0 — تدقيق المواصفة (Audit فقط، بدون أي إعادة كتابة)
التاريخ: 2026-09-14 · المنهج: كل حكم أدناه مستند إلى فحص فعلي بالكود في هذه الجلسة (grep/sed/تشغيل اختبارات). لم يُعدَّل أي سطر.

---

## 1) بنية المشروع الحالية
- `index.html` واحد (1,229 سطرًا / 603KB): CSS ‏(~261 سطرًا) + JS تطبيق (~148KB) + 5 مكتبات خارجية محلية في `lib/` (chart, xlsx, qrcode, jsQR, tesseract) + `lib/vosk-adapter.js` اختياري.
- طبقات داخل الملف (بترتيب الظهور): أيقونات/‏i18n ← تشفير ← seed/migrate ← وصول بيانات ← شاشات `S_*` + موجّه stack ← صوت ← تقارير ← إعدادات.
- اختبارات: 19 ملفًا / 277 فحصًا عبر `npm test`. توثيق: AGENT-BRIEF، ARCHITECTURE-AUDIT.

## 2) نموذج البيانات الحالي (schema الفعلية)
```
db={lang,active,accounts:[{id,name,type,cur}],data:{<accId>:{customers[],invoices[],payments[],seq}}}
customer={id,name,phone,since,archived,pinned,photo?,limit?}
invoice ={id,code,cust,ts,amount,note,due?,edits?[{ts,from,to,note,kind}],arch?}
payment ={id,cust,ts,amount,method,alloc:[{inv,amt}],arch?}
sec={enabled,salt,pinHash,autoMin,sound,vib,dark,darkAuto,speak,vosk,fps[],...}
```
- لا يوجد `schemaVersion` ولا `formatVersion` ولا checksum (grep = 0 نتائج).
- `migrate()` (سطر 439) تستنشاق الشكل فقط (accounts؟ customers؟) — بلا سجلّ هجرات.

## 3) حساب أرصدة العملاء — **نقطة قوة**
- لا يُخزَّن رصيد يدويًا أبدًا (grep `.balance` = لا شيء). الرصيد مشتق دائمًا:
  `custOpen=Σ invRem` ، `invRem=max(0, amount−invPaid)` ، `invPaid=Σ alloc` عبر كل الدفعات.
- أي أنه قابل لإعادة الحساب من السجل ✔ — لكن `max(0,…)` يكتم السداد الزائد (انظر §7).

## 4) التخزين
- **localStorage فقط** (مفتاح PLAIN أو ENC مشفّر)؛ `indexedDB`=0، `serviceWorker`=0، `navigator.storage.persist`=0 (grep).
- `save()` يكتب JSON القاعدة كاملة عند كل تغيير + تحذير حصة عند ~4MB.
- المخاطر: حد 5MB، لا معاملات transactional، لا طلب persist، وإجلاء المتصفح للبيانات غير المضمونة بلا إنذار.

## 5) منطق الدين
- دين = إنشاء invoice (id=‏`uid()`‏ = 7 محارف base36 من Math.random — **ليس UUID**).
- المسار اليدوي: عميل←مبلغ←بيان←استحقاق اختياري←حفظ ✔ مطابق لـ§14، والسقف تحذير لا منع ✔.

## 6) منطق السداد
- `payConfirm` (سطر 847): يوزّع المبلغ FIFO على الفواتير المفتوحة (`alloc`)، **ولا يفرض اختيار فاتورة** ✔.
- **مخالفة §7**: الفائض عن كل الفواتير (`left`) يُرمى صامتًا؛ `invRem` يُصفَّى بـ`max(0,)`؛ إذن «دين 70 وسداد 100» لا يُنتج رصيد −30 — الـ30 تضيع.

## 7) التعديل/الحذف/المرتجعات
- المرتجع (`applyReturn`): يخصم من `invoice.amount` **معدِّلًا العملية الأصلية**، مع `edits[]` يحتفظ from/to/ts/note (سجل شبه Audit) — ليس قيْد RETURN مستقلًا ولا REVERSAL (مخالفة روح §4/§8 مع وجود أثر).
- الحذف: لا حذف مالي صامت؛ أرشفة فقط (`arch`) ✔؛ العملاء أرشفة لا حذف ✔ (§8).

## 8) النسخ الاحتياطي والاستعادة — **أخطر الثغرات**
- لا صيغة backup أصلية: لا formatVersion/checksum/ملخص/‏safety-backup قبل الاستعادة (grep=0).
- النقل عبر QR (`qrApply` سطر 635): يفك ضغطًا/JSON ويتحقق فقط من وجود `obj.db` ثم **يستبدل القاعدة كاملة** — ملف مقصوص/قديم = فقد بيانات بلا رجعة.
- تصدير: CSV/Excel (`exportAll/exportCSV`) بلا حماية Formula Injection (الحقول تُغلَّف باقتباس فقط، بدون تعقيم =,+,-,@) — مخالفة §27.

## 9) البحث — مخالفة §16
- `filteredTx` (سطر 569-573): `name.includes(q)` و`note.includes(q)` **حرفيًا** — بلا تطبيع همزات/تشكيل/أرقام عربية. (تطبيع الأرقام العربية موجود في مسار الصوت فقط، سطر 876.)

## 10) الصوت
- زران منفصلان دين/سداد: نقرة=يدوي، **ضغطة مطوّلة 380ms=صوت** (`lpBtn/btnDown`) ✔ مطابق §13 تمامًا.
- `words2num` محرك أرقام حتمي **منفصل عن ASR** ✔ (أساس §23) — لكنه ينقصه الكسور (نص/نصف/هللة) وطبقات اللهجة والتعلم المحلي (§24 غير موجود).
- VOSK: محوّل اختياري خارج الحزمة، والنموذج غير مضمّن ✔ روح §22 — لكن واجهة الإعدادات تكتب «VOSK» صراحةً (مخالفة «لا تقل Vosk»).
- مراجعة قبل الحفظ + تحذيرات ثقة ✔؛ لا N-best ولا حفظ تصحيحات ✘.

## 11) PWA / Service Worker — مخالفة جزئية §31
- manifest بـ data-URI + meta tags (قابلية تثبيت ضعيفة على Chrome)، **لا service worker إطلاقًا** → لا offline-shell ولا استراتيجية تحديث؛ يعمل «دون إنترنت» فقط لأنه ملف محلي مفتوح يدويًا.

## 12) التشفير والأمان — جيد مع نقص
- مفتاح بيانات عشوائي AES‑GCM يُلفّ بمفتاح مشتق PBKDF2 ‏100k + salt ✔ (لا يُستخدم PIN كمفتاح مباشرة ✔).
- **لا rate‑limiting** لمحاولات PIN (grep=0) — نقص §30.

## 13) الواجهات والمصطلحات (§11/§12)
- قاموس i18n مركزي (311 مفتاحًا/لغة) ✔.
- مخالفات مصطلحات: «حصّلت اليوم» (`collToday` سطر 319) بدل «سداد اليوم»؛ «تاريخ الاستحقاق» بدل «موعد السداد»؛ «VOSK» ظاهر.
- الرئيسية: بطاقتا **إجمالي** دين/تحصيل (نقرتهما تفلتر السجل نفسه عبر `toggleDebt/togglePay`) — لا بطاقتي «ديون اليوم/سداد اليوم»، والنقر لا ينقل للعملاء بفلتر «عليه دين» (مفتاح `todayDebt:'دين اليوم'` موجود لكن غير مستخدم في الرئيسية).

## 14) الفلترة (§17/§18)
- الرئيسية: نوع (كل/دين/سداد) + فترة (اليوم/7/30) ✔ — بلا حالة (متأخر/معدّل)، بلا ترتيب، بلا chips قابلة للإزالة.
- العملاء: ورقة فلاتر (حالة/ترتيب) + chips نشطون/مؤرشَفون — جزئي ✔~.

## 15) التأخر (§19) — ✔ مطابق
`isOverdue`: بسبب due ∧ مضى ∧ متبقٍ>0؛ بلا due لا يظهر «متأخر» أبدًا.

## 16) نقل من الدفتر (§20) — مخالف تقريبًا
- لا OPENING_BALANCE إطلاقًا («رصيد من الدفتر السابق» غير موجود).
- يوجد `openImport` (نص/CSV/XLSX/OCR) لكنه: بلا وسم source، بلا تاريخ جلسة موحّد، بلا Drafts ومراجعة — ليس نموذج §20/§21.

## 17) الاختبارات الموجودة مقابل §34
- 277 فحصًا تغطي تدفقات UI واللغة والثيم والمرتجع — **لكن** grep «overpay/double/corrupt» في tests = صفر: لا اختبار سداد زائد، لا 10 نقرات حفظ، لا backup→restore بمطابقة IDs، لا رفض ملف تالف، لا property tests.

## 18) الأداء (§35)
- السجل الرئيسي مُصفّح `slice(0,60)` ✔ بداية جيدة؛ لكن: قوائم العملاء كاملة بالـDOM، `invPaid` اختزال O(الدفعات) **لكل فاتورة/صف** (O(n·m) في الرئيسية)، بلا فهارس، غير مختبر على 10k/100k.

## 19) أماكن floating-point المالي (مطلوب §39-5)
كل مسار نقدي: `parseFloat` في `payConfirm` و`applyReturn` ومدخلات الأوراق، `amount` يُخزَّن number، `fmt/money` بكسور عشرية، وأدوات like `words2num` تُرجع number. **لا minor units في أي موضع.**

## 20) أماكن تعديل «الرصيد» مباشرة (§39-6)
لا يوجد رصيد مخزَّن — لا شيء يعدّله. المقابل: `applyReturn` يعدّل `invoice.amount` الأصلي (تعديل قيْد مصدر لا إضافة قيْد) — هذا يُصنَّف MIGRATE.

## 21) مخاطر double-save (§39-7)
حواجز موجودة: `lpGuard`(450ms) + `recPend` + `touchSeen` + إغلاق الأوراق بعد الحفظ. **لكن**: لا idempotency key، لا تعطيل زر الحفظ بعد النقر، `uid()` قابل للتصادم، ولا اختبار ضغطات متتالية. الخطر: متوسط ( sheets تُغلق فالتكرار الفعلي نادر، لكن refresh-أثناء-الحفظ أو lag لمس زر ورقة قبل إغلاقها قد يزدوج).

---

## 22) تصنيف الوحدات (KEEP / REFACTOR / MIGRATE / REMOVE / DEFER)

| الوحدة الحالية | التصنيف | السبب |
|---|---|---|
| شاشات `S_*` + CSS + موجّه stack | **KEEP** | واجهة ناضجة مختبرة؛ لا تُكسر |
| أزرار دين/سداد بضغط مطوّل للصوت | **KEEP** | مطابق §13 حرفيًا |
| `words2num` | **KEEP+REFACTOR** | محرك حتمي منفصل ✔؛ يُوسَّع بالكسور واللهجات |
| وحدة التشفير (deriveKey/wrap/enc) | **KEEP** | تصميم سليم §30 |
| الاشتقاق `invPaid/invRem/custOpen` | **KEEP+REFACTOR** | الرصيد مشتق ✔؛ يُغلَّف كـ ledger engine بفهارس |
| نموذج invoices/payments | **MIGRATE** | float + تعديل الأصل + أنواع ناقصة → LedgerEntry minor-units |
| `edits[]` (المرتجع) | **MIGRATE** | إلى قيود RETURN/ADJUSTMENT مستقلة بـ relatedEntryId |
| `save()`/localStorage | **MIGRATE** | إلى مستودع IndexedDB transactional (localStorage fallback) |
| `migrate()` | **KEEP+REFACTOR** | نواة جيدة تُبنى عليها migration registry بإصدارات |
| نقل QR | **KEEP+REFACTOR** | يصبح backup service بصيغة versioned + checksum + safety-backup |
| export CSV/Excel | **KEEP+REFACTOR** | + حماية Formula Injection |
| `openImport`/OCR | **KEEP** | يصبح source=PAPER_IMPORT بجلسة تاريخ وDrafts |
| تقارير/إعدادات/عملاء UI | **KEEP** | مع تصحيح مصطلحات فقط |
| `patch*.py` + نسخ BRIEF المكررة | **REMOVE** | ضجيج مستودع |
| جلسة إملاء متعددة الديون، التعلم الصوتي، فهارس 100k | **DEFER** | مراحل 8–10 من الخطة |

---

## 23) الـ schema المستهدفة المقترحة (خلاصة، وفق §6)
```
meta={schemaVersion, migratedAt, v1RawKey}
Account  {id:UUID,name,type:STORE|PERSONAL|EXPENSE,currencyCode,minorUnit,createdAt,updatedAt,archivedAt?}
Customer {id:UUID,accountId,displayName,normalizedName,phone?,note?,debtLimitMinor?,createdAt,updatedAt,archivedAt?}
LedgerEntry{id:UUID,accountId,customerId?,type:DEBT|PAYMENT|OPENING_BALANCE|ADJUSTMENT|RETURN|REVERSAL,
           amountMinor>0,statement?,occurredAt,createdAt,source:MANUAL|VOICE|PAPER_IMPORT|OPENING_IMPORT|SYSTEM,
           dueAt?,relatedEntryId?,metadata{code,method,alloc,oldId}}
AuditEvent{id,accountId,entityType,entityId,action:CREATE|ADJUST|REVERSE|IMPORT|RESTORE,createdAt,before?,after?,reason?}
```
قواعد مطبَّقة: رصيد = Σ(±amountMinor)/10^minorUnit بلا أي تخزين؛ السداد الزائد يُبقي رصيدًا سالبًا؛ لا تعديل قيْد مصدر أبدًا.

## 24) خطة الـ Migration (تحافظ على كل بايت حالي)
- **خريطة الحقول**: invoice→DEBT (code→metadata.code، note→statement، due→dueAt، id→metadata.oldId + UUID جديد)؛ payment→PAYMENT مع metadata.alloc يُعاد ربطه بـ UUIDs الجديدة؛ كل edit→RETURN/ADJUSTMENT بـ relatedEntryId ومبلغ = from−to، ويُستعاد amount الأصلي للـDEBT من `edits[0].from`.
- **minor units**: amountMinor=Math.round(amount×10^minorUnit) مع minorUnit=2 لعملات الخانة الثانية وقائمة استثناء (مثل دينار كويتي/بحريني 3) — لا افتراض عام.
- **آمان الهجرة**: قبل أي شيء تُحفَظ لقطة `v1raw` كاملة؛ كل migration تُختبر قبل/بعد (أرصدة مطابقة، IDs محفوظة)؛ عند فشل أي خطوة يُسترجع v1raw تلقائيًا؛ لا تُحذف اللقطة إلا بعد تحقق invariants.
- **سجل إصدارات**: registry ‏v1→v2 (uuid+minor) →v3 (ledger entries) →v4 (audit) تُطبق تسلسليًا عند الإقلاع.

## 25) مخاطر فقد/فساد/تكرار البيانات المرصودة (الأسوأ أولًا)
1. استعادة/استقبال QR تستبدل القاعدة بلا checksum ولا safety-backup (§8).
2. localStorage غير مضمون البقاء وبلا persist() وبلا اكتشاف فساد (§28).
3. السداد الزائد يُحذف صامتًا (§7).
4. `uid()` غير UUID → تصادم نظري + لا idempotency (§9).
5. float مالي → أخطاء تمثيل عشرية عند الجمع الكبير (§5).
6. تعديل `invoice.amount` الأصلي يفقد قيمة الأصل من السجل الحي (تبقى في edits فقط) (§4/§8).
7. CSV بلا تعقيم حقن + بلا IDs → ليس نسخة احتياطية قابلة للاستعادة (§26/27).

---
**الخلاصة الرقمية** (أقسام المواصفة 4–36، وعددها 33): ✔ مطابق = 6 (‏8-أرشفة/10/13/14/19/25/36 تُحسب 6) · ~ جزئي = 17 · ✘ مخالف = 10.
**الحكم**: التطبيق يحقق روح الأولويات 1-5 جزئيًا وبامتياز في الواجهة والصوت، لكنه **لا يستوفي** متطلبات الهندسة المالية الصلبة (minor units، ledger غير قابل للتعديل، overpayment، backup versioned، IndexedDB، migrations). لذلك المرحلة التالية المقترحة هي PHASE 1 (schema نهائية + خطة هجرة مفصلة) **وليس** أي إعادة كتابة الآن.
