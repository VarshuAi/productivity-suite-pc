/* ═══ CLIPBOARD MODULE ═══ */
let autoCapturePrev = '';

async function captureClipboard() {
  let text = '';
  if (window.api) text = await window.api.readClipboard();
  else text = await navigator.clipboard?.readText().catch(() => '');
  if (!text) return;

  const history = await loadData('clipboard_history', []);
  // Avoid duplicates
  if (history.length > 0 && history[0].text === text) return;

  history.unshift({
    id: genId(),
    text,
    time: new Date().toLocaleTimeString(),
    date: todayStr(),
    capturedAt: new Date().toISOString(),
  });

  // Limit to 200 items
  if (history.length > 200) history.pop();
  await saveData('clipboard_history', history);
  renderClipboard();
  showToast('Clipboard captured!', '📋');
}

function toggleAutoCapture() {
  state.autoCapture = document.getElementById('auto-capture').checked;
  if (state.autoCapture) {
    state.captureInterval = setInterval(async () => {
      let text = '';
      if (window.api) text = await window.api.readClipboard();
      else text = await navigator.clipboard?.readText().catch(() => '');
      if (text && text !== autoCapturePrev && text.trim()) {
        autoCapturePrev = text;
        await captureClipboard();
      }
    }, 2000);
    showToast('Auto-capture ON', '📋');
  } else {
    clearInterval(state.captureInterval);
    showToast('Auto-capture OFF', '📋');
  }
}

async function renderClipboard() {
  const history = await loadData('clipboard_history', []);
  const search = document.getElementById('clip-search')?.value?.toLowerCase() || '';
  const filtered = search
    ? history.filter(c => c.text.toLowerCase().includes(search))
    : history;

  const grid = document.getElementById('clipboard-grid');
  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">📋</div><div class="empty-text">No clipboard history yet</div></div>`;
    return;
  }

  grid.innerHTML = filtered.map(c => `
    <div class="clip-card">
      <div class="clip-content">${escHtml(c.text)}</div>
      <div class="clip-footer">
        <span class="clip-time">🕐 ${c.time}</span>
        <div class="clip-actions">
          <button class="task-action-btn" onclick="copyClipItem('${c.id}')" title="Copy">📋</button>
          <button class="task-action-btn" onclick="deleteClipItem('${c.id}')" title="Delete">🗑</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function copyClipItem(id) {
  const history = await loadData('clipboard_history', []);
  const item = history.find(c => c.id === id);
  if (!item) return;
  if (window.api) await window.api.writeClipboard(item.text);
  else navigator.clipboard?.writeText(item.text);
  showToast('Copied to clipboard!', '📋');
}

async function deleteClipItem(id) {
  const history = await loadData('clipboard_history', []);
  await saveData('clipboard_history', history.filter(c => c.id !== id));
  renderClipboard();
}

async function clearClipboardHistory() {
  await saveData('clipboard_history', []);
  renderClipboard();
  showToast('Clipboard history cleared', '🗑');
}
