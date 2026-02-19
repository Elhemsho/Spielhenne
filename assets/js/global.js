let cachedData = null; // Speicher für die JSON-Daten

async function setupLayout() {
    
    const isSubpage = window.location.pathname.includes('/pages/');
    const pathPrefix = isSubpage ? '../' : '';

    // Aktuelle Sprache aus Speicher laden (Standard: Deutsch)
    const currentLang = localStorage.getItem('selectedLanguage') || 'de';

    try {
        // Daten nur laden, wenn sie noch nicht im Cache sind
        if (!cachedData) {
            const response = await fetch(pathPrefix + 'data.json');
            if (!response.ok) throw new Error("data.json nicht gefunden");
            cachedData = await response.json();
            window.cachedData = cachedData;

            window.gameData = cachedData;
        }
        
        const data = cachedData;
        const langData = data.languages[currentLang];

        const fixPath = (url) => {
            if (!url) return "";
            if (url.startsWith('http') || url.startsWith('data:')) return url;
            const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
            return pathPrefix + cleanUrl;
        };

        // ----------------------------
        // 0. Spielerfarben & CSS Variablen
        // ----------------------------
        if (data.playerColors) {
            const colors = data.playerColors;
            const root = document.documentElement;
            root.style.setProperty('--player1-color', colors.player1);
            root.style.setProperty('--player2-color', colors.player2);
            root.style.setProperty('--player1-colorl', colors.player1l);
            root.style.setProperty('--player2-colorl', colors.player2l);
            root.style.setProperty('--blue', colors.blue);
            root.style.setProperty('--bluel', colors.bluel);
            root.style.setProperty('--bluell', colors.bluell);
        }

        // ----------------------------
        // 1. Logos & Meta
        // ----------------------------
        const logoSchrift = document.querySelector('.logo');
        const logoHuhn = document.querySelector('.logo2');
        if (logoSchrift) {
            logoSchrift.src = fixPath(data.header.logos.schrift);
            if (logoSchrift.parentElement.tagName === 'A') logoSchrift.parentElement.href = fixPath("index.html");
        }
        if (logoHuhn) {
            logoHuhn.src = fixPath(data.header.logos.huhn);
            if (logoHuhn.parentElement.tagName === 'A') logoHuhn.parentElement.href = fixPath("index.html");
        }

        // ----------------------------
        // 2. Suche
        // ----------------------------
        const lupeIcon = document.querySelector('.lupe');
        if (lupeIcon) lupeIcon.src = fixPath(data.header.search.icon_url);

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.placeholder = langData.search_placeholder;
            if (!searchInput.dataset.initialized) {
                if (typeof showLiveSearch === "function") searchInput.addEventListener('input', showLiveSearch);
                if (typeof handleSearchEnter === "function") searchInput.addEventListener('keypress', handleSearchEnter);
                searchInput.dataset.initialized = "true";
            }
        }

        // ----------------------------
        // 3. Login & Settings Texte
        // ----------------------------
        const loginSpan = document.querySelector('.nav-login');
        if (loginSpan) {
            loginSpan.innerText = langData.login_text;
            if (loginSpan.parentElement.tagName === 'A') loginSpan.parentElement.href = fixPath(data.header.login.url);
        }

        const settingsBtn = document.querySelector('.nav-settings');
        if (settingsBtn) settingsBtn.innerText = langData.settings_title;

        const profileLink = document.querySelector('#settingsDropdown a');
        if (profileLink) {
            profileLink.innerText = langData.profile_text;
            profileLink.href = fixPath("index.html"); 
        }

        const menuItems = document.querySelectorAll('#settingsDropdown .menu-item-flex');
        if (menuItems.length >= 3) {
            menuItems[0].querySelector('span').innerText = langData.language_text;
            menuItems[1].querySelector('span').innerText = langData.music_text;
            menuItems[2].querySelector('span').innerText = langData.dark_mode_text;
        }

        // ----------------------------
        // 4. AUTOMATISCHE ÜBERSETZUNG (data-i18n)
        // ----------------------------
        const translateElements = document.querySelectorAll('[data-i18n]');
        translateElements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            let translation = null;

            // 1. Suche direkt in langData (z.B. login_text)
            if (langData[key]) {
                translation = langData[key];
            } 
            // 2. Falls nicht gefunden, suche in langData.games (z.B. ttt, c4)
            else if (langData.games && langData.games[key]) {
                translation = langData.games[key];
            }
            // 3. Spezialfall für "games.mq" (Punkt-Notation)
            else if (key.includes('.')) {
                const parts = key.split('.');
                translation = langData[parts[0]] ? langData[parts[0]][parts[1]] : null;
            }

            if (translation) {
                el.innerText = translation;
            }
        });

        // ----------------------------
        // 5. Haupt-Navigation
        // ----------------------------
        const mainNavList = document.getElementById('main-nav-list');
        if (mainNavList && data.header.main_nav) {
            const isIndex = window.location.pathname.endsWith('index.html') || 
                            window.location.pathname.endsWith('/') ||
                            (!window.location.pathname.includes('.html') && !isSubpage);

            mainNavList.innerHTML = data.header.main_nav.map(item => {
                const displayName = currentLang === 'de' ? item.name_de : item.name_en;
                const action = isIndex 
                    ? `filterGames('${item.filter}')` 
                    : `window.location.href='${pathPrefix}index.html?filter=${item.filter}'`;

                return `<li onclick="${action}"><a>${displayName}</a></li>`;
            }).join('');
        }

        // ----------------------------
        // 6. Footer Social Icons
        // ----------------------------
        const socialContainer = document.querySelector('.footer-social-icons');
        if (socialContainer && data.footer.social_icons) {
            socialContainer.innerHTML = data.footer.social_icons.map(icon => {
                return `
                    <a href="${icon.url || '#'}" target="_blank" style="text-decoration: none;">
                        <span class="icon" title="${icon.label}">${icon.platform}</span>
                    </a>
                `;
            }).join('');
        }

        // ----------------------------
        // 7. Footer Links & Lizenz
        // ----------------------------
        const footerNav = document.querySelector('.footer-nav');
        if (footerNav) {
            footerNav.innerHTML = data.footer.nav_links.map(link => {
                const displayName = currentLang === 'de' ? link.name_de : link.name_en;
                return `<a href="${fixPath(link.url)}">${displayName}</a>`;
            }).join(' | ');
        }

        const licenseDiv = document.getElementById('footer-license');
        if (licenseDiv) licenseDiv.innerText = langData.license_text;

        // ---------------------------------------------------------
        // 8. NEU: SOFORTIGER CHECK FÜR DEN UNDO-BUTTON (INNERHALB TRY)
        // ---------------------------------------------------------
        const toggleBtn = document.getElementById("toggleUndoBtn");
        if (toggleBtn && typeof undosAllowed !== 'undefined') {
            const statusText = undosAllowed ? (langData.on || "AN") : (langData.off || "AUS");
            const undoLabel = langData.undo_text || "Undo";
            toggleBtn.innerText = `${undoLabel}: ${statusText}`;
        }
        const drawBtn = document.getElementById("toggleDrawBtn");
        if (drawBtn && typeof cardsToDrawCount !== 'undefined') {
            const drawLabel = langData.draw_text || "Draw";
            drawBtn.innerText = `${drawLabel}: ${cardsToDrawCount}`;
        }
        if (typeof updateHighscoreDisplay === "function") {
            updateHighscoreDisplay();
        }
        if (typeof updateUndoButton === "function") {
            updateUndoButton();
        }
        if (typeof updateUI === "function") {
            updateUI();
        }
        const inputs = document.querySelectorAll('[data-i18n-placeholder]');
        inputs.forEach(input => {
            const key = input.getAttribute('data-i18n-placeholder');
            if (langData[key]) {
                input.placeholder = langData[key];
            }
        });
        const streakInfo = document.getElementById('streak-info');
        if (streakInfo && typeof streak !== 'undefined') {
            // Wir prüfen, was gerade im Element steht, um zu wissen, ob wir 
            // "Richtig", "Falsch" oder die "Serie" übersetzen müssen.
            
            if (streak > 1) {
                // Fall: Laufende Serie
                const streakLabel = langData.streak_text || "Streak:";
                const bonusLabel = langData.bonus_text || "Bonus!";
                streakInfo.innerText = `${streakLabel} ${streak} (+${streak - 1} ${bonusLabel})`;
            } else if (streak === 1) {
                // Fall: Gerade richtig geantwortet (erste richtige Antwort)
                streakInfo.innerText = langData.correct || "Correct!";
            } else if (streak === 0 && (streakInfo.innerText.includes("Wrong") || streakInfo.innerText.includes("Falsch"))) {
                // Fall: Gerade falsch geantwortet
                streakInfo.innerText = langData.wrong || "Wrong! -5";
            }
        }
        if (typeof updateUI === "function") {
            updateUI();
        }
        // 9. SPEZIAL: Champion-Text Live-Update
        setTimeout(() => {
            const champOverlay = document.getElementById('championOverlay');
            if (champOverlay && !champOverlay.classList.contains('hidden')) {
                if (typeof window.showChampion === "function") {
                    window.showChampion(true); 
                }
            }
        }, 50); // Kleiner Puffer für die Datenverarbeitung
        const modal = document.getElementById('info-modal');
        if (modal && modal.style.display === "block") {
            // Wir holen uns die aktuelle gameId, die wir im Titel-Element versteckt haben
            const currentId = modal.dataset.currentGameId;
            if (currentId) {
                // Wir rufen eine Hilfsfunktion auf, die nur den Inhalt aktualisiert
                updateModalContent(currentId);
            }
        }

    } catch (error) {
        console.error("Layout-Fehler:", error);
    }
}


