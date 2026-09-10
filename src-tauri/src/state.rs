use chrono::{Datelike, Local, NaiveDate, NaiveTime};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub const STATE_CHANGED_EVENT: &str = "daily-todos://state-changed";
const DATA_FILENAME: &str = "daily_todos_data.json";
const SNAPSHOT_FILENAME: &str = "daily_todos_pre_import_snapshot.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TodoItem {
    pub id: String,
    pub title: String,
    pub completed: bool,
    #[serde(rename = "type")]
    pub todo_type: String, // "daily_habit" | "single_todo"
    pub priority: String, // "high" | "medium" | "low"
    pub due_time: Option<String>,
    pub created_at: String,
    pub completed_at: Option<String>,
    pub target_date: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub habit_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HabitItem {
    pub id: String,
    pub title: String,
    pub priority: String,
    pub due_time: Option<String>,
    pub active_days: Vec<u32>, // 0=Sun, 1=Mon, ..., 6=Sat
    pub streak: u32,
    pub last_completed_date: Option<String>,
    pub created_at: String,
    #[serde(default)]
    pub archived: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyRecord {
    pub date: String,
    pub total_tasks: u32,
    pub completed_tasks: u32,
    pub rate: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String,
    pub opacity: f64,
    pub always_on_top: bool,
    pub is_locked: bool,
    pub auto_start: bool,
    pub edge_snap: bool,
    pub sound_enabled: bool,
    #[serde(default = "default_true")]
    pub notification_enabled: bool,
    pub confetti_enabled: bool,
    pub hotkey: String,
    pub last_active_date: String,
    pub widget_mode: String,
    pub selected_pet: String,
    pub pet_speech_enabled: bool,
}

fn default_true() -> bool {
    true
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "system".into(),
            opacity: 0.88,
            always_on_top: true,
            is_locked: false,
            auto_start: false,
            edge_snap: true,
            sound_enabled: true,
            notification_enabled: true,
            confetti_enabled: true,
            hotkey: if cfg!(target_os = "macos") {
                "CommandOrControl+Shift+T".into()
            } else {
                "Alt+Shift+T".into()
            },
            last_active_date: get_today_date_str(),
            widget_mode: "list".into(),
            selected_pet: "cat".into(),
            pet_speech_enabled: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    pub todos: Vec<TodoItem>,
    pub habits: Vec<HabitItem>,
    pub records: HashMap<String, DailyRecord>,
    pub settings: AppSettings,
}

fn default_schema_version() -> Option<u32> {
    Some(1)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportData {
    pub version: String,
    #[serde(default = "default_schema_version")]
    pub backup_schema_version: Option<u32>,
    pub export_date: String,
    pub todos: Vec<TodoItem>,
    pub habits: Vec<HabitItem>,
    pub records: HashMap<String, DailyRecord>,
    pub settings: AppSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSummary {
    pub todo_count: usize,
    pub habit_count: usize,
    pub record_count: usize,
    pub export_date: Option<String>,
}

pub fn get_today_date_str() -> String {
    Local::now().format("%Y-%m-%d").to_string()
}

pub fn initial_state() -> AppState {
    let today = get_today_date_str();
    let now = Local::now().to_rfc3339();

    let habit1 = HabitItem {
        id: "habit_1".into(),
        title: "晨间专注阅读 20 分钟".into(),
        priority: "medium".into(),
        due_time: Some("08:30".into()),
        active_days: vec![1, 2, 3, 4, 5, 6, 0],
        streak: 3,
        last_completed_date: None,
        created_at: now.clone(),
        archived: Some(false),
    };

    let habit2 = HabitItem {
        id: "habit_2".into(),
        title: "每日饮水 2000ml".into(),
        priority: "low".into(),
        due_time: Some("10:00".into()),
        active_days: vec![1, 2, 3, 4, 5, 6, 0],
        streak: 5,
        last_completed_date: None,
        created_at: now.clone(),
        archived: Some(false),
    };

    let todo1 = TodoItem {
        id: "todo_1".into(),
        title: "完成本周工作总结报告".into(),
        completed: false,
        todo_type: "single_todo".into(),
        priority: "high".into(),
        due_time: Some("17:30".into()),
        created_at: now.clone(),
        completed_at: None,
        target_date: today.clone(),
        start_date: None,
        end_date: None,
        habit_id: None,
    };

    let todo2 = TodoItem {
        id: "todo_2".into(),
        title: "晨间专注阅读 20 分钟".into(),
        completed: true,
        todo_type: "daily_habit".into(),
        priority: "medium".into(),
        due_time: Some("08:30".into()),
        created_at: now.clone(),
        completed_at: Some(now.clone()),
        target_date: today.clone(),
        start_date: None,
        end_date: None,
        habit_id: Some(habit1.id.clone()),
    };

    let todo3 = TodoItem {
        id: "todo_3".into(),
        title: "每日饮水 2000ml".into(),
        completed: false,
        todo_type: "daily_habit".into(),
        priority: "low".into(),
        due_time: Some("10:00".into()),
        created_at: now,
        completed_at: None,
        target_date: today,
        start_date: None,
        end_date: None,
        habit_id: Some(habit2.id.clone()),
    };

    AppState {
        todos: vec![todo1, todo2, todo3],
        habits: vec![habit1, habit2],
        records: HashMap::new(),
        settings: AppSettings::default(),
    }
}

pub struct StateStore {
    data_path: PathBuf,
    snapshot_path: PathBuf,
}

impl StateStore {
    pub fn new(app_handle: &AppHandle) -> Self {
        let base_dir = app_handle
            .path()
            .app_data_dir()
            .unwrap_or_else(|_| PathBuf::from("./"));
        let _ = fs::create_dir_all(&base_dir);

        Self {
            data_path: base_dir.join(DATA_FILENAME),
            snapshot_path: base_dir.join(SNAPSHOT_FILENAME),
        }
    }

    pub fn load_state(&self) -> AppState {
        if self.data_path.exists() {
            match fs::read_to_string(&self.data_path) {
                Ok(content) => match serde_json::from_str::<AppState>(&content) {
                    Ok(state) => return state,
                    Err(e) => {
                        eprintln!("[DailyTodos] 状态文件已损坏，无法解析: {}", e);
                        let ts = Local::now().format("%Y%m%d_%H%M%S").to_string();
                        let corrupted_filename = format!("daily_todos_data.corrupted_{}.json", ts);
                        let corrupted_path = self.data_path.with_file_name(corrupted_filename);
                        if let Err(rename_err) = fs::rename(&self.data_path, &corrupted_path) {
                            eprintln!("[DailyTodos] 归档损坏状态文件失败: {}", rename_err);
                        } else {
                            eprintln!(
                                "[DailyTodos] 已将损坏状态文件安全归档至: {:?}",
                                corrupted_path
                            );
                        }

                        if self.snapshot_path.exists() {
                            if let Ok(snapshot_state) = self.restore_snapshot() {
                                eprintln!("[DailyTodos] 已成功从历史快照中自愈恢复状态！");
                                return snapshot_state;
                            }
                        }

                        return AppState {
                            todos: Vec::new(),
                            habits: Vec::new(),
                            records: HashMap::new(),
                            settings: AppSettings::default(),
                        };
                    }
                },
                Err(e) => {
                    eprintln!("[DailyTodos] 读取状态文件失败: {}", e);
                }
            }
        }

        let state = initial_state();
        let _ = self.save_state(&state);
        state
    }

    pub fn save_state(&self, state: &AppState) -> Result<(), String> {
        let temp_path = self.data_path.with_extension("tmp");
        let json_bytes = serde_json::to_vec_pretty(state).map_err(|e| e.to_string())?;

        fs::write(&temp_path, json_bytes).map_err(|e| e.to_string())?;
        fs::rename(&temp_path, &self.data_path).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn create_pre_import_snapshot(&self) -> Result<(), String> {
        if self.data_path.exists() {
            fs::copy(&self.data_path, &self.snapshot_path).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn restore_snapshot(&self) -> Result<AppState, String> {
        if !self.snapshot_path.exists() {
            return Err("未找到历史快照文件".into());
        }
        let content = fs::read_to_string(&self.snapshot_path).map_err(|e| e.to_string())?;
        let state: AppState = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        self.save_state(&state)?;
        Ok(state)
    }

    #[cfg(test)]
    pub fn for_test(data_path: PathBuf, snapshot_path: PathBuf) -> Self {
        Self {
            data_path,
            snapshot_path,
        }
    }
}

/// Single Mutex Context holding both AppState and StateStore
/// Eliminating lock order inversions and providing atomic rollback capability
pub struct AppContext {
    pub state: AppState,
    pub store: StateStore,
}

impl AppContext {
    pub fn new(app_handle: &AppHandle) -> Self {
        let store = StateStore::new(app_handle);
        let mut state = store.load_state();
        let today = get_today_date_str();
        apply_daily_rollover(&mut state, &today);
        let _ = store.save_state(&state);

        Self { state, store }
    }

    #[cfg(test)]
    pub fn for_test(state: AppState, store: StateStore) -> Self {
        Self { state, store }
    }

    /// Mutate state and save to disk; if disk save fails, automatically rollback in-memory state
    pub fn mutate_and_save<F, R>(&mut self, mutator: F) -> Result<R, String>
    where
        F: FnOnce(&mut AppState) -> Result<R, String>,
    {
        let previous_state = self.state.clone();
        let result = match mutator(&mut self.state) {
            Ok(val) => val,
            Err(e) => {
                self.state = previous_state;
                return Err(e);
            }
        };

        if let Err(e) = self.store.save_state(&self.state) {
            // Atomic rollback on disk failure!
            self.state = previous_state;
            return Err(format!("保存到本地磁盘失败，已自动恢复状态: {}", e));
        }

        Ok(result)
    }
}

/// Dynamic Streak Backtracking Algorithm
/// Given a habit and the list of all todos, calculate streak respecting activeDays.
pub fn calculate_habit_streak(
    habit: &HabitItem,
    todos: &[TodoItem],
    today_str: &str,
) -> (u32, Option<String>) {
    let today = match NaiveDate::parse_from_str(today_str, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => return (0, None),
    };

    let mut completed_dates = HashSet::new();
    let mut latest_completed: Option<NaiveDate> = None;

    for todo in todos {
        if todo.habit_id.as_deref() == Some(&habit.id) && todo.completed {
            if let Ok(d) = NaiveDate::parse_from_str(&todo.target_date, "%Y-%m-%d") {
                completed_dates.insert(d);
                if latest_completed.is_none() || Some(d) > latest_completed {
                    latest_completed = Some(d);
                }
            }
        }
    }

    if habit.active_days.is_empty() {
        return (
            0,
            latest_completed.map(|d| d.format("%Y-%m-%d").to_string()),
        );
    }

    let is_day_active = |d: NaiveDate| -> bool {
        let weekday_sun0 = d.weekday().num_days_from_sunday();
        habit.active_days.contains(&weekday_sun0)
    };

    let mut streak = 0;
    let mut current_day = today;

    if is_day_active(today) && completed_dates.contains(&today) {
        streak += 1;
    }

    for _ in 0..365 {
        current_day = match current_day.pred_opt() {
            Some(d) => d,
            None => break,
        };

        if !is_day_active(current_day) {
            continue;
        }

        if completed_dates.contains(&current_day) {
            streak += 1;
        } else {
            break;
        }
    }

    let latest_str = latest_completed.map(|d| d.format("%Y-%m-%d").to_string());
    (streak, latest_str)
}

/// Recalculate streaks for all habits in the state
pub fn refresh_all_streaks(state: &mut AppState, today: &str) {
    let streaks: Vec<(u32, Option<String>)> = state
        .habits
        .iter()
        .map(|h| calculate_habit_streak(h, &state.todos, today))
        .collect();

    for (i, (streak, last_date)) in streaks.into_iter().enumerate() {
        if let Some(h) = state.habits.get_mut(i) {
            h.streak = streak;
            h.last_completed_date = last_date;
        }
    }
}

/// Apply day rollover logic with multi-day catchup (P1.1 & P2 5.1)
pub fn apply_daily_rollover(state: &mut AppState, today: &str) {
    let last_date_str = state.settings.last_active_date.clone();

    if let (Ok(mut cur_date), Ok(today_date)) = (
        NaiveDate::parse_from_str(&last_date_str, "%Y-%m-%d"),
        NaiveDate::parse_from_str(today, "%Y-%m-%d"),
    ) {
        // Multi-day playback: iterate day-by-day from last_date up to today
        while cur_date < today_date {
            let cur_str = cur_date.format("%Y-%m-%d").to_string();
            let cur_weekday = cur_date.weekday().num_days_from_sunday();

            // Calculate or backfill record for cur_date if missing
            if !state.records.contains_key(&cur_str) {
                let day_todos: Vec<_> = state
                    .todos
                    .iter()
                    .filter(|t| t.target_date == cur_str)
                    .collect();

                let active_habits_count = state
                    .habits
                    .iter()
                    .filter(|h| {
                        !h.archived.unwrap_or(false) && h.active_days.contains(&cur_weekday)
                    })
                    .count();

                if !day_todos.is_empty() {
                    let total = day_todos.len() as u32;
                    let completed = day_todos.iter().filter(|t| t.completed).count() as u32;
                    let rate = if total > 0 {
                        ((completed as f64 / total as f64) * 100.0).round() as u32
                    } else {
                        0
                    };
                    state.records.insert(
                        cur_str.clone(),
                        DailyRecord {
                            date: cur_str.clone(),
                            total_tasks: total,
                            completed_tasks: completed,
                            rate,
                        },
                    );
                } else if active_habits_count > 0 {
                    // Missed day: generate 0% completed record
                    state.records.insert(
                        cur_str.clone(),
                        DailyRecord {
                            date: cur_str.clone(),
                            total_tasks: active_habits_count as u32,
                            completed_tasks: 0,
                            rate: 0,
                        },
                    );
                }
            }

            match cur_date.succ_opt() {
                Some(next_date) => cur_date = next_date,
                None => break,
            }
        }

        // Rollover incomplete single todos scheduled before today
        for todo in &mut state.todos {
            if todo.todo_type == "single_todo"
                && !todo.completed
                && todo.target_date.as_str() < today
            {
                todo.target_date = today.to_string();
            }
        }

        state.settings.last_active_date = today.to_string();
    }

    // Ensure today's habits are generated (excluding archived habits)
    let parsed_today = NaiveDate::parse_from_str(today, "%Y-%m-%d").ok();
    let current_day_of_week = parsed_today
        .map(|d| d.weekday().num_days_from_sunday())
        .unwrap_or(0);

    let mut existing_habit_ids = HashSet::new();
    for t in &state.todos {
        if t.target_date == today && t.todo_type == "daily_habit" {
            if let Some(hid) = &t.habit_id {
                existing_habit_ids.insert(hid.clone());
            }
        }
    }

    let mut new_todos = Vec::new();
    let now_str = Local::now().to_rfc3339();

    for habit in &state.habits {
        if habit.archived.unwrap_or(false) {
            continue;
        }
        if habit.active_days.contains(&current_day_of_week)
            && !existing_habit_ids.contains(&habit.id)
        {
            new_todos.push(TodoItem {
                id: format!("habit_todo_{}_{}", habit.id, today),
                title: habit.title.clone(),
                completed: false,
                todo_type: "daily_habit".into(),
                priority: habit.priority.clone(),
                due_time: habit.due_time.clone(),
                created_at: now_str.clone(),
                completed_at: None,
                target_date: today.into(),
                start_date: None,
                end_date: None,
                habit_id: Some(habit.id.clone()),
            });
        }
    }

    if !new_todos.is_empty() {
        state.todos.extend(new_todos);
    }

    refresh_all_streaks(state, today);
}

fn validate_due_time(time_str: &str) -> bool {
    NaiveTime::parse_from_str(time_str, "%H:%M").is_ok()
}

fn validate_date_str(date_str: &str) -> bool {
    NaiveDate::parse_from_str(date_str, "%Y-%m-%d").is_ok()
}

/// Zero-tolerance strict Schema validation for backup import (P1 4.3)
pub fn validate_import_data(raw_json: &str) -> Result<(AppState, ImportSummary), String> {
    if raw_json.len() > 5 * 1024 * 1024 {
        return Err("备份文件体积超过 5MB 上限".into());
    }

    #[derive(Deserialize)]
    struct FullBackup {
        todos: Option<Vec<serde_json::Value>>,
        habits: Option<Vec<serde_json::Value>>,
        records: Option<HashMap<String, serde_json::Value>>,
        settings: Option<serde_json::Value>,
        version: Option<String>,
        #[serde(rename = "exportDate")]
        export_date: Option<String>,
    }

    let parsed: FullBackup =
        serde_json::from_str(raw_json).map_err(|e| format!("JSON 格式解析失败: {}", e))?;

    let version = parsed.version.unwrap_or_else(|| "1.1.2".into());
    if version.trim().is_empty() {
        return Err("备份文件版本号不能为空".into());
    }

    let raw_habits = parsed.habits.ok_or("备份中缺少 habits 习惯列表")?;
    if raw_habits.len() > 1000 {
        return Err("习惯项数量超过上限 (1000)".into());
    }

    let mut validated_habits: Vec<HabitItem> = Vec::with_capacity(raw_habits.len());
    let mut habit_ids = HashSet::new();

    for (idx, val) in raw_habits.into_iter().enumerate() {
        let item: HabitItem = serde_json::from_value(val)
            .map_err(|e| format!("习惯项 [{}] 字段类型异常: {}", idx, e))?;

        if item.id.trim().is_empty() || item.id.len() > 64 {
            return Err(format!("习惯项 [{}] ID 长度非法", idx));
        }
        if item.title.trim().is_empty() || item.title.len() > 120 {
            return Err(format!("习惯「{}」名称长度非法 (1~120字符)", item.title));
        }
        if !["high", "medium", "low"].contains(&item.priority.as_str()) {
            return Err(format!(
                "习惯「{}」优先级非法: {}",
                item.title, item.priority
            ));
        }
        if let Some(due) = &item.due_time {
            if !validate_due_time(due) {
                return Err(format!(
                    "习惯「{}」执行时间格式非法 (应为 HH:MM): {}",
                    item.title, due
                ));
            }
        }
        if item.active_days.is_empty() {
            return Err(format!("习惯「{}」生效星期不能为空", item.title));
        }
        let mut seen_days = HashSet::new();
        for d in &item.active_days {
            if *d > 6 || !seen_days.insert(*d) {
                return Err(format!(
                    "习惯「{}」生效星期包含重复或非法数值: {}",
                    item.title, d
                ));
            }
        }
        if !habit_ids.insert(item.id.clone()) {
            return Err(format!("习惯 ID 重复: {}", item.id));
        }
        validated_habits.push(item);
    }

    let raw_todos = parsed.todos.ok_or("备份中缺少 todos 待办列表")?;
    if raw_todos.len() > 10000 {
        return Err("待办事项数量超过上限 (10000)".into());
    }

    let mut validated_todos: Vec<TodoItem> = Vec::with_capacity(raw_todos.len());
    let mut todo_ids = HashSet::new();

    for (idx, val) in raw_todos.into_iter().enumerate() {
        let item: TodoItem = serde_json::from_value(val)
            .map_err(|e| format!("待办事项 [{}] 字段类型异常: {}", idx, e))?;

        if item.id.trim().is_empty() || item.id.len() > 64 {
            return Err(format!("待办事项 [{}] ID 长度非法", idx));
        }
        if item.title.trim().is_empty() || item.title.len() > 200 {
            return Err(format!("待办「{}」标题长度非法 (1~200字符)", item.title));
        }
        if !["high", "medium", "low"].contains(&item.priority.as_str()) {
            return Err(format!(
                "待办「{}」优先级非法: {}",
                item.title, item.priority
            ));
        }
        if !["daily_habit", "single_todo"].contains(&item.todo_type.as_str()) {
            return Err(format!(
                "待办「{}」类型非法: {}",
                item.title, item.todo_type
            ));
        }
        if !validate_date_str(&item.target_date) {
            return Err(format!(
                "待办「{}」目标日期格式非法: {}",
                item.title, item.target_date
            ));
        }
        if let Some(due) = &item.due_time {
            if !validate_due_time(due) {
                return Err(format!(
                    "待办「{}」时间格式非法 (应为 HH:MM): {}",
                    item.title, due
                ));
            }
        }
        if let Some(sd) = &item.start_date {
            if !validate_date_str(sd) {
                return Err(format!("待办「{}」开始日期格式非法: {}", item.title, sd));
            }
        }
        if let Some(ed) = &item.end_date {
            if !validate_date_str(ed) {
                return Err(format!("待办「{}」截止日期格式非法: {}", item.title, ed));
            }
        }

        // Validate foreign key relation for daily_habit
        if item.todo_type == "daily_habit" {
            match &item.habit_id {
                Some(hid) if habit_ids.contains(hid) => {}
                Some(hid) => {
                    return Err(format!(
                        "待办「{}」关联了不存在的习惯 ID: {}",
                        item.title, hid
                    ));
                }
                None => {
                    return Err(format!("每日习惯待办「{}」缺少关联的 habitId", item.title));
                }
            }
        }

        if !todo_ids.insert(item.id.clone()) {
            return Err(format!("待办 ID 重复: {}", item.id));
        }
        validated_todos.push(item);
    }

    let mut validated_records: HashMap<String, DailyRecord> = HashMap::new();
    if let Some(map) = parsed.records {
        if map.len() > 3650 {
            return Err("历史记录数量超过 10 年上限".into());
        }
        for (k, v) in map {
            if !validate_date_str(&k) {
                return Err(format!("历史记录日期键名非法: {}", k));
            }
            let rec: DailyRecord = serde_json::from_value(v)
                .map_err(|e| format!("历史记录「{}」字段异常: {}", k, e))?;

            if rec.date != k {
                return Err(format!("历史记录键值日期不匹配: {} vs {}", k, rec.date));
            }
            if rec.completed_tasks > rec.total_tasks {
                return Err(format!("历史记录「{}」完成数超过总任务数", k));
            }
            if rec.rate > 100 {
                return Err(format!("历史记录「{}」完成率超过 100%", k));
            }
            validated_records.insert(k, rec);
        }
    }

    let validated_settings: AppSettings = match parsed.settings {
        Some(v) => {
            let s: AppSettings =
                serde_json::from_value(v).map_err(|e| format!("设置配置字段异常: {}", e))?;

            if !["system", "light", "dark"].contains(&s.theme.as_str()) {
                return Err(format!("未知的主题设置: {}", s.theme));
            }
            if !(0.35..=1.0).contains(&s.opacity) {
                return Err(format!("小组件不透明度超出范围 (0.35~1.0): {}", s.opacity));
            }
            if !["list", "pet"].contains(&s.widget_mode.as_str()) {
                return Err(format!("未知的小组件模式: {}", s.widget_mode));
            }
            let is_builtin_pet =
                ["cat", "dog", "slime", "robot"].contains(&s.selected_pet.as_str());
            let local_pet_name = s.selected_pet.strip_prefix("local:");
            let is_local_pet = s.selected_pet.len() <= 64
                && local_pet_name.is_some_and(|name| {
                    !name.is_empty()
                        && name
                            .chars()
                            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
                });
            if !is_builtin_pet && !is_local_pet {
                return Err(format!("未知的桌宠选项: {}", s.selected_pet));
            }
            if s.hotkey.trim().is_empty() || s.hotkey.len() > 64 {
                return Err("快捷键配置格式非法".into());
            }
            if !validate_date_str(&s.last_active_date) {
                return Err("最后活跃日期格式非法".into());
            }
            s
        }
        None => AppSettings::default(),
    };

    let summary = ImportSummary {
        todo_count: validated_todos.len(),
        habit_count: validated_habits.len(),
        record_count: validated_records.len(),
        export_date: parsed.export_date,
    };

    let mut state = AppState {
        todos: validated_todos,
        habits: validated_habits,
        records: validated_records,
        settings: validated_settings,
    };

    let today = get_today_date_str();
    apply_daily_rollover(&mut state, &today);

    Ok((state, summary))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_streak_calculation_active_days_and_skips() {
        let habit = HabitItem {
            id: "h1".into(),
            title: "Test Habit".into(),
            priority: "medium".into(),
            due_time: None,
            active_days: vec![1, 2, 3, 4, 5],
            streak: 0,
            last_completed_date: None,
            created_at: "2026-09-01T00:00:00Z".into(),
            archived: Some(false),
        };

        let todos = vec![
            TodoItem {
                id: "t1".into(),
                title: "Test".into(),
                completed: true,
                todo_type: "daily_habit".into(),
                priority: "medium".into(),
                due_time: None,
                created_at: "".into(),
                completed_at: None,
                target_date: "2026-09-04".into(), // Friday
                start_date: None,
                end_date: None,
                habit_id: Some("h1".into()),
            },
            TodoItem {
                id: "t2".into(),
                title: "Test".into(),
                completed: true,
                todo_type: "daily_habit".into(),
                priority: "medium".into(),
                due_time: None,
                created_at: "".into(),
                completed_at: None,
                target_date: "2026-09-03".into(), // Thursday
                start_date: None,
                end_date: None,
                habit_id: Some("h1".into()),
            },
        ];

        let (streak, _) = calculate_habit_streak(&habit, &todos, "2026-09-07");
        assert_eq!(streak, 2);
    }

    #[test]
    fn test_streak_breaks_on_missed_active_day() {
        let habit = HabitItem {
            id: "h1".into(),
            title: "Daily Habit".into(),
            priority: "medium".into(),
            due_time: None,
            active_days: vec![0, 1, 2, 3, 4, 5, 6],
            streak: 0,
            last_completed_date: None,
            created_at: "2026-09-01T00:00:00Z".into(),
            archived: Some(false),
        };

        let todos = vec![TodoItem {
            id: "t1".into(),
            title: "Test".into(),
            completed: true,
            todo_type: "daily_habit".into(),
            priority: "medium".into(),
            due_time: None,
            created_at: "".into(),
            completed_at: None,
            target_date: "2026-09-05".into(),
            start_date: None,
            end_date: None,
            habit_id: Some("h1".into()),
        }];

        let (streak, _) = calculate_habit_streak(&habit, &todos, "2026-09-07");
        assert_eq!(streak, 0);
    }

    #[test]
    fn test_multi_day_absence_catchup_rollover() {
        let mut state = AppState {
            todos: vec![TodoItem {
                id: "single_1".into(),
                title: "Overdue task".into(),
                completed: false,
                todo_type: "single_todo".into(),
                priority: "high".into(),
                due_time: None,
                created_at: "".into(),
                completed_at: None,
                target_date: "2026-09-01".into(),
                start_date: None,
                end_date: None,
                habit_id: None,
            }],
            habits: vec![HabitItem {
                id: "h1".into(),
                title: "Everyday".into(),
                priority: "medium".into(),
                due_time: None,
                active_days: vec![0, 1, 2, 3, 4, 5, 6],
                streak: 5,
                last_completed_date: None,
                created_at: "".into(),
                archived: Some(false),
            }],
            records: HashMap::new(),
            settings: AppSettings {
                last_active_date: "2026-09-01".into(),
                ..Default::default()
            },
        };

        // App was closed from Sep 1 to Sep 4
        apply_daily_rollover(&mut state, "2026-09-04");

        // The single todo should be rolled over to today (2026-09-04)
        assert_eq!(state.todos[0].target_date, "2026-09-04");

        // All intermediate missed days should have daily records!
        assert!(state.records.contains_key("2026-09-01"));
        assert!(state.records.contains_key("2026-09-02"));
        assert!(state.records.contains_key("2026-09-03"));
        assert_eq!(state.records["2026-09-02"].rate, 0);
        assert_eq!(state.records["2026-09-03"].rate, 0);
    }

    #[test]
    fn test_validate_import_data_rejects_missing_foreign_habit_id() {
        let bad_json = r#"{
            "version": "1.1.2",
            "todos": [{
                "id": "t1",
                "title": "Invalid habit task",
                "completed": false,
                "type": "daily_habit",
                "priority": "high",
                "createdAt": "2026-09-01T00:00:00Z",
                "targetDate": "2026-09-07",
                "habitId": "non_existent_habit"
            }],
            "habits": []
        }"#;
        let res = validate_import_data(bad_json);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("不存在的习惯 ID"));
    }

    #[test]
    fn test_validate_import_data_rejects_invalid_theme() {
        let bad_json = r#"{
            "version": "1.1.2",
            "todos": [],
            "habits": [],
            "settings": {
                "theme": "invalid_neon_theme",
                "opacity": 0.88,
                "alwaysOnTop": true,
                "isLocked": false,
                "autoStart": false,
                "edgeSnap": true,
                "soundEnabled": true,
                "confettiEnabled": true,
                "hotkey": "Alt+Shift+T",
                "lastActiveDate": "2026-09-07",
                "widgetMode": "list",
                "selectedPet": "cat",
                "petSpeechEnabled": true
            }
        }"#;
        let res = validate_import_data(bad_json);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("未知的主题设置"));
    }

    #[test]
    fn test_validate_import_data_accepts_local_pet() {
        let json = r#"{
            "version": "1.1.8",
            "todos": [],
            "habits": [],
            "settings": {
                "theme": "system",
                "opacity": 0.88,
                "alwaysOnTop": true,
                "isLocked": false,
                "autoStart": false,
                "edgeSnap": true,
                "soundEnabled": true,
                "notificationEnabled": true,
                "confettiEnabled": true,
                "hotkey": "Alt+Shift+T",
                "lastActiveDate": "2026-09-09",
                "widgetMode": "pet",
                "selectedPet": "local:sample-pet",
                "petSpeechEnabled": true
            }
        }"#;

        let (state, _) = validate_import_data(json).expect("local pet should be valid");
        assert_eq!(state.settings.selected_pet, "local:sample-pet");
    }

    #[test]
    fn test_mutate_and_save_disk_failure_rollback() {
        use std::env;
        let temp_dir = env::temp_dir().join(format!(
            "todos_test_rollback_{}",
            Local::now().timestamp_nanos_opt().unwrap_or(0)
        ));
        let _ = fs::create_dir_all(&temp_dir);

        let initial = initial_state();
        let initial_todos_count = initial.todos.len();

        // Non-writable path (nested inside a non-existent subfolder)
        let non_writable_path = temp_dir.join("non_existent_folder_xyz").join("data.json");
        let snapshot_path = temp_dir.join("snapshot.json");

        let store = StateStore::for_test(non_writable_path, snapshot_path);
        let mut ctx = AppContext::for_test(initial.clone(), store);

        let res = ctx.mutate_and_save(|state| {
            state.todos.push(TodoItem {
                id: "should_rollback".into(),
                title: "Rollback me".into(),
                completed: false,
                todo_type: "single_todo".into(),
                priority: "high".into(),
                due_time: None,
                created_at: "".into(),
                completed_at: None,
                target_date: "2026-09-07".into(),
                start_date: None,
                end_date: None,
                habit_id: None,
            });
            Ok(())
        });

        assert!(res.is_err(), "Persistence should have failed");
        // State must be completely rolled back to initial state
        assert_eq!(ctx.state.todos.len(), initial_todos_count);
        assert!(!ctx.state.todos.iter().any(|t| t.id == "should_rollback"));

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_concurrent_mutations_and_snapshot_no_deadlock() {
        use std::env;
        use std::sync::{Arc, Mutex};
        use std::thread;

        let temp_dir = env::temp_dir().join(format!(
            "todos_test_concurrent_{}",
            Local::now().timestamp_nanos_opt().unwrap_or(0)
        ));
        let _ = fs::create_dir_all(&temp_dir);

        let data_path = temp_dir.join("data.json");
        let snapshot_path = temp_dir.join("snapshot.json");
        let store = StateStore::for_test(data_path, snapshot_path);
        let ctx = Arc::new(Mutex::new(AppContext::for_test(initial_state(), store)));

        let mut handles = Vec::new();

        for i in 0..4 {
            let ctx_clone = Arc::clone(&ctx);
            let handle = thread::spawn(move || {
                for j in 0..15 {
                    let mut lock = ctx_clone.lock().unwrap();
                    let _ = lock.mutate_and_save(|state| {
                        state.todos.push(TodoItem {
                            id: format!("t_{}_{}", i, j),
                            title: format!("Task {}-{}", i, j),
                            completed: j % 2 == 0,
                            todo_type: "single_todo".into(),
                            priority: "medium".into(),
                            due_time: None,
                            created_at: "".into(),
                            completed_at: None,
                            target_date: "2026-09-07".into(),
                            start_date: None,
                            end_date: None,
                            habit_id: None,
                        });
                        Ok(())
                    });
                }
            });
            handles.push(handle);
        }

        for _ in 0..2 {
            let ctx_clone = Arc::clone(&ctx);
            let handle = thread::spawn(move || {
                for _ in 0..10 {
                    let lock = ctx_clone.lock().unwrap();
                    let _ = lock.store.create_pre_import_snapshot();
                    let _ = lock.state.todos.len();
                }
            });
            handles.push(handle);
        }

        for h in handles {
            h.join().expect("Thread panicked or deadlocked");
        }

        let final_lock = ctx.lock().unwrap();
        assert!(final_lock.state.todos.len() >= 60);

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_validate_import_data_matrix() {
        let bad_opacity = r#"{
            "version": "1.1.2",
            "todos": [], "habits": [],
            "settings": { "opacity": 0.1 }
        }"#;
        assert!(validate_import_data(bad_opacity).is_err());

        let bad_priority = r#"{
            "version": "1.1.2",
            "todos": [],
            "habits": [{
                "id": "h1", "title": "Habit", "priority": "extreme_urgent",
                "activeDays": [1, 2, 3], "streak": 0, "createdAt": "2026-09-01T00:00:00Z"
            }]
        }"#;
        assert!(validate_import_data(bad_priority).is_err());

        let bad_due = r#"{
            "version": "1.1.2",
            "todos": [],
            "habits": [{
                "id": "h1", "title": "Habit", "priority": "high", "dueTime": "25:99",
                "activeDays": [1, 2, 3], "streak": 0, "createdAt": "2026-09-01T00:00:00Z"
            }]
        }"#;
        assert!(validate_import_data(bad_due).is_err());

        let duplicate_habits = r#"{
            "version": "1.1.2",
            "todos": [],
            "habits": [
                { "id": "h1", "title": "H1", "priority": "high", "activeDays": [1], "streak": 0, "createdAt": "" },
                { "id": "h1", "title": "H1", "title_repeat": "H2", "priority": "high", "activeDays": [1], "streak": 0, "createdAt": "" }
            ]
        }"#;
        assert!(validate_import_data(duplicate_habits).is_err());
    }

    #[test]
    fn test_corrupted_state_file_is_isolated_and_not_overwritten() {
        use std::env;
        let temp_dir = env::temp_dir().join(format!(
            "todos_test_corrupt_{}",
            Local::now().timestamp_nanos_opt().unwrap_or(0)
        ));
        let _ = fs::create_dir_all(&temp_dir);

        let data_path = temp_dir.join("daily_todos_data.json");
        let snapshot_path = temp_dir.join("daily_todos_pre_import_snapshot.json");

        // Write damaged/malformed JSON to data file
        let corrupted_content = "{ \"todos\": [ broken json syntax ...";
        fs::write(&data_path, corrupted_content).unwrap();

        let store = StateStore::for_test(data_path.clone(), snapshot_path);
        let state = store.load_state();

        // 1. Original broken file should have been moved/archived to a corrupted_*.json file
        assert!(
            !data_path.exists(),
            "Original corrupted file path should be moved"
        );

        // 2. A corrupted backup file must exist in temp_dir preserving the broken content
        let entries: Vec<_> = fs::read_dir(&temp_dir)
            .unwrap()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_name().to_string_lossy().contains("corrupted_"))
            .collect();
        assert_eq!(entries.len(), 1, "Must archive exactly 1 corrupted backup");

        let backup_content = fs::read_to_string(entries[0].path()).unwrap();
        assert_eq!(
            backup_content, corrupted_content,
            "Corrupted content must be 100% preserved"
        );

        // 3. Returned state should be a safe empty fallback, not unverified sample data
        assert_eq!(state.todos.len(), 0);

        let _ = fs::remove_dir_all(&temp_dir);
    }
}
