package ai.arena.dafter.offline;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.provider.OpenableColumns;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.zip.GZIPOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public final class MainActivity extends Activity {
    private static final int REQ_VOSK=42, REQ_PROJECT=43, REQ_CONTACT=44, REQ_FILE=52, REQ_MIC=91, REQ_CAMERA=92, REQ_CONTACTS=93;
    private static final String HOST="appassets.androidplatform.net", PREFIX="/assets/www/";
    private static final long MAX_ZIP=1024L*1024*1024, MAX_OUT=1024L*1024*1024;
    private static final int MAX_ENTRIES=30000;
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private PermissionRequest pendingPermission;
    private File importRoot, modelDir, libDir, projectDir;
    private boolean contactPending;

    @SuppressLint({"SetJavaScriptEnabled","JavascriptInterface"})
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(0xfff5f5f2); getWindow().setNavigationBarColor(0xfff5f5f2);
        importRoot=new File(getFilesDir(),"imports"); modelDir=new File(importRoot,"model-ar"); libDir=new File(importRoot,"lib"); projectDir=new File(importRoot,"proj");
        importRoot.mkdirs(); modelDir.mkdirs(); libDir.mkdirs(); projectDir.mkdirs();
        webView=new WebView(this); WebSettings s=webView.getSettings();
        s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false); s.setAllowFileAccess(false); s.setAllowContentAccess(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW); s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        webView.addJavascriptInterface(new Bridge(),"Daftari");
        webView.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r){return serve(r.getUrl());}
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,String u){return serve(Uri.parse(u));}
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){
                Uri u=r.getUrl(); if(HOST.equals(u.getHost())&&"https".equalsIgnoreCase(u.getScheme()))return false;
                String sc=u.getScheme()==null?"":u.getScheme().toLowerCase(Locale.ROOT);
                if("tel".equals(sc)||"sms".equals(sc)||"mailto".equals(sc))try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){}
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams p){
                if(fileCallback!=null)fileCallback.onReceiveValue(null); fileCallback=cb;
                try{Intent i=p.createIntent();i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,REQ_FILE);return true;}
                catch(Exception e){fileCallback=null;cb.onReceiveValue(null);toast("تعذّر فتح مدير الملفات");return true;}
            }
            @Override public void onPermissionRequest(PermissionRequest r){runOnUiThread(()->requestWebPermission(r));}
            @Override public void onPermissionRequestCanceled(PermissionRequest r){if(pendingPermission==r)pendingPermission=null;}
        });
        setContentView(webView); webView.loadUrl("https://"+HOST+PREFIX+"index.html");
    }

    private WebResourceResponse serve(Uri u){
        if(u==null||!HOST.equals(u.getHost())||!"https".equalsIgnoreCase(u.getScheme()))return reply(403,"Forbidden","text/plain",new ByteArrayInputStream(new byte[0]));
        String path=u.getPath(); if(path==null||"/".equals(path))path=PREFIX+"index.html";
        if(path.contains(".."))return reply(404,"Not Found","text/plain",new ByteArrayInputStream(new byte[0]));
        String rel;
        if(path.startsWith(PREFIX))rel=path.substring(PREFIX.length());
        else if(path.startsWith("/model-ar/")||path.startsWith("/lib/")||path.startsWith("/proj/"))rel=path.substring(1);
        else return reply(404,"Not Found","text/plain",new ByteArrayInputStream(new byte[0]));
        if(rel.isEmpty())rel="index.html";
        try{File f=imported(rel);if(f!=null&&f.isFile())return reply(200,"OK",mime(rel),new FileInputStream(f));return reply(200,"OK",mime(rel),getAssets().open("www/"+rel));}
        catch(Exception e){return reply(404,"Not Found","text/plain",new ByteArrayInputStream(new byte[0]));}
    }
    private File imported(String rel)throws Exception{
        File root;String child;
        if(rel.startsWith("model-ar/")){root=modelDir;child=rel.substring(9);}else if(rel.startsWith("lib/")){root=libDir;child=rel.substring(4);}else if(rel.startsWith("proj/")){root=projectDir;child=rel.substring(5);}else return null;
        File canonicalRoot=root.getCanonicalFile(),target=new File(canonicalRoot,child).getCanonicalFile();
        return target.getPath().startsWith(canonicalRoot.getPath()+File.separator)?target:null;
    }
    private WebResourceResponse reply(int code,String reason,String type,InputStream body){
        Map<String,String> h=new HashMap<>();h.put("Cache-Control","no-store");h.put("Cross-Origin-Opener-Policy","same-origin");h.put("Cross-Origin-Embedder-Policy","require-corp");h.put("Cross-Origin-Resource-Policy","same-origin");h.put("Access-Control-Allow-Origin","https://"+HOST);
        return new WebResourceResponse(type,"UTF-8",code,reason,h,body);
    }
    private static String mime(String p){String s=p.toLowerCase(Locale.ROOT);if(s.endsWith(".html"))return"text/html";if(s.endsWith(".js")||s.endsWith(".mjs"))return"application/javascript";if(s.endsWith(".css"))return"text/css";if(s.endsWith(".wasm"))return"application/wasm";if(s.endsWith(".json")||s.endsWith(".webmanifest"))return"application/json";if(s.endsWith(".png"))return"image/png";if(s.endsWith(".svg"))return"image/svg+xml";if(s.endsWith(".woff2"))return"font/woff2";return"application/octet-stream";}

    private boolean hasPermission(String p){return Build.VERSION.SDK_INT<23||checkSelfPermission(p)==PackageManager.PERMISSION_GRANTED;}
    private void requestWebPermission(PermissionRequest r){
        boolean audio=false,video=false,valid=true;for(String x:r.getResources()){if(PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(x))audio=true;else if(PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(x))video=true;else valid=false;}
        if(!valid||(!audio&&!video)){r.deny();return;}if(pendingPermission!=null&&pendingPermission!=r)pendingPermission.deny();pendingPermission=r;
        if(Build.VERSION.SDK_INT<23){pendingPermission=null;r.grant(r.getResources());return;}
        ArrayList<String> need=new ArrayList<>();if(audio&&!hasPermission(Manifest.permission.RECORD_AUDIO))need.add(Manifest.permission.RECORD_AUDIO);if(video&&!hasPermission(Manifest.permission.CAMERA))need.add(Manifest.permission.CAMERA);
        if(need.isEmpty()){pendingPermission=null;r.grant(r.getResources());}else if(Build.VERSION.SDK_INT>=23)requestPermissions(need.toArray(new String[0]),audio?REQ_MIC:REQ_CAMERA);else{pendingPermission=null;r.deny();}
    }
    private void picker(int request,boolean multiple){try{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("*/*");i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,multiple);startActivityForResult(i,request);}catch(Exception e){toast("تعذّر فتح مدير الملفات");}}
    private ArrayList<Uri> uris(Intent d){ArrayList<Uri>a=new ArrayList<>();if(d.getClipData()!=null){for(int i=0;i<d.getClipData().getItemCount();i++)a.add(d.getClipData().getItemAt(i).getUri());}else if(d.getData()!=null)a.add(d.getData());return a;}

    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==REQ_FILE){if(fileCallback!=null){Uri[] a=result==RESULT_OK&&data!=null?WebChromeClient.FileChooserParams.parseResult(result,data):null;fileCallback.onReceiveValue(a);fileCallback=null;}return;}
        if(request==REQ_CONTACT){if(result==RESULT_OK&&data!=null)contactResult(data.getData());return;}
        if(result!=RESULT_OK||data==null||(request!=REQ_VOSK&&request!=REQ_PROJECT))return;
        ArrayList<Uri> selected=uris(data);boolean project=request==REQ_PROJECT;
        new Thread(()->{String error=null;int n=0;try{for(Uri u:selected)n+=importOne(u,project);if(!project&&!new File(modelDir,"model.tar.gz").isFile())throw new IllegalArgumentException("لم يُنتج أرشيف تشغيل Vosk؛ اختر ZIP نموذج Vosk كاملًا.");}
            catch(Exception e){error=e.getMessage()==null?"فشل استيراد الملفات":e.getMessage();}
            final String err=error;final int count=n;runOnUiThread(()->{if(project){if(err==null)webView.loadUrl("https://"+HOST+PREFIX+"index.html");else toast(err);}else if(err!=null)runJs("toastMsg("+js(err)+")");else runJs("toastMsg(window.voskImpMsg?voskImpMsg(false,true):'تم استيراد نموذج Vosk');window.voskReinit&&voskReinit(true)");});
        }).start();
    }
    private int importOne(Uri uri,boolean project)throws Exception{
        String name=displayName(uri);if(name.toLowerCase(Locale.ROOT).endsWith(".zip"))return importZip(uri,project);
        File root=project?projectDir:(name.toLowerCase(Locale.ROOT).contains("vosk")&&(name.endsWith(".js")||name.endsWith(".wasm"))?libDir:modelDir);
        File target=new File(root,name).getCanonicalFile();if(!target.getPath().startsWith(root.getCanonicalPath()+File.separator))throw new SecurityException("مسار ملف غير صالح");
        try(InputStream in=getContentResolver().openInputStream(uri);FileOutputStream out=new FileOutputStream(target)){if(in==null)throw new IllegalArgumentException("تعذّرت قراءة الملف");copy(in,out,MAX_OUT);}return 1;
    }
    private int importZip(Uri uri,boolean project)throws Exception{
        File tmp=File.createTempFile("dafter-",".zip",getCacheDir()),stage=new File(getFilesDir(),"stage-"+System.nanoTime()),dest=project?projectDir:modelDir,packed=null;
        try{
            try(InputStream in=getContentResolver().openInputStream(uri);FileOutputStream out=new FileOutputStream(tmp)){if(in==null)throw new IllegalArgumentException("تعذّرت قراءة ZIP");copy(in,out,MAX_ZIP);}
            String root=findRoot(tmp);stage.mkdirs();Set<String> names=new HashSet<>();byte[] b=new byte[65536];long total=0;int entries=0;
            try(ZipInputStream z=new ZipInputStream(new FileInputStream(tmp))){ZipEntry e;while((e=z.getNextEntry())!=null){if(++entries>MAX_ENTRIES)throw new IllegalArgumentException("ملف ZIP يحتوي عناصر كثيرة جدًا");String raw=e.getName().replace('\\','/');if(raw.startsWith("/")||raw.indexOf('\0')>=0)throw new SecurityException("مسار ZIP غير آمن");String rel=root!=null&&raw.startsWith(root+"/")?raw.substring(root.length()+1):raw;rel=normalize(rel);if(rel.isEmpty()||e.isDirectory()){z.closeEntry();continue;}if(rel.equals("..")||rel.startsWith("../")||rel.contains("/../"))throw new SecurityException("مسار ZIP غير آمن");File f=new File(stage,rel).getCanonicalFile();if(!f.getPath().startsWith(stage.getCanonicalPath()+File.separator))throw new SecurityException("مسار ZIP خارج المجلد");if(!names.add(rel))throw new IllegalArgumentException("ZIP يحتوي اسمًا مكررًا");File parent=f.getParentFile();if(parent!=null)parent.mkdirs();try(FileOutputStream out=new FileOutputStream(f)){int n;while((n=z.read(b))>0){total+=n;if(total>MAX_OUT)throw new IllegalArgumentException("الملف المفكوك يتجاوز الحد 1 GB");out.write(b,0,n);}}z.closeEntry();}}
            if(!project&&!new File(stage,"am/final.mdl").isFile())throw new IllegalArgumentException("ZIP ليس نموذج Vosk كاملًا؛ am/final.mdl غير موجود.");if(project&&!new File(stage,"index.html").isFile()&&!new File(stage,"app.html").isFile())throw new IllegalArgumentException("ZIP المشروع لا يحتوي صفحة HTML.");
            if(!project){packed=new File(getFilesDir(),"packed-"+System.nanoTime());if(!packed.mkdirs())throw new IOException("تعذّر تجهيز مساحة نموذج Vosk");String tarRoot=root==null||root.isEmpty()?"vosk-model":root.substring(root.lastIndexOf('/')+1);writeTarGz(stage,new File(packed,"model.tar.gz"),tarRoot);deleteTree(stage);stage=packed;}
            File backup=new File(getFilesDir(),"backup-"+System.nanoTime());boolean had=dest.exists();if(had&&!dest.renameTo(backup))throw new IllegalStateException("تعذّر حفظ النموذج السابق");if(!stage.renameTo(dest)){if(had)backup.renameTo(dest);throw new IllegalStateException("تعذّر تثبيت الملفات الجديدة");}if(had)deleteTree(backup);return names.size();
        }finally{deleteTree(stage);if(packed!=null)deleteTree(packed);tmp.delete();}
    }
    private void writeTarGz(File root,File archive,String tarRoot)throws Exception{
        ArrayList<File> files=new ArrayList<>();collectFiles(root,root,files);final String base=root.getAbsolutePath()+File.separator;Collections.sort(files,Comparator.comparing(f->f.getAbsolutePath().substring(base.length())));
        byte[] buf=new byte[65536],zeros=new byte[1024];
        try(OutputStream out=new BufferedOutputStream(new GZIPOutputStream(new FileOutputStream(archive),65536))){
            for(File file:files){String name=tarRoot+"/"+file.getAbsolutePath().substring(base.length()).replace(File.separatorChar,'/');long size=file.length();out.write(tarHeader(name,size));long copied=0;
                try(InputStream in=new FileInputStream(file)){int n;while((n=in.read(buf))!=-1){out.write(buf,0,n);copied+=n;}}
                if(copied!=size)throw new IOException("تغير حجم الملف أثناء تجهيز نموذج Vosk");int padding=(int)((512-(size%512))%512);if(padding>0)out.write(zeros,0,padding);
            }
            out.write(zeros,0,1024);
        }
    }
    private void collectFiles(File root,File dir,List<File> out)throws IOException{
        File[] children=dir.listFiles();if(children==null)throw new IOException("تعذّر قراءة ملفات النموذج");
        for(File f:children){if(f.isDirectory())collectFiles(root,f,out);else if(f.isFile())out.add(f);else throw new IOException("عنصر نموذج غير مدعوم");}
    }
    private byte[] tarHeader(String path,long size)throws IOException{
        byte[] h=new byte[512];String name=path,prefix="";byte[] nb=name.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        if(nb.length>100){boolean split=false;for(int i=path.lastIndexOf('/');i>0;i=path.lastIndexOf('/',i-1)){String p=path.substring(0,i),n=path.substring(i+1);if(p.getBytes(java.nio.charset.StandardCharsets.UTF_8).length<=155&&n.getBytes(java.nio.charset.StandardCharsets.UTF_8).length<=100){prefix=p;name=n;split=true;break;}}if(!split)throw new IOException("اسم ملف النموذج طويل أكثر من حد TAR");}
        tarString(h,0,100,name);tarOctal(h,100,8,0644);tarOctal(h,108,8,0);tarOctal(h,116,8,0);tarOctal(h,124,12,size);tarOctal(h,136,12,0);
        for(int i=148;i<156;i++)h[i]=' ';h[156]='0';tarString(h,257,6,"ustar");h[262]=0;tarString(h,263,2,"00");tarString(h,345,155,prefix);
        long sum=0;for(byte x:h)sum+=x&255;String check=String.format(Locale.US,"%06o",sum);byte[] c=check.getBytes(java.nio.charset.StandardCharsets.US_ASCII);System.arraycopy(c,0,h,148,c.length);h[154]=0;h[155]=' ';return h;
    }
    private void tarString(byte[] h,int off,int len,String s)throws IOException{byte[] b=s.getBytes(java.nio.charset.StandardCharsets.UTF_8);if(b.length>len)throw new IOException("مسار نموذج Vosk طويل");System.arraycopy(b,0,h,off,b.length);}
    private void tarOctal(byte[] h,int off,int len,long value)throws IOException{String s=String.format(Locale.US,"%0"+(len-1)+"o",value);byte[] b=s.getBytes(java.nio.charset.StandardCharsets.US_ASCII);if(b.length>len-1)throw new IOException("حجم TAR خارج النطاق");System.arraycopy(b,0,h,off+len-1-b.length,b.length);h[off+len-1]=0;}
    private String findRoot(File zip)throws Exception{String root=null;try(ZipInputStream z=new ZipInputStream(new FileInputStream(zip))){ZipEntry e;int count=0;while((e=z.getNextEntry())!=null){if(++count>MAX_ENTRIES)throw new IllegalArgumentException("ZIP يحتوي عناصر كثيرة");if(e.isDirectory())continue;String n=e.getName().replace('\\','/');if(n.startsWith("/")||n.contains("../")||n.equals(".."))throw new SecurityException("مسار ZIP غير آمن");String suffix="am/final.mdl";if(n.equals(suffix))return "";if(n.endsWith("/"+suffix)){String candidate=n.substring(0,n.length()-suffix.length()-1);if(root!=null&&!root.equals(candidate))throw new IllegalArgumentException("ZIP يحتوي أكثر من جذر لنموذج Vosk");root=candidate;}}}return root;}
    private static String normalize(String s){StringBuilder b=new StringBuilder();for(String p:s.split("/")){if(p.isEmpty()||".".equals(p))continue;if("..".equals(p))return "../"+b; if(b.length()>0)b.append('/');b.append(p);}return b.toString();}
    private void copy(InputStream in,FileOutputStream out,long limit)throws Exception{byte[] b=new byte[65536];long total=0;int n;while((n=in.read(b))!=-1){total+=n;if(total>limit)throw new IllegalArgumentException("حجم الملف يتجاوز 1 GB");out.write(b,0,n);}out.flush();}
    private String displayName(Uri u){try(Cursor c=getContentResolver().query(u,null,null,null,null)){if(c!=null&&c.moveToFirst()){int i=c.getColumnIndex(OpenableColumns.DISPLAY_NAME);if(i>=0&&c.getString(i)!=null)return sanitize(c.getString(i));}}catch(Exception ignored){}String n=u.getLastPathSegment();return sanitize(n==null?"imported":n);}
    private static String sanitize(String s){return s.replaceAll("[^A-Za-z0-9._\\-\\u0600-\\u06FF]","_");}
    private void contactResult(Uri u){String n="",p="";try(Cursor c=getContentResolver().query(u,null,null,null,null)){if(c!=null&&c.moveToFirst()){int x=c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME),y=c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);if(x>=0&&c.getString(x)!=null)n=c.getString(x);if(y>=0&&c.getString(y)!=null)p=c.getString(y);}}catch(Exception ignored){}runJs("window.contactPicked&&contactPicked("+js(n)+","+js(p)+")");}
    private static String js(String s){return "'"+(s==null?"":s.replace("\\","\\\\").replace("'","\\'").replace("\n","\\n").replace("\r","\\r").replace("<","\\u003c"))+"'";}
    private void runJs(String s){runOnUiThread(()->{if(webView!=null)webView.evaluateJavascript(s,null);});}
    private void toast(String s){android.widget.Toast.makeText(this,s,android.widget.Toast.LENGTH_LONG).show();}
    private static void deleteTree(File f){if(f==null||!f.exists())return;if(f.isDirectory()){File[] a=f.listFiles();if(a!=null)for(File c:a)deleteTree(c);}f.delete();}
    private void list(File f,String p,StringBuilder b){File[] a=f.listFiles();if(a==null)return;for(File x:a)if(x.isDirectory())list(x,p+x.getName()+"/",b);else b.append(p).append(x.getName()).append(" (").append(x.length()).append("B)\n");}

    public final class Bridge{
        @JavascriptInterface public void pickVosk(){runOnUiThread(()->picker(REQ_VOSK,true));}
        @JavascriptInterface public void pickProject(){runOnUiThread(()->picker(REQ_PROJECT,false));}
        @JavascriptInterface public String importedList(){StringBuilder b=new StringBuilder();list(importRoot,"",b);return b.toString();}
        @JavascriptInterface public void pickContact(){runOnUiThread(()->{if(hasPermission(Manifest.permission.READ_CONTACTS)){try{startActivityForResult(new Intent(Intent.ACTION_PICK,ContactsContract.CommonDataKinds.Phone.CONTENT_URI),REQ_CONTACT);}catch(Exception e){toast("جهات الاتصال غير متاحة");}}else if(Build.VERSION.SDK_INT>=23)requestPermissions(new String[]{Manifest.permission.READ_CONTACTS},REQ_CONTACTS);});}
    }
    @Override public void onRequestPermissionsResult(int code,String[] perms,int[] results){super.onRequestPermissionsResult(code,perms,results);if((code==REQ_MIC||code==REQ_CAMERA)&&pendingPermission!=null){PermissionRequest p=pendingPermission;pendingPermission=null;boolean ok=results.length>0;for(int r:results)if(r!=PackageManager.PERMISSION_GRANTED)ok=false;if(ok)p.grant(p.getResources());else p.deny();}else if(code==REQ_CONTACTS&&results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED)try{startActivityForResult(new Intent(Intent.ACTION_PICK,ContactsContract.CommonDataKinds.Phone.CONTENT_URI),REQ_CONTACT);}catch(Exception e){toast("جهات الاتصال غير متاحة");}}
    @Override public void onBackPressed(){if(webView==null){super.onBackPressed();return;}webView.evaluateJavascript("(function(){try{if(window.stack&&stack.length>1){back();return 1}if(document.getElementById('sheetWrap')&&document.getElementById('sheetWrap').classList.contains('open')){closeSheet();return 1}}catch(e){}return 0})()",v->{if(v==null||v.startsWith("0"))finish();});}
    @Override protected void onDestroy(){if(pendingPermission!=null){pendingPermission.deny();pendingPermission=null;}if(fileCallback!=null){fileCallback.onReceiveValue(null);fileCallback=null;}if(webView!=null){webView.stopLoading();webView.destroy();webView=null;}super.onDestroy();}
}
