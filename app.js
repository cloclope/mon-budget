/* ═══════════════════════════════════════════════════════════════════════════
   PATRIMOINE PWA — app.js
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const DB_KEY = 'patrimoine_v1';

function loadData() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function saveData() {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
}

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: 'logement',     name: '🏠 Logement',      budget: 1200, color: '#4f9cf9' },
  { id: 'transport',    name: '🚗 Transport',      budget: 350,  color: '#f5c842' },
  { id: 'alimentation', name: '🍽️ Alimentation',   budget: 500,  color: '#3dd68c' },
  { id: 'sante',        name: '🏥 Santé',          budget: 150,  color: '#ff5e6a' },
  { id: 'loisirs',      name: '🎭 Loisirs',        budget: 200,  color: '#a78bfa' },
  { id: 'education',    name: '📚 Éducation',      budget: 100,  color: '#1fd4c4' },
  { id: 'energie',      name: '💡 Énergie',        budget: 120,  color: '#fb923c' },
  { id: 'abonnements',  name: '📱 Abonnements',    budget: 80,   color: '#e879f9' },
  { id: 'epargne',      name: '💰 Épargne',        budget: 300,  color: '#34d399' },
  { id: 'divers',       name: '📦 Divers',         budget: 100,  color: '#94a3b8' },
];

const DEFAULT_REVENUES = [
  { id: 'sal1', name: '💼 Salaire', amount: 2800 },
];

const DEFAULT_ACTIFS = [
  { id: 'a1', name: 'Résidence principale', value: 250000, cat: '🏠 Immobilier' },
  { id: 'a2', name: 'PEA / Actions',        value: 25000,  cat: '📈 Placements'  },
  { id: 'a3', name: 'Livret A',             value: 15000,  cat: '🏦 Liquidités'  },
];

const DEFAULT_PASSIFS = [
  { id: 'p1', name: 'Crédit immobilier', value: 180000 },
];

const DEFAULT_PLACEMENTS = [
  { id: 'pl1', name: '🟢 Livret A',   capital: 13000, value: 15000, taux: 2.4 },
  { id: 'pl2', name: '📈 PEA',        capital: 20000, value: 25000, taux: 0   },
  { id: 'pl3', name: '💼 Ass.-vie',   capital: 28000, value: 30000, taux: 1.8 },
];

const DEFAULT_OBJECTIFS = [
  { id: 'o1', name: '🏖️ Vacances',        cible: 5000,  atteint: 2500,  delai: 'Juin 2026' },
  { id: 'o2', name: '🚘 Voiture',          cible: 15000, atteint: 8000,  delai: 'Déc 2026'  },
  { id: 'o3', name: '🏠 Apport immo',      cible: 50000, atteint: 12000, delai: '2028'       },
];

function defaultState() {
  return {
    transactions: [
      { id: 't1', type: 'depense', amount: 850,  desc: 'Loyer juin',     cat: 'logement',     date: today() },
      { id: 't2', type: 'depense', amount: 120,  desc: 'Courses',        cat: 'alimentation', date: today() },
      { id: 't3', type: 'revenu',  amount: 2800, desc: 'Salaire',        cat: null,            date: today() },
      { id: 't4', type: 'depense', amount: 65,   desc: 'Carburant',      cat: 'transport',    date: todayMinus(1) },
      { id: 't5', type: 'depense', amount: 45,   desc: 'Restaurant',     cat: 'loisirs',      date: todayMinus(2) },
      { id: 't6', type: 'depense', amount: 15,   desc: 'Netflix + Spotify', cat: 'abonnements', date: todayMinus(3) },
    ],
    categories: DEFAULT_CATEGORIES,
    revenues: DEFAULT_REVENUES,
    actifs: DEFAULT_ACTIFS,
    passifs: DEFAULT_PASSIFS,
    placements: DEFAULT_PLACEMENTS,
    objectifs: DEFAULT_OBJECTIFS,
    currentMonth: currentYearMonth(),
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}
function todayMinus(days) {
  const d = new Date(); d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function fmt(n, sign = false) {
  const abs = Math.abs(n);
  const s = abs >= 1000 ? (abs/1000).toFixed(abs >= 10000 ? 0 : 1) + ' k€' : Math.round(abs) + ' €';
  if (sign) return (n < 0 ? '−' : '+') + s;
  return s;
}
function fmtFull(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function uid() {
  return Math.random().toString(36).slice(2, 9);
}
function parseYM(ym) {
  const [y, m] = ym.split('-').map(Number);
  return { year: y, month: m };
}
function formatMonth(ym) {
  const { year, month } = parseYM(ym);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}
function clamp(v, mn, mx) { return Math.min(mx, Math.max(mn, v)); }

// ─── STATE ────────────────────────────────────────────────────────────────────
let state = loadData() || defaultState();
let currentPage = 'dashboard';
let txType = 'depense';
let assetType = 'actif';
let editBudgetCatId = null;

// ─── COMPUTED ─────────────────────────────────────────────────────────────────
function getMonthTx(ym) {
  return state.transactions.filter(t => t.date && t.date.startsWith(ym));
}

function getMonthExpensesByCat(ym) {
  const txs = getMonthTx(ym).filter(t => t.type === 'depense');
  const map = {};
  txs.forEach(t => { if (t.cat) map[t.cat] = (map[t.cat] || 0) + t.amount; });
  return map;
}

function totalRevenues() {
  return state.revenues.reduce((s, r) => s + r.amount, 0);
}

function totalActifs() {
  return state.actifs.reduce((s, a) => s + a.value, 0);
}

function totalPassifs() {
  return state.passifs.reduce((s, p) => s + p.value, 0);
}

function patrimoineNet() {
  return totalActifs() - totalPassifs();
}

function totalPlacements() {
  return state.placements.reduce((s, p) => s + p.value, 0);
}

function totalCapitalInvesti() {
  return state.placements.reduce((s, p) => s + p.capital, 0);
}

function monthExpenses(ym) {
  return getMonthTx(ym).filter(t => t.type === 'depense').reduce((s, t) => s + t.amount, 0);
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:    'Tableau de Bord',
  budget:       'Budget',
  transactions: 'Opérations',
  patrimoine:   'Patrimoine',
  epargne:      'Épargne',
};

function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (nav) nav.classList.add('active');
  document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;
  currentPage = page;
  renderPage(page);
}

function renderPage(page) {
  if (page === 'dashboard')    renderDashboard();
  if (page === 'budget')       renderBudget();
  if (page === 'transactions') renderTransactions();
  if (page === 'patrimoine')   renderPatrimoine();
  if (page === 'epargne')      renderEpargne();
}

// ─── RENDER: DASHBOARD ───────────────────────────────────────────────────────
function renderDashboard() {
  const ym = state.currentMonth;
  const revenu = totalRevenues();
  const depenses = monthExpenses(ym);
  const epargne = revenu - depenses;
  const taux = revenu > 0 ? epargne / revenu : 0;

  document.getElementById('dash-patrimoine').textContent = fmtFull(patrimoineNet());
  document.getElementById('dash-actif-chip').textContent  = 'Actifs ' + fmt(totalActifs());
  document.getElementById('dash-passif-chip').textContent = 'Passifs ' + fmt(totalPassifs());
  document.getElementById('dash-revenus').textContent  = fmt(revenu);
  document.getElementById('dash-depenses').textContent = fmt(depenses);
  document.getElementById('dash-epargne').textContent  = fmt(epargne);
  document.getElementById('dash-taux-pct').textContent = Math.round(taux * 100) + '%';
  document.getElementById('dash-taux-bar').style.width = clamp(taux * 100, 0, 100) + '%';

  // Categories
  const expMap = getMonthExpensesByCat(ym);
  const catEl = document.getElementById('dash-categories');
  const topCats = state.categories
    .map(c => ({ ...c, spent: expMap[c.id] || 0 }))
    .filter(c => c.spent > 0 || c.budget > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  if (!topCats.length) {
    catEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div>Ajoutez des dépenses pour voir les catégories</div>';
  } else {
    catEl.innerHTML = topCats.map(c => {
      const pct = c.budget > 0 ? clamp(c.spent / c.budget * 100, 0, 100) : 0;
      const cls = c.spent > c.budget ? 'over' : c.spent > c.budget * 0.8 ? 'warn' : 'ok';
      return `<div class="cat-item">
        <div class="cat-emoji">${c.name.split(' ')[0]}</div>
        <div class="cat-info">
          <div class="cat-name">${c.name.split(' ').slice(1).join(' ')}</div>
          <div class="cat-bar-track"><div class="cat-bar-fill ${cls}" style="width:${pct}%;background:${c.color}"></div></div>
        </div>
        <div class="cat-pct" style="color:${c.color}">${Math.round(pct)}%</div>
      </div>`;
    }).join('');
  }

  // Recent transactions
  const recent = [...state.transactions].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5);
  const txEl = document.getElementById('dash-recent');
  txEl.innerHTML = recent.length
    ? recent.map(t => txHtml(t)).join('')
    : '<div class="empty-state"><div class="empty-icon">💸</div>Aucune opération</div>';
}

// ─── RENDER: BUDGET ──────────────────────────────────────────────────────────
function renderBudget() {
  const ym = state.currentMonth;
  document.getElementById('month-label').textContent = formatMonth(ym);

  const expMap = getMonthExpensesByCat(ym);
  let totalBudget = 0, totalReel = 0;

  state.categories.forEach(c => { totalBudget += c.budget; totalReel += expMap[c.id] || 0; });
  const restant = totalBudget - totalReel;

  document.getElementById('bud-total-budget').textContent  = fmtFull(totalBudget);
  document.getElementById('bud-total-reel').textContent    = fmtFull(totalReel);
  document.getElementById('bud-total-restant').textContent = fmtFull(restant);

  const catsEl = document.getElementById('budget-cats');
  catsEl.innerHTML = state.categories.map(c => {
    const spent = expMap[c.id] || 0;
    const pct = c.budget > 0 ? clamp(spent / c.budget * 100, 0, 100) : 0;
    const cls = spent > c.budget ? 'over' : spent > c.budget * 0.8 ? 'warn' : 'ok';
    const barColor = cls === 'over' ? '#ff5e6a' : cls === 'warn' ? '#f5c842' : c.color;
    return `<div class="bcat-item" onclick="openBudgetConfig('${c.id}')">
      <div class="bcat-top">
        <div class="bcat-name">${c.name}</div>
        <div class="bcat-amounts">${fmtFull(spent)} / <strong>${fmtFull(c.budget)}</strong></div>
      </div>
      <div class="bcat-bar-track">
        <div class="bcat-bar-fill" style="width:${pct}%;background:${barColor}"></div>
      </div>
    </div>`;
  }).join('');

  // Revenues
  const revEl = document.getElementById('revenues-list');
  revEl.innerHTML = state.revenues.length
    ? state.revenues.map(r => `<div class="rev-item">
        <div class="rev-name">${r.name}</div>
        <div class="rev-amount">${fmtFull(r.amount)}</div>
      </div>`).join('')
    : '<div class="empty-state"><div class="empty-icon">💰</div>Aucune source de revenu</div>';
}

// ─── RENDER: TRANSACTIONS ────────────────────────────────────────────────────
let txFilter = 'all';
let txSearchVal = '';

function filterTx(btn, f) {
  txFilter = f;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderTransactions();
}

function renderTransactions() {
  const search = txSearchVal.toLowerCase();
  let txs = [...state.transactions].filter(t => {
    if (txFilter === 'depense' && t.type !== 'depense') return false;
    if (txFilter === 'revenu'  && t.type !== 'revenu')  return false;
    if (search && !t.desc.toLowerCase().includes(search)) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const el = document.getElementById('tx-list-main');
  if (!txs.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div>Aucune opération trouvée</div>';
    return;
  }

  // Group by date
  const groups = {};
  txs.forEach(t => { (groups[t.date] = groups[t.date] || []).push(t); });

  el.innerHTML = Object.entries(groups).sort(([a],[b]) => b.localeCompare(a)).map(([date, list]) => {
    const d = new Date(date + 'T12:00:00');
    const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    return `<div class="tx-date-group">${label}</div>` + list.map(t => txHtml(t)).join('');
  }).join('');
}

function txHtml(t) {
  const cat = state.categories.find(c => c.id === t.cat);
  const emoji = cat ? cat.name.split(' ')[0] : (t.type === 'revenu' ? '💚' : '💸');
  const catName = cat ? cat.name.split(' ').slice(1).join(' ') : (t.type === 'revenu' ? 'Revenu' : 'Non classé');
  const sign = t.type === 'revenu' ? '+' : '−';
  return `<div class="tx-item" onclick="deleteTx('${t.id}')">
    <div class="tx-avatar ${t.type}">${emoji}</div>
    <div class="tx-info">
      <div class="tx-desc">${t.desc}</div>
      <div class="tx-meta">${catName}</div>
    </div>
    <div class="tx-amount ${t.type}">${sign}${fmt(t.amount)}</div>
  </div>`;
}

function deleteTx(id) {
  if (!confirm('Supprimer cette opération ?')) return;
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveData();
  renderPage(currentPage);
  toast('Opération supprimée');
}

// ─── RENDER: PATRIMOINE ──────────────────────────────────────────────────────
const DONUT_COLORS = ['#4f9cf9','#1fd4c4','#3dd68c','#f5c842','#a78bfa','#ff5e6a','#fb923c'];

function renderPatrimoine() {
  const net = patrimoineNet();
  const actif = totalActifs();
  const passif = totalPassifs();

  document.getElementById('pat-net').textContent          = fmtFull(net);
  document.getElementById('pat-actif-chip').textContent  = 'Actifs ' + fmt(actif);
  document.getElementById('pat-passif-chip').textContent = 'Passifs ' + fmt(passif);

  document.getElementById('actifs-list').innerHTML = state.actifs.length
    ? state.actifs.map((a, i) => `<div class="asset-item" onclick="deleteAsset('actif','${a.id}')">
        <div class="asset-left">
          <div class="asset-cat-dot" style="background:${DONUT_COLORS[i % DONUT_COLORS.length]}"></div>
          <div><div class="asset-name">${a.name}</div><div class="asset-cat">${a.cat}</div></div>
        </div>
        <div class="asset-value">${fmtFull(a.value)}</div>
      </div>`).join('')
    : '<div class="empty-state"><div class="empty-icon">🏦</div>Aucun actif</div>';

  document.getElementById('passifs-list').innerHTML = state.passifs.length
    ? state.passifs.map(p => `<div class="asset-item" onclick="deleteAsset('passif','${p.id}')">
        <div class="asset-left">
          <div class="asset-cat-dot" style="background:#ff5e6a"></div>
          <div><div class="asset-name">${p.name}</div><div class="asset-cat">Passif</div></div>
        </div>
        <div class="asset-value" style="color:var(--red)">${fmtFull(p.value)}</div>
      </div>`).join('')
    : '<div class="empty-state"><div class="empty-icon">📉</div>Aucun passif</div>';

  drawDonut();
}

function deleteAsset(type, id) {
  if (!confirm('Supprimer cet élément ?')) return;
  if (type === 'actif')  state.actifs  = state.actifs.filter(a => a.id !== id);
  if (type === 'passif') state.passifs = state.passifs.filter(p => p.id !== id);
  saveData(); renderPage('patrimoine'); toast('Supprimé');
}

function drawDonut() {
  const canvas = document.getElementById('donut-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2, R = 80, r = 50;

  ctx.clearRect(0, 0, W, H);

  const total = totalActifs();
  if (!total) {
    ctx.fillStyle = '#1d2e40'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0f1923'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    return;
  }

  let angle = -Math.PI / 2;
  const legend = document.getElementById('donut-legend');
  legend.innerHTML = '';

  // Group by category
  const catMap = {};
  state.actifs.forEach(a => { catMap[a.cat] = (catMap[a.cat] || 0) + a.value; });
  const entries = Object.entries(catMap).sort((a,b) => b[1]-a[1]);

  entries.forEach(([cat, val], i) => {
    const sweep = (val / total) * Math.PI * 2;
    const color = DONUT_COLORS[i % DONUT_COLORS.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    angle += sweep;

    const pct = Math.round(val / total * 100);
    legend.innerHTML += `<div class="legend-item">
      <div class="legend-dot" style="background:${color}"></div>
      <div class="legend-name">${cat}</div>
      <div class="legend-pct">${pct}%</div>
    </div>`;
  });

  // Hole
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = '#16222f'; ctx.fill();
  // Center text
  ctx.fillStyle = '#e8edf2';
  ctx.font = 'bold 14px DM Serif Display, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(fmt(total), cx, cy);
}

// ─── RENDER: ÉPARGNE ─────────────────────────────────────────────────────────
function renderEpargne() {
  const total = totalPlacements();
  const capital = totalCapitalInvesti();
  const pv = total - capital;

  document.getElementById('ep-total').textContent = fmtFull(total);
  document.getElementById('ep-pv-chip').textContent = (pv >= 0 ? '+' : '') + fmt(pv) + ' plus-value';

  const el = document.getElementById('placements-list');
  el.innerHTML = state.placements.length
    ? state.placements.map(p => {
        const pv = p.value - p.capital;
        const pct = p.capital > 0 ? ((pv / p.capital) * 100).toFixed(1) : 0;
        const pvCls = pv >= 0 ? 'pos' : 'neg';
        const pvSign = pv >= 0 ? '+' : '';
        return `<div class="pl-item" onclick="deletePlacement('${p.id}')">
          <div class="pl-top">
            <div class="pl-name">${p.name}</div>
            <div class="pl-value">${fmtFull(p.value)}</div>
          </div>
          <div class="pl-bottom">
            <div class="pl-capital">Investi : ${fmtFull(p.capital)}</div>
            <div class="pl-pv ${pvCls}">${pvSign}${fmt(pv)} (${pvSign}${pct}%)</div>
            ${p.taux ? `<div class="pl-taux">${p.taux}%/an</div>` : ''}
          </div>
        </div>`;
      }).join('')
    : '<div class="empty-state"><div class="empty-icon">📈</div>Aucun placement</div>';

  const objEl = document.getElementById('objectifs-list');
  objEl.innerHTML = state.objectifs.length
    ? state.objectifs.map(o => {
        const pct = o.cible > 0 ? clamp(o.atteint / o.cible * 100, 0, 100) : 0;
        const status = pct >= 100 ? '✅ Atteint' : pct >= 75 ? '🟡 En bonne voie' : '🔴 À accélérer';
        return `<div class="obj-item">
          <div class="obj-top">
            <div class="obj-name">${o.name}</div>
            <div class="obj-status">${status}</div>
          </div>
          <div class="obj-amounts">
            <span>${fmtFull(o.atteint)} / ${fmtFull(o.cible)}</span>
            <span>${Math.round(pct)}%</span>
          </div>
          <div class="obj-bar-track"><div class="obj-bar-fill" style="width:${pct}%"></div></div>
          <div class="obj-delai">📅 ${o.delai}</div>
        </div>`;
      }).join('')
    : '<div class="empty-state"><div class="empty-icon">🎯</div>Ajoutez un objectif d\'épargne</div>';
}

function deletePlacement(id) {
  if (!confirm('Supprimer ce placement ?')) return;
  state.placements = state.placements.filter(p => p.id !== id);
  saveData(); renderPage('epargne'); toast('Placement supprimé');
}

// ─── MODALS ───────────────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// Transaction
function setTxType(type) {
  txType = type;
  document.getElementById('type-depense').classList.toggle('active', type === 'depense');
  document.getElementById('type-revenu').classList.toggle('active', type === 'revenu');
}

function openAddTransaction() {
  const sel = document.getElementById('tx-cat');
  sel.innerHTML = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('tx-amount').value = '';
  document.getElementById('tx-desc').value = '';
  document.getElementById('tx-date').value = today();
  setTxType('depense');
  openModal('modal-transaction');
  setTimeout(() => document.getElementById('tx-amount').focus(), 300);
}

function saveTransaction() {
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const desc   = document.getElementById('tx-desc').value.trim();
  const cat    = document.getElementById('tx-cat').value;
  const date   = document.getElementById('tx-date').value;
  if (!amount || amount <= 0) { toast('Montant invalide'); return; }
  if (!desc) { toast('Description requise'); return; }

  state.transactions.push({
    id: uid(), type: txType, amount, desc,
    cat: txType === 'depense' ? cat : null,
    date: date || today(),
  });
  saveData();
  closeModal('modal-transaction');
  renderPage(currentPage);
  toast(txType === 'depense' ? '💸 Dépense ajoutée' : '💚 Revenu ajouté');
}

// Asset
function openAssetModal(type) {
  assetType = type;
  document.getElementById('asset-modal-title').textContent = type === 'actif' ? 'Nouvel actif' : 'Nouveau passif';
  document.getElementById('asset-name').value = '';
  document.getElementById('asset-value').value = '';
  if (type === 'passif') {
    document.getElementById('asset-cat').style.display = 'none';
  } else {
    document.getElementById('asset-cat').style.display = '';
  }
  openModal('modal-asset');
}

function saveAsset() {
  const name  = document.getElementById('asset-name').value.trim();
  const value = parseFloat(document.getElementById('asset-value').value);
  const cat   = document.getElementById('asset-cat').value;
  if (!name)  { toast('Nom requis'); return; }
  if (!value) { toast('Valeur requise'); return; }

  if (assetType === 'actif')  state.actifs.push({ id: uid(), name, value, cat });
  if (assetType === 'passif') state.passifs.push({ id: uid(), name, value });
  saveData();
  closeModal('modal-asset');
  renderPage('patrimoine');
  toast('Ajouté avec succès');
}

// Placement
function openPlacementModal() {
  document.getElementById('pl-name').value = '';
  document.getElementById('pl-capital').value = '';
  document.getElementById('pl-value').value = '';
  document.getElementById('pl-taux').value = '';
  openModal('modal-placement');
}

function savePlacement() {
  const name    = document.getElementById('pl-name').value.trim();
  const capital = parseFloat(document.getElementById('pl-capital').value) || 0;
  const value   = parseFloat(document.getElementById('pl-value').value) || 0;
  const taux    = parseFloat(document.getElementById('pl-taux').value) || 0;
  if (!name) { toast('Nom requis'); return; }

  state.placements.push({ id: uid(), name, capital, value, taux });
  saveData();
  closeModal('modal-placement');
  renderPage('epargne');
  toast('Placement ajouté');
}

// Objectif
function openObjectifModal() {
  document.getElementById('obj-name').value = '';
  document.getElementById('obj-cible').value = '';
  document.getElementById('obj-atteint').value = '';
  document.getElementById('obj-delai').value = '';
  openModal('modal-objectif');
}

function saveObjectif() {
  const name    = document.getElementById('obj-name').value.trim();
  const cible   = parseFloat(document.getElementById('obj-cible').value) || 0;
  const atteint = parseFloat(document.getElementById('obj-atteint').value) || 0;
  const delai   = document.getElementById('obj-delai').value.trim();
  if (!name) { toast('Nom requis'); return; }

  state.objectifs.push({ id: uid(), name, cible, atteint, delai });
  saveData();
  closeModal('modal-objectif');
  renderPage('epargne');
  toast('Objectif ajouté');
}

// Revenue
function openRevenueModal() {
  document.getElementById('rev-name').value = '';
  document.getElementById('rev-amount').value = '';
  openModal('modal-revenue');
}

function saveRevenue() {
  const name   = document.getElementById('rev-name').value.trim();
  const amount = parseFloat(document.getElementById('rev-amount').value) || 0;
  if (!name) { toast('Nom requis'); return; }

  state.revenues.push({ id: uid(), name, amount });
  saveData();
  closeModal('modal-revenue');
  renderPage('budget');
  toast('Revenu ajouté');
}

// Budget config
function openBudgetConfig(catId) {
  const cat = state.categories.find(c => c.id === catId);
  if (!cat) return;
  editBudgetCatId = catId;
  document.getElementById('bcat-title').textContent = cat.name;
  document.getElementById('bcat-budget').value = cat.budget;
  openModal('modal-budget-config');
}

function saveBudgetCat() {
  const budget = parseFloat(document.getElementById('bcat-budget').value) || 0;
  const cat = state.categories.find(c => c.id === editBudgetCatId);
  if (cat) cat.budget = budget;
  saveData();
  closeModal('modal-budget-config');
  renderPage('budget');
  toast('Budget mis à jour');
}

// ─── SIMULATION ───────────────────────────────────────────────────────────────
function runSimulation() {
  const C  = parseFloat(document.getElementById('sim-capital').value) || 0;
  const m  = parseFloat(document.getElementById('sim-versement').value) || 0;
  const r  = (parseFloat(document.getElementById('sim-taux').value) || 0) / 100;
  const n  = parseFloat(document.getElementById('sim-duree').value) || 0;

  if (r === 0) {
    const final = C + m * 12 * n;
    document.getElementById('sim-final').textContent = fmtFull(final);
    document.getElementById('sim-pv').textContent = fmtFull(0);
    document.getElementById('sim-rdt').textContent = '0%';
  } else {
    const final = C * Math.pow(1+r, n) + m * 12 * ((Math.pow(1+r, n) - 1) / r);
    const invested = C + m * 12 * n;
    const pv = final - invested;
    const rdt = invested > 0 ? (pv / invested * 100) : 0;
    document.getElementById('sim-final').textContent = fmtFull(Math.round(final));
    document.getElementById('sim-pv').textContent = '+' + fmtFull(Math.round(pv));
    document.getElementById('sim-rdt').textContent = '+' + rdt.toFixed(1) + '%';
  }
  document.getElementById('sim-result').classList.remove('hidden');
}

// ─── MONTH NAVIGATION ────────────────────────────────────────────────────────
function changeMonth(delta) {
  const { year, month } = parseYM(state.currentMonth);
  const d = new Date(year, month - 1 + delta, 1);
  state.currentMonth = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  saveData();
  renderBudget();
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
}

// ─── INIT ────────────────────────────────────────────────────────────────────
function init() {
  // Date in topbar
  const now = new Date();
  document.getElementById('topbar-date').textContent =
    now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  // Month nav
  document.getElementById('month-prev').addEventListener('click', () => changeMonth(-1));
  document.getElementById('month-next').addEventListener('click', () => changeMonth(1));

  // Add button
  document.getElementById('add-btn').addEventListener('click', openAddTransaction);

  // Search
  document.getElementById('tx-search').addEventListener('input', e => {
    txSearchVal = e.target.value;
    renderTransactions();
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.add('hidden'); });
  });

  // Render initial page
  renderDashboard();

  // Show app after splash
  setTimeout(() => {
    document.getElementById('app').classList.remove('hidden');
  }, 2000);
}

// ─── REGISTER SERVICE WORKER ─────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

document.addEventListener('DOMContentLoaded', init);
