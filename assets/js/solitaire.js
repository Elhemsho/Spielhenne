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

/* ------------------------------------ Solitär Logik ------------------------------------ */
let deck = [];
let wastePile = []; 
let tableauData = [[], [], [], [], [], [], []];
let deckClickCount = 0;
let gameStateHistory = []; // Speicher für die Undo-Funktion
let undoLimit = 5;
let foundationData = [[], [], [], []]; // Für die 4 Stapel oben rechts
let stackCycles = 0;

const suits = ["hearts", "diamonds", "spades", "clubs"];
const valuesOrder = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// Globales Element für das Ziehen (Animation-Proxy)
let dragProxy = document.getElementById("drag-proxy");
if (!dragProxy) {
    dragProxy = document.createElement("div");
    dragProxy.id = "drag-proxy";
    document.body.appendChild(dragProxy);
}

document.addEventListener("DOMContentLoaded", () => {
    const playAgainBtn = document.getElementById("playAgainBtn");
    const stockElement = document.getElementById("stock");
    const undoBtn = document.getElementById("undoButton");

    if (playAgainBtn) playAgainBtn.onclick = resetGame;
    if (undoBtn) undoBtn.onclick = undo;
    
    if (stockElement) {
        stockElement.onclick = () => {
            saveState(); // Zustand speichern VOR dem Klick
            deckClickCount++;
            const counter = document.getElementById("move-counter");
            if (counter) counter.innerText = `Stapel-Klicks: ${deckClickCount}`;
            drawThreeCards();
        };
    }

    if (stockElement) {
        stockElement.onclick = () => {
            // Zuerst speichern für Undo
            saveState(); 

            if (deck.length === 0 && wastePile.length > 0) {
                // Stapel leer -> Neu mischen und Zähler hoch!
                stackCycles++; 
                deck = wastePile.reverse();
                wastePile = [];
                renderAll();
            } else if (deck.length > 0) {
                // Normal ziehen
                deckClickCount++;
                const counter = document.getElementById("move-counter");
                if (counter) counter.innerText = `Stapel-Klicks: ${deckClickCount}`;
                drawThreeCards();
            }
        };
    }

    // Foundations vorbereiten
    document.querySelectorAll("#foundations .card-slot").forEach(slot => {
        slot.addEventListener("dragover", (e) => e.preventDefault());
        slot.addEventListener("drop", handleFoundationDrop);
    });

    const winBtn = document.getElementById("showMeButton");
    if (winBtn) winBtn.onclick = hideVictoryPopup;

    initGame();
});

/* --- Undo & State Management --- */
function saveState() {
    // Foundations extrahieren für das Backup
    const currentFoundations = Array.from(document.querySelectorAll("#foundations .card-slot")).map(slot => {
        return Array.from(slot.children).map(card => ({
            suit: card.dataset.suit,
            value: card.dataset.value
        }));
    });

    const state = {
        deck: JSON.parse(JSON.stringify(deck)),
        wastePile: JSON.parse(JSON.stringify(wastePile)),
        tableauData: JSON.parse(JSON.stringify(tableauData)),
        foundations: currentFoundations,
        deckClickCount: deckClickCount,
        stackCycles: stackCycles // NEU: Merkt sich die Stapel-Durchgänge
    };
    
    gameStateHistory.push(state);
    if (gameStateHistory.length > 40) gameStateHistory.shift(); 
}

function undo() {
    if (undoLimit <= 0 || gameStateHistory.length === 0) return;

    // 1. Letzten Zustand aus der Historie holen
    const lastState = gameStateHistory.pop();

    // 2. Einfache Variablen wiederherstellen
    deck = lastState.deck;
    wastePile = lastState.wastePile;
    tableauData = lastState.tableauData;
    deckClickCount = lastState.deckClickCount;
    stackCycles = lastState.stackCycles;

    // 3. WICHTIG: Die Daten der Foundations im Array wiederherstellen
    // Wir mappen die gespeicherten Daten zurück in das foundationData Array
    foundationData = lastState.foundations.map(stack => [...stack]);

    // 4. Den Button-Zähler und das Limit aktualisieren
    undoLimit--;
    updateUndoButton();

    // 5. UI-Counter aktualisieren (falls vorhanden)
    const counter = document.getElementById("move-counter");
    if (counter) counter.innerText = `Stapel-Klicks: ${deckClickCount}`;

    // 6. ALLES neu zeichnen
    // renderAll() sorgt dafür, dass Tableau, Waste, Stock UND Foundations 
    // basierend auf den gerade wiederhergestellten Daten neu gezeichnet werden.
    renderAll();
}

