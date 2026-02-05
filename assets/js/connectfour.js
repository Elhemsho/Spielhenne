/* ------------------------------------ Vier Gewinnt Logik ------------------------------------ */
const rows = 6;
const cols = 7;
const board = document.getElementById('board');
const resetBtn = document.getElementById('playAgainBtn');
const redIndicator = document.getElementById("redIndicator");
const blueIndicator = document.getElementById("blueIndicator");
const winPopup = document.getElementById("winPopup");
const winText = document.getElementById("winText");
const winCoin = document.getElementById("winCoin");
const closePopup = document.getElementById("closePopup");

let gameOver = false;
let currentPlayer = 'red';
let grid = Array.from({ length: rows }, () => Array(cols).fill(null));

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
            const stone = document.createElement('div');
            stone.classList.add('stone');
            stone.style.backgroundImage = currentPlayer === 'red'
                ? "url('../assets/images/chip_rot2.png')"
                : "url('../assets/images/chip_blau2.png')";
            stone.style.backgroundSize = "cover";
            const cell = document.querySelector(`.cell[data-row='${r}'][data-col='${col}']`);
            cell.appendChild(stone);

            requestAnimationFrame(() => { stone.style.top = '5px'; });

            if (checkWin(r, col)) {
                gameOver = true;
                showWinPopup(currentPlayer);
                return;
            }
            if (isBoardFull()) {
                gameOver = true;
                showDrawPopup();
                return;
            }
            currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
            updateTurnIndicator();
            break;
        }
    }
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

if (resetBtn) {
    resetBtn.onclick = () => {
        grid = Array.from({ length: rows }, () => Array(cols).fill(null));
        document.querySelectorAll('.stone').forEach(s => s.remove());
        currentPlayer = 'red';
        gameOver = false;
        if (winPopup) winPopup.classList.add("hidden");
        winCoin.style.display = "block";
        updateTurnIndicator();
    };
}

function updateTurnIndicator() {
    if (!redIndicator || !blueIndicator) return;
    if (currentPlayer === "red") {
        redIndicator.classList.remove("inactive");
        blueIndicator.classList.add("inactive");
    } else {
        blueIndicator.classList.remove("inactive");
        redIndicator.classList.add("inactive");
    }
}

function showWinPopup(player) {
    const content = winPopup.querySelector(".popup-content");
    content.classList.replace("draw", "win");
    winText.textContent = player === "red" ? "Red wins!" : "Blue wins!";
    winCoin.style.backgroundImage = player === "red"
        ? "url('../assets/images/chip_rot2.png')"
        : "url('../assets/images/chip_blau2.png')";
    winPopup.classList.remove("hidden");
}

if (closePopup) {
    closePopup.onclick = () => { winPopup.classList.add("hidden"); };
}

function showDrawPopup() {
    const content = winPopup.querySelector(".popup-content");
    content.classList.replace("win", "draw");

    // Text setzen
    winText.innerHTML = `<strong>Draw!</strong><div class="emoji">🤝</div>`;

    // Münze komplett aus dem Layout entfernen, damit sie keinen Platz wegnimmt
    if (winCoin) {
        winCoin.style.display = "none";
    }

    winPopup.classList.remove("hidden");
}

function isBoardFull() {
    return grid.every(row => row.every(cell => cell !== null));
}