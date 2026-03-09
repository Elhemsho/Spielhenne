/* ============================================================
   SPIELHENNE – TURNIER / OLYMPIADE
   tournament.js  –  gehört in assets/js/
   
   Einbinden in index.html und allen Spielseiten:
   <script src="../assets/js/tournament.js" defer></script>
   (auf index.html:  <script src="assets/js/tournament.js" defer></script>)
   ============================================================ */

// ----------------------------------------------------------------
// 1. SESSION KEY – überlebt Navigation aber nicht Reload
// ----------------------------------------------------------------
let T_SESSION_KEY = sessionStorage.getItem('t_session_key');

const _navEntry = performance.getEntriesByType('navigation')[0];
const _isReload = _navEntry ? _navEntry.type === 'reload' : false;

if (_isReload) {
  sessionStorage.clear();
  T_SESSION_KEY = null;
}

if (!T_SESSION_KEY) {
  T_SESSION_KEY = Math.random().toString(36).slice(2);
  sessionStorage.setItem('t_session_key', T_SESSION_KEY);
}

// ----------------------------------------------------------------
// 2. STATE
// ----------------------------------------------------------------
const TournamentState = {
  active:       false,
  scores:       [0, 0],
  roundHistory: [],
  gameOrder:    [],
  currentRound: 0,
  currentGame:  null,
  mathScores:   [0, 0],
  mathPhase:    0,
};

// ----------------------------------------------------------------
// 3. PFAD-HELFER (funktioniert auf Index UND Unterseiten)
// ----------------------------------------------------------------
function tImgSrc(filename) {
  const isSubpage = window.location.pathname.includes('/pages/');
  const prefix = isSubpage ? '../' : '';
  return `${prefix}assets/images/${filename}`;
}

function tGameImg(g) {
  return `<img src="${tImgSrc(g.img)}" class="t-game-chip-img">`;
}

// ----------------------------------------------------------------
// 4. GAME DEFINITIONS
// ----------------------------------------------------------------
const T_GAMES = [
  { id: 'connectfour', img: 'cf.png',  de: 'Vier Gewinnt',      en: 'Connect Four',  url: 'connectfour.html' },
  { id: 'battleship',  img: 'battlelogo.png', de: 'Schiffe versenken', en: 'Battleship',    url: 'battleship.html'  },
  { id: 'memory',      img: 'memorylogo.png',     de: 'Memory',            en: 'Memory',        url: 'memory.html'      },
  { id: 'yazy',        img: 'würfel.png',        de: 'Kniffel',           en: 'Yazy',          url: 'yazy.html'        },
  { id: 'mathquiz',   img: 'mathlogo.png',    de: 'Mathe Quiz',        en: 'Math Quiz',     url: 'mathquiz.html'    },
];

// ----------------------------------------------------------------
// 5. TEXTE (beide Sprachen)
// ----------------------------------------------------------------
const T_LANG = {
  de: {
    intro_title:      'Spielhenne Olympiade',
    intro_sub:        'Tretet in 5 Spielen gegeneinander an. Wer am Ende die meisten Runden gewonnen hat, ist Sieger der Olympiade!',
    rules_title:      'Regeln',
    rules: [
      '5 Spiele werden zufällig ausgewählt',
      'Jedes gewonnene Spiel gibt 1 Punkt',
      'Bei Unentschieden gibt es keinen Punkt',
      'Beim Mathe Quiz spielt erst Spieler 1, dann Spieler 2',
    ],
    btn_start:        'Olympiade starten!',
    spin_label:       'Nächstes Spiel...',
    round_of:         'Runde',
    of:               'von',
    btn_play:         'Spiel starten!',
    p1:               'Spieler 1',
    p2:               'Spieler 2',
    wins:             'gewinnt die Runde!',
    draw:             'Unentschieden!',
    round_done:       'Runde abgeschlossen',
    btn_next:         'Weiter',
    champion:         'Olympiasieger!',
    champion_draw:    'Unentschieden!',
    draw_both:        'Beide haben gleich viele Punkte!',
    btn_restart:      'Neue Runde',
    mq_p_label:       'ist dran! (30 Sekunden)',
    mq_pts:           'Punkte',
    mq_ok:            'OK',
    mq_done:          'Zeit! Punkte:',
    history_draw:     'Unentschieden',
    scoreboard_round: 'Runde',
    abort_cancel:     'Weiterspielen',
    mq_title:      'Mathe Quiz – Olympiade',
    abort_title:   'Olympiade beenden?',
    abort_sub:     'Wenn du abbrichst, wird die aktuelle Olympiade beendet und der Spielstand gelöscht.',
    abort_confirm: '🗑️ Olympiade abbrechen',
    btn_to_olympics: '→ Olympiade',
  },
  en: {
    intro_title:      'Spielhenne Olympics',
    intro_sub:        'Compete in 5 games. The player with the most wins becomes Olympic Champion!',
    rules_title:      'Rules',
    rules: [
      '5 games are chosen randomly',
      'Each game win earns 1 point',
      'Draws award no points',
      'In Math Quiz, Player 1 goes first, then Player 2',
    ],
    btn_start:        'Start Olympics!',
    spin_label:       'Next game...',
    round_of:         'Round',
    of:               'of',
    btn_play:         'Play Game!',
    p1:               'Player 1',
    p2:               'Player 2',
    wins:             'wins the round!',
    draw:             'Draw!',
    round_done:       'Round complete',
    btn_next:         'Continue',
    champion:         'Olympic Champion!',
    champion_draw:    'Draw!',
    draw_both:        'Both players are tied!',
    btn_restart:      'New Round',
    mq_p_label:       'is up! (30 seconds)',
    mq_pts:           'Points',
    mq_ok:            'OK',
    mq_done:          'Time! Points:',
    history_draw:     'Draw',
    scoreboard_round: 'Round',
    abort_cancel:     'Keep playing',
    mq_title:      'Math Quiz – Olympics',
    abort_title:   'End Olympics?',
    abort_sub:     'If you quit, the current Olympics will end and all progress will be lost.',
    abort_confirm: '🗑️ Quit Olympics',
    btn_to_olympics: '→ Olympics',
  },
};

