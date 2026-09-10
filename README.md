# Daily Todos · 桌面每日待办与习惯悬浮小组件

基于 **Tauri v2 + React 19 + TypeScript + TailwindCSS** 构建的现代化、极轻量、跨平台（Windows 11 & macOS）桌面每日待办悬浮小组件应用。

---

## ✨ 核心特性

- 🪟 **双形态架构**：
  - **桌面悬浮小组件 (Widget)**：半透明磨砂毛玻璃质感，支持自由拖拽、无边框、置顶浮动 (`Always-on-Top`)、透明度调节、防误触锁定、边缘微标折叠。
  - **全功能管理看板 (Main Window)**：包含今日看板、每日循环习惯库、近 28 天打卡热力图、系统偏好设置与数据迁移。
- 🔄 **每日待办机制**：
  - **每日循环习惯**：次日零点自动重置打卡状态，统计连胜天数（Streak）。
  - **单次待办**：未完成任务次日平滑顺延至今日清单，避免遗漏。
  - **轻量任务属性**：高/中/低三档彩色优先级标点、可选设定提醒时间点。
- ⚡ **内联极速输入**：小组件底部常驻快速输入栏，键盘敲入待办按 `Enter` 即可秒存。
- 🎵 **精致反馈动效**：完成打勾触发清脆轻悦的和弦提示音（基于 Web Audio API 原生合成，零外部资源消耗）及多彩纸屑微粒子动效。
- 🔒 **100% 纯本地隐私与跨平台互通**：数据保存于本地设备，支持一键导出/导入通用的 `todos_backup.json`，在 Windows 与 Mac 设备间双向快速迁移。
- 🍎 **macOS 原生适配**：
  - 自动启用 **Accessory 模式**（隐藏 Dock 栏图标，常驻顶部 Menu Bar 菜单栏）。
  - 原生毛玻璃质感，键盘快捷键自适应 Mac 修饰符（`⌘ Command`, `⌥ Option`）。

---

## 📦 下载与安装

安装包可从 [GitHub Releases](https://github.com/Xusq513/daily-todos/releases) 页面下载：

- **Windows x64**：推荐下载 `DailyTodos_*-setup.exe`（NSIS 安装程序），也可使用 `.msi` 安装程序。
- **macOS Apple Silicon**：M 系列芯片请选择 `*_aarch64.dmg`。
- **macOS Intel**：Intel 芯片请选择 `*_x64.dmg`。

> [!WARNING]
> 当前测试版本尚未进行正式代码签名。Windows SmartScreen 可能提示风险；macOS 首次启动时可能需要前往“系统设置 → 隐私与安全性”手动允许。请只从本项目的 GitHub Releases 页面下载安装包。

---

## 🛠️ 常用开发与运行命令

### 1. 启动本地开发服务 (支持浏览器直接预览或桌面双窗口)
```bash
# 安装依赖 (如首次克隆)
npm install

# 启动 Web 前端独立调试 (浏览器中可点击一键在悬浮窗与主看板间切换)
npm run dev

# 启动 Tauri 桌面端运行 (启动原生桌面双窗口及系统托盘)
npm run tauri dev
```

### 2. 打包为桌面独立安装包

#### 在 Windows 上：
```bash
npm run tauri build
```
将在 `src-tauri/target/release/bundle/` 下生成：
- Windows NSIS 安装程序 `*-setup.exe`
- Windows MSI 安装程序 `.msi`

#### 在 macOS 上：
在 Mac 机器上克隆本项目，执行相同命令：
```bash
npm install
npm run tauri build
```
将自动产出：
- macOS 原生应用包 `.app`
- macOS 磁盘镜像安装包 `.dmg`（支持 Apple Silicon M系列芯片及 Intel 架构）

---

## 📁 项目工程架构

```
d:/agy-workspace/todos/
├── src-tauri/                 # Tauri v2 原生核心 (Rust)
│   ├── Cargo.toml             # Rust 依赖与功能特性 (启用 tray-icon 等)
│   ├── tauri.conf.json        # 双窗口定义 (widget & main) 与跨平台配置
│   ├── capabilities/          # 窗口安全能力授权
│   └── src/
│       ├── main.rs            # 应用入口
│       └── lib.rs             # 跨平台托盘菜单、macOS Accessory 策略与原生命令
├── src/                       # React 前端工程 (Windows & macOS 通用)
│   ├── App.tsx                # 多窗口路由调度与深浅色主题自适应
│   ├── index.css              # Fluent 磨砂毛玻璃、半透明与动画样式
│   ├── store/
│   │   └── useTodoStore.ts    # 统一状态管理、跨日自动顺延与跨窗口广播
│   ├── types/
│   │   └── index.ts           # TodoItem, HabitItem, AppSettings 模型定义
│   ├── utils/
│   │   ├── date.ts            # 日期格式化与热力图计算
│   │   ├── platform.ts        # Windows / macOS 平台按键识别
│   │   ├── sound.ts           # Web Audio 清脆提示音合成
│   │   └── tauriBridge.ts     # 窗口拖拽、置顶、切换跨环境安全桥
│   └── components/
│       ├── widget/            # 桌面悬浮小组件 (Header, Input, List, Item)
│       └── main/              # 全功能管理看板 (Sidebar, Today, Habits, Calendar, Settings)
```

---

## 💬 反馈与建议

这是一个仍在持续改进的测试版本。欢迎大家提出更多建议和问题，帮助我不断改进 Daily Todos。你可以前往 [GitHub Issues](https://github.com/Xusq513/daily-todos/issues) 留下反馈。

---

## 📄 开源许可

本项目基于 [MIT License](LICENSE) 开源。第三方依赖及其许可信息请参阅 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
