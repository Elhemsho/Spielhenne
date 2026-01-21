/* ------------------ Navbar - Suchfunktion erscheint durch Klick auf Lupe ------------------ */
function toggleSearch() {
    const input = document.getElementById("searchInput");
    const settings = document.getElementById("settingsDropdown");

    settings.classList.remove("show");

    if (!input.classList.contains("show")) {
        input.classList.add("show");
        input.focus();
    } else if (input.value === "") {
        input.classList.remove("show");
        input.blur();
    }
}

/* ------------------ Navbar - Suchfeld: Eingabe -> Diese Spiele erscheinen (sonst Text) ------------------ */
function searchGames() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const games = document.querySelectorAll('.game');
    const noGamesMessage = document.getElementById("noGamesMessage");
    let visibleCount = 0;

    games.forEach(game => {
        const gameName = game.innerText.toLowerCase(); 
        if (gameName.includes(query)) {
            game.style.display = 'block';
            visibleCount++;
        } else {
            game.style.display = 'none';
        }
    });

    if (noGamesMessage) {
        if (visibleCount === 0) {
            noGamesMessage.style.display = 'block';
            noGamesMessage.querySelector('h2').textContent = "No games found...";
        } else {
            noGamesMessage.style.display = 'none';
            noGamesMessage.querySelector('h2').textContent = "Coming Soon...";
        }
    }
}

/* ------------------ Spiele-Liste (für Suche) ------------------ */
const allGames = [
    { 
        name: "Tic Tac Toe", 
        url: "../tictactoe/tictactoe.html", 
        img: "../images/ttt.png" 
    },
    { 
        name: "Connect Four", 
        url: "../connectfour/connectfour.html", 
        img: "../images/chip_rot2.png" 
    },
    { 
        name: "Yazy", 
        url: "../yazy/yazy.html", 
        img: "../images/würfel.png" 
    },
    { 
        name: "Solitaire", 
        url: "../solitaire/solitaire.html", 
        img: "../images/ass2.png" 
    },
    { 
        name: "2048", 
        url: "../2048/2048.html", 
        img: "../images/2048logo.png" 
    },
    { 
        name: "Dots and Boxes", 
        url: "../dotsandboxes/dotsandboxes.html", 
        img: "../images/kklogo.png" 
    },
    { 
        name: "Memory", 
        url: "../memory/memory.html", 
        img: "../images/memorylogo.png" 
    }
];

/* ------------------ Navbar - Suchvorschläge ------------------ */
function showLiveSearch() {
    const input = document.getElementById("searchInput");
    const suggestionsBox = document.getElementById("searchSuggestions");
    
    if (!suggestionsBox) return;

    const query = input.value.toLowerCase().trim();
    suggestionsBox.innerHTML = ""; 

    if (query === "") {
        suggestionsBox.style.display = "none";
        return;
    }

    const filtered = allGames.filter(game => 
        game.name.toLowerCase().includes(query)
    );

    if (filtered.length > 0) {
        filtered.forEach(game => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            div.innerHTML = `
                <img src="${game.img}" style="width:30px; height:30px; margin-right:10px; border-radius:4px;">
                <span>${game.name}</span>
            `;
            div.onclick = () => {
                window.location.href = game.url;
            };
            suggestionsBox.appendChild(div);
        });
        suggestionsBox.style.display = "block";
    } else {
        suggestionsBox.style.display = "none";
    }
}

/* ------------------ Navbar - Suche Enter -> Weiterleitung ------------------ */
function handleSearchEnter(event) {
    if (event.key === "Enter") {
        const query = event.target.value.trim();
        if (query !== "") {
            window.location.href = `../spielhenne.html?search=${encodeURIComponent(query)}`;
        }
    }
}

/* ------------------ Navbar - Einstellungsmenü erscheint bei klick auf "Settings" ------------------ */
function toggleSettings() {
    const input = document.getElementById("searchInput");
    const settings = document.getElementById("settingsDropdown");

    if (input.value === "") {
        input.classList.remove("show");
    }
    settings.classList.toggle("show");
}

