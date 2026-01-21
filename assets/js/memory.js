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

/* ------------------------------------ Memory Logik ------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
    const gameField = document.querySelector('.game-field');
    const playAgainBtn = document.getElementById('playAgainBtn');
    
    // Config
    const symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']; 
    let cards = [...symbols, ...symbols];
    let flippedCards = [];
    let matchedPairs = 0;
    let currentPlayer = 1;
    let scores = { player1: 0, player2: 0 };
    let lockBoard = false;

    const scoreBoard = document.createElement('div');
    scoreBoard.className = 'score-board';
    updateScoreDisplay();
    document.querySelector('.main').insertBefore(scoreBoard, gameField);

    function initGame() {
        gameField.innerHTML = '';
        flippedCards = [];
        matchedPairs = 0;
        scores = { player1: 0, player2: 0 };
        currentPlayer = 1;
        lockBoard = false;
        
        updateScoreDisplay();
        cards.sort(() => Math.random() - 0.5);

        cards.forEach((symbol, index) => {
            const card = document.createElement('div');
            card.classList.add('memory-card');
            card.dataset.symbol = symbol;
            
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">?</div>
                    <div class="card-back">${symbol}</div>
                </div>
            `;
            
            card.addEventListener('click', flipCard);
            gameField.appendChild(card);
        });
    }

    function flipCard() {
        if (lockBoard || this.classList.contains('flipped') || this.classList.contains('matched')) return;

        this.classList.add('flipped');
        flippedCards.push(this);

        if (flippedCards.length === 2) {
            checkMatch();
        }
    }

    function checkMatch() {
        lockBoard = true;
        const [card1, card2] = flippedCards;
        const isMatch = card1.dataset.symbol === card2.dataset.symbol;

        if (isMatch) {
            scores[`player${currentPlayer}`]++;
            matchedPairs++;
            
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                resetTurn(true);
                
                // Delay before popup if game is won
                if (matchedPairs === symbols.length) {
                    setTimeout(showWinPopup, 500);
                }
            }, 400);

            updateScoreDisplay();
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                currentPlayer = currentPlayer === 1 ? 2 : 1;
                resetTurn(false);
            }, 1000);
        }
    }

    function resetTurn(keepPlayer) {
        flippedCards = [];
        lockBoard = false;
        updateScoreDisplay();
    }

    function updateScoreDisplay() {
        scoreBoard.innerHTML = `
            <div class="player-score ${currentPlayer === 1 ? 'active' : ''}">
                Player 1: <span>${scores.player1}</span>
            </div>
            <div class="player-score ${currentPlayer === 2 ? 'active' : ''}">
                Player 2: <span>${scores.player2}</span>
            </div>
        `;
    }

    function showWinPopup() {
        let message = "";
        if (scores.player1 > scores.player2) {
            message = `Player 1 wins with ${scores.player1} to ${scores.player2} points!`;
        } else if (scores.player2 > scores.player1) {
            message = `Player 2 wins with ${scores.player2} to ${scores.player1} points!`;
        } else {
            message = `Draw! Both have ${scores.player1} points.`;
        }

        const overlay = document.createElement('div');
        overlay.id = 'winOverlay';
        overlay.className = 'win-overlay';
        overlay.innerHTML = `
            <div class="win-popup">
                <h2>All Pairs Found!</h2>
                <p>${message}</p>
                <button onclick="document.getElementById('winOverlay').remove()">Show Board</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    playAgainBtn.addEventListener('click', initGame);
    initGame();
});