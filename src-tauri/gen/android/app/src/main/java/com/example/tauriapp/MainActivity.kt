package com.example.tauriapp

import app.tauri.plugin.PluginManager
import android.os.Bundle
import app.tauri.TauriActivity

class MainActivity : TauriActivity() {
    var pluginManager: PluginManager = PluginManager(this)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pluginManager.onActivityCreate()
    }
}
