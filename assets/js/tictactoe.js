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
const playAgainBtn = document.getElementById("playAgainBtn");
const playAgainBtnChampion = document.getElementById("playAgainBtnChampion");
const playAgainSymbol = document.getElementById("playAgainSymbol")
const confettiCanvas = document.getElementById("confettiCanvas");

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = true;
let startingPlayer = "X";
let championPending = false;
let gameOver = false;

const winConditions = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[2, 4, 6]
];

resetOverlay.classList.remove("active");

// Spielfeld Klicks
fields.forEach(field => {
	field.addEventListener("click", () => handleClick(field));
});

// Overlay Buttons
closeOverlay.addEventListener("click", () => {
	overlay.classList.add("hidden");

	if (championPending) {
		showChampion();
		championPending = false;
		return;
	}

	if (gameOver) {
		resetOverlay.classList.add("armed");
	}
});

resetBtn.addEventListener("click", resetGame);
playAgainBtn.addEventListener("click", resetGame);
resetOverlay.addEventListener("click", resetGame);
playAgainBtnChampion.addEventListener("click", resetEverything);
playAgainSymbol.addEventListener("click", resetEverything);

function handleClick(field) {
	const index = field.dataset.index;

	if (board[index] !== "" || !gameActive) return;

	// Symbol setzen
	board[index] = currentPlayer;
	field.textContent = currentPlayer === "X" ? "X" : "⭘";
	field.classList.add(currentPlayer === "X" ? "x" : "o");

	// WICHTIG: erst setzen, dann prüfen
	const winData = checkWin();
	if (winData) {
		gameActive = false;
		handleWin(winData);
		return;
	}

	if (board.every(cell => cell !== "")) {
		gameActive = false;
		gameOver = true;

		winnerText.textContent = "Draw!";
		overlay.classList.remove("hidden");

		startingPlayer = startingPlayer === "X" ? "O" : "X";

		return;
	}

	switchPlayer();
}

function switchPlayer() {
	currentPlayer = currentPlayer === "X" ? "O" : "X";

	if (currentPlayer === "X") {
		turnP1.style.opacity = "1";
		turnP2.style.opacity = "0.12";
	} else {
		turnP1.style.opacity = "0.12";
		turnP2.style.opacity = "1";
	}
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
	resetOverlay.classList.add("armed");

	// Gewinnerfelder markieren
	winFields.forEach(i => {
		fields[i].classList.add("win");
	});

	// Score sofort erhöhen (nicht im Timeout!)
	if (currentPlayer === "X") {
		scoreP1.textContent = Number(scoreP1.textContent) + 1;
	} else {
		scoreP2.textContent = Number(scoreP2.textContent) + 1;
	}

	const p1Score = Number(scoreP1.textContent);
	const p2Score = Number(scoreP2.textContent);

	// Entscheidung: Champion oder normaler Rundensieg?
	setTimeout(() => {
		if (p1Score === 3 || p2Score === 3) {
			// Wenn jemand 3 Punkte hat, zeige SOFORT den Champion
			showChampion();
		} else {
			// Sonst zeige das normale Runden-Overlay
			winnerText.textContent = currentPlayer === "X" ? "Player 1 wins!" : "Player 2 wins!";
			overlay.classList.remove("hidden");
		}
	}, 800);

	startingPlayer = currentPlayer === "X" ? "O" : "X";
}

function resetGame() {
	gameOver = false;
	resetOverlay.classList.remove("armed");

	board = ["", "", "", "", "", "", "", "", ""];
	gameActive = true;

	fields.forEach(field => {
		field.textContent = "";
		field.classList.remove("win", "x", "o");
	});

	currentPlayer = startingPlayer;

	// Turn-Anzeige korrekt setzen
	if (currentPlayer === "X") {
		turnP1.style.opacity = "1";
		turnP2.style.opacity = "0.12";
	} else {
		turnP1.style.opacity = "0.12";
		turnP2.style.opacity = "1";
	}

	overlay.classList.add("hidden");

	if (championPending) {
		showChampion();
		championPending = false;
		return;
	}
}

function showChampion() {
	overlay.classList.add("hidden");
	resetOverlay.classList.remove("active");

	championText.textContent =
		scoreP1.textContent === "3"
			? "☆ Player 1 is the Champion!"
			: "☆ Player 2 is the Champion!";

	championOverlay.classList.remove("hidden");
	startConfetti();
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

function resetEverything() {
	// Scores zurücksetzen
	scoreP1.textContent = "0";
	scoreP2.textContent = "0";

	// Starter zurücksetzen
	startingPlayer = "X";
	currentPlayer = "X";

	// Spielfeld reset
	resetGame();

	// Overlays schließen
	championOverlay.classList.add("hidden");

	// Turn UI
	turnP1.style.opacity = "1";
	turnP2.style.opacity = "0.12";
}