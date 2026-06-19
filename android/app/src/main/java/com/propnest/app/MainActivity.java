package com.bhoomitayi.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fix: Google OAuth blocks sign-in in Android WebView by detecting
        // the "; wv)" substring in the user agent (disallowed_useragent error).
        // We remove it so the WebView is treated as a regular Chrome browser.
        WebView webView = getBridge().getWebView();
        String originalUserAgent = webView.getSettings().getUserAgentString();
        String fixedUserAgent = originalUserAgent
            .replace("; wv)", ")")
            .replace("; wv", "");
        webView.getSettings().setUserAgentString(fixedUserAgent);
    }
}
