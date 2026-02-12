async function setupLayout() {
    const isSubpage = window.location.pathname.includes('/pages/');
    const pathPrefix = isSubpage ? '../' : '';

    try {
        // JSON laden
        const response = await fetch(pathPrefix + 'data.json');
        if (!response.ok) throw new Error("data.json nicht gefunden");
        const data = await response.json();

        const fixPath = (url) => {
            if (!url) return "";
            if (url.startsWith('http') || url.startsWith('data:')) return url;
            const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
            return pathPrefix + cleanUrl;
        };

        // ----------------------------
        // 0. Spielerfarben setzen
        // ----------------------------
        if (data.playerColors) {
            const colors = data.playerColors;
            document.documentElement.style.setProperty('--player1-color', colors.player1);
            document.documentElement.style.setProperty('--player2-color', colors.player2);
            document.documentElement.style.setProperty('--player1-colorl', colors.player1l);
            document.documentElement.style.setProperty('--player2-colorl', colors.player2l);
            document.documentElement.style.setProperty('--blue', colors.blue);
            document.documentElement.style.setProperty('--bluel', colors.bluel);
            document.documentElement.style.setProperty('--bluell', colors.bluell);
        }

        // ----------------------------
        // 1. Logos & Home-Link
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
            searchInput.placeholder = data.header.search.placeholder;
            searchInput.addEventListener('input', showLiveSearch);
            searchInput.addEventListener('keypress', handleSearchEnter);
        }

        // ----------------------------
        // 3. Login & Settings
        // ----------------------------
        const loginSpan = document.querySelector('.nav-login');
        if (loginSpan) {
            loginSpan.innerText = data.header.login.text;
            if (loginSpan.parentElement.tagName === 'A') loginSpan.parentElement.href = fixPath(data.header.login.url);
        }

        const settingsBtn = document.querySelector('.nav-settings');
        if (settingsBtn) settingsBtn.innerText = data.header.settings.title;

        const profileLink = document.querySelector('#settingsDropdown a');
        if (profileLink) {
            profileLink.innerText = data.header.settings.profile_text;
            profileLink.href = fixPath("index.html"); 
        }

        const settingsLabels = document.querySelectorAll('.menu-item-flex > span');
        if (settingsLabels.length >= 2) {
            settingsLabels[0].innerText = data.header.settings.music_text;
            settingsLabels[1].innerText = data.header.settings.dark_mode_text;
        }

        // ----------------------------
        // 4. Haupt-Navigation
        // ----------------------------
        const mainNavList = document.getElementById('main-nav-list');
        if (mainNavList && data.header.main_nav) {
            mainNavList.innerHTML = data.header.main_nav.map(item => {
                const action = isSubpage 
                    ? `window.location.href='${pathPrefix}index.html?filter=${item.filter}'`
                    : `filterGames('${item.filter}')`;
                return `<li onclick="${action}"><a>${item.name}</a></li>`;
            }).join('');
        }

        // ----------------------------
        // 5. Footer Social Icons
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
        // 6. Footer Links & Lizenz
        // ----------------------------
        const footerNav = document.querySelector('.footer-nav');
        if (footerNav) {
            footerNav.innerHTML = data.footer.nav_links.map(link => 
                `<a href="${fixPath(link.url)}">${link.name}</a>`
            ).join(' | ');
        }

        const licenseDiv = document.getElementById('footer-license');
        if (licenseDiv) licenseDiv.innerText = data.footer.license_text;

    } catch (error) {
        console.error("Layout-Fehler:", error);
    }
}

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

const confettiCanvas = document.getElementById("confettiCanvas");

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