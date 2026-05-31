/* ═══ TASKS MODULE ═══ */
let editTaskId = null;

async function renderTasks() {
  const tasks = await loadData('tasks', []);
  const search = document.getElementById('task-search')?.value?.toLowerCase() || '';
  let filtered = tasks;

  if (state.taskFilter === 'today') {
    const td = todayStr();
    filtered = filtered.filter(t => t.due === td || !t.due);
  } else if (state.taskFilter === 'high') {
    filtered = filtered.filter(t => t.priority === 'high' || t.priority === 'urgent');
  } else if (state.taskFilter === 'pending') {
    filtered = filtered.filter(t => !t.done);
  } else if (state.taskFilter === 'done') {
    filtered = filtered.filter(t => t.done);
  }

  if (search) filtered = filtered.filter(t =>
    t.title.toLowerCase().includes(search) || (t.desc || '').toLowerCase().includes(search)
  );

  const list = document.getElementById('task-list');
  if (!list) return;

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-text">No tasks here!</div></div>`;
    return;
  }

  list.innerHTML = filtered.sort((a, b) => {
    const order = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (order[a.priority] || 2) - (order[b.priority] || 2);
  }).map(t => `
    <div class="task-item ${t.done ? 'done' : ''}" id="task-${t.id}">
      <div class="task-checkbox" onclick="toggleTask('${t.id}')">${t.done ? '✓' : ''}</div>
      <div class="task-body">
        <div class="task-title">${escHtml(t.title)}</div>
        ${t.desc ? `<div class="task-desc">${escHtml(t.desc)}</div>` : ''}
        <div class="task-meta">
          <span class="task-priority-badge priority-${t.priority}">${t.priority}</span>
          ${t.due ? `<span class="task-due ${isOverdue(t.due) && !t.done ? 'overdue' : ''}">📅 ${relativeTime(t.due)}</span>` : ''}
          ${t.category ? `<span class="task-cat">${escHtml(t.category)}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="task-action-btn" onclick="editTask('${t.id}')" title="Edit">✏️</button>
        <button class="task-action-btn" onclick="deleteTask('${t.id}')" title="Delete">🗑</button>
      </div>
    </div>
  `).join('');

  // Update badge
  const pending = tasks.filter(t => !t.done).length;
  const badge = document.getElementById('badge-tasks-count');
  if (badge) badge.textContent = pending || '';
}

function filterTasks(filter, btn) {
  state.taskFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => {
    if (b.closest('#page-tasks')) b.classList.remove('active');
  });
  btn.classList.add('active');
  renderTasks();
}

function openTaskModal(id = null) {
  editTaskId = id;
  document.getElementById('task-modal-title').textContent = id ? 'Edit Task' : 'New Task';
  document.getElementById('task-title').value = '';
  document.getElementById('task-desc').value = '';
  document.getElementById('task-priority').value = 'medium';
  document.getElementById('task-due').value = '';
  document.getElementById('task-category').value = '';

  if (id) {
    loadData('tasks', []).then(tasks => {
      const t = tasks.find(x => x.id === id);
      if (t) {
        document.getElementById('task-title').value = t.title;
        document.getElementById('task-desc').value = t.desc || '';
        document.getElementById('task-priority').value = t.priority;
        document.getElementById('task-due').value = t.due || '';
        document.getElementById('task-category').value = t.category || '';
      }
    });
  }

  document.getElementById('task-modal').classList.add('open');
  document.getElementById('task-title').focus();
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.remove('open');
  editTaskId = null;
}

async function saveTask() {
  const title = document.getElementById('task-title').value.trim();
  if (!title) { showToast('Task title is required', '⚠️'); return; }

  const tasks = await loadData('tasks', []);
  const taskData = {
    id: editTaskId || genId(),
    title,
    desc: document.getElementById('task-desc').value.trim(),
    priority: document.getElementById('task-priority').value,
    due: document.getElementById('task-due').value,
    category: document.getElementById('task-category').value.trim(),
    done: false,
    createdAt: new Date().toISOString(),
  };

  if (editTaskId) {
    const idx = tasks.findIndex(t => t.id === editTaskId);
    if (idx !== -1) { taskData.done = tasks[idx].done; tasks[idx] = taskData; }
  } else {
    tasks.unshift(taskData);
  }

  await saveData('tasks', tasks);
  closeTaskModal();
  renderTasks();
  showToast(editTaskId ? 'Task updated!' : 'Task created!', '✅');
}

async function toggleTask(id) {
  const tasks = await loadData('tasks', []);
  const idx = tasks.findIndex(t => t.id === id);
  if (idx !== -1) {
    tasks[idx].done = !tasks[idx].done;
    await saveData('tasks', tasks);
    renderTasks();
    if (tasks[idx].done) showToast('Task completed! 🎉', '✅');
  }
}

function editTask(id) { openTaskModal(id); }

async function deleteTask(id) {
  const tasks = await loadData('tasks', []);
  await saveData('tasks', tasks.filter(t => t.id !== id));
  renderTasks();
  showToast('Task deleted', '🗑');
}

// Close modal on overlay click
document.getElementById('task-modal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('task-modal')) closeTaskModal();
});