function tLang() {
  return T_LANG[localStorage.getItem('selectedLanguage') || 'de'];
}

function tGameName(g) {
  const l = localStorage.getItem('selectedLanguage') || 'de';
  return l === 'en' ? g.en : g.de;
}

// ----------------------------------------------------------------
// 6. PERSISTENCE (sessionStorage)
// ----------------------------------------------------------------
function saveTS() {
  sessionStorage.setItem('t_state', JSON.stringify({
    ...TournamentState,
    _sessionKey: T_SESSION_KEY
  }));
}

function loadTS() {
  try {
    const raw = sessionStorage.getItem('t_state');
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s.active) return false;
    if (s._sessionKey !== T_SESSION_KEY) {
      sessionStorage.removeItem('t_state');
      sessionStorage.removeItem('t_game_snapshot');
      return false;
    }
    // gameOrder und currentGame müssen mit echten T_GAMES Objekten gemappt werden
    // (JSON verliert die Referenzen)
    if (s.gameOrder) {
      s.gameOrder = s.gameOrder.map(saved =>
        T_GAMES.find(g => g.id === saved.id) || saved
      );
    }
    if (s.currentGame) {
      s.currentGame = T_GAMES.find(g => g.id === s.currentGame.id) || s.currentGame;
    }
    if (s.roundHistory) {
      s.roundHistory = s.roundHistory.map(r => ({
        ...r,
        game: T_GAMES.find(g => g.id === r.game.id) || r.game
      }));
    }
    Object.assign(TournamentState, s);
    return true;
  } catch(e) { return false; }
}

function clearTS() {
  sessionStorage.removeItem('t_state');
}

// ----------------------------------------------------------------
// 7. DOM HELPERS
// ----------------------------------------------------------------
function tEl(id)   { return document.getElementById(id); }
function tShow(id) { const e = tEl(id); if(e) e.style.display = 'block'; }
function tHide(id) { const e = tEl(id); if(e) e.style.display = 'none'; }

function tShowPanel(id) {
  ['t-panel-intro','t-panel-spin','t-panel-result','t-panel-mathquiz','t-panel-final']
    .forEach(p => { const e = tEl(p); if(e) e.style.display = p === id ? 'flex' : 'none'; });
  const ov = tEl('t-overlay');
  if (ov) { ov.style.display = 'flex'; ov.classList.add('t-open'); }
}

function tCloseOverlay() {
  const ov = tEl('t-overlay');
  if (ov) { ov.classList.remove('t-open'); setTimeout(() => { ov.style.display = 'none'; }, 300); }
}

