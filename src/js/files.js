/* ═══ FILES MODULE ═══ */
const FILE_ICONS = {
  '.pdf': '📄', '.doc': '📝', '.docx': '📝', '.xls': '📊', '.xlsx': '📊',
  '.ppt': '📊', '.pptx': '📊', '.txt': '📄', '.md': '📄',
  '.jpg': '🖼', '.jpeg': '🖼', '.png': '🖼', '.gif': '🖼', '.svg': '🖼', '.webp': '🖼',
  '.mp4': '🎬', '.mov': '🎬', '.avi': '🎬', '.mkv': '🎬',
  '.mp3': '🎵', '.wav': '🎵', '.flac': '🎵',
  '.zip': '📦', '.rar': '📦', '.7z': '📦', '.tar': '📦',
  '.js': '⚡', '.ts': '⚡', '.html': '🌐', '.css': '🎨',
  '.py': '🐍', '.java': '☕', '.dart': '💙', '.kt': '🟣',
  '.json': '📋', '.yaml': '📋', '.xml': '📋',
  '.exe': '⚙️', '.msi': '⚙️',
};

function getFileIcon(name, isDir) {
  if (isDir) return '📁';
  const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
  return FILE_ICONS[ext] || '📄';
}

async function renderQuickAccess() {
  const quickAccess = await loadData('quick_access', []);
  const list = document.getElementById('quick-access-list');
  if (!list) return;

  if (quickAccess.length === 0) {
    list.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">No quick access folders added</div>';
    return;
  }

  list.innerHTML = quickAccess.map(qa => `
    <div class="qa-item ${state.currentDir === qa.path ? 'active' : ''}"
         onclick="openDir('${qa.path.replace(/\\/g,'\\\\').replace(/'/g, "\\'")}')">
      <span>📁</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(qa.name)}</span>
      <button onclick="event.stopPropagation();removeQuickAccess('${qa.path.replace(/\\/g,'\\\\').replace(/'/g, "\\'")}')"
        style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:11px;">✕</button>
    </div>
  `).join('');
}

async function addQuickAccess() {
  if (!window.api) { showToast('File browsing requires Electron app', '⚠️'); return; }
  const dir = await window.api.openFolder();
  if (!dir) return;

  const qa = await loadData('quick_access', []);
  if (qa.find(x => x.path === dir)) { showToast('Already in quick access', 'ℹ️'); return; }

  const name = dir.split(/[\\/]/).pop() || dir;
  qa.push({ path: dir, name });
  await saveData('quick_access', qa);
  renderQuickAccess();
  openDir(dir);
  showToast(`Added "${name}" to quick access`, '📁');
}

async function removeQuickAccess(path) {
  const qa = await loadData('quick_access', []);
  await saveData('quick_access', qa.filter(x => x.path !== path));
  renderQuickAccess();
  showToast('Removed from quick access', '🗑');
}

async function browseFolder() {
  if (!window.api) { showToast('File browsing requires Electron app', '⚠️'); return; }
  const dir = await window.api.openFolder();
  if (dir) openDir(dir);
}

async function openDir(dir) {
  if (!window.api) { showToast('File browsing requires Electron app', '⚠️'); return; }

  if (state.currentDir && dir !== state.currentDir) {
    state.dirHistory.push(state.currentDir);
  }
  state.currentDir = dir;

  document.getElementById('file-path').textContent = dir;
  document.getElementById('btn-go-up').disabled = false;

  const entries = await window.api.readDir(dir);
  const grid = document.getElementById('files-grid');
  if (!grid) return;

  if (entries.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">📂</div><div class="empty-text">Empty folder</div></div>`;
    return;
  }

  // Sort: directories first, then files
  const sorted = [...entries.filter(e => e.isDirectory), ...entries.filter(e => !e.isDirectory)];

  grid.innerHTML = sorted.map(e => `
    <div class="file-card" ondblclick="${e.isDirectory ? `openDir('${e.path.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')` : `openFile('${e.path.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')`)}"
         title="${escHtml(e.path)}" oncontextmenu="fileContextMenu(event, '${e.path.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')">
      <div class="file-card-icon">${getFileIcon(e.name, e.isDirectory)}</div>
      <div class="file-card-name">${escHtml(e.name)}</div>
    </div>
  `).join('');

  renderQuickAccess();
}

function goUp() {
  if (!state.currentDir) return;
  const parts = state.currentDir.replace(/\\/g, '/').split('/');
  parts.pop();
  const parent = parts.join('/').replace(/\//g, '\\') || state.currentDir.split('\\')[0] + '\\';
  openDir(parent);
}

function refreshDir() {
  if (state.currentDir) openDir(state.currentDir);
}

async function openFile(path) {
  if (window.api) await window.api.openPath(path);
}

function fileContextMenu(event, path) {
  event.preventDefault();
  // Simple: show in explorer
  if (window.api) window.api.showInFolder(path);
}
