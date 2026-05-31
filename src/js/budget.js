/* ═══ BUDGET MODULE ═══ */
let txType = 'expense';
let txFilter = 'all';

function setTxType(type) {
  txType = type;
  document.getElementById('tx-type-income').classList.toggle('active', type === 'income');
  document.getElementById('tx-type-expense').classList.toggle('active', type === 'expense');
}

function openTxModal() {
  txType = 'expense';
  setTxType('expense');
  document.getElementById('tx-amount').value = '';
  document.getElementById('tx-desc').value = '';
  document.getElementById('tx-date').value = todayStr();
  document.getElementById('tx-modal').classList.add('open');
  document.getElementById('tx-amount').focus();
}

function closeTxModal() {
  document.getElementById('tx-modal').classList.remove('open');
}

function filterTx(filter, btn) {
  txFilter = filter;
  document.querySelectorAll('#page-budget .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTransactions();
}

async function saveTransaction() {
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const desc = document.getElementById('tx-desc').value.trim();
  if (!desc || isNaN(amount) || amount <= 0) {
    showToast('Enter valid amount and description', '⚠️');
    return;
  }

  const txs = await loadData('transactions', []);
  txs.unshift({
    id: genId(),
    type: txType,
    amount,
    desc,
    category: document.getElementById('tx-category').value,
    date: document.getElementById('tx-date').value || todayStr(),
    createdAt: new Date().toISOString(),
  });

  await saveData('transactions', txs);
  closeTxModal();
  renderTransactions();
  showToast(`${txType === 'income' ? 'Income' : 'Expense'} added!`, txType === 'income' ? '💵' : '💸');
}

async function renderTransactions() {
  const txs = await loadData('transactions', []);
  const search = document.getElementById('tx-search')?.value?.toLowerCase() || '';
  let filtered = txs;

  if (txFilter !== 'all') filtered = filtered.filter(t => t.type === txFilter);
  if (search) filtered = filtered.filter(t =>
    t.desc.toLowerCase().includes(search) || t.category.toLowerCase().includes(search)
  );

  // Summary
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  document.getElementById('budget-income').textContent = `₹${income.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
  document.getElementById('budget-expense').textContent = `₹${expense.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
  const balEl = document.getElementById('budget-balance-main');
  if (balEl) {
    balEl.textContent = `₹${Math.abs(balance).toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    balEl.style.color = balance >= 0 ? 'var(--success)' : 'var(--danger)';
    if (balance < 0) balEl.textContent = '-' + balEl.textContent;
  }

  const list = document.getElementById('tx-list');
  if (!list) return;

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">💰</div><div class="empty-text">No transactions found</div></div>`;
  } else {
    list.innerHTML = filtered.map(t => `
      <div class="tx-item">
        <div class="tx-type-icon">${t.type === 'income' ? '💵' : '💸'}</div>
        <div class="tx-info">
          <div class="tx-desc">${escHtml(t.desc)}</div>
          <div class="tx-cat-date">${escHtml(t.category)} · ${formatDate(t.date)}</div>
        </div>
        <div class="tx-amount ${t.type === 'income' ? 'tx-income' : 'tx-expense'}">
          ${t.type === 'income' ? '+' : '-'}₹${t.amount.toLocaleString('en-IN', {minimumFractionDigits:2})}
        </div>
        <button class="task-action-btn" onclick="deleteTx('${t.id}')">🗑</button>
      </div>
    `).join('');
  }

  // Category breakdown
  const catMap = {};
  txs.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const maxCat = Math.max(...Object.values(catMap), 1);
  const catEl = document.getElementById('budget-categories');
  if (catEl) {
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
    catEl.innerHTML = sorted.map(([cat, amt]) => `
      <div class="cat-item">
        <div class="cat-name">${escHtml(cat)}</div>
        <div class="cat-bar-wrap"><div class="cat-bar" style="width:${(amt/maxCat)*100}%"></div></div>
        <div class="cat-amount">₹${amt.toLocaleString('en-IN')}</div>
      </div>
    `).join('') || '<div style="color:var(--text-muted);font-size:12px;">No expenses yet</div>';
  }
}

async function deleteTx(id) {
  const txs = await loadData('transactions', []);
  await saveData('transactions', txs.filter(t => t.id !== id));
  renderTransactions();
  showToast('Transaction deleted', '🗑');
}

document.getElementById('tx-modal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('tx-modal')) closeTxModal();
});