// ----------------------------------------------------------------
// 8. SCOREBOARD
// ----------------------------------------------------------------
function tUpdateScoreboard() {
  const sb = tEl('t-scoreboard');
  if (!sb) return;
  const tx = tLang();
  const round = Math.min(TournamentState.currentRound + 1, 5);
  sb.style.display = TournamentState.active ? 'flex' : 'none';

  const dots = TournamentState.roundHistory.map(r => {
    const cls = r.winner === 1 ? 'p1' : r.winner === 2 ? 'p2' : 'draw';
    return `<span class="t-sb-dot t-sb-dot--${cls}"></span>`;
  }).join('') + Array(5 - TournamentState.roundHistory.length)
    .fill('<span class="t-sb-dot"></span>').join('');

  sb.innerHTML = `
    <div class="t-sb-player">
      <span class="t-sb-name">${tx.p1}</span>
      <span class="t-sb-score t-sb-score--p1">${TournamentState.scores[0]}</span>
    </div>
    <div class="t-sb-center">
      <span class="t-sb-vs">VS</span>
      <span class="t-sb-round">${tx.scoreboard_round} ${round} ${tx.of} 5</span>
      <div class="t-sb-dots">${dots}</div>
    </div>
    <div class="t-sb-player">
      <span class="t-sb-name">${tx.p2}</span>
      <span class="t-sb-score t-sb-score--p2">${TournamentState.scores[1]}</span>
    </div>
  `;

  // Scoreboard klickbar machen (einmalig)
  if (!sb.dataset.clickable) {
    sb.dataset.clickable = '1';
    sb.style.cursor = 'pointer';
    sb.onclick = () => {
      if (!TournamentState.active) return;
      const currentGame = TournamentState.currentGame;
      const onGamePage = currentGame && window.location.pathname.includes(currentGame.url);
      if (!onGamePage && currentGame) {
        const isSubpage = window.location.pathname.includes('/pages/');
        const prefix = isSubpage ? '' : 'pages/';
        window.location.href = `${prefix}${currentGame.url}?tournament=1&round=${TournamentState.currentRound + 1}`;
      }
    };
  }
}

// ----------------------------------------------------------------
// 9. INTRO MODAL
// ----------------------------------------------------------------
function tBuildIntro() {
  const tx = tLang();
  const panel = tEl('t-panel-intro');
  if (!panel) return;
  panel.innerHTML = `
    <button class="t-close-btn" onclick="tCloseOverlay()">✕</button>
    <div class="t-trophy-icon">
      <img src="${tImgSrc('trophae.png')}" style="width:58px;height:58px;object-fit:contain; margin-top:12px;">
    </div>
    <h2 class="t-title">${tx.intro_title}</h2>
    <p class="t-sub">${tx.intro_sub}</p>
    <div class="t-rules-box">
      <strong>${tx.rules_title}:</strong>
      <ul>${tx.rules.map(r => `<li>${r}</li>`).join('')}</ul>
    </div>
    <div class="t-game-chips">
      ${T_GAMES.map(g => `<span class="t-chip">${tGameImg(g)} ${tGameName(g)}</span>`).join('')}
    </div>
    <button class="t-btn-primary" onclick="Tournament.start()">${tx.btn_start}</button>
  `;
}

// ----------------------------------------------------------------
// 10. ABBRUCH PANEL
// ----------------------------------------------------------------
function tShowAbortPanel() {
  const tx = tLang();
  const panel = tEl('t-panel-intro');
  if (!panel) return;
  panel.innerHTML = `
    <div class="t-trophy-icon">⚠️</div>
    <h2 class="t-title">${tx.abort_title}</h2>
    <p class="t-sub">${tx.abort_sub}</p>
    <div style="display:flex; gap:12px; justify-content:center; margin-top:8px; flex-wrap:nowrap;min-width:410px;">
      <button class="t-btn-primary t-abort-btn" style="background:#ffb3b3;" onclick="Tournament.abort()">
        ${tx.abort_confirm}
      </button>
      <button class="t-btn-primary" onclick="tCloseOverlay()">
        ${tx.abort_cancel}
      </button>
    </div>
  `;
  tShowPanel('t-panel-intro');
}

// ----------------------------------------------------------------
// 11. SPIN ANIMATION
// ----------------------------------------------------------------
function tRunSpin(targetGame, onDone) {
  const tx = tLang();
  const panel = tEl('t-panel-spin');
  const round = TournamentState.currentRound + 1;

  panel.innerHTML = `
    <div class="t-spin-title">${tx.spin_label}</div>
    <div class="t-spin-sub">${tx.round_of} ${round} ${tx.of} 5</div>
    <div class="t-slot-machine">
      <div class="t-slot-fade t-slot-fade--top"></div>
      <div class="t-slot-highlight"></div>
      <div class="t-slot-fade t-slot-fade--bot"></div>
      <div class="t-slot-strip" id="t-slot-strip"></div>
    </div>
    <div id="t-spin-result" style="display:none">
      <div class="t-spin-winner">
        <img src="${tImgSrc(targetGame.img)}" class="t-game-chip-img t-game-chip-img--large">
        ${tGameName(targetGame)}
      </div>
      <button class="t-btn-primary" id="t-btn-play" onclick="Tournament.launchGame()" style="display:none">▶ ${tx.btn_play}</button>
    </div>
  `;

  const strip = tEl('t-slot-strip');
  const loopItems = [...T_GAMES,...T_GAMES,...T_GAMES,...T_GAMES,...T_GAMES];
  if (loopItems[loopItems.length - 1].id === targetGame.id) {
    [loopItems[loopItems.length - 1], loopItems[loopItems.length - 2]] = [loopItems[loopItems.length - 2], loopItems[loopItems.length - 1]];
  }
  const items = [...loopItems, targetGame];
  strip.innerHTML = items.map(g => `
    <div class="t-slot-item">
      <img src="${tImgSrc(g.img)}" class="t-game-chip-img">
      ${tGameName(g)}
    </div>
  `).join('');

  const itemH = 44;
  const centerOff = 22;
  const targetIdx = items.length - 1;
  const endY = centerOff - targetIdx * itemH;
  const startY = centerOff;
  strip.style.transform = `translateY(${startY}px)`;
  strip.getBoundingClientRect();

  const duration = 3200;
  let startTime = null;
  function ease(t) { return 1 - Math.pow(1 - t, 4); }

  function step(ts) {
    if (!startTime) startTime = ts;
    const p = Math.min((ts - startTime) / duration, 1);
    strip.style.transform = `translateY(${startY + (endY - startY) * ease(p)}px)`;
    if (p < 1) {
      requestAnimationFrame(step);
    } else {
      strip.style.transform = `translateY(${endY}px)`;
      tEl('t-spin-result').style.display = 'block';
      setTimeout(() => {
        const btn = tEl('t-btn-play');
        if (btn) btn.style.display = 'inline-block';
        if (onDone) onDone();
      }, 400);
    }
  }
  requestAnimationFrame(step);
}

