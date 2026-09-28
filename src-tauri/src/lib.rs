use serde::Serialize;
use std::process::{Command, Stdio};

#[derive(Serialize)]
struct CliOutput {
    success: bool,
    code: Option<i32>,
    stdout: String,
    stderr: String,
}

#[cfg(not(windows))]
fn shell_quote(arg: &str) -> String {
    format!("'{}'", arg.replace('\'', "'\\''"))
}

/// Builds `npx -y skills@latest <args>`. On unix it runs through the user's
/// interactive login shell so PATH managers (nvm, fnm, volta...) are loaded,
/// since GUI apps don't inherit the terminal environment.
fn build_command(args: &[String]) -> Command {
    #[cfg(windows)]
    {
        let mut cmd = Command::new("cmd");
        cmd.args(["/C", "npx", "-y", "skills@latest"]).args(args);
        cmd
    }
    #[cfg(not(windows))]
    {
        let line = std::iter::once("npx -y skills@latest".to_string())
            .chain(args.iter().map(|a| shell_quote(a)))
            .collect::<Vec<_>>()
            .join(" ");
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".into());
        let mut cmd = Command::new(shell);
        cmd.args(["-ilc", &line]);
        cmd
    }
}

#[tauri::command]
async fn run_skills(args: Vec<String>, cwd: Option<String>) -> Result<CliOutput, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut cmd = build_command(&args);
        let dir = cwd
            .filter(|d| !d.is_empty())
            .or_else(|| std::env::var("HOME").ok())
            .or_else(|| std::env::var("USERPROFILE").ok());
        if let Some(dir) = dir {
            cmd.current_dir(dir);
        }
        let out = cmd
            .env("NO_COLOR", "1")
            .env("FORCE_COLOR", "0")
            .stdin(Stdio::null())
            .output()
            .map_err(|e| format!("failed to spawn npx: {e}"))?;
        Ok(CliOutput {
            success: out.status.success(),
            code: out.status.code(),
            stdout: String::from_utf8_lossy(&out.stdout).into_owned(),
            stderr: String::from_utf8_lossy(&out.stderr).into_owned(),
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![run_skills])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
