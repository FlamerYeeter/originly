package com.example.app;

import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
		Log.d("MainActivity", "Registering GoogleSignInPlugin");
		registerPlugin(GoogleSignInPlugin.class);
		super.onCreate(savedInstanceState);
	}
}
