/* Daftari SW v5 — shell is NETWORK-FIRST (never serve a stale app),
   immutable libs stay cache-first for offline. Bumping C deletes old caches. */
const C='dafter-v5-whisper';
const LIBS=['lib/qrcode.js','lib/jsQR.js','lib/chart.umd.js','lib/xlsx.full.min.js','lib/tesseract.min.js','lib/vosk-adapter.js','lib/whisper/engine.js','lib/whisper/main.js','manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(LIBS.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 const base=new URL(self.registration.scope).pathname;const rel=u.pathname.startsWith(base)?u.pathname.slice(base.length):u.pathname.replace(/^\//,'');
 const isShell=e.request.mode==='navigate'||/index\.html$/.test(u.pathname)||u.pathname==='/'||u.pathname.endsWith('/index.html');
 const isolate=r=>{if(!r||r.type==='opaque')return r;const h=new Headers(r.headers);h.set('Cross-Origin-Opener-Policy','same-origin');h.set('Cross-Origin-Embedder-Policy','credentialless');return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h})};
 if(isShell){ /* network first; cache only as offline fallback */
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return isolate(r)}).catch(()=>caches.match(e.request).then(h=>h||caches.match('index.html')).then(isolate)));
  return}
 if(rel.startsWith('lib/')||rel==='manifest.webmanifest'){ /* cache first w/ background refresh */
  e.respondWith(caches.match(e.request).then(h=>{const f=fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r}).catch(()=>h);return h||f}));
 }});
