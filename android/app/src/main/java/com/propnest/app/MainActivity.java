package com.bhoomitayi.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.util.Log;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;

import com.getcapacitor.BridgeActivity;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    private GoogleSignInClient googleSignInClient;
    private ActivityResultLauncher<Intent> googleSignInLauncher;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fix WebView user agent - remove "wv" flag that Google blocks
        String currentUserAgent = this.bridge.getWebView().getSettings().getUserAgentString();
        String newUserAgent = currentUserAgent
                .replace("; wv)", ")")
                .replace(" wv", "");
        this.bridge.getWebView().getSettings().setUserAgentString(newUserAgent);

        // Configure Google Sign-In
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(getString(R.string.default_web_client_id))
                .requestEmail()
                .build();

        googleSignInClient = GoogleSignIn.getClient(this, gso);

        // Register the result handler
        googleSignInLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> handleGoogleSignInResult(result)
        );

        // Inject the AndroidBridge JavaScript interface into the WebView
        WebView webView = this.bridge.getWebView();
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
    }

    private void handleGoogleSignInResult(ActivityResult result) {
        Intent data = result.getData();
        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            String idToken = account.getIdToken();
            String serverAuthCode = account.getServerAuthCode();

            Log.d(TAG, "Google Sign-In successful, sending token to WebView");

            // Post result back to WebView via JavaScript
            String js = String.format(
                "window.postMessage({type:'GOOGLE_SIGN_IN_RESULT', idToken:'%s', accessToken:null}, '*');",
                idToken != null ? idToken : ""
            );
            this.bridge.getWebView().post(() -> {
                this.bridge.getWebView().evaluateJavascript(js, null);
            });

        } catch (ApiException e) {
            Log.e(TAG, "Google Sign-In failed: " + e.getStatusCode());
            String errorJs = String.format(
                "window.postMessage({type:'GOOGLE_SIGN_IN_RESULT', error:'Google Sign-In failed (code %d)'}, '*');",
                e.getStatusCode()
            );
            this.bridge.getWebView().post(() -> {
                this.bridge.getWebView().evaluateJavascript(errorJs, null);
            });
        }
    }

    // This object is injected into JavaScript as "window.AndroidBridge"
    private class AndroidBridge {
        @JavascriptInterface
        public void startGoogleSignIn() {
            Log.d(TAG, "startGoogleSignIn called from JS");
            // Sign out first to force account picker to always show
            googleSignInClient.signOut().addOnCompleteListener(task -> {
                Intent signInIntent = googleSignInClient.getSignInIntent();
                googleSignInLauncher.launch(signInIntent);
            });
        }
    }
}
