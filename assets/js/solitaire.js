/* ------------------------------------ Solitär Logik ------------------------------------ */
let deck = [];
let wastePile = [];
let tableauData = [[], [], [], [], [], [], []];
let deckClickCount = 0;
let gameStateHistory = []; // Speicher für die Undo-Funktion
let undoLimit = 5;
let foundationData = [[], [], [], []]; // Für die 4 Stapel oben rechts
let stackCycles = 0;

let timerInterval = null;
let seconds = 0;
let gameStarted = false;
let isPaused = false;
let undosAllowed = true;
let cardsToDrawCount = 3;

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
            saveState(); // Zustand für Undo speichern

            if (deck.length === 0 && wastePile.length > 0) {
                // FALL: Stapel leer, Waste voll -> Wir mischen neu
                stackCycles++; 
                deck = wastePile.reverse();
                wastePile = [];
                
                // Wichtig: Wir zeigen erst an, DASS neu gemischt wurde
                const counter = document.getElementById("move-counter");
                if (counter) counter.innerText = `Stapel-Klicks: ${deckClickCount}`;
                
                renderAll();
            } else if (deck.length > 0) {
                // FALL: Normal ziehen
                deckClickCount++;
                const counter = document.getElementById("move-counter");
                if (counter) counter.innerText = `Stapel-Klicks: ${deckClickCount}`;
                drawThreeCards();
            } else {
                // Stapel leer UND Waste leer -> Nichts passiert
                console.log("Keine Karten mehr zum Ziehen!");
            }
        };
    }

    // Foundations vorbereiten
    document.querySelectorAll("#foundations .card-slot").forEach(slot => {
        slot.addEventListener("dragover", (e) => e.preventDefault());
        slot.addEventListener("drop", handleFoundationDrop);
    });

    const winBtn = document.getElementById("modal-button");
    if (winBtn) winBtn.onclick = hideVictoryPopup;

    document.getElementById("pauseBtn").onclick = togglePause;
    document.getElementById("continueBtn").onclick = togglePause;

    document.getElementById("toggleUndoBtn").onclick = toggleUndoSetting;
    document.getElementById("toggleDrawBtn").onclick = toggleDrawSetting;

    updateHighscoreDisplay();
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

const originalSaveState = saveState;
saveState = function () {
    startTimer();
    if (!undosAllowed) return; // Falls Undo aus, speichern wir nichts
    originalSaveState();
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
        // Aktuelle Sprache abrufen
        const currentLang = localStorage.getItem('selectedLanguage') || 'de';
        let undoLabel = "Undo"; // Standardfall

        // Übersetzung aus cachedData holen
        if (cachedData && cachedData.languages[currentLang]) {
            undoLabel = cachedData.languages[currentLang].undo_text || "Undo";
        }

        // Text mit dem aktuellen Limit setzen
        undoBtn.innerText = `${undoLabel} (${undoLimit})`;

        // Styling Logik
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
    gameStateHistory = [];

    for (let i = 0; i < 7; i++) {
        for (let j = 0; j <= i; j++) {
            let cardIndex = deck.length - 1;
            let card = deck[cardIndex];

            // LOGIK FÜR BESSERE LÖSBARKEIT:
            // Wenn es die unterste Karte eines Stapels ist (j === 0)
            // und es ein Ass oder ein König ist, schieben wir sie nach oben ins Deck
            if (j === 0 && (card.value === "A" || card.value === "K")) {
                // Karte rausnehmen und an den Anfang des Decks schieben (wird später gezogen)
                let specialCard = deck.pop();
                deck.unshift(specialCard);
                // Neue Karte für diese Position nehmen
                card = deck.pop();
            } else {
                card = deck.pop();
            }

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
            const cardEl = createCardElement({ ...card, faceUp: true }, `foundation-${i}`);
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
        cardDiv.style.backgroundImage = `url('../assets/images/cards/${fileName}')`;

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
                clone.style.backgroundImage = `url('../assets/images/cards/${getFileName(c)}')`;
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

                    window.cardSound.currentTime = 0; 
                    window.cardSound.volume = 0.05; 
                    window.cardSound.play();

                    // 3. Alles neu zeichnen (rendert die Karte nun auch in der Foundation)
                    renderAll();
                    break;
                }
            }
        });

    } else {
        cardDiv.classList.add("card-back");
        cardDiv.style.backgroundImage = `url('../assets/images/cards/1B.svg')`;
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

    stockElement.innerHTML = ""; 

    if (deck.length === 0) {
        // Stapel ist leer -> Zeige die Zahl der bisherigen Durchgänge
        stockElement.classList.add("empty");
        
        const cycleDisplay = document.createElement("div");
        cycleDisplay.className = "stock-cycle-counter";

        // Styles
        cycleDisplay.style.position = "absolute";
        cycleDisplay.style.top = "50%";
        cycleDisplay.style.left = "50%";
        cycleDisplay.style.transform = "translate(-50%, -50%)";
        cycleDisplay.style.fontSize = "40px";
        cycleDisplay.style.fontWeight = "bold";
        cycleDisplay.style.fontFamily = "'Comic Neue', sans-serif"; // Anführungszeichen wichtig!
        cycleDisplay.style.color = "rgba(166, 213, 222, 0.8)"; // Etwas kräftiger für bessere Sichtbarkeit
        cycleDisplay.style.pointerEvents = "none"; 

        cycleDisplay.innerText = stackCycles;
        stockElement.appendChild(cycleDisplay);
    } else {
        // Karten sind noch da -> Zeige Rückseite
        stockElement.classList.remove("empty");
        const cardBack = createCardElement({ faceUp: false }, "stock");
        cardBack.style.top = "-2px";
        cardBack.style.left = "-2px";
        cardBack.style.position = "absolute";
        stockElement.appendChild(cardBack);
    }
}