/* ------------------ Navbar - Pop-Ups schließen bei Klick daneben ------------------ */
window.onclick = function(event) {
    const settings = document.getElementById("settingsDropdown");
    const input = document.getElementById("searchInput");
    const suggestionsBox = document.getElementById("searchSuggestions");

    // Settings schließen
    if (!event.target.closest('.nav-settings') && !event.target.closest('#settingsDropdown')) {
        if (settings && settings.classList.contains('show')) {
            settings.classList.remove('show');
        }
    }

    // Suchfeld & Vorschläge schließen
    if (!event.target.closest('.search-container')) {
        if (input && input.value === "") {
            input.classList.remove('show');
        }
        if (suggestionsBox) {
            suggestionsBox.style.display = "none";
        }
    }
}

/* ------------------------------------ Musik ------------------------------------ */
const audio = document.getElementById('bgMusic');
const muteBtn = document.getElementById('muteBtn'); 
const muteIcon = document.getElementById('muteIcon'); 
const musicToggle = document.getElementById('musicToggle'); 
const dropdown = document.getElementById('settingsDropdown');

function updateMusic(isMuted) {
    if (audio) audio.muted = isMuted;
    if (muteIcon) muteIcon.src = isMuted ? '../images/mute2.png' : '../images/speaker.png';
    if (musicToggle) musicToggle.checked = !isMuted;
    localStorage.setItem('muted', isMuted);
}

// Initialisierung
const initialMutedState = localStorage.getItem('muted') === 'true';
updateMusic(initialMutedState);

if (muteBtn) {
    muteBtn.onclick = () => {
        const currentMuted = localStorage.getItem('muted') === 'true';
        updateMusic(!currentMuted);
    };
}

if (musicToggle) {
    musicToggle.onchange = () => {
        updateMusic(!musicToggle.checked);
    };
}

if (dropdown) {
    dropdown.addEventListener('click', (event) => {
        event.stopPropagation();
    });
}

document.addEventListener('click', () => {
    if (audio) audio.play().catch(() => {});
}, { once: true });

/* ------------------------------------ Käsekästchen Logik (Stabilisiert) ------------------------------------ */
let currentPlayer = 1;
let scores = { 1: 0, 2: 0 };
let isGameOverState = false;
const boardElement = document.getElementById('board');

const layouts = [
    { r: 4, c: 4, holes: [] }, // Klassisch
    { r: 5, c: 5, holes: ["1-1", "1-3", "1-5", "3-1", "3-3", "3-5", "5-1", "5-3", "5-5"] }, 
    { r: 6, c: 6, holes: ["3-3", "3-5", "3-7", "3-9", "5-3", "7-3", "9-3"] },

    // Das "U" - Ein großer Tunnel
    { r: 5, c: 5, holes: ["3-3", "3-5", "3-7", "5-3", "5-5", "5-7"] }, 
    
    // Die "Sanduhr" - Engpass in der Mitte
    { r: 5, c: 5, holes: ["3-1", "3-3", "3-7", "3-9", "7-1", "7-3", "7-7", "7-9"] },
    
    // "Tetris" - Ein Z-Shape Hindernis
    { r: 5, c: 6, holes: ["3-3", "3-5", "5-5", "5-7", "7-7", "7-9"] },
    
    // "Inseln" - Vier getrennte Bereiche, die nur über Ecken verbunden sind
    { r: 6, c: 6, holes: ["5-5", "5-7", "7-5", "7-7", "1-5", "1-7", "9-5", "9-7", "5-1", "7-1", "5-11", "7-11"] },
    
    // "Das Labyrinth" - Sehr verwinkelt
    { r: 5, c: 5, holes: ["1-3", "3-3", "5-3", "5-5", "5-7", "7-7", "9-7"] },
    
    // "Plus-Zeichen" - Fokus auf die vier Quadranten
    { r: 5, c: 5, holes: ["1-5", "3-5", "7-5", "9-5", "5-1", "5-3", "5-7", "5-9"] },
    
    // "Schlangenlinie"
    { r: 4, c: 6, holes: ["1-3", "1-5", "1-7", "5-5", "5-7", "5-9", "3-1", "7-11"] },

    // "Donut" - Ein Loch genau in der Mitte
    { r: 5, c: 5, holes: ["5-5"] }
];

