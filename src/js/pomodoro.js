/* ═══ POMODORO MODULE ═══ */
let pomoTimer = null;
let pomoRunning = false;
let pomoMode = 'work';
let pomoSecondsLeft = 25 * 60;
let pomoTotalSeconds = 25 * 60;
let pomoSessionNum = 1;

const POMO_COLORS = { work: '#ef4444', short: '#22c55e', long: '#38bdf8' };
const POMO_LABELS = { work: 'Focus Time', short: 'Short Break', long: 'Long Break' };

function getPomoSettings() {
  return {
    work: parseInt(document.getElementById('pomo-work-dur')?.value) || 25,
    short: parseInt(document.getElementById('pomo-short-dur')?.value) || 5,
    long: parseInt(document.getElementById('pomo-long-dur')?.value) || 15,
    target: parseInt(document.getElementById('pomo-sessions-target')?.value) || 4,
  };
}

function setPomoMode(mode, btn) {
  pomoMode = mode;
  const s = getPomoSettings();
  pomoSecondsLeft = s[mode] * 60;
  pomoTotalSeconds = pomoSecondsLeft;

  document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const progress = document.getElementById('timer-progress');
  if (progress) progress.style.stroke = POMO_COLORS[mode];
  document.getElementById('timer-label').textContent = POMO_LABELS[mode];

  stopTimer();
  updateTimerDisplay();
  updateTimerRing();
}

function updateTimerDisplay() {
  const m = Math.floor(pomoSecondsLeft / 60);
  const s = pomoSecondsLeft % 60;
  document.getElementById('timer-display').textContent =
    `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function updateTimerRing() {
  const circumference = 2 * Math.PI * 88;
  const progress = pomoSecondsLeft / pomoTotalSeconds;
  const offset = circumference * (1 - progress);
  const ring = document.getElementById('timer-progress');
  if (ring) ring.style.strokeDashoffset = offset;
}

function toggleTimer() {
  if (pomoRunning) stopTimer();
  else startTimer();
}

function startTimer() {
  pomoRunning = true;
  document.getElementById('pomo-toggle').textContent = '⏸ Pause';
  pomoTimer = setInterval(tick, 1000);
}

function stopTimer() {
  pomoRunning = false;
  clearInterval(pomoTimer);
  const btn = document.getElementById('pomo-toggle');
  if (btn) btn.textContent = '▶ Start';
}

async function tick() {
  if (pomoSecondsLeft <= 0) {
    clearInterval(pomoTimer);
    pomoRunning = false;

    // Log completed session
    const log = await loadData('pomodoro_log', []);
    const task = document.getElementById('pomo-task-label')?.value || '';
    log.unshift({ type: pomoMode, date: todayStr(), time: new Date().toLocaleTimeString(), task });
    await saveData('pomodoro_log', log);

    showToast(pomoMode === 'work' ? '🎉 Focus session done! Take a break.' : '⏱️ Break done! Back to work.', '🍅');

    // Auto advance
    const s = getPomoSettings();
    if (pomoMode === 'work') {
      pomoSessionNum++;
      document.getElementById('pomo-session-num').textContent = pomoSessionNum;
      if (pomoSessionNum > s.target) {
        pomoSessionNum = 1;
        setPomoMode('long', null);
      } else {
        setPomoMode('short', null);
      }
    } else {
      setPomoMode('work', null);
    }

    renderPomoLog();
    updateDashSessions();
    return;
  }

  pomoSecondsLeft--;
  updateTimerDisplay();
  updateTimerRing();
}

async function updateDashSessions() {
  const log = await loadData('pomodoro_log', []);
  const count = log.filter(l => l.date === todayStr() && l.type === 'work').length;
  const el = document.getElementById('dash-sessions');
  if (el) el.textContent = count;
}

function resetTimer() {
  stopTimer();
  const s = getPomoSettings();
  pomoSecondsLeft = s[pomoMode] * 60;
  pomoTotalSeconds = pomoSecondsLeft;
  updateTimerDisplay();
  updateTimerRing();
}

function skipSession() {
  pomoSecondsLeft = 0;
  tick();
}

function updatePomoSettings() {
  resetTimer();
  const s = getPomoSettings();
  document.getElementById('pomo-session-target').textContent = s.target;
}

async function renderPomoLog() {
  const log = await loadData('pomodoro_log', []);
  const el = document.getElementById('pomo-log');
  if (!el) return;

  const recent = log.slice(0, 8);
  if (recent.length === 0) {
    el.innerHTML = '<div style="color:var(--text-muted);font-size:12px;">No sessions yet</div>';
    return;
  }

  el.innerHTML = recent.map(l => `
    <div class="pomo-log-item">
      <span>${l.type === 'work' ? '🍅' : l.type === 'short' ? '☕' : '🌙'}</span>
      <span>${l.type}</span>
      <span style="flex:1;">${escHtml(l.task || '')}</span>
      <span>${l.time}</span>
    </div>
  `).join('');

  const todayCount = log.filter(l => l.date === todayStr() && l.type === 'work').length;
  document.getElementById('pomo-today').textContent = todayCount;
}

// Init on page load
window.addEventListener('DOMContentLoaded', () => {
  updateTimerDisplay();
  renderPomoLog();
  document.getElementById('pomo-session-target').textContent = getPomoSettings().target;
});
