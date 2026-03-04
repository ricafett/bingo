/* =============================================
   Bingo — app.js
   ============================================= */

const STORAGE_KEY = 'bingo_game';
const THEME_KEY   = 'bingo_theme';
const HEADING_KEY = 'bingo_heading';
const TOTAL_BALLS = 75;

const DEFAULT_ROUND_NUMBER = 1;
const DEFAULT_LINE_PRIZE = 0;
const DEFAULT_BINGO_PRIZE = 0;

const COLUMNS = [
  { letter: 'B', min: 1,  max: 15 },
  { letter: 'I', min: 16, max: 30 },
  { letter: 'N', min: 31, max: 45 },
  { letter: 'G', min: 46, max: 60 },
  { letter: 'O', min: 61, max: 75 },
];

// ── State ──────────────────────────────────────
let drawn = []; // ordered list of drawn numbers
let roundNumber = DEFAULT_ROUND_NUMBER;
let linePrize = DEFAULT_LINE_PRIZE;
let bingoPrize = DEFAULT_BINGO_PRIZE;
let holdTimer = null;
let wasHeld   = false;
const HOLD_DURATION = 600; // ms

const euroFormatter = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// ── DOM refs ───────────────────────────────────
const htmlEl            = document.documentElement;
const resumeModal       = document.getElementById('resume-modal');
const newGameModal      = document.getElementById('new-game-modal');
const btnResume         = document.getElementById('btn-resume');
const btnNewFromModal   = document.getElementById('btn-new-from-modal');
const btnConfirmNewGame = document.getElementById('btn-confirm-new-game');
const btnCancelNewGame  = document.getElementById('btn-cancel-new-game');
const chkResetAll       = document.getElementById('chk-reset-all');
const btnNewGame        = document.getElementById('btn-new-game');
const btnTheme          = document.getElementById('btn-theme');
const counterEl         = document.getElementById('counter');
const historyStrip      = document.getElementById('history-strip');
const historyEmpty      = document.getElementById('history-empty');
const bingoGrid         = document.getElementById('bingo-grid');
const gameHeading       = document.getElementById('game-heading');
const roundNumberEl     = document.getElementById('round-number');
const linePrizeEl       = document.getElementById('line-prize');
const bingoPrizeEl      = document.getElementById('bingo-prize');

// ── Helpers ────────────────────────────────────
function parsePositiveInteger(text, fallback) {
  const parsed = parseInt((text || '').replace(/\D+/g, ''), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseEuroAmount(text, fallback) {
  const normalized = (text || '')
    .replace(/\s/g, '')
    .replace(/€/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return Math.round(parsed * 100) / 100;
}

function formatEuro(value) {
  return euroFormatter.format(value);
}

function updateMetaDisplay() {
  roundNumberEl.textContent = String(roundNumber);
  linePrizeEl.textContent = formatEuro(linePrize);
  bingoPrizeEl.textContent = formatEuro(bingoPrize);
}

// ── Theme ──────────────────────────────────────
function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  btnTheme.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = htmlEl.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
}

// ── Grid ───────────────────────────────────────
function buildGrid() {
  bingoGrid.innerHTML = '';
  COLUMNS.forEach(({ letter, min, max }) => {
    const row = document.createElement('div');
    row.className = 'bingo-row';

    const header = document.createElement('div');
    header.className = 'row-header';
    header.textContent = letter;
    row.appendChild(header);

    for (let n = min; n <= max; n++) {
      const cell = document.createElement('div');
      cell.className = 'bingo-cell';
      cell.textContent = n;
      cell.dataset.number = n;
      if (drawn.includes(n)) cell.classList.add('drawn');
      if (drawn.length > 0 && drawn[drawn.length - 1] === n) cell.classList.add('last-drawn');

      cell.addEventListener('click', () => handleDraw(n, cell));

      // Hold-to-deselect (last drawn only)
      cell.addEventListener('pointerdown', () => startHold(n, cell));
      cell.addEventListener('pointerup',    () => cancelHold(cell));
      cell.addEventListener('pointerleave', () => cancelHold(cell));
      cell.addEventListener('pointercancel',() => cancelHold(cell));

      row.appendChild(cell);
    }

    bingoGrid.appendChild(row);
  });
}

// ── Draw ───────────────────────────────────────
function handleDraw(n, cell) {
  if (wasHeld) { wasHeld = false; return; }
  if (drawn.includes(n)) return;
  drawn.push(n);
  cell.classList.add('drawn');
  updateLastDrawnMarker();
  saveGame();
  updateCounter();
  updateHistory();
}

// ── Deselect (hold on last drawn) ─────────────
function startHold(n, cell) {
  if (drawn.length === 0 || drawn[drawn.length - 1] !== n) return;
  cell.classList.add('holding');
  holdTimer = setTimeout(() => {
    wasHeld = true;
    cell.classList.remove('holding');
    deselect(n, cell);
  }, HOLD_DURATION);
}

function cancelHold(cell) {
  if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
  cell.classList.remove('holding');
}

function deselect(n, cell) {
  drawn = drawn.filter(x => x !== n);
  cell.classList.remove('drawn', 'last-drawn');
  updateLastDrawnMarker();
  saveGame();
  updateCounter();
  updateHistory();
}

function updateLastDrawnMarker() {
  // Remove marker from all cells then re-apply to current last
  bingoGrid.querySelectorAll('.last-drawn').forEach(c => c.classList.remove('last-drawn'));
  if (drawn.length === 0) return;
  const last = drawn[drawn.length - 1];
  const lastCell = bingoGrid.querySelector(`[data-number="${last}"]`);
  if (lastCell) lastCell.classList.add('last-drawn');
}

// ── Counter ────────────────────────────────────
function updateCounter() {
  counterEl.textContent = drawn.length;
}

// ── History ────────────────────────────────────
function updateHistory() {
  historyStrip.innerHTML = '';

  if (drawn.length === 0) {
    historyStrip.appendChild(historyEmpty);
    return;
  }

  // Render in reverse: most recent first
  [...drawn].reverse().forEach((n, i) => {
    const ball = document.createElement('span');
    ball.className = 'history-ball';
    if (i === 0) ball.classList.add('last');
    ball.textContent = n;
    historyStrip.appendChild(ball);
  });

  // Scroll to start to show latest
  historyStrip.scrollLeft = 0;
}

// ── LocalStorage ──────────────────────────────
function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    drawn,
    roundNumber,
    linePrize,
    bingoPrize,
  }));
}