// Hilfsfunktion für die Button-Anzeige
function updateUndoButton() {
    const undoBtn = document.getElementById("undoButton");
    if (undoBtn) {
        undoBtn.innerText = `Undo (${undoLimit})`;
        if (undoLimit <= 0) {
            undoBtn.style.opacity = "0.5";
            undoBtn.style.cursor = "not-allowed";
        } else {
            undoBtn.style.opacity = "1";
            undoBtn.style.cursor = "pointer";
        }
    }
}

/* --- Spielsteuerung --- */
function initGame() {
    deck = createDeck();
    shuffle(deck);
    wastePile = [];
    tableauData = [[], [], [], [], [], [], []];
    foundationData = [[], [], [], []];
    gameStateHistory = []; // History beim Neustart leeren

    for (let i = 0; i < 7; i++) {
        for (let j = 0; j <= i; j++) {
            let card = deck.pop();
            if (j === i) card.faceUp = true;
            tableauData[i].push(card);
        }
    }
    renderAll();
}

function createDeck() {
    let newDeck = [];
    for (let suit of suits) {
        for (let value of valuesOrder) {
            newDeck.push({ suit, value, faceUp: false });
        }
    }
    return newDeck;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getFileName(cardData) {
    const suitMap = { "hearts": "H", "diamonds": "D", "spades": "S", "clubs": "C" };
    const valueMap = { "10": "T" }; 
    const val = valueMap[cardData.value] || cardData.value;
    const suit = suitMap[cardData.suit];
    return `${val}${suit}.svg`;
}

function renderAll() {
    const tableau = document.getElementById("tableau");
    if (!tableau) return;
    tableau.innerHTML = "";
    
    // --- TABLEAU RENDERN ---
    tableauData.forEach((colCards, i) => {
        const column = document.createElement("div");
        column.classList.add("column");
        column.id = `col-${i}`;
        column.addEventListener("dragover", (e) => e.preventDefault());
        column.addEventListener("drop", handleTableauDrop);
        
        // Berechnet die exakte Höhe des Stapels
        const verticalOffset = 30; 
        const cardHeight = 140;
        // Die Spalte ist genau so hoch wie die Karten, mindestens aber 140px
        const calculatedHeight = colCards.length > 0 
            ? (colCards.length - 1) * verticalOffset + cardHeight 
            : cardHeight;
        
        column.style.height = calculatedHeight + "px";
        column.style.position = "relative"; 

        colCards.forEach((card, j) => {
            const cardDiv = createCardElement(card, i);
            cardDiv.style.top = (j * verticalOffset) + "px";
            column.appendChild(cardDiv);
        });
        tableau.appendChild(column);
    });
    
    // --- FOUNDATIONS RENDERN ---
    const slots = document.querySelectorAll("#foundations .card-slot");
    slots.forEach((slot, i) => {
        slot.innerHTML = ""; 
        foundationData[i].forEach(card => {
            const cardEl = createCardElement({...card, faceUp: true}, `foundation-${i}`);
            cardEl.style.top = "-2px";
            cardEl.style.left = "-2px";
            slot.appendChild(cardEl);
        });
    });

    renderWaste();
    renderStock();
    checkWinCondition();
}

function createCardElement(cardData, origin) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.draggable = cardData.faceUp;

    cardDiv.dataset.suit = cardData.suit;
    cardDiv.dataset.value = cardData.value;

    if (cardData.faceUp) {
        const fileName = getFileName(cardData);
        cardDiv.style.backgroundImage = `url('../images/cards/${fileName}')`;

        cardDiv.addEventListener("dragstart", (e) => {
            dragProxy.innerHTML = "";
            let dragData = { card: cardData, origin: origin, stack: [] };

            if (typeof origin === 'number') {
                const colCards = tableauData[origin];
                const cardIdx = colCards.findIndex(c => c.suit === cardData.suit && c.value === cardData.value);
                dragData.stack = colCards.slice(cardIdx);
            } else {
                dragData.stack = [cardData];
            }

            e.dataTransfer.setData("text/plain", JSON.stringify(dragData));

            dragData.stack.forEach((c, i) => {
                const clone = document.createElement("div");
                clone.classList.add("card");
                clone.style.backgroundImage = `url('../images/cards/${getFileName(c)}')`;
                clone.style.top = (i * 30) + "px";
                clone.style.position = "absolute"; 
                dragProxy.appendChild(clone);
            });

            dragProxy.style.display = "block";
            const img = new Image();
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; 
            e.dataTransfer.setDragImage(img, 0, 0);

            requestAnimationFrame(() => {
                cardDiv.classList.add("dragging-hidden");
                let nextCard = cardDiv.nextElementSibling;
                while (nextCard) {
                    nextCard.classList.add("dragging-hidden");
                    nextCard = nextCard.nextElementSibling;
                }
            });
        });

        cardDiv.addEventListener("dragend", () => {
            dragProxy.style.display = "none";
            dragProxy.innerHTML = "";
            document.querySelectorAll('.dragging-hidden').forEach(el => el.classList.remove('dragging-hidden'));
            renderAll();
        });

        cardDiv.addEventListener("dblclick", () => {
            const foundations = document.querySelectorAll("#foundations .card-slot");
            
            for (let i = 0; i < foundations.length; i++) {
                const slot = foundations[i];
                
                if (canMoveToFoundation(cardData, slot)) {
                    saveState(); // Zustand für Undo speichern
                    
                    // 1. Karte in die Foundation-Daten eintragen
                    foundationData[i].push(cardData);
                    
                    // 2. Karte vom Ursprung (Tableau/Waste) entfernen
                    removeFromOrigin({ 
                        card: cardData, 
                        origin: origin, 
                        stack: [cardData] 
                    });
                    
                    // 3. Alles neu zeichnen (rendert die Karte nun auch in der Foundation)
                    renderAll();
                    break; 
                }
            }
        });

    } else {
        cardDiv.classList.add("card-back");
        cardDiv.style.backgroundImage = `url('../images/cards/1B.svg')`;
        cardDiv.style.backgroundSize = "cover";
    }

    return cardDiv;
}

