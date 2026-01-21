/* ------------------------------------ 2048 Logik ------------------------------------ */
let board;
let history = []; 
let undoAttempts = 5;
let isGameOverState = false; // Sperrt das Spiel nach Sieg/Niederlage
let score = 0;
let highScore = localStorage.getItem("2048-highscore") || 0;
const rows = 4;
const columns = 4;

window.onload = function() {
    setGame();
};

function setGame() {
    score = 0; // Score zurücksetzen
    document.getElementById("score").innerText = score;
    document.getElementById("high-score").innerText = highScore;

    board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    history = []; 
    undoAttempts = 5; 
    isGameOverState = false;
    
    // UI zurücksetzen
    const container = document.getElementById("grid-container");
    if (!container) return;
    container.innerHTML = ''; 

    // Raster erstellen
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let tile = document.createElement("div");
            tile.id = r + "-" + c;
            updateTile(tile, 0);
            container.append(tile);
        }
    }
    
    // Erste Kacheln spawnen
    spawnTile();
    spawnTile();
    updateUndoDisplay(); 
    
    // Modal verstecken, falls offen
    const modal = document.getElementById("game-modal");
    if (modal) modal.style.display = "none";
}

function updateTile(tile, num) {
    // Klassen-Zuweisung für Farben aus dem CSS
    tile.className = num > 0 ? "tile tile-" + num : "tile";
    tile.innerText = num > 0 ? num : "";
    
    // Schriftgrößen-Anpassung direkt im Style für flüssige Übergänge
    if (num >= 1024) {
        tile.style.fontSize = "25px";
    } else if (num >= 128) {
        tile.style.fontSize = "30px";
    } else {
        tile.style.fontSize = "35px";
    }
}

function spawnTile() {
    if (!hasEmptyTile()) return;
    let emptyTiles = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (board[r][c] === 0) emptyTiles.push({r, c});
        }
    }
    let {r, c} = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    updateTile(document.getElementById(r + "-" + c), board[r][c]);
}

function hasEmptyTile() {
    return board.flat().includes(0);
}

function slide(row) {
    row = row.filter(num => num !== 0); 
    for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i+1]) {
            row[i] *= 2;      // Die Verschmelzung
            row[i+1] = 0;
            
            // SCORE LOGIK HIER:
            updateScore(row[i]); 
        }
    }
    row = row.filter(num => num !== 0);
    while (row.length < columns) row.push(0);
    return row;
}

function updateScore(points) {
    score += points;
    document.getElementById("score").innerText = score;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("2048-highscore", highScore);
        document.getElementById("high-score").innerText = highScore;
    }
}

// Tastatur-Steuerung
document.addEventListener('keyup', (e) => {
    // Falls das Spiel beendet wurde (Sieg oder Niederlage), keine Züge mehr zulassen
    if (isGameOverState) return;

    // Aktuellen Zustand speichern, um zu prüfen, ob sich durch den Zug etwas verändert hat
    let boardBeforeMove = JSON.stringify(board);
    let scoreBeforeMove = score; 

    // Bewegung ausführen - Jetzt mit WASD Unterstützung
    if (e.code == "ArrowLeft" || e.code == "KeyA") {
        for (let r = 0; r < rows; r++) board[r] = slide(board[r]);
    } else if (e.code == "ArrowRight" || e.code == "KeyD") {
        for (let r = 0; r < rows; r++) board[r] = slide([...board[r]].reverse()).reverse();
    } else if (e.code == "ArrowUp" || e.code == "KeyW") {
        for (let c = 0; c < columns; c++) {
            let row = [];
            for (let r = 0; r < rows; r++) row.push(board[r][c]);
            row = slide(row);
            for (let r = 0; r < rows; r++) board[r][c] = row[r];
        }
    } else if (e.code == "ArrowDown" || e.code == "KeyS") {
        for (let c = 0; c < columns; c++) {
            let row = [];
            for (let r = 0; r < rows; r++) row.push(board[r][c]);
            row.reverse();
            row = slide(row);
            row.reverse();
            for (let r = 0; r < rows; r++) board[r][c] = row[r];
        }
    } else {
        return; // Andere Tasten ignorieren
    }

    // Nur fortfahren, wenn der Zug gültig war
    if (boardBeforeMove !== JSON.stringify(board)) {
        history.push({
            board: boardBeforeMove,
            score: scoreBeforeMove
        });

        if (history.length > 5) history.shift();

        renderBoard();
        spawnTile();
        updateUndoDisplay();
        checkGameStatus();
    }
});