// ----------------------------------------------------------------
// 12. RESULT MODAL
// ----------------------------------------------------------------
function tShowResult(winner) {
  const tx = tLang();
  const game = TournamentState.currentGame;
  const panel = tEl('t-panel-result');

  let emoji, titleHtml, colorClass;
  if (winner === 1) {
    emoji = '🎉'; colorClass = 't-col-p1';
    titleHtml = `<span class="${colorClass}">${tx.p1}</span> ${tx.wins}`;
  } else if (winner === 2) {
    emoji = '🎉'; colorClass = 't-col-p2';
    titleHtml = `<span class="${colorClass}">${tx.p2}</span> ${tx.wins}`;
  } else {
    emoji = '🤝'; titleHtml = tx.draw;
  }

  panel.innerHTML = `
    <div class="t-result-emoji">${emoji}</div>
    <h2 class="t-result-title">${titleHtml}</h2>
    <p class="t-result-sub">${tGameName(game)} – ${tx.round_done} ${TournamentState.currentRound}</p>
    <div class="t-score-row">
      <div class="t-score-block">
        <span class="t-score-name">${tx.p1}</span>
        <span class="t-score-val t-col-p1">${TournamentState.scores[0]}</span>
      </div>
      <span class="t-score-divider">:</span>
      <div class="t-score-block">
        <span class="t-score-name">${tx.p2}</span>
        <span class="t-score-val t-col-p2">${TournamentState.scores[1]}</span>
      </div>
    </div>
    <button class="t-btn-primary" onclick="Tournament.next()">▶ ${tx.btn_next}</button>
  `;
  tShowPanel('t-panel-result');
  if (winner !== 0) tCelebrate();
}

