/* ═══ NOTES MODULE ═══ */
let currentNoteId = null;
let noteAutoSaveTimer = null;

async function renderNotesList() {
  const notes = await loadData('notes', []);
  const search = document.getElementById('note-search')?.value?.toLowerCase() || '';
  const filtered = search
    ? notes.filter(n => n.title.toLowerCase().includes(search) || n.content.toLowerCase().includes(search))
    : notes;

  const list = document.getElementById('notes-list');
  if (!list) return;

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state" style="padding:30px 0;"><div class="empty-icon">📝</div><div class="empty-text">No notes yet</div></div>`;
    return;
  }

  list.innerHTML = filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(n => `
    <div class="note-list-item ${n.id === currentNoteId ? 'active' : ''}" onclick="openNote('${n.id}')">
      <div class="note-list-title">${escHtml(n.title || 'Untitled')}</div>
      <div class="note-list-preview">${escHtml((n.content || '').substring(0, 60))}</div>
      <div class="note-list-date">${new Date(n.updatedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
    </div>
  `).join('');
}

async function openNote(id) {
  const notes = await loadData('notes', []);
  const note = notes.find(n => n.id === id);
  if (!note) return;

  currentNoteId = id;
  renderNotesList();

  const editor = document.getElementById('notes-editor');
  editor.innerHTML = `
    <div class="note-editor-header">
      <input class="note-title-input" id="note-title-edit" placeholder="Note title..." value="${escHtml(note.title || '')}"
        oninput="scheduleNoteSave()" />
      <button class="btn-danger" onclick="deleteNote('${id}')">🗑 Delete</button>
    </div>
    <textarea class="note-content-input" id="note-content-edit" placeholder="Start writing..."
      oninput="scheduleNoteSave()">${escHtml(note.content || '')}</textarea>
  `;
  document.getElementById('note-title-edit').focus();
}

async function newNote() {
  const notes = await loadData('notes', []);
  const note = {
    id: genId(),
    title: 'New Note',
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notes.unshift(note);
  await saveData('notes', notes);
  renderNotesList();
  openNote(note.id);
  showToast('New note created', '📝');
}

function scheduleNoteSave() {
  clearTimeout(noteAutoSaveTimer);
  noteAutoSaveTimer = setTimeout(saveCurrentNote, 800);
}

async function saveCurrentNote() {
  if (!currentNoteId) return;
  const title = document.getElementById('note-title-edit')?.value || '';
  const content = document.getElementById('note-content-edit')?.value || '';
  const notes = await loadData('notes', []);
  const idx = notes.findIndex(n => n.id === currentNoteId);
  if (idx !== -1) {
    notes[idx].title = title;
    notes[idx].content = content;
    notes[idx].updatedAt = new Date().toISOString();
    await saveData('notes', notes);
    renderNotesList();
  }
}

async function deleteNote(id) {
  const notes = await loadData('notes', []);
  await saveData('notes', notes.filter(n => n.id !== id));
  currentNoteId = null;
  document.getElementById('notes-editor').innerHTML = `
    <div class="note-empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-text">Select a note or create a new one</div>
    </div>`;
  renderNotesList();
  showToast('Note deleted', '🗑');
}
