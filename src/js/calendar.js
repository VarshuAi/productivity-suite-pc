/* ═══ CALENDAR MODULE ═══ */
let calDate = new Date();

async function renderCalendar() {
  const events = await loadData('events', []);
  const year = calDate.getFullYear();
  const month = calDate.getMonth();

  document.getElementById('cal-month-title').textContent =
    calDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const grid = document.getElementById('calendar-grid');
  if (!grid) return;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let html = DAYS.map(d => `<div class="cal-day-header">${d}</div>`).join('');

  // Prev month filler
  const prevDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month"><div class="cal-day-num">${prevDays - i}</div></div>`;
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const dayEvents = events.filter(e => e.date === dateStr);

    html += `
      <div class="cal-day ${isToday ? 'today' : ''}" onclick="openEventModal('${dateStr}')">
        <div class="cal-day-num">${d}</div>
        ${dayEvents.map(e => `<div class="cal-event-dot" style="background:${e.color || 'var(--accent)'}"></div>`).join('')}
      </div>
    `;
  }

  // Next month filler
  const cellsFilled = firstDay + daysInMonth;
  const remaining = (7 - (cellsFilled % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    html += `<div class="cal-day other-month"><div class="cal-day-num">${d}</div></div>`;
  }

  grid.innerHTML = html;

  // Events list
  const list = document.getElementById('events-list');
  if (!list) return;
  const upcoming = events.filter(e => new Date(e.date + 'T00:00:00') >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 20);

  if (upcoming.length === 0) {
    list.innerHTML = `<div class="empty-state" style="padding:20px 0;"><div class="empty-icon">📅</div><div class="empty-text">No upcoming events</div></div>`;
  } else {
    list.innerHTML = upcoming.map(e => `
      <div class="event-item">
        <div class="event-color-bar" style="background:${e.color || 'var(--accent)'}"></div>
        <div class="event-info">
          <div class="event-title">${escHtml(e.title)}</div>
          <div class="event-datetime">${formatDate(e.date)}${e.time ? ' · ' + e.time : ''}</div>
          ${e.desc ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${escHtml(e.desc.substring(0,50))}</div>` : ''}
        </div>
        <button class="event-del" onclick="deleteEvent('${e.id}')">🗑</button>
      </div>
    `).join('');
  }
}

function changeMonth(dir) {
  calDate.setMonth(calDate.getMonth() + dir);
  renderCalendar();
}

function openEventModal(dateStr = null) {
  document.getElementById('event-title').value = '';
  document.getElementById('event-date').value = dateStr || todayStr();
  document.getElementById('event-time').value = '';
  document.getElementById('event-desc').value = '';
  document.getElementById('event-color').value = '#6c63ff';
  document.getElementById('event-modal').classList.add('open');
  document.getElementById('event-title').focus();
}

function closeEventModal() {
  document.getElementById('event-modal').classList.remove('open');
}

async function saveEvent() {
  const title = document.getElementById('event-title').value.trim();
  const date = document.getElementById('event-date').value;
  if (!title || !date) { showToast('Title and date are required', '⚠️'); return; }

  const events = await loadData('events', []);
  events.push({
    id: genId(),
    title,
    date,
    time: document.getElementById('event-time').value,
    desc: document.getElementById('event-desc').value.trim(),
    color: document.getElementById('event-color').value,
  });

  await saveData('events', events);
  closeEventModal();
  renderCalendar();
  showToast('Event added!', '📅');
}

async function deleteEvent(id) {
  const events = await loadData('events', []);
  await saveData('events', events.filter(e => e.id !== id));
  renderCalendar();
  showToast('Event deleted', '🗑');
}

document.getElementById('event-modal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('event-modal')) closeEventModal();
});
