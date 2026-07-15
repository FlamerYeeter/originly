package com.example.app;

import android.content.Intent;
import android.util.Log;

import androidx.annotation.Nullable;

import com.getcapacitor.Bridge;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(name = "GoogleSignIn")
public class GoogleSignInPlugin extends Plugin {
    private static final int RC_SIGN_IN = 9001;
    private PluginCall pendingCall;
    private GoogleSignInClient googleSignInClient;

    @PluginMethod
    public void initialize(PluginCall call) {
        Log.d("GoogleSignInPlugin", "initialize called");
        String clientId = call.getString("clientId");
        if (clientId == null) {
            call.reject("clientId is required");
            return;
        }

        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestIdToken(clientId)
                .build();

        googleSignInClient = GoogleSignIn.getClient(getActivity(), gso);
        call.resolve();
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        Log.d("GoogleSignInPlugin", "signIn called");
        if (googleSignInClient == null) {
            Log.d("GoogleSignInPlugin", "signIn failed: not initialized");
            call.reject("GoogleSignIn not initialized. Call initialize(clientId) first.");
            return;
        }

        pendingCall = call;
        Intent signInIntent = googleSignInClient.getSignInIntent();
        startActivityForResult(call, signInIntent, RC_SIGN_IN);
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            try {
                GoogleSignInAccount account = task.getResult(ApiException.class);
                if (account != null) {
                    com.getcapacitor.JSObject js = new com.getcapacitor.JSObject();
                    js.put("idToken", account.getIdToken());
                    js.put("email", account.getEmail());
                    js.put("displayName", account.getDisplayName());
                    if (pendingCall != null) {
                        pendingCall.resolve(js);
                        pendingCall = null;
                    }
                } else {
                    if (pendingCall != null) {
                        pendingCall.reject("Sign-in failed: no account");
                        pendingCall = null;
                    }
                }
            } catch (ApiException e) {
                if (pendingCall != null) {
                    pendingCall.reject("Sign-in failed: " + e.getMessage());
                    pendingCall = null;
                }
            }
        }
    }
}
