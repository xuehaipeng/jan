use std::fs::{self, File};
use std::io::{BufRead, BufReader, Write};
use tauri::Runtime;

// For async file write serialization
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

use super::utils::{get_messages_path, get_thread_metadata_path};

// Global per-thread locks for message file writes
pub static MESSAGE_LOCKS: Lazy<Mutex<HashMap<String, Arc<Mutex<()>>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

/// Get a lock for a specific thread to ensure thread-safe message file operations
pub async fn get_lock_for_thread(thread_id: &str) -> Arc<Mutex<()>> {
    let mut locks = MESSAGE_LOCKS.lock().await;
    let lock = locks
        .entry(thread_id.to_string())
        .or_insert_with(|| Arc::new(Mutex::new(())))
        .clone();
    drop(locks); // Release the map lock before returning the file lock
    lock
}

/// Write messages to a thread's messages.jsonl file
pub fn write_messages_to_file(
    messages: &[serde_json::Value],
    path: &std::path::Path,
) -> Result<(), String> {
    let mut file = File::create(path).map_err(|e| e.to_string())?;
    for msg in messages {
        let data = serde_json::to_string(msg).map_err(|e| e.to_string())?;
        writeln!(file, "{}", data).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Read messages from a thread's messages.jsonl file
pub fn read_messages_from_file<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    thread_id: &str,
) -> Result<Vec<serde_json::Value>, String> {
    let path = get_messages_path(app_handle, thread_id);
    if !path.exists() {
        return Ok(vec![]);
    }

    let file = File::open(&path).map_err(|e| {
        eprintln!("Error opening file {}: {}", path.display(), e);
        e.to_string()
    })?;
    let reader = BufReader::new(file);

    let mut messages = Vec::new();
    for line in reader.lines() {
        let line = line.map_err(|e| {
            eprintln!("Error reading line from file {}: {}", path.display(), e);
            e.to_string()
        })?;
        let message: serde_json::Value = serde_json::from_str(&line).map_err(|e| {
            eprintln!(
                "Error parsing JSON from line in file {}: {}",
                path.display(),
                e
            );
            e.to_string()
        })?;
        messages.push(message);
    }

    Ok(messages)
}

/// Update thread metadata by writing to thread.json
pub fn update_thread_metadata<R: Runtime>(
    app_handle: tauri::AppHandle<R>,
    thread_id: &str,
    thread: &serde_json::Value,
) -> Result<(), String> {
    let path = get_thread_metadata_path(app_handle, thread_id);
    let data = serde_json::to_string_pretty(thread).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())?;
    Ok(())
}
