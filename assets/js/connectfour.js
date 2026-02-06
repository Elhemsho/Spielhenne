/* ------------------------------------ Vier Gewinnt Logik ------------------------------------ */
const rows = 6;
const cols = 7;
const board = document.getElementById('board');
const resetBtn = document.getElementById('playAgainBtn'); // Reset oben rechts
const redIndicator = document.getElementById("redIndicator");
const blueIndicator = document.getElementById("blueIndicator");
const winPopup = document.getElementById("championOverlay");
const winText = document.getElementById("championText");
const winCoin = document.getElementById("winCoin");
const playAgainBtnChampion = document.getElementById("playAgainBtnChampion");

let gameOver = false;
let currentPlayer = 'red'; // 'red' oder 'blue'
let grid = Array.from({ length: rows }, () => Array(cols).fill(null));

// Spielfeld generieren
if (board) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', () => handleClick(c));
            board.appendChild(cell);
        }
    }
    updateTurnIndicator();
}

function handleClick(col) {
    if (gameOver) return;
    
    for (let r = rows - 1; r >= 0; r--) {
        if (!grid[r][col]) {
            grid[r][col] = currentPlayer;
            
            // Stein erstellen
            const stone = document.createElement('div');
            stone.classList.add('stone');
            stone.style.backgroundImage = currentPlayer === 'red'
                ? "url('../assets/images/chip_rot2.png')"
                : "url('../assets/images/chip_blau2.png')";
            stone.style.backgroundSize = "cover";
            
            const cell = document.querySelector(`.cell[data-row='${r}'][data-col='${col}']`);
            cell.appendChild(stone);

            // Die Animation: Stein fällt rein
            requestAnimationFrame(() => { 
                stone.style.top = '5px'; 
            });

            // Sieg prüfen
            if (checkWin(r, col)) {
                gameOver = true;
                setTimeout(() => showWinPopup(currentPlayer), 500); // Kurz warten bis Stein gelandet ist
                return;
            }
            
            // Unentschieden prüfen
            if (isBoardFull()) {
                gameOver = true;
                setTimeout(showDrawPopup, 500);
                return;
            }
            
            // Spieler wechseln (Korrektur: blue statt yellow)
            currentPlayer = currentPlayer === 'red' ? 'blue' : 'red';
            updateTurnIndicator();
            break;
        }
    }
}

function showWinPopup(player) {
    const content = winPopup.querySelector(".winnerBox");
    if (content) content.classList.replace("draw", "win");
    
    winText.textContent = player === "red" ? "☆ Player 1 wins! ☆" : "☆ Player 2 wins! ☆";
    
    // Münze im Popup anzeigen
    if (winCoin) {
        winCoin.style.display = "block";
        winCoin.style.backgroundImage = player === "red"
            ? "url('../assets/images/chip_rot2.png')"
            : "url('../assets/images/chip_blau2.png')";
    }

    // Leuchteffekt/Schatten basierend auf Gewinner
    const winColor = player === "red" ? "rgb(255, 77, 77)" : "rgb(77, 124, 255)";
    const winnerBox = winPopup.querySelector('.winnerBox');
    if (winnerBox) {
        winnerBox.style.boxShadow = `0 0 20px 10px ${winColor}`;
    }

    winPopup.classList.remove("hidden");
    if (typeof startConfetti === "function") startConfetti();
}

// REVIEW-LOGIK: Nur das Overlay schließen, Spiel bleibt sichtbar
if (playAgainBtnChampion) {
    playAgainBtnChampion.onclick = () => {
        winPopup.classList.add("hidden");
    };
}

// RESET-LOGIK: Alles komplett neu (Oben Rechts)
if (resetBtn) {
    resetBtn.onclick = () => {
        grid = Array.from({ length: rows }, () => Array(cols).fill(null));
        document.querySelectorAll('.stone').forEach(s => s.remove());
        currentPlayer = 'red';
        gameOver = false;
        winPopup.classList.add("hidden");
        if (winCoin) winCoin.style.display = "block";
        updateTurnIndicator();
    };
}

function updateTurnIndicator() {
    if (!redIndicator || !blueIndicator) return;
    redIndicator.style.opacity = (currentPlayer === "red") ? "1" : "0.2";
    blueIndicator.style.opacity = (currentPlayer === "blue") ? "1" : "0.2";
}

function checkWin(r, c) {
    const color = grid[r][c];
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dr, dc] of directions) {
        let count = 1;
        let rr = r + dr, cc = c + dc;
        while (rr >= 0 && rr < rows && cc >= 0 && cc < cols && grid[rr][cc] === color) {
            count++; rr += dr; cc += dc;
        }
        rr = r - dr; cc = c - dc;
        while (rr >= 0 && rr < rows && cc >= 0 && cc < cols && grid[rr][cc] === color) {
            count++; rr -= dr; cc -= dc;
        }
        if (count >= 4) return true;
    }
    return false;
}

function showDrawPopup() {
    const content = winPopup.querySelector(".winnerBox");
    if (content) content.classList.replace("win", "draw");

    // Dein Text mit den Bildern
    winText.innerHTML = `
        <div class="draw-container">
            <img src="../assets/images/draw.png" class="draw-icon">
            <strong>Draw!</strong>
            <img src="../assets/images/draw.png" class="draw-icon">
        </div>
    `;

    if (winCoin) winCoin.style.display = "none";

    // FIX: Den Schatten explizit auf die neutrale Farbe setzen
    // Das überschreibt den "roten" oder "blauen" Schatten der vorherigen Runde
    if (content) {
        const drawColor = "rgba(160, 236, 246, 0.7)"; // Dein neutrales Hellblau oder Grau
        content.style.boxShadow = `0 0 20px 10px ${drawColor}`;
    }

    winPopup.classList.remove("hidden");
}

function isBoardFull() {
    return grid.every(row => row.every(cell => cell !== null));
}

function startConfetti() {
    const ctx = confettiCanvas.getContext("2d");
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    const colors = ["#E53935", "#1E88E5", "#43A047", "#FDD835"];
    const confetti = Array.from({ length: 100 }, () => ({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height,
        size: Math.random() * 6 + 4,
        speedY: Math.random() * 1.5 + 0.5,
        rotation: Math.random() * Math.PI,
        rotationSpeed: Math.random() * 0.02 - 0.01,
        color: colors[Math.floor(Math.random() * colors.length)]
    }));
    function draw() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        confetti.forEach(c => {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
            ctx.restore();
            c.y += c.speedY;
            c.rotation += c.rotationSpeed;
            if (c.y > confettiCanvas.height) {
                c.y = -10;
                c.x = Math.random() * confettiCanvas.width;
            }
        });
        requestAnimationFrame(draw);
    }
    draw();
}