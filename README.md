# ⚡ Productivity Suite — PC (Electron)

> A comprehensive, premium personal productivity suite for Windows, macOS, and Linux.
> Built with **Electron + HTML/CSS/JavaScript**.

[![GitHub](https://img.shields.io/badge/GitHub-VARSHAN69-purple?style=flat-square&logo=github)](https://github.com/VARSHAN69)

---

## 🚀 Features

| Module | Description |
|--------|-------------|
| 🏠 **Dashboard** | At-a-glance overview of all modules |
| ✅ **Task Manager** | Full CRUD tasks with priorities, due dates, categories |
| 📝 **Notes** | Auto-saving notes with search |
| 🔥 **Habit Tracker** | Daily habits with streak tracking & 7-day chart |
| ⏱️ **Pomodoro Timer** | Focus timer with ring animation, session logging |
| 💰 **Budget Tracker** | Income/expense tracking with category breakdown |
| 📅 **Calendar & Planner** | Monthly calendar with events |
| 🔐 **Password Manager** | Local encrypted vault with password generator |
| 📋 **Clipboard Manager** | Clipboard history with auto-capture |
| 📁 **File Organizer** | Browse, quick-access, and open files |

---

## 📸 Design Highlights

- 🌙 **Dark Premium Theme** — `#0a0a0f` background with purple accent (`#6c63ff`)
- ✨ **Glassmorphism Cards** — Subtle borders with glow effects on hover
- 🎨 **Inter + JetBrains Mono** fonts for readability
- 🏃 **Smooth Animations** — Fade-in, slide-up, hover transforms
- 📱 **Responsive Sidebar** — Collapses on smaller windows

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- npm v8+

### Install & Run
```bash
# Install dependencies
npm install

# Start the app
npm start

# Development mode
npm run dev
```

### Build for Production
```bash
npm run build
```

---

## 📁 Project Structure

```
productivity-suite-pc/
├── main.js              # Electron main process
├── preload.js           # Context bridge (IPC)
├── package.json
├── src/
│   ├── index.html       # Main UI shell
│   ├── styles/
│   │   └── main.css     # Complete design system
│   └── js/
│       ├── app.js       # Navigation, utilities, dashboard
│       ├── tasks.js     # Task manager
│       ├── notes.js     # Notes module
│       ├── habits.js    # Habit tracker
│       ├── pomodoro.js  # Pomodoro timer
│       ├── budget.js    # Budget tracker
│       ├── calendar.js  # Calendar & events
│       ├── passwords.js # Password vault
│       ├── clipboard.js # Clipboard manager
│       └── files.js     # File organizer
└── assets/
```

---

## 🔐 Password Vault

Default master password: `admin123`

> ⚠️ All data is stored **locally** on your machine in Electron's userData directory.
> No cloud sync. No telemetry.

---

## 🧩 Tech Stack

- **[Electron](https://www.electronjs.org/)** — Cross-platform desktop framework
- **Vanilla HTML/CSS/JS** — No frontend framework needed
- **Node.js fs** — Local data persistence (JSON files)
- **Inter + JetBrains Mono** — Google Fonts

---

## 📄 License

MIT © 2024 [Varshan Gowda](https://github.com/VARSHAN69)
