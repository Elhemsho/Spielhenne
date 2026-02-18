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
/* ------------------ Info-Modal Logik ------------------ */

/* ------------------ Info-Modal Funktionen ------------------ */

// Diese Funktion befüllt das Modal mit Inhalten
function updateModalContent(gameId) {
    const titleElem = document.getElementById('modal-title');
    const textElem = document.getElementById('info-text');
    const modal = document.getElementById('info-modal');

    const lang = localStorage.getItem('selectedLanguage') || 'de';
    const data = window.gameData;

    if (data && data.languages[lang]) {
        const langData = data.languages[lang];

        // 1. Titel aus der "games"-Sektion (ttt, c4, bs, etc.)
        titleElem.innerText = langData.games[gameId] || "Info";

        // 2. Text aus "game_descriptions"
        if (langData.game_descriptions && langData.game_descriptions[gameId]) {
            textElem.innerHTML = langData.game_descriptions[gameId];
        } else {
            textElem.innerText = "Keine Beschreibung verfügbar.";
        }

        // 3. ID am Modal speichern für das Live-Update in global.js
        modal.dataset.currentGameId = gameId;
    }
}

// Diese Funktion wird vom Icon aufgerufen
function showInfo(event, gameId) {
    event.preventDefault();
    event.stopPropagation();

    updateModalContent(gameId);
    document.getElementById('info-modal').style.display = "block";
}

function closeModal() {
    const modal = document.getElementById('info-modal');
    modal.style.display = "none";
    modal.dataset.currentGameId = ""; // ID löschen beim Schließen
}

// Schließen wenn man außerhalb klickt
window.addEventListener('click', (event) => {
    const modal = document.getElementById('info-modal');
    if (event.target === modal) {
        closeModal();
    }
});