document.addEventListener("dragover", (e) => {
    if (dragProxy.style.display === "block") {
        dragProxy.style.left = (e.clientX - 50) + "px";
        dragProxy.style.top = (e.clientY - 70) + "px";
    }
});

function renderWaste() {
    const wasteContainer = document.getElementById("waste");
    if (!wasteContainer) return;
    wasteContainer.innerHTML = "";
    const visibleCards = wastePile.slice(-3);

    visibleCards.forEach((cardData, index) => {
        const isTopCard = (index === visibleCards.length - 1);
        const cardEl = createCardElement(cardData, "waste");
        
        if (!isTopCard) {
            cardEl.draggable = false;
            cardEl.style.pointerEvents = "none"; 
        } else {
            cardEl.style.pointerEvents = "auto";
        }

        cardEl.style.left = (index * 20 - 2) + "px"; 
        cardEl.style.position = "absolute";
        wasteContainer.appendChild(cardEl);
    });
}

function renderStock() {
    const stockElement = document.getElementById("stock");
    if (!stockElement) return;

    stockElement.innerHTML = ""; // Alles löschen

    if (deck.length === 0) {
        // FALL: Stapel ist leer -> Zeige die Zahl
        stockElement.classList.add("empty");
        stockElement.style.position = "relative"; // Sicherstellen für die Zentrierung

        const cycleDisplay = document.createElement("div");
        cycleDisplay.className = "stock-cycle-counter";
        
        // Direkte Styles für maximale Sicherheit:
        cycleDisplay.style.position = "absolute";
        cycleDisplay.style.top = "50%";
        cycleDisplay.style.left = "50%";
        cycleDisplay.style.transform = "translate(-50%, -50%)";
        cycleDisplay.style.fontSize = "40px";
        cycleDisplay.style.fontWeight = "bold";
        cycleDisplay.style.fontFamily = "sans-serif";
        cycleDisplay.style.color = "rgba(166, 213, 222, 0.5)"; // Dein Hellblau, verblasst
        cycleDisplay.style.pointerEvents = "none"; // Klicks gehen durch die Zahl zum Stapel
        cycleDisplay.style.zIndex = "1";
        
        cycleDisplay.innerText = stackCycles;
        stockElement.appendChild(cycleDisplay);
    } else {
        // FALL: Karten sind noch da -> Zeige Rückseite
        stockElement.classList.remove("empty");
        
        // Nutze deine existierende Karten-Erstellung
        const cardBack = createCardElement({ faceUp: false }, "stock");
        
        // Sicherstellen, dass die Karte im Slot richtig sitzt
        cardBack.style.top = "-2px";
        cardBack.style.left = "-2px";
        cardBack.style.position = "absolute";
        
        stockElement.appendChild(cardBack);
    }
}

