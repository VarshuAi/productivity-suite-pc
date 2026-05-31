/* ═══ PASSWORDS MODULE ═══ */
const MASTER_PASS = 'admin123';
let editPassId = null;

function unlockVault() {
  const input = document.getElementById('master-pass-input').value;
  if (input === MASTER_PASS) {
    state.vaultUnlocked = true;
    document.getElementById('vault-lock-screen').style.display = 'none';
    document.getElementById('vault-content').style.display = 'block';
    renderPasswords();
  } else {
    showToast('Wrong master password!', '🔒');
    document.getElementById('master-pass-input').value = '';
    document.getElementById('master-pass-input').style.borderColor = 'var(--danger)';
    setTimeout(() => {
      document.getElementById('master-pass-input').style.borderColor = '';
    }, 1000);
  }
}

function lockVault() {
  state.vaultUnlocked = false;
  document.getElementById('vault-lock-screen').style.display = 'flex';
  document.getElementById('vault-content').style.display = 'none';
  document.getElementById('master-pass-input').value = '';
}

function openPassModal(id = null) {
  editPassId = id;
  document.getElementById('pass-modal-title').textContent = id ? 'Edit Password' : 'Add Password';
  document.getElementById('pass-site').value = '';
  document.getElementById('pass-user').value = '';
  document.getElementById('pass-password').value = '';
  document.getElementById('pass-url').value = '';
  document.getElementById('pass-notes').value = '';

  if (id) {
    loadData('passwords', []).then(passes => {
      const p = passes.find(x => x.id === id);
      if (p) {
        document.getElementById('pass-site').value = p.site;
        document.getElementById('pass-user').value = p.username;
        document.getElementById('pass-password').value = p.password;
        document.getElementById('pass-url').value = p.url || '';
        document.getElementById('pass-notes').value = p.notes || '';
      }
    });
  }

  document.getElementById('pass-modal').classList.add('open');
  document.getElementById('pass-site').focus();
}

function closePassModal() {
  document.getElementById('pass-modal').classList.remove('open');
  editPassId = null;
}

async function savePassword() {
  const site = document.getElementById('pass-site').value.trim();
  const password = document.getElementById('pass-password').value;
  if (!site || !password) { showToast('Site and password required', '⚠️'); return; }

  const passes = await loadData('passwords', []);
  const entry = {
    id: editPassId || genId(),
    site,
    username: document.getElementById('pass-user').value.trim(),
    password,
    url: document.getElementById('pass-url').value.trim(),
    notes: document.getElementById('pass-notes').value.trim(),
    updatedAt: new Date().toISOString(),
  };

  if (editPassId) {
    const idx = passes.findIndex(p => p.id === editPassId);
    if (idx !== -1) passes[idx] = entry;
  } else {
    passes.unshift(entry);
  }

  await saveData('passwords', passes);
  closePassModal();
  renderPasswords();
  showToast(editPassId ? 'Password updated!' : 'Password saved!', '🔐');
}

async function renderPasswords() {
  const passes = await loadData('passwords', []);
  const search = document.getElementById('pass-search')?.value?.toLowerCase() || '';
  const filtered = search
    ? passes.filter(p => p.site.toLowerCase().includes(search) || (p.username || '').toLowerCase().includes(search))
    : passes;

  const grid = document.getElementById('passwords-grid');
  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🔐</div><div class="empty-text">No passwords saved yet</div></div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div class="pass-card">
      <div class="pass-site">
        <span class="pass-site-icon">🌐</span>
        <span>${escHtml(p.site)}</span>
      </div>
      <div class="pass-user">👤 ${escHtml(p.username || 'No username')}</div>
      <div class="pass-pw">••••••••••••</div>
      <div class="pass-actions">
        <button class="btn-ghost" onclick="copyPassword('${p.id}')" style="padding:6px 10px;font-size:11px;">📋 Copy Pass</button>
        <button class="btn-ghost" onclick="copyUsername('${p.id}')" style="padding:6px 10px;font-size:11px;">👤 Copy User</button>
        <button class="task-action-btn" onclick="openPassModal('${p.id}')" title="Edit">✏️</button>
        <button class="task-action-btn" onclick="deletePassword('${p.id}')" title="Delete">🗑</button>
      </div>
      ${p.url ? `<div style="margin-top:8px;"><a style="font-size:11px;color:var(--accent-2);text-decoration:none;" href="${escHtml(p.url)}" target="_blank">🔗 ${escHtml(p.url)}</a></div>` : ''}
    </div>
  `).join('');
}

async function copyPassword(id) {
  const passes = await loadData('passwords', []);
  const p = passes.find(x => x.id === id);
  if (!p) return;
  if (window.api) await window.api.writeClipboard(p.password);
  else navigator.clipboard?.writeText(p.password);
  showToast('Password copied!', '📋');
}

async function copyUsername(id) {
  const passes = await loadData('passwords', []);
  const p = passes.find(x => x.id === id);
  if (!p) return;
  if (window.api) await window.api.writeClipboard(p.username);
  else navigator.clipboard?.writeText(p.username);
  showToast('Username copied!', '👤');
}

async function deletePassword(id) {
  const passes = await loadData('passwords', []);
  await saveData('passwords', passes.filter(p => p.id !== id));
  renderPasswords();
  showToast('Password deleted', '🗑');
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}';
  let pw = '';
  for (let i = 0; i < 16; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  document.getElementById('pass-password').value = pw;
  document.getElementById('pass-password').type = 'text';
}

function togglePassVis(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.type = el.type === 'password' ? 'text' : 'password';
}

document.getElementById('pass-modal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('pass-modal')) closePassModal();
});

document.getElementById('master-pass-input')?.addEventListener('keyup', e => {
  if (e.key === 'Enter') unlockVault();
});