function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearGame() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── New Game / New Round ──────────────────────
function startNewRound({ resetAllValues = false } = {}) {
  drawn = [];

  if (resetAllValues) {
    roundNumber = DEFAULT_ROUND_NUMBER;
    linePrize = DEFAULT_LINE_PRIZE;
    bingoPrize = DEFAULT_BINGO_PRIZE;
  } else {
    roundNumber += 1;
  }

  saveGame();
  buildGrid();
  updateCounter();
  updateHistory();
  updateMetaDisplay();
}

// ── Modal ─────────────────────────────────────
function showResumeModal() {
  resumeModal.setAttribute('open', '');
}

function hideResumeModal() {
  resumeModal.removeAttribute('open');
}

function showNewGameModal() {
  chkResetAll.checked = false;
  newGameModal.setAttribute('open', '');
}

function hideNewGameModal() {
  newGameModal.removeAttribute('open');
}

// ── Editable Heading ──────────────────────────
function loadHeading() {
  const saved = localStorage.getItem(HEADING_KEY);
  if (saved) gameHeading.textContent = saved;
}

function saveHeading() {
  const text = gameHeading.textContent.trim();
  if (text) {
    localStorage.setItem(HEADING_KEY, text);
  } else {
    gameHeading.textContent = 'O meu Bingo';
    localStorage.setItem(HEADING_KEY, 'O meu Bingo');
  }
}

function saveRoundNumber() {
  roundNumber = parsePositiveInteger(roundNumberEl.textContent, roundNumber);
  updateMetaDisplay();
  saveGame();
}

function saveLinePrize() {
  linePrize = parseEuroAmount(linePrizeEl.textContent, linePrize);
  updateMetaDisplay();
  saveGame();
}

function saveBingoPrize() {
  bingoPrize = parseEuroAmount(bingoPrizeEl.textContent, bingoPrize);
  updateMetaDisplay();
  saveGame();
}

gameHeading.addEventListener('blur', saveHeading);
gameHeading.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    gameHeading.blur();
  }
});

roundNumberEl.addEventListener('blur', saveRoundNumber);
roundNumberEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    roundNumberEl.blur();
  }
});

linePrizeEl.addEventListener('blur', saveLinePrize);
linePrizeEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    linePrizeEl.blur();
  }
});

bingoPrizeEl.addEventListener('blur', saveBingoPrize);
bingoPrizeEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    bingoPrizeEl.blur();
  }
});

// ── History wheel scroll ───────────────────────
historyStrip.addEventListener('wheel', (e) => {
  if (e.deltaY !== 0) {
    e.preventDefault();
    historyStrip.scrollLeft += e.deltaY;
  }
}, { passive: false });

btnResume.addEventListener('click', () => {
  hideResumeModal();
  // State already loaded; just render
  buildGrid();
  updateCounter();
  updateHistory();
  updateMetaDisplay();
});

btnNewFromModal.addEventListener('click', () => {
  hideResumeModal();
  startNewRound();
});

btnNewGame.addEventListener('click', () => {
  showNewGameModal();
});

btnConfirmNewGame.addEventListener('click', () => {
  hideNewGameModal();
  startNewRound({ resetAllValues: chkResetAll.checked });
});

btnCancelNewGame.addEventListener('click', () => {
  hideNewGameModal();
});

btnTheme.addEventListener('click', toggleTheme);

// ── Init ───────────────────────────────────────
(function init() {
  loadTheme();
  loadHeading();

  const saved = loadGame();
  if (saved && Array.isArray(saved.drawn)) {
    drawn = saved.drawn;
    roundNumber = parsePositiveInteger(String(saved.roundNumber ?? DEFAULT_ROUND_NUMBER), DEFAULT_ROUND_NUMBER);
    linePrize = Number.isFinite(saved.linePrize) ? Math.max(0, saved.linePrize) : DEFAULT_LINE_PRIZE;
    bingoPrize = Number.isFinite(saved.bingoPrize) ? Math.max(0, saved.bingoPrize) : DEFAULT_BINGO_PRIZE;

    if (drawn.length > 0) {
      showResumeModal();
    }

    buildGrid();
    updateCounter();
    updateHistory();
    updateMetaDisplay();
  } else {
    drawn = [];
    roundNumber = DEFAULT_ROUND_NUMBER;
    linePrize = DEFAULT_LINE_PRIZE;
    bingoPrize = DEFAULT_BINGO_PRIZE;
    saveGame();
    buildGrid();
    updateCounter();
    updateHistory();
    updateMetaDisplay();
  }
})();