function drawThreeCards() {
    if (deck.length === 0) {
        if (wastePile.length === 0) return;
        deck = wastePile.map(c => ({...c, faceUp: false})).reverse();
        wastePile = [];
    } else {
        const count = Math.min(deck.length, 2); //Anzahl an Karten die umgedreht werden sollen
        for (let i = 0; i < count; i++) {
            let card = deck.pop();
            card.faceUp = true;
            wastePile.push(card);
        }
    }
    renderAll();
}

function handleTableauDrop(e) {
    e.preventDefault();
    const dragDataString = e.dataTransfer.getData("text/plain");
    if (!dragDataString) return;
    const dragData = JSON.parse(dragDataString);
    const targetColIndex = parseInt(e.currentTarget.id.replace("col-", ""));
    const movingCard = dragData.stack[0];

    if (canMoveToTableau(movingCard, targetColIndex)) {
        saveState(); // Speicher vor Tableau-Drop
        tableauData[targetColIndex].push(...dragData.stack);
        removeFromOrigin(dragData);
        renderAll();
    }
    checkWinCondition;
}

function canMoveToTableau(cardData, colIndex) {
    const col = tableauData[colIndex];
    if (col.length === 0) return cardData.value === "K";
    
    const target = col[col.length - 1];
    const targetColor = (target.suit === "hearts" || target.suit === "diamonds") ? "red" : "black";
    const cardColor = (cardData.suit === "hearts" || cardData.suit === "diamonds") ? "red" : "black";
    
    const targetValIdx = valuesOrder.indexOf(target.value);
    const cardValIdx = valuesOrder.indexOf(cardData.value);
    
    return (cardColor !== targetColor) && (cardValIdx === targetValIdx - 1);
}

function handleFoundationDrop(e) {
    e.preventDefault();
    const dragDataString = e.dataTransfer.getData("text/plain");
    if (!dragDataString) return;
    const dragData = JSON.parse(dragDataString);
    
    if (dragData.stack && dragData.stack.length > 1) return;

    const slot = e.currentTarget;
    // Wir finden heraus, welcher der 4 Slots es ist (0-3)
    const slotIndex = Array.from(document.querySelectorAll("#foundations .card-slot")).indexOf(slot);
    const cardData = dragData.card;

    if (canMoveToFoundation(cardData, slot)) {
        saveState(); 
        
        // NEU: In den Daten speichern statt nur im HTML hängen
        foundationData[slotIndex].push(cardData);
        
        removeFromOrigin(dragData);
        renderAll(); // Jetzt zeichnet renderAll die Karte korrekt mit
    }
    checkWinCondition;
}

function canMoveToFoundation(cardData, slot) {
    // Finde heraus, welcher Slot-Index gerade geprüft wird
    const slotIndex = Array.from(document.querySelectorAll("#foundations .card-slot")).indexOf(slot);
    const stack = foundationData[slotIndex];

    if (stack.length === 0) {
        // Wenn der Stapel leer ist, darf nur ein Ass (A) drauf
        return cardData.value === "A";
    }

    const topCard = stack[stack.length - 1];
    const topValIdx = valuesOrder.indexOf(topCard.value);
    const currValIdx = valuesOrder.indexOf(cardData.value);

    // Gleiches Symbol und genau ein Wert höher
    return (cardData.suit === topCard.suit) && (currValIdx === topValIdx + 1);
}

