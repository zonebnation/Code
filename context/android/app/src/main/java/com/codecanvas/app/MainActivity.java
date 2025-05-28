package com.codecanvas.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(com.capacitorjs.plugins.splashscreen.SplashScreenPlugin.class);
        registerPlugin(com.capacitorjs.plugins.app.AppPlugin.class);
        registerPlugin(com.capacitorjs.plugins.keyboard.KeyboardPlugin.class);
        registerPlugin(com.capacitorjs.plugins.statusbar.StatusBarPlugin.class);
        registerPlugin(com.capacitorjs.plugins.filesystem.FilesystemPlugin.class);
        registerPlugin(com.capacitorjs.plugins.haptics.HapticsPlugin.class);
        registerPlugin(com.capacitorjs.plugins.toast.ToastPlugin.class);
    }
}