let lastLayoutIndex = -1;
let currentRows, currentCols, currentHoles;

function initBoard() {
    isGameOverState = false;
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * layouts.length);
    } while (randomIndex === lastLayoutIndex);
    
    lastLayoutIndex = randomIndex;
    const layout = layouts[randomIndex];
    currentRows = layout.r;
    currentCols = layout.c;
    currentHoles = layout.holes;

    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${currentCols}, 10px 60px) 10px`;
    boardElement.style.gridTemplateRows = `repeat(${currentRows}, 10px 60px) 10px`;

    for (let r = 0; r < currentRows * 2 + 1; r++) {
        for (let c = 0; c < currentCols * 2 + 1; c++) {
            const div = document.createElement('div');
            
            if (r % 2 === 0 && c % 2 === 0) {
                div.className = 'dot';
                div.id = `dot-${r}-${c}`;
            } else if (r % 2 === 0 && c % 2 !== 0) {
                div.className = 'h-line';
                div.dataset.row = r; div.dataset.col = c;
                div.onclick = () => handleMove(div);
            } else if (r % 2 !== 0 && c % 2 === 0) {
                div.className = 'v-line';
                div.dataset.row = r; div.dataset.col = c;
                div.onclick = () => handleMove(div);
            } else {
                div.className = 'box';
                div.id = `box-${r}-${c}`;
                if (currentHoles.includes(`${r}-${c}`)) {
                    div.classList.add('is-hole');
                }
            }
            boardElement.appendChild(div);
        }
    }
    cleanUpMap();
}

function cleanUpMap() {
    disableHoleLines();

    const dots = document.querySelectorAll('.dot');
    dots.forEach(dot => {
        const r = parseInt(dot.id.split('-')[1]);
        const c = parseInt(dot.id.split('-')[2]);
        
        const hasVisibleLine = [
            document.querySelector(`[data-row="${r-1}"][data-col="${c}"]`),
            document.querySelector(`[data-row="${r+1}"][data-col="${c}"]`),
            document.querySelector(`[data-row="${r}"][data-col="${c-1}"]`),
            document.querySelector(`[data-row="${r}"][data-col="${c+1}"]`)
        ].some(line => line && line.style.visibility !== "hidden" && !line.classList.contains('is-disabled'));

        if (!hasVisibleLine) {
            dot.style.visibility = "hidden"; // Platz behalten, aber unsichtbar
        }
    });
}

function disableHoleLines() {
    const lines = document.querySelectorAll('.h-line, .v-line');
    lines.forEach(line => {
        const r = parseInt(line.dataset.row);
        const c = parseInt(line.dataset.col);
        let isUseless = true;

        if (line.classList.contains('h-line')) {
            const boxAbove = document.getElementById(`box-${r-1}-${c}`);
            const boxBelow = document.getElementById(`box-${r+1}-${c}`);
            if ((boxAbove && !boxAbove.classList.contains('is-hole')) || 
                (boxBelow && !boxBelow.classList.contains('is-hole'))) {
                isUseless = false;
            }
        } else {
            const boxLeft = document.getElementById(`box-${r}-${c-1}`);
            const boxRight = document.getElementById(`box-${r}-${c+1}`);
            if ((boxLeft && !boxLeft.classList.contains('is-hole')) || 
                (boxRight && !boxRight.classList.contains('is-hole'))) {
                isUseless = false;
            }
        }

        if (isUseless) {
            line.style.visibility = "hidden"; // WICHTIG: Erhält die Grid-Struktur
            line.classList.add('is-disabled');
        }
    });
}

function handleMove(el) {
    if (isGameOverState || el.classList.contains('taken') || el.classList.contains('is-disabled')) return;

    el.classList.add('taken', `p${currentPlayer}`);
    const boxesClosed = checkBox(el);

    if (boxesClosed > 0) {
        scores[currentPlayer] += boxesClosed;
        updateUI();
        checkGameOver();
    } else {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateUI();
    }
}

function isLineTaken(r, c) {
    const line = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    return !line || line.classList.contains('taken') || line.classList.contains('is-disabled') || line.style.visibility === "hidden";
}

function checkBox(line) {
    const r = parseInt(line.dataset.row);
    const c = parseInt(line.dataset.col);
    let closed = 0;

    const check = (boxR, boxC) => {
        const box = document.getElementById(`box-${boxR}-${boxC}`);
        if (!box || box.classList.contains('is-hole')) return false;
        
        if (isLineTaken(boxR-1, boxC) && isLineTaken(boxR+1, boxC) && 
            isLineTaken(boxR, boxC-1) && isLineTaken(boxR, boxC+1)) {
            if (!box.classList.contains('taken')) {
                box.classList.add('taken', `p${currentPlayer}`);
                return true;
            }
        }
        return false;
    };

    if (line.classList.contains('h-line')) {
        if (check(r + 1, c)) closed++;
        if (check(r - 1, c)) closed++;
    } else {
        if (check(r, c + 1)) closed++;
        if (check(r, c - 1)) closed++;
    }
    return closed;
}

function updateUI() {
    document.getElementById('p1-score').innerText = scores[1];
    document.getElementById('p2-score').innerText = scores[2];
    const status = document.getElementById('status');
    if(status) {
        status.innerText = `Player ${currentPlayer}'s turn`;
        status.className = `p${currentPlayer}`;
    }
}