function filterGames(filter) {
    const gameCards = document.querySelectorAll('.game-card');
    
    // Falls wir NICHT auf der Index sind, haben wir keine .game-card Elemente.
    // Das ist okay, die Funktion bricht dann einfach hier ab.
    if (gameCards.length === 0) return;

    gameCards.forEach(card => {
        const players = card.getAttribute('data-players');
        if (filter === 'all' || players === filter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Hilfreich für das Styling: Aktiven Filter im Menü markieren (optional)
    console.log("Filter aktiv:", filter);
}

window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const filterFromUrl = urlParams.get('filter');

    if (filterFromUrl) {
        // Kurze Verzögerung, damit die Spiele-Kacheln sicher geladen sind
        setTimeout(() => {
            filterGames(filterFromUrl);
        }, 100);
    }
});

/* 1. Zentrale Funktion zum Schließen aller Menüs */
function closeAllNavbarMenus() {
    const settings = document.getElementById("settingsDropdown");
    const languageMenu = document.getElementById("languageMenu");
    const searchInput = document.getElementById("searchInput");
    const suggestionsBox = document.getElementById("searchSuggestions");

    if (settings) settings.classList.remove('show');
    if (languageMenu) languageMenu.classList.remove('show');
    if (suggestionsBox) suggestionsBox.style.display = "none";
    if (searchInput && searchInput.value === "") {
        searchInput.classList.remove("show");
    }
}

/* 2. Globaler Klick-Wächter: Schließt Menüs bei Klick auf leere Flächen */
window.addEventListener('click', function (event) {
    // Wenn der Klick AUẞERHALB von Settings, Sprache oder Suche war:
    if (!event.target.closest('.nav-settings') && 
        !event.target.closest('#settingsDropdown') && 
        !event.target.closest('#languageMenu') &&
        !event.target.closest('.search-container')) {
        
        closeAllNavbarMenus();
    }
});

// MODERNE VERSION: Sprache wechseln OHNE Reload
function setLanguage(lang) {
    // Beide Keys speichern zur Sicherheit
    localStorage.setItem('selectedLanguage', lang);
    localStorage.setItem('language', lang); 
    
    // Texte live aktualisieren
    setupLayout(); 

    const languageMenu = document.getElementById('languageMenu');
    if (languageMenu) languageMenu.classList.remove('show');
}

// Erstmaliger Aufruf beim Laden der Seite
setupLayout();

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
        url: "../pages/tictactoe.html",
        img: "../assets/images/ttt.png"
    },
    {
        name: "Connect Four",
        url: "../pages/connectfour.html",
        img: "../assets/images/chip_rot2.png"
    },
    {
        name: "Battleship",
        url: "../pages/battleship.html",
        img: "../assets/images/battlelogo.png"
    },
    {
        name: "Yazy",
        url: "../pages/yazy.html",
        img: "../assets/images/würfel.png"
    },
    {
        name: "Solitaire",
        url: "../pages/solitaire.html",
        img: "../assets/images/ass2.png"
    },
    {
        name: "2048",
        url: "../pages/2048.html",
        img: "../assets/images/2048logo.png"
    },
    {
        name: "Dots and Boxes",
        url: "../pages/dotsandboxes.html",
        img: "../assets/images/kklogo.png"
    },
    {
        name: "Memory",
        url: "../pages/memory.html",
        img: "../assets/images/memorylogo.png"
    },
    {
        name: "Math Quiz",
        url: "../pages/mathquiz.html",
        img: "../assets/images/mathlogo.png"
    }
];