// ----------------------------------------------------------------
// 13. FINAL PODIUM
// ----------------------------------------------------------------
function tShowFinal() {
  const tx = tLang();
  const [s1, s2] = TournamentState.scores;
  const panel = tEl('t-panel-final');

  const trophyImg = `<img src="${tImgSrc('trophae.png')}" style="width:68px;height:68px;object-fit:contain;">`;

  let crown, label, winnerName;
  if (s1 > s2)      { crown = trophyImg; label = tx.champion;      winnerName = `<span class="t-col-p1">${tx.p1}</span>`; }
  else if (s2 > s1) { crown = trophyImg; label = tx.champion;      winnerName = `<span class="t-col-p2">${tx.p2}</span>`; }
  else              { crown = '🤝';       label = tx.champion_draw; winnerName = `<span>${tx.draw_both}</span>`; }

  const maxH = Math.max(s1, s2, 1);
  const h1 = 60 + Math.round((s1 / maxH) * 80);
  const h2 = 60 + Math.round((s2 / maxH) * 80);

  const histHTML = TournamentState.roundHistory.map(r => {
    const wCls = r.winner === 1 ? 't-col-p1' : r.winner === 2 ? 't-col-p2' : '';
    const wTxt = r.winner === 1 ? tx.p1 : r.winner === 2 ? tx.p2 : tx.history_draw;
    return `<div class="t-hist-row">
      <span>${tGameImg(r.game)} ${tGameName(r.game)}</span>
      <span class="${wCls}">${wTxt}</span>
    </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="t-crown">${crown}</div>
    <div class="t-final-label">${label}</div>
    <div class="t-final-winner">${winnerName}</div>
    <div class="t-podium">
      <div class="t-podium-col">
        <div class="t-podium-score t-col-p1">${s1}</div>
        <div class="t-podium-bar t-podium-bar--p1" style="height:${h1}px">
          ${s1 > s2 ? `<img src="${tImgSrc('trophae.png')}" style="width:28px;height:28px;object-fit:contain;">` : ''}
        </div>
        <div class="t-podium-lbl">${tx.p1}</div>
      </div>
      <div class="t-podium-col">
        <div class="t-podium-score t-col-p2">${s2}</div>
        <div class="t-podium-bar t-podium-bar--p2" style="height:${h2}px">
          ${s2 > s1 ? `<img src="${tImgSrc('trophae.png')}" style="width:28px;height:28px;object-fit:contain;">` : ''}
        </div>
        <div class="t-podium-lbl">${tx.p2}</div>
      </div>
    </div>
    <div class="t-history">${histHTML}</div>
    <button class="t-btn-primary" onclick="Tournament.restart()">${tx.btn_restart}</button>
  `;
  tShowPanel('t-panel-final');
  if (s1 !== s2) tCelebrate();
}

// ----------------------------------------------------------------
// 14. MATH QUIZ (embedded)
// ----------------------------------------------------------------
const TMQ = {
  timer: null, timeLeft: 30, score: 0,
  correct: 0, wrong: 0, player: 0, answer: 0, fbTimeout: null,

  gen() {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, ans;
    if (op === '+')      { a = Math.floor(Math.random()*20)+1; b = Math.floor(Math.random()*20)+1; ans = a+b; }
    else if (op === '-') { a = Math.floor(Math.random()*20)+5; b = Math.floor(Math.random()*a);    ans = a-b; }
    else                 { a = Math.floor(Math.random()*10)+1; b = Math.floor(Math.random()*10)+1; ans = a*b; }
    return { q: `${a} ${op} ${b} = ?`, ans };
  },

  // Zeigt den "Spieler X ist dran" Übergabe-Screen
  showHandover(playerIdx) {
    const tx = tLang();
    const pName = playerIdx === 0 ? tx.p1 : tx.p2;
    const pColor = playerIdx === 0 ? 'var(--player1-color)' : 'var(--player2-color)';
    const panel = tEl('t-panel-mathquiz');
    panel.innerHTML = `
      <div class="t-mq-title">${tx.mq_title}</div>
      <div style="font-size:3rem; margin:8px 0;">🧮</div>
      <div style="font-size:1.3rem; font-weight:bold; color:${pColor}; margin-bottom:6px;">${pName}</div>
      <div class="t-mq-player" style="margin-bottom:16px;">${tx.mq_p_label}</div>
      <button class="t-btn-primary" onclick="TMQ.build(${playerIdx})">▶ ${tx.btn_play}</button>
    `;
    tShowPanel('t-panel-mathquiz');
    const ov = tEl('t-overlay');
    if (ov) { ov.style.display = 'flex'; ov.classList.add('t-open'); }
  },

  build(playerIdx) {
    this.player = playerIdx;
    this.score = 0; this.correct = 0; this.wrong = 0;
    this.timeLeft = 30;
    const tx = tLang();
    const pName = playerIdx === 0 ? tx.p1 : tx.p2;
    const pColor = playerIdx === 0 ? 'var(--player1-color)' : 'var(--player2-color)';
    const panel = tEl('t-panel-mathquiz');
    panel.innerHTML = `
      <div class="t-mq-title">${tx.mq_title}</div>
      <div class="t-mq-player" style="color:${pColor}; font-weight:bold;">${pName}</div>
      <div class="t-mq-timer" id="t-mq-timer">30</div>
      <div class="t-mq-stats">
        <div class="t-mq-stat"><span id="t-mq-score">0</span><small>${tx.mq_pts}</small></div>
        <div class="t-mq-stat t-col-green"><span id="t-mq-correct">0</span><small>✓</small></div>
        <div class="t-mq-stat t-col-p1"><span id="t-mq-wrong">0</span><small>✗</small></div>
      </div>
      <div class="t-mq-question" id="t-mq-question">? + ? = ?</div>
      <input class="t-mq-input" id="t-mq-input" type="number" placeholder="?" autocomplete="off">
      <button class="t-btn-primary" onclick="TMQ.check()">${tx.mq_ok}</button>
      <div class="t-mq-fb" id="t-mq-fb"></div>
    `;
    tShowPanel('t-panel-mathquiz');
    const ov = tEl('t-overlay');
    if (ov) { ov.style.display = 'flex'; ov.classList.add('t-open'); }

    this.newQ();
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.timeLeft--;
      const el = tEl('t-mq-timer');
      if (el) { el.textContent = this.timeLeft; el.classList.toggle('t-mq-timer--urgent', this.timeLeft <= 5); }
      if (this.timeLeft <= 0) { clearInterval(this.timer); this.end(); }
    }, 1000);

    const inp = tEl('t-mq-input');
    if (inp) {
      inp.focus();
      inp.onkeydown = e => { if (e.key === 'Enter') TMQ.check(); };
    }
  },

  newQ() {
    const { q, ans } = this.gen();
    this.answer = ans;
    const el = tEl('t-mq-question');
    if (el) el.textContent = q;
    const inp = tEl('t-mq-input');
    if (inp) { inp.value = ''; inp.focus(); }
  },

  check() {
    const inp = tEl('t-mq-input');
    if (!inp) return;
    const val = parseInt(inp.value);
    if (isNaN(val)) return;
    const tx = tLang();
    const fb = tEl('t-mq-fb');
    clearTimeout(this.fbTimeout);
    if (val === this.answer) {
      this.score++; this.correct++;
      if (fb) { fb.textContent = tx.mq_correct; fb.className = 't-mq-fb t-mq-fb--correct'; }
    } else {
      this.score = Math.max(0, this.score - 1); this.wrong++;
      if (fb) { fb.textContent = `${tx.mq_wrong} (${this.answer})`; fb.className = 't-mq-fb t-mq-fb--wrong'; }
    }
    const sc = tEl('t-mq-score'), co = tEl('t-mq-correct'), wr = tEl('t-mq-wrong');
    if (sc) sc.textContent = this.score;
    if (co) co.textContent = this.correct;
    if (wr) wr.textContent = this.wrong;
    this.fbTimeout = setTimeout(() => { if (fb) fb.textContent = ''; }, 900);
    this.newQ();
  },

  end() {
    clearInterval(this.timer);
    TournamentState.mathScores[this.player] = this.score;
    saveTS();

    if (this.player === 0) {
      // P1 fertig → Ergebnis-Screen mit Übergabe zu P2
      this.showP1Result();
    } else {
      // P2 fertig → Vergleich zeigen
      this.showComparison();
    }
  },

  showP1Result() {
    const tx = tLang();
    const s1 = TournamentState.mathScores[0];
    const panel = tEl('t-panel-mathquiz');
    panel.innerHTML = `
      <div class="t-mq-title">${tx.mq_title}</div>
      <div style="font-size:2.5rem; margin:8px 0;">✅</div>
      <div style="font-size:1rem; color:#666; margin-bottom:4px;">${tx.p1}</div>
      <div style="font-size:2.5rem; font-weight:bold; color:var(--player1-color);">${s1}</div>
      <div style="font-size:0.85rem; color:#888; margin-bottom:16px;">${tx.mq_pts}</div>
      <button class="t-btn-primary" onclick="TMQ.showHandover(1)">▶ ${tx.p2} ${tx.mq_p_label.replace('(30 Sekunden)','').replace('(30 seconds)','')}</button>
    `;
    tShowPanel('t-panel-mathquiz');
  },

  showComparison() {
    const tx = tLang();
    const [s1, s2] = TournamentState.mathScores;
    const winner = s1 > s2 ? 1 : s2 > s1 ? 2 : 0;

    let resultEmoji, resultText, resultColor;
    if (winner === 1)      { resultEmoji = '🎉'; resultText = `${tx.p1} ${tx.wins}`; resultColor = 'var(--player1-color)'; }
    else if (winner === 2) { resultEmoji = '🎉'; resultText = `${tx.p2} ${tx.wins}`; resultColor = 'var(--player2-color)'; }
    else                   { resultEmoji = '🤝'; resultText = tx.draw;               resultColor = '#888'; }

    const panel = tEl('t-panel-mathquiz');
    panel.innerHTML = `
      <div class="t-mq-title">${tx.mq_title}</div>
      <div style="font-size:2.5rem; margin:6px 0;">${resultEmoji}</div>
      <div style="font-size:1.2rem; font-weight:bold; color:${resultColor}; margin-bottom:14px;">${resultText}</div>
      <div class="t-score-row">
        <div class="t-score-block">
          <span class="t-score-name">${tx.p1}</span>
          <span class="t-score-val t-col-p1">${s1}</span>
          <span style="font-size:0.75rem; color:#888;">${tx.mq_pts}</span>
        </div>
        <span class="t-score-divider">:</span>
        <div class="t-score-block">
          <span class="t-score-name">${tx.p2}</span>
          <span class="t-score-val t-col-p2">${s2}</span>
          <span style="font-size:0.75rem; color:#888;">${tx.mq_pts}</span>
        </div>
      </div>
      <button class="t-btn-primary" onclick="TMQ.finish()" style="margin-top:8px;">▶ ${tx.btn_next}</button>
    `;
    tShowPanel('t-panel-mathquiz');
    if (winner !== 0) tCelebrate();
  },

  finish() {
    const [s1, s2] = TournamentState.mathScores;
    const winner = s1 > s2 ? 1 : s2 > s1 ? 2 : 0;
    Tournament.applyResult(winner);
  }
};

