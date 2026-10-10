package ai.arena.dafter.offline;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

public final class MainActivity extends Activity {
    private static final int PICK_FILE = 72;
    private static final int REQUEST_MIC = 91;
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String ASSET_PREFIX = "/assets/www/";

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private PermissionRequest pendingPermission;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(0xfff5f5f2);
        getWindow().setNavigationBarColor(0xfff5f5f2);
        getWindow().getDecorView().setSystemUiVisibility(0);

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!APP_HOST.equals(uri.getHost())) return null;
                return serveAsset(uri.getPath());
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    startActivityForResult(intent, PICK_FILE);
                    return true;
                } catch (Exception e) {
                    fileCallback = null;
                    callback.onReceiveValue(null);
                    return false;
                }
            }

            @Override public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> handleWebPermission(request));
            }

            @Override public void onPermissionRequestCanceled(PermissionRequest request) {
                if (pendingPermission == request) pendingPermission = null;
            }
        });
        setContentView(webView);
        webView.loadUrl("https://" + APP_HOST + "/assets/www/index.html");
    }

    private void handleWebPermission(PermissionRequest request) {
        boolean audioOnly = true;
        for (String resource : request.getResources()) {
            if (!PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) audioOnly = false;
        }
        if (!audioOnly) {
            request.deny();
            return;
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
        } else {
            pendingPermission = request;
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQUEST_MIC);
        }
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_MIC && pendingPermission != null) {
            PermissionRequest request = pendingPermission;
            pendingPermission = null;
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
            } else {
                request.deny();
            }
        }
    }

    private WebResourceResponse serveAsset(String urlPath) {
        String relative;
        if (urlPath == null || "/".equals(urlPath)) {
            relative = "index.html";
        } else if (urlPath.startsWith(ASSET_PREFIX)) {
            relative = urlPath.substring(ASSET_PREFIX.length());
        } else {
            return response(404, "Not Found", "text/plain", new ByteArrayInputStream(new byte[0]));
        }
        if (relative.isEmpty()) relative = "index.html";
        if (relative.contains("..") || relative.startsWith("/")) {
            return response(403, "Forbidden", "text/plain", new ByteArrayInputStream(new byte[0]));
        }
        try {
            InputStream stream = getAssets().open("www/" + relative);
            return response(200, "OK", mimeType(relative), stream);
        } catch (Exception e) {
            return response(404, "Not Found", "text/plain", new ByteArrayInputStream(new byte[0]));
        }
    }

    private WebResourceResponse response(int status, String reason, String mime, InputStream stream) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-store");
        headers.put("Cross-Origin-Opener-Policy", "same-origin");
        headers.put("Cross-Origin-Embedder-Policy", "require-corp");
        headers.put("Cross-Origin-Resource-Policy", "same-origin");
        return new WebResourceResponse(mime, "UTF-8", status, reason, headers, stream);
    }

    private static String mimeType(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "application/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".wasm")) return "application/wasm";
        if (p.endsWith(".json") || p.endsWith(".webmanifest")) return "application/json";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".ico")) return "image/x-icon";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".woff")) return "font/woff";
        return "application/octet-stream";
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == PICK_FILE && fileCallback != null) {
            Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            fileCallback.onReceiveValue(result);
            fileCallback = null;
        }
    }

    @Override public void onBackPressed() {
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        webView.evaluateJavascript("(function(){try{if(window.stack&&stack.length>1){back();return 1}if(document.getElementById('sheetWrap').classList.contains('open')){closeSheet();return 1}}catch(e){}return 0})()", value -> {
            if (value == null || value.startsWith("0")) finish();
        });
    }

    @Override protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
