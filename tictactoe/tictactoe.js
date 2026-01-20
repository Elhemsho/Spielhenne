/* ------------------ Navbar - Suchfunktion erscheint durch Klick auf Lupe ------------------ */
function toggleSearch() {
    const input = document.getElementById("searchInput");
    const settings = document.getElementById("settingsDropdown");

    // 1. Zuerst das andere Menü (Settings) schließen
    settings.classList.remove("show");

    // 2. Suche umschalten
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

    // Hier kannst du die Nachricht anpassen (z.B. "Kein Spiel gefunden")
    if (visibleCount === 0) {
        noGamesMessage.style.display = 'block';
        // Optional: Text ändern für die Suche
        noGamesMessage.querySelector('h2').textContent = "No games found...";
    } else {
        noGamesMessage.style.display = 'none';
        noGamesMessage.querySelector('h2').textContent = "Coming Soon...";
    }
}

/* ------------------ Spiele-Liste (für Suche) ------------------ */
const allGames = [
    { 
        name: "Tic Tac Toe", 
        // Der Pfad ist: Hauptordner -> Ordner tictactoe -> datei.html
        url: "/tictactoe/tictactoe.html", 
        img: "/images/ttt.png" 
    },
    { 
        name: "Connect Four", 
        // Der Pfad ist: Hauptordner -> Ordner connectfour -> datei.html
        url: "/connectfour/connectfour.html", 
        img: "/images/chip_rot2.png" 
    },
    { 
        name: "Yazy", 
        url: "/yazy/yazy.html", 
        img: "/images/würfel.png" 
    },
    { 
        name: "Solitaire", 
        url: "/solitaire/solitaire.html", 
        img: "/images/ass2.png" 
    },
    { 
        name: "2048", 
        url: "/2048/2048.html", 
        img: "/images/2048logo.png" 
    },
    { 
        name: "Dots and Boxes", 
        url: "/dotsandboxes/dotsandboxes.html", 
        img: "/images/kklogo.png" 
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

    // Durchsucht dein allGames Array
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

/* ------------------ Navbar - Suchvorschläge schließen bei Klick ------------------ */
window.addEventListener("click", (e) => {
    if (!e.target.closest('.search-container')) {
        document.getElementById("searchSuggestions").style.display = "none";
    }
});

/* ------------------ Navbar - Suche Enter -> Weiterleitung ------------------ */
function handleSearchEnter(event) {
    // Prüfen, ob die gedrückte Taste "Enter" ist
    if (event.key === "Enter") {
        const query = event.target.value.trim();
        if (query !== "") {
            // Weiterleitung zur Hauptseite mit dem Suchbegriff als Parameter
            window.location.href = `/spielhenne.html?search=${encodeURIComponent(query)}`;
        }
    }
}

/* ------------------ Navbar - Einstellungsmenü erscheint bei klick auf "Settings" ------------------ */
function toggleSettings() {
    const input = document.getElementById("searchInput");
    const settings = document.getElementById("settingsDropdown");

    // 1. Zuerst die Suche schließen (falls sie leer ist)
    if (input.value === "") {
        input.classList.remove("show");
    }

    // 2. Settings umschalten
    settings.classList.toggle("show");
}

/* ------------------ Navbar - Pop-Ups schließen bei Klick daneben ------------------ */
window.onclick = function(event) {
    const settings = document.getElementById("settingsDropdown");
    const input = document.getElementById("searchInput");
    const settingsBtn = document.querySelector(".nav-settings"); // Dein Button/Link

    // Logik: Wenn der Klick NICHT auf dem Button und NICHT innerhalb des Dropdowns war
    if (!event.target.closest('.nav-settings') && !event.target.closest('#settingsDropdown')) {
        if (settings.classList.contains('show')) {
            settings.classList.remove('show');
        }
    }

    // Suchfeld Logik: Schließen wenn leer und Klick außerhalb
    if (!event.target.closest('.search-container') && input.value === "") {
        input.classList.remove('show');
    }
}

/* ------------------------------------ Musik ------------------------------------ */
const audio = document.getElementById('bgMusic');
const muteBtn = document.getElementById('muteBtn'); 
const muteIcon = document.getElementById('muteIcon'); 
const musicToggle = document.getElementById('musicToggle'); // Der Regler (Checkbox)
const dropdown = document.getElementById('settingsDropdown');

// Eine einzige, zentrale Funktion zum Synchronisieren aller Elemente
function updateMusic(isMuted) {
    if (audio) {
        audio.muted = isMuted;
    }

    if (muteIcon) {
        muteIcon.src = isMuted ? '/images/mute2.png' : '/images/speaker.png';
    }

    if (musicToggle) {
        musicToggle.checked = !isMuted;
    }

    localStorage.setItem('muted', isMuted);
}

// --- INITIALISIERUNG BEIM LADEN ---
const initialMutedState = localStorage.getItem('muted') === 'true';
updateMusic(initialMutedState);

// --- EVENT LISTENER ---

// Klick auf Lautsprecher-Icon
if (muteBtn) {
    muteBtn.onclick = () => {
        const currentMuted = localStorage.getItem('muted') === 'true';
        updateMusic(!currentMuted);
    };
}

// Betätigen des Reglers im Dropdown
if (musicToggle) {
    musicToggle.onchange = () => {
        updateMusic(!musicToggle.checked);
    };
}

// Verhindert, dass das Dropdown schließt, wenn man auf den Regler klickt
if (dropdown) {
    dropdown.addEventListener('click', (event) => {
        event.stopPropagation();
    });
}

// Autoplay-Fix: Musik startet beim ersten Klick des Nutzers auf der Seite
document.addEventListener('click', () => {
    if (audio) {
        audio.play().catch(() => {});
    }
}, { once: true });

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
const playAgainSymbol = document.getElementById("playAgainSymbol")
const confettiCanvas = document.getElementById("confettiCanvas");

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = true;
let startingPlayer = "X";
let championPending = false;
let gameOver = false;

const winConditions = [
	[0,1,2],
    [3,4,5],
    [6,7,8],
	[0,3,6],
    [1,4,7],
    [2,5,8],
	[0,4,8],
    [2,4,6]
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
resetOverlay.addEventListener("click", resetGame);
playAgainBtn.addEventListener("click", resetEverything);
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
	
	// Gewinnerfelder animieren
	winFields.forEach(i => {
		fields[i].classList.add("win");
	});

	startingPlayer = currentPlayer === "X" ? "O" : "X";

	setTimeout(() => {
		winnerText.textContent =
		currentPlayer === "X" ? "Player 1 wins!" : "Player 2 wins!";
		overlay.classList.remove("hidden");
	}, 800);

    if (currentPlayer === "X") {
        scoreP1.textContent = Number(scoreP1.textContent) + 1;
    } else {
        scoreP2.textContent = Number(scoreP2.textContent) + 1;
    }

    setTimeout(() => {
        const p1Score = Number(scoreP1.textContent);
        const p2Score = Number(scoreP2.textContent);

        if (p1Score === 3 || p2Score === 3) {
            championPending = true;
        }
    }, 900);
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
			? "🏆 Player 1 is the Champion!"
			: "🏆 Player 2 is the Champion!";

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