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
            document.querySelector(`[data-row="${r - 1}"][data-col="${c}"]`),
            document.querySelector(`[data-row="${r + 1}"][data-col="${c}"]`),
            document.querySelector(`[data-row="${r}"][data-col="${c - 1}"]`),
            document.querySelector(`[data-row="${r}"][data-col="${c + 1}"]`)
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
            const boxAbove = document.getElementById(`box-${r - 1}-${c}`);
            const boxBelow = document.getElementById(`box-${r + 1}-${c}`);
            if ((boxAbove && !boxAbove.classList.contains('is-hole')) ||
                (boxBelow && !boxBelow.classList.contains('is-hole'))) {
                isUseless = false;
            }
        } else {
            const boxLeft = document.getElementById(`box-${r}-${c - 1}`);
            const boxRight = document.getElementById(`box-${r}-${c + 1}`);
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

    window.clickSound.currentTime = 0;
    window.clickSound.volume = 0.1;
    window.clickSound.play();

    const boxesClosed = checkBox(el);

    if (boxesClosed > 0) {
        window.correctSound.currentTime = 0;
        window.correctSound.volume = 0.07;
        window.correctSound.play();

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

        if (isLineTaken(boxR - 1, boxC) && isLineTaken(boxR + 1, boxC) &&
            isLineTaken(boxR, boxC - 1) && isLineTaken(boxR, boxC + 1)) {
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
    // 1. Die reinen Zahlen-Werte aktualisieren
    document.getElementById('p1-score').innerText = scores[1];
    document.getElementById('p2-score').innerText = scores[2];
    
    const status = document.getElementById('status');
    if (status) {
        const currentLang = localStorage.getItem('selectedLanguage') || 'de';
        
        if (cachedData && cachedData.languages[currentLang]) {
            const langData = cachedData.languages[currentLang];
            
            // 2. Den Status-Text übersetzen
            const playerLabel = currentPlayer === 1 ? langData.player1 : langData.player2;
            const turnText = langData.your_turn2 || "ist dran!";
            status.innerText = `${playerLabel} ${turnText}`;

            // 3. OPTIONAL: Falls die Scoreboard-Labels nicht über data-i18n 
            // automatisch mitsprangen, kannst du sie hier erzwingen:
            // document.querySelector('.p1 [data-i18n="player1"]').innerText = langData.player1;
            // document.querySelector('.p2 [data-i18n="player2"]').innerText = langData.player2;

        } else {
            status.innerText = `Player ${currentPlayer}'s turn`;
        }
        
        status.className = `p${currentPlayer}`;
    }
}

function checkGameOver() {
    const allPlayableBoxes = document.querySelectorAll('.box:not(.is-hole)').length;
    const takenBoxes = document.querySelectorAll('.box.taken').length;

    if (takenBoxes === allPlayableBoxes && allPlayableBoxes > 0) {
        isGameOverState = true;
        let winnerText = "";
        let message = "";

        // WICHTIG: Zugriff über scores[1] und scores[2]
        if (scores[1] > scores[2]) { 
            winnerText = `☆ Player 1 wins ☆`;
            message = `Final score: ${scores[1]} - ${scores[2]}`;
        }
        else if (scores[2] > scores[1]) { 
            winnerText = `☆ Player 2 wins ☆`;
            message = `Final score: ${scores[2]} - ${scores[1]}`;
        }
        else {
            winnerText = `Draw!`;
            message = `Final score: ${scores[1]} - ${scores[2]}`;
        }

        setTimeout(() => {
            // HIER war der Fehler: Du musst BEIDE Variablen übergeben
            showModal(winnerText, message); 
            if (typeof startConfetti === "function") startConfetti();
        }, 300);
    }
}

function showModal(title) {
    const modal = document.getElementById("championOverlay");
    const modalContent = modal.querySelector('.winnerBox');
    const modalText = document.getElementById("championText");

    // Hier wird der Titel und die Nachricht mit Abstand gesetzt
    modalText.innerHTML = `
        <div style="margin-bottom: 20px; font-size: 32px;">${title}</div>
    `;

    modalContent.classList.remove('winner-p1', 'winner-p2', 'winner-draw');
    if (scores[1] > scores[2]) {
        modalContent.classList.add('winner-p1');
    } else if (scores[2] > scores[1]) {
        modalContent.classList.add('winner-p2');
    } else {
        modalContent.classList.add('winner-draw');
    }

    modal.style.display = "flex";
}

// Diese Funktion hat gefehlt – sie schließt das Fenster
function closeModal() {
    const modal = document.getElementById("championOverlay");
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

// X schließt nur das Modal
document.getElementById("modal-close").addEventListener("click", () => {
    closeModal();
});

// "Show" setzt alles zurück
document.getElementById("playAgainBtnChampion").addEventListener("click", () => {
    resetGame();
});

updateUI();