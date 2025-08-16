package com.example.tauriapp

import android.app.Application
import app.tauri.plugin.PluginManager

class MainApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        PluginManager.init(this)
    }
}