/* ------------------ Navbar - Suchvorschläge ------------------ */
function showLiveSearch() {
    const input = document.getElementById("searchInput");
    const suggestionsBox = document.getElementById("searchSuggestions");

    // 1. Abbruch, falls die Elemente im HTML nicht existieren
    if (!input || !suggestionsBox) return;

    const query = input.value.toLowerCase().trim();
    
    // 2. Box leeren und verstecken, wenn das Suchfeld leer ist
    if (query === "") {
        suggestionsBox.innerHTML = "";
        suggestionsBox.style.display = "none";
        return;
    }

    // 3. SICHERHEIT: Prüfen, ob die Spiele-Daten (allGames) überhaupt da sind
    // Auf Unterseiten ist allGames oft 'undefined', hier fangen wir das ab.
    if (typeof allGames === 'undefined') {
        console.warn("Suche: 'allGames' ist auf dieser Seite nicht definiert.");
        return;
    }

    // 4. Filtern der Spiele basierend auf dem Namen
    const filtered = allGames.filter(game =>
        game.name.toLowerCase().includes(query)
    );

    // 5. Ergebnisse anzeigen
    if (filtered.length > 0) {
        suggestionsBox.innerHTML = ""; // Box säubern
        
        filtered.forEach(game => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            
            // Aufbau der Vorschlags-Zeile (Bild + Name)
            div.innerHTML = `
                <img src="${game.img}" alt="${game.name}" style="width:30px; height:30px; margin-right:10px; border-radius:4px; object-fit:cover;">
                <span>${game.name}</span>
            `;
            
            // Klick auf einen Vorschlag leitet zum Spiel weiter
            div.onclick = () => {
                window.location.href = game.url;
            };
            
            suggestionsBox.appendChild(div);
        });
        
        suggestionsBox.style.display = "block";
    } else {
        // Wenn nichts gefunden wurde
        suggestionsBox.innerHTML = '<div class="suggestion-item">Kein Spiel gefunden...</div>';
        suggestionsBox.style.display = "block";
    }
}

