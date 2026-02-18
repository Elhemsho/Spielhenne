/* ------------------ Navbar - GameFilter (Hauptseite) ------------------ */
function filterGames(category) {
    const games = document.querySelectorAll('.game');
    const noGamesMessage = document.getElementById("noGamesMessage");
    let visibleCount = 0;

    // Suche leeren, wenn ein Filter geklickt wird
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";

    games.forEach(game => {
        // Prüfen, ob Kategorie 'all' ist oder mit dem data-players Attribut übereinstimmt
        if (category === 'all' || game.dataset.players === category) {
            game.style.display = 'block';
            visibleCount++; // Zähler erhöhen
        } else {
            game.style.display = 'none';
        }
    });

    // Nachricht anzeigen, wenn keine Spiele gefunden wurden
    if (visibleCount === 0) {
        noGamesMessage.style.display = 'block';
    } else {
        noGamesMessage.style.display = 'none';
    }
}

/* ------------------ Navbar - GameFilter (von Spiel aus - Ergänzung) ------------------ */
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    if (filter) filterGames(filter);
});

/* ------------------ Navbar - Suchfeld: Eingabe (Von Spiel aus - Ergänzung) ------------------ */
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const searchTerm = params.get('search');
    const filterTerm = params.get('filter');

    // 1. Wenn ein Suchbegriff in der URL steht (?search=...)
    if (searchTerm) {
        const decodedSearch = decodeURIComponent(searchTerm);
        const searchInput = document.getElementById("searchInput");

        if (searchInput) {
            searchInput.value = decodedSearch;
            searchInput.classList.add("show"); // Suchfeld anzeigen
        }

        // Wir warten kurz, bis der Browser alle .game Elemente geladen hat
        const checkExist = setInterval(() => {
            const games = document.querySelectorAll('.game');
            if (games.length > 0) {
                searchGames(); // Deine Filter-Funktion aufrufen
                clearInterval(checkExist); // Timer stoppen
            }
        }, 100); // Prüft alle 100ms
    }

    // 2. Wenn ein Kategoriefilter in der URL steht (?filter=...)
    if (filterTerm) {
        const checkExistFilter = setInterval(() => {
            const games = document.querySelectorAll('.game');
            if (games.length > 0) {
                filterGames(filterTerm);
                clearInterval(checkExistFilter);
            }
        }, 100);
    }
});

// Hier kannst du die Erklärungen für jedes Spiel anpassen
const gameInfo = {
    'ttt': { title: 'Tic Tac Toe', text: 'Bringe drei deiner Zeichen in eine waagerechte, senkrechte oder diagonale Reihe.' },
    'c4': { title: 'Connect Four', text: 'Versuche als Erster, vier deiner Steine in eine Reihe zu bekommen – egal ob horizontal, vertikal oder diagonal.' },
    'bs': { title: 'Battleship', text: 'Platziere deine Schiffe und versuche, die Flotte deines Gegners durch gezielte Schüsse zu versenken.' },
    'g2048': { title: '2048', text: 'Kombiniere gleiche Zahlenkacheln durch Verschieben, um die Kachel mit dem Wert 2048 zu erreichen.' },
    'mem': { title: 'Memory', text: 'Decke zwei Karten nacheinander auf und finde alle passenden Paare.' },
    'sol': { title: 'Solitaire', text: 'Sortiere die Karten nach Farben und Werten auf die Ablagestapel.' },
    'yaz': { title: 'Yazy', text: 'Ein Würfelspiel, bei dem du durch geschicktes Kombinieren die höchste Punktzahl erreichen musst.' },
    'dab': { title: 'Dots and Boxes', text: 'Verbinde Punkte, um Quadrate zu schließen. Wer die meisten Kästchen besitzt, gewinnt!' },
    'mq': { title: 'Math Quiz', text: 'Löse so viele Rechenaufgaben wie möglich innerhalb der vorgegebenen Zeit.' }
};

function showInfo(event, gameId) {
    // Stoppt das Öffnen des Spiel-Links
    event.preventDefault();
    event.stopPropagation();
    
    const modal = document.getElementById('info-modal');
    const title = document.getElementById('modal-title');
    const text = document.getElementById('info-text');
    
    const info = gameInfo[gameId];
    if (info) {
        title.innerText = info.title;
        text.innerText = info.text;
        modal.style.display = "block";
    }
}

function closeModal() {
    document.getElementById('info-modal').style.display = "none";
}

// Schließen, wenn man irgendwo außerhalb des Fensters hinklickt
window.onclick = function(event) {
    const modal = document.getElementById('info-modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
