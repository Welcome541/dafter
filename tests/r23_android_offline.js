const fs=require('fs');
const path=require('path');
const {mk}=require('./h');
const {ok,done}=mk();
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=read('android-offline/app/src/main/AndroidManifest.xml');
const activity=read('android-offline/app/src/main/java/ai/arena/dafter/offline/MainActivity.java');
const androidHtml=read('android-offline/app/src/main/assets/www/index.html');
const buildScript=read('android-offline/build-apk.sh');
const workflow=read('.github/workflows/android-offline.yml');

ok(!/android\.permission\.INTERNET/.test(manifest),'APK does not request Android Internet permission');
ok(/android:allowBackup="false"/.test(manifest),'private app data is excluded from Android backup');
ok(/onShowFileChooser/.test(activity)&&/params\.createIntent\(\)/.test(activity),'WebView file input opens the Android system file picker');
ok(/FLAG_GRANT_READ_URI_PERMISSION/.test(activity)&&/FileChooserParams\.parseResult/.test(activity),'picked document URI is readable by WebView');
ok(/isModelFileChooser\(params\).*EXTRA_LOCAL_ONLY/s.test(activity),'GGML model picker is restricted to locally available files');
ok(/shouldOverrideUrlLoading[\s\S]*?isAppAssetUri/.test(activity)&&/blockedOfflineRequest\(\)/.test(activity),'external navigation and web resources are blocked');
ok(/Cross-Origin-Opener-Policy/.test(activity)&&/Cross-Origin-Embedder-Policy/.test(activity),'local WebView responses enable Whisper WASM isolation');
ok(/id="whisperModelFile" type="file" accept="\.bin,application\/octet-stream"/.test(androidHtml),'Android settings exposes a .bin model picker');
ok(/importWhisperModel\(input\)[\s\S]*?whisperEngine\.importModel\(f\)/.test(androidHtml),'selected model file is stored locally through the Whisper engine');
ok(/assembleDebug/.test(buildScript)&&/Dafter-Whisper-Offline\.apk/.test(buildScript),'one command builds a phone-installable APK');
ok(/actions\/upload-artifact@v5/.test(workflow)&&/Dafter-Whisper-Offline\.apk/.test(workflow),'CI publishes the APK as a downloadable artifact');

done();
