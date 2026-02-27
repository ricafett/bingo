/* =============================================
   Bingo — app.js
   ============================================= */

const STORAGE_KEY = 'bingo_game';
const THEME_KEY   = 'bingo_theme';
const TOTAL_BALLS = 75;

const COLUMNS = [
  { letter: 'B', min: 1,  max: 15 },
  { letter: 'I', min: 16, max: 30 },
  { letter: 'N', min: 31, max: 45 },
  { letter: 'G', min: 46, max: 60 },
  { letter: 'O', min: 61, max: 75 },
];

// ── State ──────────────────────────────────────
let drawn = []; // ordered list of drawn numbers
let holdTimer = null;
let wasHeld   = false;
const HOLD_DURATION = 600; // ms

// ── DOM refs ───────────────────────────────────
const htmlEl         = document.documentElement;
const resumeModal    = document.getElementById('resume-modal');
const btnResume      = document.getElementById('btn-resume');
const btnNewFromModal= document.getElementById('btn-new-from-modal');
const btnNewGame     = document.getElementById('btn-new-game');
const btnTheme       = document.getElementById('btn-theme');
const counterEl      = document.getElementById('counter');
const historyStrip   = document.getElementById('history-strip');
const historyEmpty   = document.getElementById('history-empty');
const bingoGrid      = document.getElementById('bingo-grid');
const gameHeading    = document.getElementById('game-heading');

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ drawn }));
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

// ── New Game ───────────────────────────────────
function startNewGame() {
  drawn = [];
  clearGame();
  buildGrid();
  updateCounter();
  updateHistory();
}

// ── Modal ─────────────────────────────────────
function showResumeModal() {
  resumeModal.setAttribute('open', '');
}

function hideResumeModal() {
  resumeModal.removeAttribute('open');
}

// ── Editable Heading ──────────────────────────
const HEADING_KEY = 'bingo_heading';

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

gameHeading.addEventListener('blur', saveHeading);
gameHeading.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    gameHeading.blur();
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
});

btnNewFromModal.addEventListener('click', () => {
  hideResumeModal();
  startNewGame();
});

btnNewGame.addEventListener('click', () => {
  if (drawn.length === 0) return;
  const confirmed = window.confirm('Tem a certeza que quer iniciar um novo jogo? O jogo atual será apagado.');
  if (confirmed) startNewGame();
});

btnTheme.addEventListener('click', toggleTheme);

// ── Init ───────────────────────────────────────
(function init() {
  loadTheme();
  loadHeading();

  const saved = loadGame();
  if (saved && Array.isArray(saved.drawn) && saved.drawn.length > 0) {
    drawn = saved.drawn;
    showResumeModal();
    // Render initial empty state under the modal; actual render happens on modal action
    buildGrid();
    updateCounter();
    updateHistory();
  } else {
    startNewGame();
  }
})();
