/* ═══ HABITS MODULE ═══ */

function openHabitModal() {
  document.getElementById('habit-name').value = '';
  document.getElementById('habit-icon').value = '⭐';
  document.getElementById('habit-color').value = '#6c63ff';
  document.getElementById('habit-goal').value = '1';
  document.getElementById('habit-modal').classList.add('open');
  document.getElementById('habit-name').focus();
}

function closeHabitModal() {
  document.getElementById('habit-modal').classList.remove('open');
}

async function saveHabit() {
  const name = document.getElementById('habit-name').value.trim();
  if (!name) { showToast('Habit name required', '⚠️'); return; }
  const habits = await loadData('habits', []);
  habits.push({
    id: genId(),
    name,
    icon: document.getElementById('habit-icon').value.trim() || '⭐',
    color: document.getElementById('habit-color').value,
    goal: parseInt(document.getElementById('habit-goal').value) || 1,
    checks: {},
    createdAt: new Date().toISOString(),
  });
  await saveData('habits', habits);
  closeHabitModal();
  renderHabits();
  showToast('Habit created!', '🔥');
}

async function renderHabits() {
  const habits = await loadData('habits', []);
  const today = todayStr();
  document.getElementById('habit-date-label').textContent =
    new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

  const grid = document.getElementById('habits-grid');
  if (!grid) return;

  if (habits.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🔥</div><div class="empty-text">No habits yet. Add your first habit!</div></div>`;
    renderHabitsChart([]);
    return;
  }

  grid.innerHTML = habits.map(h => {
    const done = (h.checks?.[today] || 0);
    const goal = h.goal || 1;
    const pct = Math.min((done / goal) * 100, 100);
    const completed = done >= goal;
    const streak = calcStreak(h);
    return `
      <div class="habit-card ${completed ? 'completed' : ''}">
        <div class="habit-header">
          <div class="habit-icon-name">
            <span class="habit-icon">${h.icon}</span>
            <span class="habit-name">${escHtml(h.name)}</span>
          </div>
          <span class="habit-streak">🔥 ${streak}</span>
        </div>
        <div class="habit-progress-bar">
          <div class="habit-progress-fill" style="width:${pct}%;background:${h.color}"></div>
        </div>
        <div class="habit-actions">
          <span class="habit-count">${done}/${goal}</span>
          <div style="display:flex;gap:4px;">
            <button class="habit-check-btn" onclick="checkHabit('${h.id}')">
              ${completed ? '✓ Done' : '+ Check'}
            </button>
            <button class="task-action-btn" onclick="deleteHabit('${h.id}')" title="Delete">🗑</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  renderHabitsChart(habits);
}

function calcStreak(habit) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().split('T')[0];
    if ((habit.checks?.[key] || 0) >= (habit.goal || 1)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

async function checkHabit(id) {
  const habits = await loadData('habits', []);
  const today = todayStr();
  const h = habits.find(x => x.id === id);
  if (!h) return;
  h.checks = h.checks || {};
  h.checks[today] = (h.checks[today] || 0) + 1;
  await saveData('habits', habits);
  renderHabits();
  if (h.checks[today] >= (h.goal || 1)) showToast(`${h.icon} ${h.name} completed!`, '🎉');
}

async function deleteHabit(id) {
  const habits = await loadData('habits', []);
  await saveData('habits', habits.filter(h => h.id !== id));
  renderHabits();
  showToast('Habit deleted', '🗑');
}

function renderHabitsChart(habits) {
  const chart = document.getElementById('habits-chart');
  if (!chart) return;
  if (habits.length === 0) { chart.innerHTML = ''; return; }

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  chart.innerHTML = habits.map(h => `
    <div style="flex-shrink:0;">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;display:flex;align-items:center;gap:4px;">
        <span>${h.icon}</span> <span>${escHtml(h.name)}</span>
      </div>
      <div style="display:flex;gap:3px;">
        ${days.map(day => {
          const done = (h.checks?.[day] || 0) >= (h.goal || 1);
          const d = new Date(day + 'T00:00:00');
          return `<div title="${d.toLocaleDateString('en-IN', {month:'short',day:'numeric'})}"
            style="width:28px;height:28px;border-radius:4px;background:${done ? h.color : 'var(--bg-secondary)'};
            opacity:${done ? 1 : 0.4};border:1px solid var(--border);transition:all 0.2s;"></div>`;
        }).join('')}
      </div>
    </div>
  `).join('');
}

document.getElementById('habit-modal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('habit-modal')) closeHabitModal();
});