// ----------------------------------------------------------------
// 15. CELEBRATE
// ----------------------------------------------------------------
function tCelebrate() {
  if (typeof startConfetti === 'function') {
    try { startConfetti(); } catch(e) {}
  }
}

// ----------------------------------------------------------------
// 16. TOURNAMENT CONTROLLER
// ----------------------------------------------------------------
function tShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const Tournament = {

  open() {
    tBuildIntro();
    tShowPanel('t-panel-intro');
  },

  start() {
    TournamentState.active = true;
    TournamentState.scores = [0, 0];
    TournamentState.roundHistory = [];
    TournamentState.currentRound = 0;
    TournamentState.gameOrder = tShuffle(T_GAMES);
    saveTS();
    tUpdateScoreboard();
    this._spin();
  },

  _spin() {
    TournamentState.currentGame = TournamentState.gameOrder[TournamentState.currentRound];
    saveTS();
    tShowPanel('t-panel-spin');
    tRunSpin(TournamentState.currentGame, () => {});
  },

  launchGame() {
  const game = TournamentState.currentGame;
  sessionStorage.removeItem('t_game_snapshot');
  if (game.id === 'mathquiz') {
  TournamentState.mathScores = [0, 0];
  TournamentState.mathPhase = 0;
  sessionStorage.setItem('mq_phase', '0'); // ← neu, vor Navigation setzen
  saveTS();
  tCloseOverlay();
  const isSubpage = window.location.pathname.includes('/pages/');
  const prefix = isSubpage ? '' : 'pages/';
  window.location.href = `${prefix}${game.url}?tournament=1&round=${TournamentState.currentRound + 1}`;
}
  else {
    tCloseOverlay();
    const isSubpage = window.location.pathname.includes('/pages/');
    const prefix = isSubpage ? '' : 'pages/';
    const url = `${prefix}${game.url}?tournament=1&round=${TournamentState.currentRound + 1}`;
    window.location.href = url;
  }
},

  reportResult(winner) {
    this.applyResult(winner);
  },

  applyResult(winner) {
    if (winner === 1) TournamentState.scores[0]++;
    else if (winner === 2) TournamentState.scores[1]++;
    TournamentState.roundHistory.push({ game: TournamentState.currentGame, winner });
    TournamentState.currentRound++;
    saveTS();
    tUpdateScoreboard();
    tShowResult(winner);
    const ov = tEl('t-overlay');
    if (ov) { ov.style.display = 'flex'; ov.classList.add('t-open'); }
  },

  next() {
    if (TournamentState.currentRound >= 5) {
      tShowFinal();
    } else {
      this._spin();
    }
  },

  abort() {
  TournamentState.active = false;
  clearTS();
  sessionStorage.removeItem('t_game_snapshot');
  sessionStorage.removeItem('mq_phase');
  sessionStorage.removeItem('mq_score_0');
  tUpdateScoreboard();
  // MQ Header zurücksetzen falls auf MQ-Seite
  const header = document.querySelector('.header');
  if (header && window.location.pathname.includes('mathquiz')) {
    const lang = window.cachedData?.languages?.[localStorage.getItem('selectedLanguage') || 'de'];
    header.textContent = lang?.mq || 'Math Quiz';
  }
  tCloseOverlay();
},

restart() {
  TournamentState.active = false;
  clearTS();
  sessionStorage.removeItem('t_game_snapshot');
  sessionStorage.removeItem('mq_phase');
  sessionStorage.removeItem('mq_score_0');
  tUpdateScoreboard();
  const header = document.querySelector('.header');
  if (header && window.location.pathname.includes('mathquiz')) {
    const lang = window.cachedData?.languages?.[localStorage.getItem('selectedLanguage') || 'de'];
    header.textContent = lang?.mq || 'Math Quiz';
  }
  this.open();
},
};

