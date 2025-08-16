mod commands;
mod constants;
pub mod cpu;
pub mod gpu;
mod helpers;
mod types;
pub mod vendor;

pub use constants::*;
pub use helpers::*;
pub use types::*;

use std::sync::OnceLock;
use tauri::Runtime;

static SYSTEM_INFO: OnceLock<SystemInfo> = OnceLock::new();

/// Initialize the hardware plugin
pub fn init<R: Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::new("hardware")
        .invoke_handler(tauri::generate_handler![
            commands::get_system_info,
            commands::get_system_usage
        ])
        .build()
}

#[cfg(test)]
mod tests;
