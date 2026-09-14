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