// ----------------------------------------------------------------
// 17. INJECT DOM
// ----------------------------------------------------------------
function tInjectDOM() {
  if (tEl('t-overlay')) return;

  const sb = document.createElement('div');
  sb.id = 't-scoreboard';
  sb.style.display = 'none';
  document.body.appendChild(sb);

  const ov = document.createElement('div');
  ov.id = 't-overlay';
  ov.style.display = 'none';
  ov.innerHTML = `
    <div id="t-panel-intro"    class="t-panel" style="display:none"></div>
    <div id="t-panel-spin"     class="t-panel" style="display:none"></div>
    <div id="t-panel-result"   class="t-panel" style="display:none"></div>
    <div id="t-panel-mathquiz" class="t-panel" style="display:none"></div>
    <div id="t-panel-final"    class="t-panel" style="display:none"></div>
  `;
  document.body.appendChild(ov);
}

// ----------------------------------------------------------------
// 18. HOOK TROPHY BUTTON
// ----------------------------------------------------------------
function tHookTrophyBtn() {
  const spans = document.querySelectorAll('.nav-trophae');
  spans.forEach(span => {
    span.style.cursor = 'pointer';
    span.onclick = () => {
      if (TournamentState.active) {
        const currentGame = TournamentState.currentGame;
        const onGamePage = currentGame && window.location.pathname.includes(currentGame.url);

        if (!onGamePage && currentGame) {
          // Nicht auf der Spielseite → hinnavigieren
          const isSubpage = window.location.pathname.includes('/pages/');
          const prefix = isSubpage ? '' : 'pages/';
          window.location.href = `${prefix}${currentGame.url}?tournament=1&round=${TournamentState.currentRound + 1}`;
          return;
        }

        // Bereits auf der Spielseite → Abbruch-Popup
        tShowAbortPanel();
      } else {
        Tournament.open();
      }
    };
  });
}

