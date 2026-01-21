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
        muteIcon.src = isMuted ? '../images/mute2.png' : '../images/speaker.png';
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