/* ------------------------------------ Tic Tac Toe Logik ------------------------------------ */
const fields = document.querySelectorAll(".feld");
const turnP1 = document.getElementById("turnP1");
const turnP2 = document.getElementById("turnP2");
const scoreP1 = document.querySelector(".pp1");
const scoreP2 = document.querySelector(".pp2");

const overlay = document.getElementById("winnerOverlay");
const winnerText = document.getElementById("winnerText");
const closeOverlay = document.getElementById("closeOverlay");
const resetBtn = document.getElementById("resetBtn");
const resetOverlay = document.getElementById("resetOverlay");

const championOverlay = document.getElementById("championOverlay");
const championText = document.getElementById("championText");

// Die IDs für die Reset-Buttons
const manualResetIcon = document.getElementById("playAgainBtn"); // Das Icon oben rechts
const playAgainBtnChampion = document.getElementById("playAgainBtnChampion"); // Der Button im Overlay

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = true;
let startingPlayer = "X";
let championPending = false;
let gameOver = false;

const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontal
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Vertikal
    [0, 4, 8], [2, 4, 6]             // Diagonal
];

// Spielfeld Klicks
fields.forEach(field => {
    field.addEventListener("click", () => handleClick(field));
});

// Event Listener für Manuellen Reset (Oben Rechts)
manualResetIcon.addEventListener("click", resetEverything);
resetOverlay.addEventListener("click", resetGame);

// Event Listener für Champion-Overlay Button (NUR SCHLIESSEN)
playAgainBtnChampion.addEventListener("click", () => {
    championOverlay.classList.add("hidden");
    // Hier passiert kein Reset, damit man das Spielfeld sieht!
});

function handleClick(field) {
    const index = field.dataset.index;
    if (board[index] !== "" || !gameActive) return;

    board[index] = currentPlayer;
    field.innerHTML = currentPlayer === "X"
  ? "X"
  : '<span class="circle2"></span>';

    field.classList.add(currentPlayer === "X" ? "x" : "o");

    const winData = checkWin();
    if (winData) {
        gameActive = false;
        handleWin(winData);
        return;
    }

    if (board.every(cell => cell !== "")) {
        gameActive = false;
        gameOver = true;
        handleWin(null); // Unentschieden
        return;
    }

    switchPlayer();
}

function switchPlayer() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    turnP1.style.opacity = currentPlayer === "X" ? "1" : "0.12";
    turnP2.style.opacity = currentPlayer === "O" ? "1" : "0.12";
}

function checkWin() {
    for (let condition of winConditions) {
        if (condition.every(i => board[i] === currentPlayer)) {
            return condition;
        }
    }
    return null;
}

function handleWin(winFields) {
    gameOver = true;

    // Gewinnerfelder markieren (Blinken)
    if (winFields) {
        winFields.forEach(i => {
            fields[i].classList.add("win");
        });

        // Score erhöhen
        if (currentPlayer === "X") {
            scoreP1.textContent = Number(scoreP1.textContent) + 1;
        } else {
            scoreP2.textContent = Number(scoreP2.textContent) + 1;
        }
    }

    const p1Score = Number(scoreP1.textContent);
    const p2Score = Number(scoreP2.textContent);

    // Entscheidung: Champion oder normale Runde?
    setTimeout(() => {
        if (p1Score === 3 || p2Score === 3) {
            showChampion();
        } else {
            // WICHTIG: Kein automatisches resetGame() mehr!
            // Stattdessen aktivieren wir nur das Overlay über dem Spielfeld
            resetOverlay.classList.add("armed");
        }
    }, 800);

    startingPlayer = startingPlayer === "X" ? "O" : "X";
}

function resetGame() {
    // Falls das Champion-Overlay offen ist, verhindern wir den Runden-Reset
    if (!championOverlay.classList.contains("hidden")) return;

    gameOver = false;
    board = ["", "", "", "", "", "", "", "", ""];
    gameActive = true;
    fields.forEach(field => {
        field.textContent = "";
        field.classList.remove("win", "x", "o");
    });
    currentPlayer = startingPlayer;
    turnP1.style.opacity = currentPlayer === "X" ? "1" : "0.12";
    turnP2.style.opacity = currentPlayer === "O" ? "1" : "0.12";
    
    if (overlay) overlay.classList.add("hidden");
    resetOverlay.classList.remove("armed");
}

function showChampion() {
    if (overlay) overlay.classList.add("hidden"); 
    championOverlay.classList.remove("hidden");

    const championBox = championOverlay.querySelector('.winnerBox');
    const isP1Win = scoreP1.textContent === "3";

    championText.textContent = isP1Win ? "☆ Player 1 wins! ☆" : "☆ Player 2 wins! ☆";

    const winColor = isP1Win ? "var(--player1-color)" : "var(--player2-color)"; 
    if (championBox) {
        championBox.style.boxShadow = `0 0 20px 10px ${winColor}`;
    }

    startConfetti();
}

function resetEverything() {
    scoreP1.textContent = "0";
    scoreP2.textContent = "0";
    startingPlayer = "X";
    currentPlayer = "X";
    championOverlay.classList.add("hidden");
    resetGame();
}

// Hier deine startConfetti Funktion lassen...
