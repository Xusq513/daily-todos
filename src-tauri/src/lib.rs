pub mod state;

use chrono::{Local, NaiveTime, Timelike};
use serde::Deserialize;
use state::*;
use std::collections::HashSet;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri_plugin_notification::NotificationExt;

pub struct AppContextHandle(pub Mutex<AppContext>);

fn emit_state(app: &AppHandle, state: &AppState) -> Result<(), String> {
    app.emit(STATE_CHANGED_EVENT, state)
        .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct AddTodoPayload {
    pub title: String,
    pub priority: Option<String>,
    pub due_time: Option<String>,
    pub todo_type: Option<String>,
    pub target_date: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateTodoPayload {
    pub id: String,
    pub title: Option<String>,
    pub priority: Option<String>,
    pub due_time: Option<String>,
    pub target_date: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateHabitPayload {
    pub id: String,
    pub title: Option<String>,
    pub priority: Option<String>,
    pub due_time: Option<String>,
    pub active_days: Option<Vec<u32>>,
}

// ================= Tauri IPC Commands for State Management =================

#[tauri::command]
fn get_app_state(context: State<'_, AppContextHandle>) -> Result<AppState, String> {
    let ctx = context.0.lock().map_err(|e| e.to_string())?;
    Ok(ctx.state.clone())
}

#[tauri::command]
fn add_todo(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
    payload: AddTodoPayload,
) -> Result<TodoItem, String> {
    if payload.title.trim().is_empty() {
        return Err("任务标题不能为空".into());
    }

    let today = get_today_date_str();
    let actual_target = payload.target_date.unwrap_or_else(|| today.clone());

    let new_todo = TodoItem {
        id: format!(
            "todo_{}_{}",
            Local::now().timestamp_millis(),
            &uuid_v4_short()
        ),
        title: payload.title.trim().into(),
        completed: false,
        todo_type: payload.todo_type.unwrap_or_else(|| "single_todo".into()),
        priority: payload.priority.unwrap_or_else(|| "medium".into()),
        due_time: payload.due_time,
        created_at: Local::now().to_rfc3339(),
        completed_at: None,
        target_date: actual_target,
        start_date: payload.start_date,
        end_date: payload.end_date,
        habit_id: None,
    };

    let todo_clone = new_todo.clone();
    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    ctx.mutate_and_save(|state| {
        state.todos.insert(0, new_todo);
        Ok(())
    })?;

    emit_state(&app, &ctx.state)?;
    Ok(todo_clone)
}

#[tauri::command]
fn toggle_todo(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
    id: String,
) -> Result<bool, String> {
    let today = get_today_date_str();
    let mut will_complete = false;

    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    ctx.mutate_and_save(|state| {
        for todo in &mut state.todos {
            if todo.id == id {
                todo.completed = !todo.completed;
                will_complete = todo.completed;
                todo.completed_at = if will_complete {
                    Some(Local::now().to_rfc3339())
                } else {
                    None
                };
                break;
            }
        }
        refresh_all_streaks(state, &today);
        Ok(())
    })?;

    emit_state(&app, &ctx.state)?;
    Ok(will_complete)
}

#[tauri::command]
fn delete_todo(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
    id: String,
) -> Result<(), String> {
    let today = get_today_date_str();
    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    ctx.mutate_and_save(|state| {
        state.todos.retain(|t| t.id != id);
        refresh_all_streaks(state, &today);
        Ok(())
    })?;

    emit_state(&app, &ctx.state)?;
    Ok(())
}

#[tauri::command]
fn update_todo(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
    payload: UpdateTodoPayload,
) -> Result<(), String> {
    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    ctx.mutate_and_save(|state| {
        for todo in &mut state.todos {
            if todo.id == payload.id {
                if let Some(t) = payload.title {
                    todo.title = t;
                }
                if let Some(p) = payload.priority {
                    todo.priority = p;
                }
                if payload.due_time.is_some() {
                    todo.due_time = payload.due_time;
                }
                if let Some(td) = payload.target_date {
                    todo.target_date = td;
                }
                if payload.start_date.is_some() {
                    todo.start_date = payload.start_date;
                }
                if payload.end_date.is_some() {
                    todo.end_date = payload.end_date;
                }
                break;
            }
        }
        Ok(())
    })?;

    emit_state(&app, &ctx.state)?;
    Ok(())
}

#[tauri::command]
fn add_habit(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
    title: String,
    priority: Option<String>,
    due_time: Option<String>,
    active_days: Option<Vec<u32>>,
) -> Result<HabitItem, String> {
    if title.trim().is_empty() {
        return Err("习惯名称不能为空".into());
    }

    let today = get_today_date_str();
    let new_habit = HabitItem {
        id: format!("habit_{}", Local::now().timestamp_millis()),
        title: title.trim().into(),
        priority: priority.unwrap_or_else(|| "medium".into()),
        due_time,
        active_days: active_days.unwrap_or_else(|| vec![0, 1, 2, 3, 4, 5, 6]),
        streak: 0,
        last_completed_date: None,
        created_at: Local::now().to_rfc3339(),
        archived: Some(false),
    };

    let habit_clone = new_habit.clone();
    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    ctx.mutate_and_save(|state| {
        state.habits.push(new_habit);
        apply_daily_rollover(state, &today);
        Ok(())
    })?;

    emit_state(&app, &ctx.state)?;
    Ok(habit_clone)
}

#[tauri::command]
fn add_habit_and_todo(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
    title: String,
    priority: Option<String>,
    due_time: Option<String>,
    active_days: Option<Vec<u32>>,
) -> Result<TodoItem, String> {
    if title.trim().is_empty() {
        return Err("习惯名称不能为空".into());
    }

    let today = get_today_date_str();
    let now_str = Local::now().to_rfc3339();

    let new_habit = HabitItem {
        id: format!("habit_{}", Local::now().timestamp_millis()),
        title: title.trim().into(),
        priority: priority.unwrap_or_else(|| "medium".into()),
        due_time: due_time.clone(),
        active_days: active_days.unwrap_or_else(|| vec![0, 1, 2, 3, 4, 5, 6]),
        streak: 0,
        last_completed_date: None,
        created_at: now_str.clone(),
        archived: Some(false),
    };

    let new_todo = TodoItem {
        id: format!("habit_todo_{}_{}", new_habit.id, today),
        title: new_habit.title.clone(),
        completed: false,
        todo_type: "daily_habit".into(),
        priority: new_habit.priority.clone(),
        due_time,
        created_at: now_str,
        completed_at: None,
        target_date: today.clone(),
        start_date: None,
        end_date: None,
        habit_id: Some(new_habit.id.clone()),
    };

    let todo_clone = new_todo.clone();
    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    ctx.mutate_and_save(|state| {
        state.habits.push(new_habit);
        state.todos.insert(0, new_todo);
        refresh_all_streaks(state, &today);
        Ok(())
    })?;

    emit_state(&app, &ctx.state)?;
    Ok(todo_clone)
}

#[tauri::command]
fn update_habit(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
    payload: UpdateHabitPayload,
) -> Result<(), String> {
    let today = get_today_date_str();
    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    ctx.mutate_and_save(|state| {
        for habit in &mut state.habits {
            if habit.id == payload.id {
                if let Some(t) = payload.title {
                    habit.title = t;
                }
                if let Some(p) = payload.priority {
                    habit.priority = p;
                }
                if payload.due_time.is_some() {
                    habit.due_time = payload.due_time;
                }
                if let Some(days) = payload.active_days {
                    habit.active_days = days;
                }
                break;
            }
        }
        refresh_all_streaks(state, &today);
        Ok(())
    })?;

    emit_state(&app, &ctx.state)?;
    Ok(())
}

#[tauri::command]
fn archive_habit(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
    id: String,
) -> Result<(), String> {
    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    ctx.mutate_and_save(|state| {
        for habit in &mut state.habits {
            if habit.id == id {
                habit.archived = Some(true);
                break;
            }
        }
        Ok(())
    })?;

    emit_state(&app, &ctx.state)?;
    Ok(())
}

#[tauri::command]
fn unarchive_habit(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
    id: String,
) -> Result<(), String> {
    let today = get_today_date_str();
    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    ctx.mutate_and_save(|state| {
        for habit in &mut state.habits {
            if habit.id == id {
                habit.archived = Some(false);
                break;
            }
        }
        apply_daily_rollover(state, &today);
        Ok(())
    })?;

    emit_state(&app, &ctx.state)?;
    Ok(())
}

#[tauri::command]
fn delete_habit_permanently(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
    id: String,
) -> Result<(), String> {
    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    ctx.mutate_and_save(|state| {
        state.habits.retain(|h| h.id != id);
        state.todos.retain(|t| t.habit_id.as_deref() != Some(&id));
        Ok(())
    })?;

    emit_state(&app, &ctx.state)?;
    Ok(())
}

#[tauri::command]
fn update_settings(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
    settings: AppSettings,
) -> Result<(), String> {
    let always_on_top = settings.always_on_top;
    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    ctx.mutate_and_save(|state| {
        state.settings = settings;
        Ok(())
    })?;

    if let Some(w) = app.get_webview_window("widget") {
        let _ = w.set_always_on_top(always_on_top);
    }

    emit_state(&app, &ctx.state)?;
    Ok(())
}

#[tauri::command]
fn export_backup_data(context: State<'_, AppContextHandle>) -> Result<String, String> {
    let ctx = context.0.lock().map_err(|e| e.to_string())?;
    let export = ExportData {
        version: "1.1.4".into(),
        backup_schema_version: Some(1),
        export_date: Local::now().to_rfc3339(),
        todos: ctx.state.todos.clone(),
        habits: ctx.state.habits.clone(),
        records: ctx.state.records.clone(),
        settings: ctx.state.settings.clone(),
    };
    serde_json::to_string_pretty(&export).map_err(|e| e.to_string())
}

#[tauri::command]
fn preview_import_backup(json_str: String) -> Result<ImportSummary, String> {
    let (_, summary) = validate_import_data(&json_str)?;
    Ok(summary)
}

#[tauri::command]
fn execute_import_backup(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
    json_str: String,
) -> Result<AppState, String> {
    let (new_state, _) = validate_import_data(&json_str)?;
    let always_on_top = new_state.settings.always_on_top;

    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    ctx.store.create_pre_import_snapshot()?;

    ctx.mutate_and_save(|state| {
        *state = new_state;
        Ok(())
    })?;

    if let Some(w) = app.get_webview_window("widget") {
        let _ = w.set_always_on_top(always_on_top);
    }

    emit_state(&app, &ctx.state)?;
    Ok(ctx.state.clone())
}

#[tauri::command]
fn restore_backup_snapshot(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
) -> Result<AppState, String> {
    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    let restored = ctx.store.restore_snapshot()?;
    let always_on_top = restored.settings.always_on_top;

    ctx.state = restored;

    if let Some(w) = app.get_webview_window("widget") {
        let _ = w.set_always_on_top(always_on_top);
    }

    emit_state(&app, &ctx.state)?;
    Ok(ctx.state.clone())
}

#[tauri::command]
fn trigger_daily_rollover(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
) -> Result<AppState, String> {
    let today = get_today_date_str();
    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    ctx.mutate_and_save(|state| {
        apply_daily_rollover(state, &today);
        Ok(())
    })?;

    emit_state(&app, &ctx.state)?;
    Ok(ctx.state.clone())
}

#[tauri::command]
fn change_global_hotkey(
    app: AppHandle,
    context: State<'_, AppContextHandle>,
    new_hotkey: String,
) -> Result<(), String> {
    let new_shortcut = new_hotkey
        .parse::<Shortcut>()
        .map_err(|e| format!("快捷键格式无效: {}", e))?;

    let old_hotkey = {
        let ctx = context.0.lock().map_err(|e| e.to_string())?;
        ctx.state.settings.hotkey.clone()
    };

    if new_hotkey == old_hotkey {
        return Ok(());
    }

    // Try registering new shortcut first without unregistering old shortcut
    app.global_shortcut()
        .on_shortcut(new_shortcut, |app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                if let Some(w) = app.get_webview_window("widget") {
                    if w.is_visible().unwrap_or(false) {
                        let _ = w.hide();
                    } else {
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
            }
        })
        .map_err(|e| format!("系统快捷键已被占用或注册失败: {}", e))?;

    // Now that new shortcut registered successfully, safely unregister the old shortcut
    if let Ok(old_shortcut) = old_hotkey.parse::<Shortcut>() {
        let _ = app.global_shortcut().unregister(old_shortcut);
    }

    // Update settings
    let mut ctx = context.0.lock().map_err(|e| e.to_string())?;
    ctx.mutate_and_save(|state| {
        state.settings.hotkey = new_hotkey;
        Ok(())
    })?;

    emit_state(&app, &ctx.state)?;
    Ok(())
}

// ================= Window Management Commands =================

#[tauri::command]
fn open_main_window(app: AppHandle) -> Result<(), String> {
    if let Some(main_win) = app.get_webview_window("main") {
        main_win.show().map_err(|e| e.to_string())?;
        main_win.unminimize().map_err(|e| e.to_string())?;
        main_win.set_focus().map_err(|e| e.to_string())?;
    } else {
        let _ = tauri::WebviewWindowBuilder::new(
            &app,
            "main",
            tauri::WebviewUrl::App("index.html#/main".into()),
        )
        .title("Daily Todos · 任务与习惯看板")
        .inner_size(960.0, 680.0)
        .min_inner_size(800.0, 600.0)
        .center()
        .build()
        .map_err(|e| e.to_string())?;
    }

    if let Some(w) = app.get_webview_window("widget") {
        let _ = w.hide();
    }
    Ok(())
}

#[tauri::command]
fn close_main_and_show_widget(app: AppHandle) -> Result<(), String> {
    if let Some(main_win) = app.get_webview_window("main") {
        let _ = main_win.hide();
    }
    if let Some(widget) = app.get_webview_window("widget") {
        widget.show().map_err(|e| e.to_string())?;
        widget.unminimize().map_err(|e| e.to_string())?;
        widget.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn hide_widget_window(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("widget") {
        w.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn toggle_widget_window(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("widget") {
        if w.is_visible().unwrap_or(false) {
            w.hide().map_err(|e| e.to_string())?;
        } else {
            w.show().map_err(|e| e.to_string())?;
            w.set_focus().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
fn resize_widget_window(
    app: AppHandle,
    width: f64,
    height: f64,
    resizable: bool,
) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("widget") {
        w.set_resizable(true).map_err(|e| e.to_string())?;
        w.set_size(tauri::LogicalSize::new(width, height))
            .map_err(|e| e.to_string())?;
        w.set_resizable(resizable).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn set_widget_always_on_top(app: AppHandle, always_on_top: bool) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("widget") {
        w.set_always_on_top(always_on_top)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn uuid_v4_short() -> String {
    let rand_val = Local::now().timestamp_nanos_opt().unwrap_or(0);
    format!("{:x}", rand_val % 0xffffff)
}

// ================= Background Tokio Schedulers =================

fn start_background_tasks(app_handle: AppHandle) {
    // 1. Midnight Rollover Scheduler (P1.1)
    let app_clone = app_handle.clone();
    std::thread::spawn(move || loop {
        let now = Local::now();
        let next_day = now.date_naive().succ_opt().unwrap_or(now.date_naive());
        let midnight = next_day.and_hms_opt(0, 0, 1).unwrap();
        let duration_until_midnight = midnight.signed_duration_since(now.naive_local());
        let seconds = duration_until_midnight.num_seconds().max(1) as u64;

        std::thread::sleep(Duration::from_secs(seconds));

        let today = get_today_date_str();
        if let Some(context_handle) = app_clone.try_state::<AppContextHandle>() {
            if let Ok(mut ctx) = context_handle.0.lock() {
                let _ = ctx.mutate_and_save(|state| {
                    apply_daily_rollover(state, &today);
                    Ok(())
                });
                let _ = emit_state(&app_clone, &ctx.state);
            }
        }
    });

    // 2. Minute-level Task Due Reminder Scheduler (P1 4.4 with Sleep Wakeup Compensation)
    let app_notify = app_handle;
    std::thread::spawn(move || {
        let mut notified_tasks: HashSet<String> = HashSet::new();
        let mut current_tracking_date = get_today_date_str();
        let mut last_check_time = Local::now();

        loop {
            std::thread::sleep(Duration::from_secs(20));

            let now = Local::now();
            let now_time = format!("{:02}:{:02}", now.hour(), now.minute());
            let today = get_today_date_str();

            // Clear old tracking dates on day change
            if today != current_tracking_date {
                notified_tasks.clear();
                current_tracking_date = today.clone();
            }

            let elapsed_secs = (now - last_check_time).num_seconds();
            let is_time_jump = elapsed_secs > 70; // 20s interval, >70s implies sleep or clock shift

            if let Some(context_handle) = app_notify.try_state::<AppContextHandle>() {
                if let Ok(ctx) = context_handle.0.lock() {
                    if !ctx.state.settings.notification_enabled {
                        last_check_time = now;
                        continue;
                    }

                    // Sleep / Wakeup compensation: Check if tasks were missed during sleep (within past 15 mins)
                    if is_time_jump {
                        let fifteen_mins_ago = now - chrono::Duration::minutes(15);
                        let mut missed_todos = Vec::new();

                        for todo in &ctx.state.todos {
                            if !todo.completed && todo.target_date == today {
                                if let Some(due) = &todo.due_time {
                                    if let Ok(due_naive_time) =
                                        NaiveTime::parse_from_str(due, "%H:%M")
                                    {
                                        let due_dt = match now
                                            .date_naive()
                                            .and_time(due_naive_time)
                                            .and_local_timezone(Local)
                                        {
                                            chrono::LocalResult::Single(dt) => dt,
                                            _ => continue,
                                        };

                                        let task_key = format!("{}_{}_{}", today, due, todo.id);
                                        if !notified_tasks.contains(&task_key) {
                                            if due_dt >= fifteen_mins_ago && due_dt < now {
                                                missed_todos.push((task_key, todo.title.clone()));
                                            } else if due_dt < fifteen_mins_ago {
                                                // Expired > 15m ago, mark as notified to avoid spamming later
                                                notified_tasks.insert(task_key);
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        if !missed_todos.is_empty() {
                            let total_missed = missed_todos.len();
                            let first_titles: Vec<String> = missed_todos
                                .iter()
                                .take(2)
                                .map(|(_, title)| format!("「{}」", title))
                                .collect();
                            let body_text = format!(
                                "休眠期间有 {} 项待办到期（{} 等），请及时查看。",
                                total_missed,
                                first_titles.join("、")
                            );

                            let res = app_notify
                                .notification()
                                .builder()
                                .title("Daily Todos 离线到期补发提醒")
                                .body(body_text)
                                .show();

                            if res.is_ok() {
                                for (key, _) in missed_todos {
                                    notified_tasks.insert(key);
                                }
                            }
                        }
                    }

                    // Normal due check for current minute
                    let mut due_todos = Vec::new();
                    for todo in &ctx.state.todos {
                        if !todo.completed && todo.target_date == today {
                            if let Some(due) = &todo.due_time {
                                if due == &now_time {
                                    let task_key = format!("{}_{}_{}", today, due, todo.id);
                                    if !notified_tasks.contains(&task_key) {
                                        due_todos.push((task_key, todo.title.clone()));
                                    }
                                }
                            }
                        }
                    }

                    if !due_todos.is_empty() {
                        // Smart Anti-spam: 1~3 tasks -> individual notification; >3 tasks -> consolidated summary
                        if due_todos.len() <= 3 {
                            for (key, title) in due_todos {
                                let res = app_notify
                                    .notification()
                                    .builder()
                                    .title("Daily Todos 到期提醒")
                                    .body(format!("「{}」该执行啦！", title))
                                    .show();
                                if res.is_ok() {
                                    notified_tasks.insert(key);
                                }
                            }
                        } else {
                            let total_count = due_todos.len();
                            let first_titles: Vec<String> = due_todos
                                .iter()
                                .take(2)
                                .map(|(_, title)| format!("「{}」", title))
                                .collect();
                            let body_text = format!(
                                "当前有 {} 项待办同时到期，包括 {} 等，请注意规划处理。",
                                total_count,
                                first_titles.join("、")
                            );

                            let res = app_notify
                                .notification()
                                .builder()
                                .title("Daily Todos 待办批量到期提醒")
                                .body(body_text)
                                .show();

                            if res.is_ok() {
                                for (key, _) in due_todos {
                                    notified_tasks.insert(key);
                                }
                            }
                        }
                    }
                }
            }

            last_check_time = now;
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            get_app_state,
            add_todo,
            toggle_todo,
            delete_todo,
            update_todo,
            add_habit,
            add_habit_and_todo,
            update_habit,
            archive_habit,
            unarchive_habit,
            delete_habit_permanently,
            update_settings,
            export_backup_data,
            preview_import_backup,
            execute_import_backup,
            restore_backup_snapshot,
            trigger_daily_rollover,
            change_global_hotkey,
            open_main_window,
            close_main_and_show_widget,
            toggle_widget_window,
            hide_widget_window,
            resize_widget_window,
            set_widget_always_on_top
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                    if let Some(widget) = window.app_handle().get_webview_window("widget") {
                        let _ = widget.show();
                        let _ = widget.unminimize();
                        let _ = widget.set_focus();
                    }
                }
            }
        })
        .setup(|app| {
            let app_context = AppContext::new(app.handle());
            let saved_hotkey = app_context.state.settings.hotkey.clone();
            let saved_widget_mode = app_context.state.settings.widget_mode.clone();
            let saved_always_on_top = app_context.state.settings.always_on_top;

            app.manage(AppContextHandle(Mutex::new(app_context)));

            if let Some(w) = app.get_webview_window("widget") {
                let _ = w.set_maximizable(false);
                let _ = w.set_skip_taskbar(true);
                let _ = w.set_always_on_top(saved_always_on_top);
                let (width, height, resizable) = match saved_widget_mode.as_str() {
                    "pet" => (190.0, 190.0, false),
                    _ => (350.0, 500.0, true),
                };
                let _ = w.set_resizable(true);
                let _ = w.set_size(tauri::LogicalSize::new(width, height));
                let _ = w.set_resizable(resizable);
            }

            // macOS Accessory Mode
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            // Register configured global hotkey
            if let Ok(shortcut) = saved_hotkey.parse::<Shortcut>() {
                let _ = app
                    .global_shortcut()
                    .on_shortcut(shortcut, |app, _shortcut, event| {
                        if event.state() == ShortcutState::Pressed {
                            if let Some(w) = app.get_webview_window("widget") {
                                if w.is_visible().unwrap_or(false) {
                                    let _ = w.hide();
                                } else {
                                    let _ = w.show();
                                    let _ = w.set_focus();
                                }
                            }
                        }
                    });
            }

            // Create Tray Menu
            let toggle_widget_item = MenuItem::with_id(
                app,
                "toggle_widget",
                "显示/隐藏悬浮小组件",
                true,
                None::<&str>,
            )?;
            let open_main_item =
                MenuItem::with_id(app, "open_main", "打开全功能任务看板", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "退出 Daily Todos", true, None::<&str>)?;

            let tray_menu =
                Menu::with_items(app, &[&toggle_widget_item, &open_main_item, &quit_item])?;

            let _tray = TrayIconBuilder::with_id("daily_todos_tray")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .tooltip("Daily Todos 每日待办")
                .icon(app.default_window_icon().unwrap().clone())
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle_widget" => {
                        if let Some(w) = app.get_webview_window("widget") {
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                    "open_main" => {
                        let _ = open_main_window(app.clone());
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("widget") {
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // Start background tasks for midnight rollover & task notifications
            start_background_tasks(app.handle().clone());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