function drawThreeCards() {
    
    if (deck.length === 0) {
        if (wastePile.length === 0) return;
        deck = wastePile.map(c => ({ ...c, faceUp: false })).reverse();
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
        window.cardSound.currentTime = 0;
        window.cardSound.volume = 0.05;
        window.cardSound.play();
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
            if (col.length > 0) {
                col[col.length - 1].faceUp = true;
                window.cardSound.currentTime = 0; 
                window.cardSound.volume = 0.05; 
                window.cardSound.play();
            }
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
                        window.cardSound.currentTime = 0; 
                        window.cardSound.volume = 0.05; 
                        window.cardSound.play();
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
    window.winSound.currentTime = 0;
    window.winSound.volume = 0.07;
    window.winSound.play();

    const popup = document.getElementById("game-modal");
    if (!popup) return;

    const currentTimeStr = document.getElementById("timerDisplay").innerText;
    const currentCycles = stackCycles;
    const isNewHighscore = saveHighscore(currentCycles, currentTimeStr);

    const modalContent = document.querySelector('.modal-content');
    const modalH2 = document.getElementById('modal-text');
    const resultStats = document.querySelector('.result-stats');
    const labelEl = document.querySelector('.result-item .label');
    const valueEl = document.getElementById('modal-score-display');
    const modalBtn = document.getElementById('modal-button');

    if (isNewHighscore) {
        if (resultStats) { resultStats.style.backgroundColor = "#fff9e6"; resultStats.style.borderColor = "#ffcc00"; resultStats.style.boxShadow = "0 0 15px 10px rgba(255, 204, 0, 0.4)"; }
        if (modalH2) { modalH2.innerText = "Congratulations!"; modalH2.style.color = "#333"; }
        if (labelEl) { labelEl.innerText = "NEW HIGHSCORE"; labelEl.style.color = "#333"; }
        if (valueEl) valueEl.style.color = "#b8860b";
    } else {
        if (resultStats) { resultStats.style.backgroundColor = "#f0fbfc"; resultStats.style.borderColor = "var(--blue)"; resultStats.style.boxShadow = "var(--blue)"; }
        if (modalH2) { modalH2.innerText = "Congratulations!"; modalH2.style.color = "#333"; }
        if (labelEl) { labelEl.innerText = "YOUR SCORE"; labelEl.style.color = "#666"; }
        if (valueEl) valueEl.style.color = "#333";
    }

    if (valueEl) valueEl.innerText = `${currentCycles} Cycles | ${currentTimeStr}`;
    if (modalBtn) { modalBtn.innerText = "Play Again"; modalBtn.onclick = () => { popup.style.display = "none"; resetGame(); }; }

    updateHighscoreDisplay();
    popup.style.display = "flex";
}

function hideVictoryPopup() {
    const popup = document.getElementById("victoryPopup");
    if (popup) {
        popup.classList.remove("is-visible");
        resetGame(); // Spiel neu starten nach Klick auf Button
    }
}

function resetGame() {
    // Timer und Status komplett zurücksetzen
    clearInterval(timerInterval);
    timerInterval = null;
    seconds = 0;
    gameStarted = false; // Wichtig: Ermöglicht das Ändern der Settings
    isPaused = false;

    // UI-Elemente bereinigen
    updateTimerDisplay();
    document.getElementById("pauseBtn").innerText = "⏸";
    document.getElementById("gameField").classList.remove("blurred");
    document.getElementById("pauseOverlay").classList.remove("active");

    // Buttons für Einstellungen wieder aktiv schalten
    document.getElementById("toggleUndoBtn").classList.remove("disabled");
    document.getElementById("toggleDrawBtn").classList.remove("disabled");

    // Ursprüngliche Reset-Logik
    stackCycles = 0;
    undoLimit = 5;
    gameStateHistory = [];
    updateUndoButton();

    const counter = document.getElementById("move-counter");
    if (counter) counter.innerText = "Stapel-Klicks: 0";

    document.getElementById("waste").innerHTML = "";
    document.querySelectorAll("#foundations .card-slot").forEach(slot => slot.innerHTML = "");

    initGame();
}

// Timer Funktionen
function startTimer() {
    if (!gameStarted) {
        gameStarted = true;
        // Einstellungen sperren
        document.getElementById("toggleUndoBtn").classList.add("disabled");
        document.getElementById("toggleDrawBtn").classList.add("disabled");

        timerInterval = setInterval(() => {
            if (!isPaused) {
                seconds++;
                updateTimerDisplay();
            }
        }, 1000);
    }
}

function updateTimerDisplay() {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    document.getElementById("timerDisplay").innerText = `${h}:${m}:${s}`;
}

// Pause Logik
function togglePause() {
    if (!gameStarted) return;

    isPaused = !isPaused;
    const overlay = document.getElementById("pauseOverlay");
    const wrapper = document.getElementById("gameContentWrapper");

    if (isPaused) {
        overlay.classList.add("active");
        wrapper.classList.add("blurred");
        // KEIN overflow: hidden mehr, damit man scrollen kann!
    } else {
        overlay.classList.remove("active");
        wrapper.classList.remove("blurred");
    }
}

// Einstellungen
function toggleUndoSetting() {
    if (typeof gameStarted !== 'undefined' && gameStarted) return;

    // 1. Status umschalten
    undosAllowed = !undosAllowed;

    // 2. Sprache & Daten laden
    const currentLang = localStorage.getItem('selectedLanguage') || 'de';
    // Wir greifen auf die Daten zu, die global.js geladen hat
    if (cachedData && cachedData.languages[currentLang]) {
        const langData = cachedData.languages[currentLang];
        
        // Begriffe aus der JSON holen (on/off/undo_text müssen dort stehen!)
        const statusText = undosAllowed ? langData.on : langData.off;
        const undoLabel = langData.undo_text || "Undo";

        // 3. Button-Text setzen
        const toggleBtn = document.getElementById("toggleUndoBtn");
        if (toggleBtn) {
            toggleBtn.innerText = `${undoLabel}: ${statusText}`;
        }
    }

    // 4. Button Sichtbarkeit
    const undoBtn = document.getElementById("undoButton");
    if (undoBtn) {
        undoBtn.style.display = undosAllowed ? "block" : "none";
    }

    if (typeof updateHighscoreDisplay === "function") {
        updateHighscoreDisplay();
    }
}

function toggleDrawSetting() {
    if (typeof gameStarted !== 'undefined' && gameStarted) return;

    // 1. Logik: 1 -> 2 -> 3 -> 1
    cardsToDrawCount = (cardsToDrawCount % 3) + 1;

    // 2. Sprache & Daten laden
    const currentLang = localStorage.getItem('selectedLanguage') || 'de';
    
    if (cachedData && cachedData.languages[currentLang]) {
        const langData = cachedData.languages[currentLang];
        const drawLabel = langData.draw_text || "Draw";

        // 3. Button-Text setzen
        const drawBtn = document.getElementById("toggleDrawBtn");
        if (drawBtn) {
            drawBtn.innerText = `${drawLabel}: ${cardsToDrawCount}`;
        }
    }

    if (typeof updateHighscoreDisplay === "function") {
        updateHighscoreDisplay();
    }
}

// Modifizierte existierende Funktionen
function drawThreeCards() {
    startTimer(); // Timer bei Aktion starten
    if (deck.length === 0) {
        if (wastePile.length === 0) return;
        deck = wastePile.map(c => ({ ...c, faceUp: false })).reverse();
        wastePile = [];
    } else {
        window.cardSound.currentTime = 0; 
        window.cardSound.volume = 0.05; 
        window.cardSound.play();
        // Nutzt jetzt die cardsToDrawCount Variable
        const count = Math.min(deck.length, cardsToDrawCount);
        for (let i = 0; i < count; i++) {
            let card = deck.pop();
            card.faceUp = true;
            wastePile.push(card);
        }
    }
    renderAll();
}

// Highscore System
function updateHighscoreDisplay() {
    const key = `highscore_undo${undosAllowed}_draw${cardsToDrawCount}`;
    const score = JSON.parse(localStorage.getItem(key));
    const display = document.getElementById("highscoreDisplay");

    if (display) {
        if (score) {
            display.innerText = `${score.cycles} | ${score.timeStr}`;
        } else {
            // Aktuelle Sprache prüfen
            const currentLang = localStorage.getItem('selectedLanguage') || 'de';
            
            // Wenn cachedData existiert, nimm die Übersetzung, sonst Fallback "None"
            if (cachedData && cachedData.languages[currentLang]) {
                display.innerText = cachedData.languages[currentLang].none_text || "None";
            } else {
                display.innerText = "None";
            }
        }
    }
}

function saveHighscore(cycles, timeStr) {
    // Eindeutiger Key basierend auf den Einstellungen (Draw 1/3, Undo ON/OFF)
    const key = `highscore_undo${undosAllowed}_draw${cardsToDrawCount}`;
    const savedScore = JSON.parse(localStorage.getItem(key));

    // Logik: Weniger Cycles sind besser. Bei Gleichstand ist weniger Zeit besser.
    const isBetter = !savedScore ||
        cycles < savedScore.cycles ||
        (cycles === savedScore.cycles && timeStr < savedScore.timeStr);

    if (isBetter) {
        const newScore = { cycles: cycles, timeStr: timeStr };
        localStorage.setItem(key, JSON.stringify(newScore));
    }
    return isBetter;
}