// ----------------------------------------------------------------
// 19. GAME PAGE INTEGRATION
// ----------------------------------------------------------------
function tCheckGamePage() {
  const params = new URLSearchParams(window.location.search);
  if (!params.get('tournament')) return;
  if (!loadTS()) return;

  tUpdateScoreboard();

  let reported = false;
  const observer = new MutationObserver(() => {
    if (reported) return;

    // Connect Four & Battleship (beide nutzen championOverlay)
    const cf = tEl('championOverlay');
    if (cf && !cf.classList.contains('hidden') && cf.style.display !== 'none') {
      const winner = cf.dataset.winner;
      if (winner) { reported = true; observer.disconnect(); tInjectGameResultBtn(cf, winner); }
    }

    // Memory
    const mem = tEl('winOverlay');
    if (mem && mem.style.display === 'flex') {
      const winner = mem.dataset.winner;
      if (winner && winner !== 'draw') { reported = true; observer.disconnect(); tInjectGameResultBtn(mem, winner); }
      else if (winner === 'draw') { reported = true; observer.disconnect(); tInjectGameResultBtn(mem, '0'); }
    }

    // Yazy
    const yazy = tEl('winner-popup');
    if (yazy && yazy.classList.contains('show')) {
      const wt = tEl('winner-text')?.textContent || '';
      let winner = '0';
      if (wt.includes('1')) winner = '1';
      else if (wt.includes('2')) winner = '2';
      reported = true; observer.disconnect(); tInjectGameResultBtn(yazy, winner);
    }
  });
  observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
}

function tInjectGameResultBtn(container, winner) {
  if (container.querySelector('.t-report-btn')) return;

  const hideSelectors = [
  '.retry-btn', '.play-again-btn', '.reset-btn',
  '.close-btn', '.modal-close', '.modal-close2', '.win-close',
  '.overlay-close', '.btn-close', 'button.close',
  '.playAgainBtn', '.pABtn',
  '#playAgainBtnChampion', '#modal-close', '#winner-close',
  '#winner-play-again', '#playAgainPopupBtn',
  '[onclick*="resetGame"]', '[onclick*="playAgain"]',
  '[onclick*="newGame"]', '[onclick*="restart"]',
  '[onclick*="reset"]',
];

  // Layout-Elemente nur unsichtbar machen (visibility), nicht aus dem Layout entfernen
  const layoutSelectors = ['#playAgainBtn', '.reset'];

  hideSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
  });

  layoutSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.style.visibility = 'hidden');
  });

  const tx = tLang();
  const btn = document.createElement('button');
  btn.className = 't-report-btn';
  btn.innerHTML = `<img src="${tImgSrc('trophae.png')}" style="width:18px;height:18px;vertical-align:middle;object-fit:contain;"> ${tx.btn_next} ${tx.btn_to_olympics}`;
  btn.onclick = () => {
    const w = parseInt(winner);
    Tournament.applyResult(isNaN(w) ? 0 : w);
    const ov = tEl('t-overlay');
    if (ov) { ov.style.display = 'flex'; ov.classList.add('t-open'); }
  };

  const box = container.querySelector('.winnerBox,.winner-content,.win-popup') || container;
  box.appendChild(btn);
}

// ----------------------------------------------------------------
// 20. INIT
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  tInjectDOM();
  tHookTrophyBtn();

  if (loadTS() && TournamentState.active) {
    tUpdateScoreboard();
    tCheckGamePage();
  } else {
    tCheckGamePage();
  }
});

// Re-hook nach global.js nav-rebuild (Sprachwechsel)
const _origSetLayout = window.setupLayout;
if (typeof _origSetLayout === 'function') {
  window.setupLayout = async function() {
    await _origSetLayout.apply(this, arguments);
    tHookTrophyBtn();
    tUpdateScoreboard();
    if (typeof tUpdateMQHeader === 'function') tUpdateMQHeader();

    // t-report-btn Sprache aktualisieren
    const tx = tLang();
    document.querySelectorAll('.t-report-btn').forEach(btn => {
      btn.innerHTML = `<img src="${tImgSrc('trophae.png')}" style="width:18px;height:18px;vertical-align:middle;object-fit:contain;"> ${tx.btn_next} ${tx.btn_to_olympics}`;
    });
  };
}