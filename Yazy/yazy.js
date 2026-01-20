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
        url: "/tictactoe/tictactoe.html", 
        img: "/images/ttt.png" 
    },
    { 
        name: "Connect Four", 
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
            window.location.href = `/spielhenne.html?search=${encodeURIComponent(query)}`;
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
    if (muteIcon) muteIcon.src = isMuted ? '/images/mute2.png' : '/images/speaker.png';
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

/* ------------------------------------ Kniffel Logik ------------------------------------ */
let currentDice = [0, 0, 0, 0, 0];
let rollsLeft = 3;
let currentPlayer = 1;

function rollDice() {
    if (rollsLeft > 0) {
        const diceElements = document.querySelectorAll('.die');
        diceElements.forEach(die => {
            if (!die.classList.contains('held')) {
                die.classList.add('shaking');
            }
        });
        
        setTimeout(() => {
            diceElements.forEach((die, index) => {
                if (!die.classList.contains('held')) {
                    die.classList.remove('shaking');
                    const newValue = Math.floor(Math.random() * 6) + 1;
                    die.innerText = newValue;
                    currentDice[index] = newValue;
                } else {
                    currentDice[index] = parseInt(die.innerText);
                }
            });

            rollsLeft--;
            document.getElementById('rollCount').innerText = 3 - rollsLeft;

            if (rollsLeft === 0) {
                document.getElementById('rollBtn').disabled = true;
            }
            document.querySelector('.game-field').classList.add('can-score');
        }, 400);
    }
}

// Event Listener für Würfel (nur einmal definieren!)
document.querySelectorAll('.die').forEach(die => {
    die.addEventListener('click', function() {
        if (rollsLeft < 3) {
            this.classList.toggle('held');
        }
    });
});

function resetTurn() {
    rollsLeft = 3; 
    const btn = document.getElementById('rollBtn');
    if(btn) btn.disabled = false; 

    document.getElementById('rollCount').innerText = "0";
    
    document.querySelectorAll('.die').forEach(die => {
        die.classList.remove('held');
        die.innerText = "?";
    });
    
    currentDice = [0, 0, 0, 0, 0];
    const field = document.querySelector('.game-field');
    if(field) field.classList.remove('can-score');
}

function writeScore(id, value) {
    // Dynamische Prüfung: p1 für Spieler 1, p2 für Spieler 2
    if (!id.startsWith('p' + currentPlayer)) {
        alert("Spieler " + (currentPlayer === 1 ? "1" : "2") + " ist gerade dran! Du hast in das falsche Feld geklickt.");
        return;
    }
    
    if (rollsLeft === 3) return;

    const target = document.getElementById(id);
    if (target && (target.innerText === "-" || target.innerText === "")) {
        let points = 0;
        currentDice.forEach(die => {
            if (die === value) points += value;
        });

        target.innerText = points;
        target.classList.add("filled");
        
        checkGameOver();
        nextPlayer(); // Hier wird currentPlayer von 1 auf 2 (oder umgekehrt) gewechselt
    }
}

function writeSpecial(id, type) {
    // Dynamische Prüfung
    if (!id.startsWith('p' + currentPlayer)) {
        alert("Spieler " + (currentPlayer === 1 ? "1" : "2") + " ist gerade dran!");
        return;
    }

    if (rollsLeft === 3) return;

    const target = document.getElementById(id);
    if (!target || (target.innerText !== "-" && target.innerText !== "")) return;

    let points = 0;
    const sumAll = currentDice.reduce((a, b) => a + b, 0);
    const counts = {};
    currentDice.forEach(x => { counts[x] = (counts[x] || 0) + 1; });
    const values = Object.values(counts);
    const uniqueDice = [...new Set(currentDice)].sort((a, b) => a - b);

    switch (type) {
        case '3pasch': if (values.some(v => v >= 3)) points = sumAll; break;
        case '4pasch': if (values.some(v => v >= 4)) points = sumAll; break;
        case 'fullhouse': if (values.includes(3) && values.includes(2)) points = 25; break;
        case 'klstr': 
            const strKl = uniqueDice.join("");
            if (/1234|2345|3456/.test(strKl)) points = 30; 
            break;
        case 'grstr': 
            const strGr = uniqueDice.join("");
            if (strGr === "12345" || strGr === "23456") points = 40; 
            break;
        case 'kniffel': if (values.includes(5)) points = 50; break;
        case 'chance': points = sumAll; break;
    }

    target.innerText = points;
    target.classList.add("filled");
    
    checkGameOver();
    nextPlayer(); 
}

function updateTotalScore() {
    const p = currentPlayer;
    // Oben: 1er bis 6er
    const upperFields = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixs'];
    let upperSum = 0;
    
    upperFields.forEach(field => {
        const val = document.getElementById('p' + p + '-' + field);
        if (val && val.classList.contains('filled')) {
            upperSum += parseInt(val.innerText) || 0;
        }
    });

    // Bonus Logik (63 Punkte Regel)
    const bonusField = document.getElementById('p' + p + '-bonus');
    let bonus = 0;
    if (upperSum >= 63) {
        bonus = 35;
        if(bonusField) bonusField.innerText = "35";
    } else if (bonusField) {
        bonusField.innerText = "0";
    }

    // Gesamt berechnen
    const allFilled = document.querySelectorAll('.player' + p + ' .score-val.filled');
    let total = 0;
    allFilled.forEach(s => {
        total += parseInt(s.innerText) || 0;
    });
    
    const totalDisplay = document.getElementById('p' + p + '-total');
    if(totalDisplay) totalDisplay.innerText = total + bonus;
}

function nextPlayer() {
    updateTotalScore(); // Punkte des aktuellen Spielers speichern
    checkGameOver();

    // Wechsel: 1 -> 2 oder 2 -> 1
    currentPlayer = (currentPlayer === 1) ? 2 : 1;
    
    const p1Table = document.querySelector('.player1');
    const p2Table = document.querySelector('.player2');

    if (currentPlayer === 1) {
        p1Table.classList.add('active-player');
        p2Table.classList.remove('active-player');
    } else {
        p2Table.classList.add('active-player');
        p1Table.classList.remove('active-player');
    }

    resetTurn(); // Setzt rollsLeft auf 3 und entfernt 'can-score'
}

function resetGame() {
    // 1. Alle Score-Felder leeren
    const allScores = document.querySelectorAll('.score-val');
    allScores.forEach(field => {
        field.innerText = "-"; // Setzt alles auf den Strich zurück
        field.classList.remove('filled'); // Entfernt die Sperre
    });

    // 2. Bonus und Total auf 0 setzen
    document.getElementById('p1-bonus').innerText = "0";
    document.getElementById('p2-bonus').innerText = "0";
    document.getElementById('p1-total').innerText = "0";
    document.getElementById('p2-total').innerText = "0";

    // 3. Würfel zurücksetzen
    currentDice = [0, 0, 0, 0, 0];
    const diceElements = document.querySelectorAll('.die');
    diceElements.forEach(die => {
        die.innerText = "?";
        die.classList.remove('held'); // Falls Würfel gehalten wurden
    });

    // 4. Wurf-Zähler zurücksetzen
    rollsLeft = 3;
    document.getElementById('rollCount').innerText = "0";
    document.getElementById('rollBtn').disabled = false;

    // 5. Spieler auf 1 zurücksetzen
    currentPlayer = 1;
    document.querySelector('.player1').classList.add('active-player');
    document.querySelector('.player2').classList.remove('active-player');
    
    // 6. can-score vom game-field entfernen (Sperrt das Klicken in die Tabelle)
    document.querySelector('.game-field').classList.remove('can-score');

    console.log("Spiel wurde zurückgesetzt!");
}

// Den Button mit der Funktion verknüpfen
document.getElementById('playAgainBtn').addEventListener('click', resetGame);

function checkGameOver() {
    // Wir holen uns alle Felder, in denen Punkte stehen können
    const allScoreFields = document.querySelectorAll('.score-val');
    
    // Wir filtern die Bonus-Felder heraus, da dort ja nie ein "-" steht (sondern 0 oder 35)
    // Und wir schauen, ob es noch IRGENDEIN Feld gibt, das noch ein "-" hat
    let emptyFields = 0;
    allScoreFields.forEach(field => {
        // Wenn das Feld nicht das Bonus-Feld ist UND noch ein "-" hat
        if (!field.id.includes('bonus') && field.innerText === "-") {
            emptyFields++;
        }
    });

    console.log("Noch offene Felder:", emptyFields); // Zum Testen in der Konsole

    if (emptyFields === 0) {
        showWinner();
    }
}

function showWinner() {
    const score1 = parseInt(document.getElementById('p1-total').innerText) || 0;
    const score2 = parseInt(document.getElementById('p2-total').innerText) || 0;
    const diff = Math.abs(score1 - score2); // Berechnet immer den positiven Unterschied
    
    const winnerText = document.getElementById('winner-text');
    const winnerScore = document.getElementById('winner-score');
    const popup = document.getElementById('winner-popup');
    
    // WICHTIG: Nutze querySelector, falls es eine Klasse ist, oder stelle sicher, dass die ID im HTML existiert
    const winnerContent = document.querySelector('.winner-content');

    if (score1 > score2) {
        winnerText.innerText = "Player 1 wins! 🎉";
        winnerScore.innerText = "Difference: " + diff + " Points";
        if(winnerContent) winnerContent.style.width = "380px"; // Zurück auf Standard 
    } else if (score2 > score1) {
        winnerText.innerText = "Player 2 wins! 🎉";
        winnerScore.innerText = "Difference: " + diff + " Points";
        if(winnerContent) winnerContent.style.width = "380px"; // Zurück auf Standard
    } else {
        winnerText.innerText = "Draw! 🤝";
        winnerScore.innerText = "Both of you got " + score1 + " Points.";
        if(winnerContent) winnerContent.style.width = "260px"; // Breiter bei Unentschieden
    }

    if (popup) {
        popup.classList.add('show');
    } else {
        console.error("Popup-Element nicht gefunden! Prüfe die ID 'winner-popup' im HTML.");
    }
}

// Funktion zum Schließen
function closePopup() {
    document.getElementById('winner-popup').classList.remove('show');
    document.getElementById('rollBtn').disabled = true;
}