function removeFromOrigin(dragData) {
    if (dragData.origin === "waste") {
        wastePile.pop();
    } 
    // NEU: Prüfung auf Foundation-Origin
    else if (typeof dragData.origin === 'string' && dragData.origin.startsWith("foundation")) {
        const parts = dragData.origin.split("-");
        const slotIndex = parseInt(parts[1]);
        if (!isNaN(slotIndex)) {
            foundationData[slotIndex].pop(); // Entfernt die Karte aus den Daten
        }
    } 
    else if (typeof dragData.origin === 'number') {
        const col = tableauData[dragData.origin];
        const mainCard = dragData.stack[0];
        const idx = col.findIndex(c => c.suit === mainCard.suit && c.value === mainCard.value);
        if (idx !== -1) {
            col.splice(idx);
            // Die jetzt oberste Karte im Tableau aufdecken
            if (col.length > 0) col[col.length - 1].faceUp = true;
        }
    }
}

async function autoSortToFoundations() {
    if (window.isAutoSorting) return;
    window.isAutoSorting = true; 
    let cardsMoved = true;

    while (cardsMoved) {
        cardsMoved = false;

        // Tableau prüfen
        for (let colIndex = 0; colIndex < tableauData.length; colIndex++) {
            const column = tableauData[colIndex];
            if (column.length > 0) {
                const card = column[column.length - 1];
                const foundations = document.querySelectorAll("#foundations .card-slot");
                
                for (let i = 0; i < foundations.length; i++) {
                    if (canMoveToFoundation(card, foundations[i])) {
                        foundationData[i].push(card);
                        column.pop();
                        renderAll();
                        // Warte auf die Animation, bevor die nächste Karte gesucht wird
                        await new Promise(r => setTimeout(r, 150)); 
                        cardsMoved = true;
                        break; 
                    }
                }
            }
            if (cardsMoved) break; 
        }

        // Falls im Tableau nichts ging, Waste prüfen
        if (!cardsMoved && wastePile.length > 0) {
            const card = wastePile[wastePile.length - 1];
            const foundations = document.querySelectorAll("#foundations .card-slot");
            for (let i = 0; i < foundations.length; i++) {
                if (canMoveToFoundation(card, foundations[i])) {
                    foundationData[i].push(card);
                    wastePile.pop();
                    renderAll();
                    await new Promise(r => setTimeout(r, 150));
                    cardsMoved = true;
                    break;
                }
            }
        }
    }

    window.isAutoSorting = false;
    
    // WICHTIG: Wenn die Schleife fertig ist, rufen wir checkWinCondition auf,
    // die jetzt erkennt, dass alle 52 Karten liegen und das Popup anzeigt.
    checkWinCondition(); 
}

function checkWinCondition() {
    // Wenn die Animation schon läuft, nichts tun
    if (window.isAutoSorting) return;

    const stockEmpty = deck.length === 0;
    const wasteEmpty = wastePile.length === 0;
    const allTableauFaceUp = tableauData.every(column => 
        column.every(card => card.faceUp === true)
    );

    // Wenn alles aufgedeckt ist...
    if (stockEmpty && wasteEmpty && allTableauFaceUp) {
        // Prüfen, ob schon alle 52 Karten in den Foundations liegen
        const totalInFoundations = foundationData.reduce((sum, stack) => sum + stack.length, 0);
        
        if (totalInFoundations === 52) {
            // Erst wenn wirklich alle Karten oben liegen, zeige das Popup
            showVictoryPopup();
        } else {
            // Ansonsten starte die automatische Sortier-Animation
            autoSortToFoundations();
        }
    }
}

function showVictoryPopup() {
    const popup = document.getElementById("victoryPopup");
    if (popup) {
        // Text im Popup anpassen
        const pTag = popup.querySelector("p");
        if (pTag) {
            pTag.innerText = `Number of stack cycles: ${stackCycles}`;
        }
        popup.classList.add("is-visible");
    }
}

function hideVictoryPopup() {
    const popup = document.getElementById("victoryPopup");
    if (popup) {
        popup.classList.remove("is-visible");
        resetGame(); // Spiel neu starten nach Klick auf Button
    }
}

function resetGame() {
    stackCycles = 0;
    undoLimit = 5; // Zähler zurücksetzen
    gameStateHistory = []; // History leeren
    
    updateUndoButton(); // Button-Text wieder auf "Rückgängig (5)" setzen
    
    const counter = document.getElementById("move-counter");
    if (counter) counter.innerText = "Stapel-Klicks: 0";
    
    document.getElementById("waste").innerHTML = "";
    document.querySelectorAll("#foundations .card-slot").forEach(slot => slot.innerHTML = "");
    initGame();
}