function checkGameStatus() {
    // Die Abfrage auf board.flat().includes(2048) haben wir entfernt.
    // Das Spiel läuft jetzt einfach weiter, auch wenn du 2048 erreichst.

    // Wir prüfen nur noch, ob das Spielfeld komplett voll ist und kein Zug mehr geht:
    if (isGameOver()) {
        isGameOverState = true; // Sperrt Züge
        updateUndoDisplay();    // Sperrt Undo
        
        setTimeout(() => {
            showModal("Game Over!"); // Zeigt das finale Score-Pop-up
        }, 500);
    }
}

function renderBoard() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let tile = document.getElementById(r + "-" + c);
            if (tile) updateTile(tile, board[r][c]);
        }
    }
}

function showModal(text) {
    const modal = document.getElementById("game-modal");
    const modalText = document.getElementById("modal-text");
    const modalScore = document.getElementById("modal-score-display"); // Das neue Feld
    const modalBtn = document.getElementById("modal-button");
    
    if (modal && modalText) {
        modalText.innerText = text;
        
        // Hier wird der aktuelle Score in das Pop-up geschrieben
        if (modalScore) {
            modalScore.innerText = "Your Score: " + score;
        }
        
        modal.style.display = "flex";
        
        modalBtn.onclick = function() {
            modal.style.display = "none";
            isGameOverState = true; 
            updateUndoDisplay();
        };
    }
}

function undo() {
    if (undoAttempts > 0 && history.length > 0 && !isGameOverState) {
        // Hol das letzte Objekt aus der History
        let lastState = history.pop();
        
        // Board zurücksetzen
        board = JSON.parse(lastState.board);
        
        // Score zurücksetzen
        score = lastState.score;
        document.getElementById("score").innerText = score;
        
        undoAttempts--;
        renderBoard();
        updateUndoDisplay();
    }
}

function updateUndoDisplay() {
    const undoBtn = document.getElementById("undoBtn");
    const undoCount = document.getElementById("undoCount");
    if (undoCount) undoCount.innerText = undoAttempts;
    
    if (undoBtn) {
        // Button deaktivieren wenn Versuche leer, History leer oder Spiel vorbei
        if (undoAttempts > 0 && history.length > 0 && !isGameOverState) {
            undoBtn.disabled = false;
            undoBtn.style.opacity = "1";
        } else {
            undoBtn.disabled = true;
            undoBtn.style.opacity = "0.5";
        }
    }
}

function isGameOver() {
    if (hasEmptyTile()) return false;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (c < 3 && board[r][c] === board[r][c+1]) return false;
            if (r < 3 && board[r][c] === board[r+1][c]) return false;
        }
    }
    return true;
}

// Event-Listener für Buttons (Reset und Undo)
document.addEventListener('click', (e) => {
    if (e.target.id === "undoBtn") undo();
    if (e.target.id === "playAgainSymbol" || e.target.closest(".reset")) setGame();
});

// Verhindert das Scrollen der Seite bei Verwendung der Pfeiltasten und der Leertaste
window.addEventListener("keydown", function(e) {
    // Wenn das Spiel vorbei ist, erlauben wir das Scrollen wieder
    if (isGameOverState) {
        return; 
    }

    // Wenn das Spiel aktiv ist, blockieren wir die Scroll-Tasten
    if(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);