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
                ? "url('../images/chip_rot2.png')" 
                : "url('../images/chip_blau2.png')";
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
        ? "url('../images/chip_rot2.png')" 
        : "url('../images/chip_blau2.png')";
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