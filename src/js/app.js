/* ═══════════════════════════════════════════════════════════════
   APP.JS — Core navigation, utilities, and dashboard
   ═══════════════════════════════════════════════════════════════ */

// ─── GLOBAL STATE ────────────────────────────────────────────────
window.state = {
  currentPage: 'dashboard',
  taskFilter: 'all',
  txFilter: 'all',
  vaultUnlocked: false,
  autoCapture: false,
  captureInterval: null,
  currentNoteId: null,
  currentDir: null,
  dirHistory: [],
};

const QUOTES = [
  { q: "The secret of getting ahead is getting started.", a: "Mark Twain" },
  { q: "It always seems impossible until it's done.", a: "Nelson Mandela" },
  { q: "Don't watch the clock; do what it does. Keep going.", a: "Sam Levenson" },
  { q: "The future depends on what you do today.", a: "Mahatma Gandhi" },
  { q: "You don't have to be great to start, but you have to start to be great.", a: "Zig Ziglar" },
  { q: "Success is the sum of small efforts, repeated day in and day out.", a: "Robert Collier" },
  { q: "Believe you can and you're halfway there.", a: "Theodore Roosevelt" },
  { q: "Action is the foundational key to all success.", a: "Pablo Picasso" },
  { q: "Well done is better than well said.", a: "Benjamin Franklin" },
  { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
  { q: "Focus on being productive instead of busy.", a: "Tim Ferriss" },
  { q: "Your time is limited, don't waste it living someone else's life.", a: "Steve Jobs" },
];

// ─── NAVIGATION ──────────────────────────────────────────────────
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  const navEl = document.getElementById(`nav-${page}`);

  if (pageEl) pageEl.classList.add('active');
  if (navEl) navEl.classList.add('active');

  state.currentPage = page;

  // Trigger page-specific init
  const init = { tasks: renderTasks, notes: renderNotesList, habits: renderHabits,
    budget: renderTransactions, calendar: renderCalendar, passwords: null,
    clipboard: renderClipboard, files: renderQuickAccess, dashboard: renderDashboard };
  if (init[page]) init[page]();
}

// ─── NAV CLICK HANDLERS ──────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.page));
});

// ─── WINDOW CONTROLS ─────────────────────────────────────────────
document.getElementById('btn-minimize').addEventListener('click', () => window.api?.minimize());
document.getElementById('btn-maximize').addEventListener('click', () => window.api?.maximize());
document.getElementById('btn-close').addEventListener('click', () => window.api?.close());

// ─── CLOCK ───────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  document.getElementById('sidebar-clock').textContent =
    `${String(hh).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
  document.getElementById('sidebar-date').textContent =
    now.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// ─── TOAST ───────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, icon = '✓') {
  const t = document.getElementById('toast');
  t.innerHTML = `<span>${icon}</span> ${msg}`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── DASHBOARD ───────────────────────────────────────────────────
async function renderDashboard() {
  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
  document.getElementById('greeting-time').textContent = greeting;
  document.getElementById('dashboard-date').textContent =
    now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Tasks
  const tasks = await loadData('tasks', []);
  const pending = tasks.filter(t => !t.done);
  document.getElementById('dash-tasks-count').textContent = pending.length;
  document.getElementById('badge-tasks-count').textContent = pending.length || '';

  // Habits
  const habits = await loadData('habits', []);
  const today = todayStr();
  const doneHabits = habits.filter(h => h.checks?.[today] >= (h.goal || 1));
  document.getElementById('dash-habits-done').textContent = `${doneHabits.length}/${habits.length}`;

  // Budget
  const txs = await loadData('transactions', []);
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  document.getElementById('dash-balance').textContent = `₹${(income - expense).toLocaleString('en-IN')}`;

  // Pomodoro sessions today
  const pomoLog = await loadData('pomodoro_log', []);
  const todaySessions = pomoLog.filter(l => l.date === today && l.type === 'work').length;
  document.getElementById('dash-sessions').textContent = todaySessions;

  // Notes
  const notes = await loadData('notes', []);
  document.getElementById('dash-notes-count').textContent = notes.length;

  // Events
  const events = await loadData('events', []);
  const upcoming = events.filter(e => new Date(e.date) >= now).length;
  document.getElementById('dash-events').textContent = upcoming;

  // Today's tasks list
  const list = document.getElementById('dashboard-tasks-list');
  const todayTasks = tasks.filter(t => !t.done).slice(0, 5);
  if (todayTasks.length === 0) {
    list.innerHTML = '<div class="empty-state" style="padding:20px 0;"><div class="empty-text">🎉 All tasks done!</div></div>';
  } else {
    list.innerHTML = todayTasks.map(t => `
      <div class="dash-task-item">
        <div class="dash-task-priority" style="background:${priorityColor(t.priority)}"></div>
        <span style="flex:1;font-size:13px;">${escHtml(t.title)}</span>
        <span class="task-priority-badge priority-${t.priority}">${t.priority}</span>
      </div>
    `).join('');
  }

  // Quote
  const qi = Math.floor(Math.random() * QUOTES.length);
  document.getElementById('daily-quote').textContent = `"${QUOTES[qi].q}"`;
  document.querySelector('.quote-author').textContent = `— ${QUOTES[qi].a}`;
}

function newQuote() {
  const qi = Math.floor(Math.random() * QUOTES.length);
  document.getElementById('daily-quote').textContent = `"${QUOTES[qi].q}"`;
  document.querySelector('.quote-author').textContent = `— ${QUOTES[qi].a}`;
}

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function priorityColor(p) {
  return { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', urgent: '#ef4444' }[p] || '#9090b8';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.floor((d - now) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr + 'T00:00:00') < new Date(new Date().toDateString());
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// ─── DATA HELPERS (with localStorage fallback) ────────────────────
async function loadData(name, defaultVal = []) {
  if (window.api) return await window.api.readData(name, defaultVal);
  const raw = localStorage.getItem(`ps_${name}`);
  return raw ? JSON.parse(raw) : defaultVal;
}

async function saveData(name, data) {
  if (window.api) return await window.api.writeData(name, data);
  localStorage.setItem(`ps_${name}`, JSON.stringify(data));
}

// ─── INIT ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
});