function checkGameOver() {
    const allPlayableBoxes = document.querySelectorAll('.box:not(.is-hole)').length;
    const takenBoxes = document.querySelectorAll('.box.taken').length;
    
    if (takenBoxes === allPlayableBoxes && allPlayableBoxes > 0) {
        isGameOverState = true;
        let winnerText = "";
        
        if (scores[1] > scores[2]) winnerText = `Blue wins ${scores[1]}:${scores[2]}!`;
        else if (scores[2] > scores[1]) winnerText = `Red wins ${scores[2]}:${scores[1]}!`;
        else winnerText = `Draw! ${scores[1]}:${scores[2]}`;

        setTimeout(() => {
            showModal(winnerText);
        }, 300);
    }
}

// Funktion zum Anzeigen des Pop-ups
// Zeigt das Modal an
function showModal(text) {
    const modal = document.getElementById("game-modal");
    const modalContent = modal.querySelector('.modal-content');
    const modalText = document.getElementById("modal-text");
    
    modalText.innerText = text;

    // Schattenfarbe basierend auf dem Gewinner setzen
    modalContent.classList.remove('winner-p1', 'winner-p2', 'winner-draw');
    if (scores[1] > scores[2]) {
        modalContent.classList.add('winner-p1');
    } else if (scores[2] > scores[1]) {
        modalContent.classList.add('winner-p2');
    } else {
        modalContent.classList.add('winner-draw');
    }

    modal.style.display = "block";
}

// Diese Funktion hat gefehlt – sie schließt das Fenster
function closeModal() {
    const modal = document.getElementById("game-modal");
    if (modal) {
        modal.style.display = "none";
    }
}

// Deine bestehende Reset-Funktion muss das Modal ebenfalls schließen
function resetGame() {
    currentPlayer = 1;
    scores = { 1: 0, 2: 0 };
    isGameOverState = false;
    
    // Modal schließen, falls es noch offen ist
    closeModal();
    
    initBoard();
    updateUI();
}

initBoard();