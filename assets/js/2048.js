/* ------------------------------------ 2048 Logik ------------------------------------ */
let board, history = [], undoAttempts = 5, isGameOverState = false;
let score = 0, highScore = 0;
let rows = 4, columns = 4;

window.onload = () => setGame();

function getHighScoreKey() { return `2048-highscore-${rows}x${columns}`; }

function setGame() {
    score = 0;
    document.getElementById("score").innerText = score;
    highScore = localStorage.getItem(getHighScoreKey()) || 0;
    document.getElementById("high-score").innerText = highScore;
    document.getElementById("size-label-highscore").innerText = `${rows}x${columns}`;

    board = Array(rows).fill().map(() => Array(columns).fill(0));
    history = []; undoAttempts = 5; isGameOverState = false;
    
    const container = document.getElementById("grid-container");
    container.innerHTML = ''; 
    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let tile = document.createElement("div");
            tile.id = r + "-" + c;
            updateTile(tile, 0);
            container.append(tile);
        }
    }
    spawnTile(); spawnTile();
    updateUndoDisplay(); updateArrowButtons();
    document.getElementById("game-modal").style.display = "none";
}

function changeSize(delta) {
    if ((rows + delta) < 3 || (rows + delta) > 5) return;
    const container = document.getElementById("grid-container");
    const outClass = delta > 0 ? "slide-out-left" : "slide-out-right";

    container.style.transition = "transform 0.12s ease-in";
    container.classList.add(outClass);
    
    setTimeout(() => {
        rows += delta; columns += delta;
        setGame();
        
        container.style.transition = "none";
        container.classList.remove("slide-out-left", "slide-out-right");
        container.style.transform = delta > 0 ? "translateX(105%)" : "translateX(-105%)";
        
        requestAnimationFrame(() => {
            setTimeout(() => {
                container.style.transition = "transform 0.12s ease-out";
                container.style.transform = "translateX(0)";
            }, 10);
        });
    }, 125);
}

function updateArrowButtons() {
    document.getElementById("prevSize").disabled = (rows <= 3);
    document.getElementById("nextSize").disabled = (rows >= 5);
}

function updateTile(tile, num) {
    tile.className = num > 0 ? `tile tile-${num}` : "tile";
    tile.innerText = num > 0 ? num : "";
    let baseSize = rows === 5 ? 22 : (rows === 3 ? 45 : 35);
    tile.style.fontSize = (num >= 1024) ? (baseSize - 8) + "px" : baseSize + "px";
}

function spawnTile() {
    let empty = [];
    for (let r = 0; r < rows; r++) 
        for (let c = 0; c < columns; c++) 
            if (board[r][c] === 0) empty.push({r, c});
    if (!empty.length) return;
    let {r, c} = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    updateTile(document.getElementById(`${r}-${c}`), board[r][c]);
}

function slide(row) {
    row = row.filter(n => n !== 0);
    for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i+1]) {
            row[i] *= 2; row[i+1] = 0;
            updateScore(row[i]);
        }
    }
    row = row.filter(n => n !== 0);
    while (row.length < columns) row.push(0);
    return row;
}

function updateScore(p) {
    score += p;
    document.getElementById("score").innerText = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem(getHighScoreKey(), highScore);
        document.getElementById("high-score").innerText = highScore;
    }
}

document.addEventListener('keyup', (e) => {
    if (isGameOverState) return;
    let old = JSON.stringify(board), oldS = score;
    if (e.code == "ArrowLeft" || e.code == "KeyA") for (let r = 0; r < rows; r++) board[r] = slide(board[r]);
    else if (e.code == "ArrowRight" || e.code == "KeyD") for (let r = 0; r < rows; r++) board[r] = slide([...board[r]].reverse()).reverse();
    else if (e.code == "ArrowUp" || e.code == "KeyW") {
        for (let c = 0; c < columns; c++) {
            let col = []; for (let r = 0; r < rows; r++) col.push(board[r][c]);
            col = slide(col); for (let r = 0; r < rows; r++) board[r][c] = col[r];
        }
    } else if (e.code == "ArrowDown" || e.code == "KeyS") {
        for (let c = 0; c < columns; c++) {
            let col = []; for (let r = 0; r < rows; r++) col.push(board[r][c]);
            col.reverse(); col = slide(col); col.reverse();
            for (let r = 0; r < rows; r++) board[r][c] = col[r];
        }
    } else return;

    if (old !== JSON.stringify(board)) {
        history.push({ b: old, s: oldS });
        if (history.length > 5) history.shift();
        renderBoard(); spawnTile(); updateUndoDisplay();
        if (isGameOver()) { isGameOverState = true; setTimeout(() => showModal(), 500); }
    }
});

function renderBoard() {
    for (let r = 0; r < rows; r++) 
        for (let c = 0; c < columns; c++) 
            updateTile(document.getElementById(`${r}-${c}`), board[r][c]);
}

function showModal() {
    const m = document.getElementById("game-modal");
    document.getElementById("modal-score-display").innerText = "Your Score: " + score;
    m.style.display = "flex";
    document.getElementById("modal-button").onclick = () => m.style.display = "none";
}

function undo() {
    if (undoAttempts > 0 && history.length > 0 && !isGameOverState) {
        let last = history.pop(); board = JSON.parse(last.b); score = last.s;
        document.getElementById("score").innerText = score;
        undoAttempts--; renderBoard(); updateUndoDisplay();
    }
}

function updateUndoDisplay() {
    const btn = document.getElementById("undoBtn");
    document.getElementById("undoCount").innerText = undoAttempts;
    btn.disabled = !(undoAttempts > 0 && history.length > 0 && !isGameOverState);
}

function isGameOver() {
    if (board.flat().includes(0)) return false;
    for (let r = 0; r < rows; r++) 
        for (let c = 0; c < columns; c++) {
            if (c < columns - 1 && board[r][c] === board[r][c+1]) return false;
            if (r < rows - 1 && board[r][c] === board[r+1][c]) return false;
        }
    return true;
}

document.addEventListener('click', (e) => {
    if (e.target.id === "undoBtn") undo();
    if (e.target.id === "playAgainBtn" || e.target.classList.contains("reset")) setGame();
    if (e.target.id === "prevSize") changeSize(-1);
    if (e.target.id === "nextSize") changeSize(1);
});