/* ------------------ Navbar - Suche Enter -> Weiterleitung ------------------ */
function handleSearchEnter(event) {
    if (event.key === "Enter") {
        const query = event.target.value.trim();
        if (query !== "") {
            window.location.href = `../index.html?search=${encodeURIComponent(query)}`;
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
window.onclick = function (event) {
    const settings = document.getElementById("settingsDropdown");
    const languageMenu = document.getElementById("languageMenu");
    const input = document.getElementById("searchInput");
    const suggestionsBox = document.getElementById("searchSuggestions");

    // Settings + Sprache schließen
    if (
        !event.target.closest('.nav-settings') &&
        !event.target.closest('#settingsDropdown') &&
        !event.target.closest('#languageMenu') &&
        !event.target.closest('.menu-item-flex.language')
    ) {
        settings?.classList.remove('show');
        languageMenu?.classList.remove('show');
    }

    // Suche schließen
    if (!event.target.closest('.search-container')) {
        if (input && input.value === "") input.classList.remove("show");
        if (suggestionsBox) suggestionsBox.style.display = "none";
    }
};



/* ------------------------------------ Musik ------------------------------------ */
const audio = document.getElementById('bgMusic');
const muteBtn = document.getElementById('muteBtn');
const muteIcon = document.getElementById('muteIcon');
const musicToggle = document.getElementById('musicToggle');
const dropdown = document.getElementById('settingsDropdown');

function updateMusic(isMuted) {
    if (audio) audio.muted = isMuted;
    if (muteIcon) muteIcon.src = isMuted ? '../assets/images/mute2.png' : '../assets/images/speaker.png';
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
    if (audio) audio.play().catch(() => { });
}, { once: true });

const clickSound = new Audio('../assets/audio/sfx/click-sound.mp3');
window.winSound = new Audio('../assets/audio/sfx/win.mp3');
window.winSound.volume = 0.2;
const correctSound = new Audio('assets/audio/sfx/correct.mp3');
const wrongSound = new Audio('assets/audio/sfx/negative.mp3');
const diceSound = new Audio('assets/audio/sfx/dice-roll.mp3');
const cardSound = new Audio('assets/audio/sfx/flipcard.mp3');




const confettiCanvas = document.getElementById("confettiCanvas");

function startConfetti() {
    window.winSound.currentTime = 0; 
    window.winSound.volume = 0.08; 
    window.winSound.play();
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

function openLanguageMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('languageMenu');
    if (!menu) return;
    menu.classList.toggle('show');
}

const languageMenuEl = document.getElementById('languageMenu');
if (languageMenuEl) {
    languageMenuEl.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}