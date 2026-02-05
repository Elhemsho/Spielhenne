let isProcessing = false; // Verhindert Klicks während des automatischen Wechsels

document.addEventListener('DOMContentLoaded', () => {
    const gridP1 = document.getElementById('grid-p1');
    const gridP2 = document.getElementById('grid-p2');
    const listP1 = document.getElementById('list-p1');
    const listP2 = document.getElementById('list-p2');
    const actionBtn = document.getElementById('main-action-btn');
    const resetBtn = document.getElementById('playAgainBtn');

    let currentPlayer = 1;
    let gameState = 'SETUP_P1'; // SETUP_P1, SETUP_P2, BATTLE, FINISHED

    const fleetDefinitions = [
        { id: 's4_1', size: 4 },
        { id: 's3_1', size: 3 }, { id: 's3_2', size: 3 },
        { id: 's2_1', size: 2 }, { id: 's2_2', size: 2 }
    ];

    const p1Data = { board: Array(64).fill(null), ships: [] };
    const p2Data = { board: Array(64).fill(null), ships: [] };

    function init() {
        createGrid(gridP1, 1);
        createGrid(gridP2, 2);
        updateUI();
        renderInventories();
    }

    function createGrid(gridEl, playerNum) {
        gridEl.innerHTML = '';
        for (let i = 0; i < 64; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;

            cell.ondragover = (e) => e.preventDefault();
            cell.ondragenter = (e) => handleDragEnter(e, i, playerNum);
            cell.ondragleave = (e) => clearHoverEffects();
            cell.ondrop = (e) => {
                clearHoverEffects();
                handleDrop(e, i, playerNum);
            };

            cell.ondragstart = (e) => handleGridDragStart(e, i, playerNum);
            cell.onclick = () => handleCellClick(i, playerNum);
            gridEl.appendChild(cell);
        }
    }

    // Hilfsfunktionen für Hover-Effekte
    function clearHoverEffects() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('drag-hover-group', 'invalid-drag-group');
        });
    }

    function handleDragStartData(e, size, dir) {
        window.currentDragSize = size;
        window.currentDragDir = dir;
    }

    // GHOST IMAGE ERSTELLUNG (Universal für Inventar und Board)
    function createDragGhost(size, dir) {
        const ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        ghost.style.display = 'flex';

        // 0: Rechts, 1: Runter, 2: Links, 3: Hoch
        if (dir === 0) {
            ghost.style.flexDirection = 'row';
        } else if (dir === 1) {
            ghost.style.flexDirection = 'column';
        } else if (dir === 2) {
            ghost.style.flexDirection = 'row-reverse'; // Wächst nach links
        } else if (dir === 3) {
            ghost.style.flexDirection = 'column-reverse'; // Wächst nach oben
        }

        for (let i = 0; i < size; i++) {
            const part = document.createElement('div');
            part.className = 'ship-part';
            part.style.backgroundColor = (currentPlayer === 1) ? 'rgb(255, 77, 77)' : 'rgb(77, 124, 255)';
            ghost.appendChild(part);
        }

        document.body.appendChild(ghost);
        return ghost;
    }

    function handleGridDragStart(e, index, playerNum) {
        if (!gameState.startsWith('SETUP')) {
            e.preventDefault();
            return;
        }

        const data = playerNum === 1 ? p1Data : p2Data;
        const ship = data.board[index];

        if (ship) {
            handleDragStartData(e, ship.size, ship.dir);
            const ghost = createDragGhost(ship.size, ship.dir);

            // Standard-Versatz (Mitte des ersten Quadrats)
            let offsetX = 15;
            let offsetY = 15;

            // Wenn das Schiff nach Links (2) oder Oben (3) gerichtet ist, 
            // müssen wir den Versatz ans Ende des Geisterbildes schieben
            if (ship.dir === 2) offsetX = (ship.size * 30) - 15;
            if (ship.dir === 3) offsetY = (ship.size * 30) - 15;

            e.dataTransfer.setDragImage(ghost, offsetX, offsetY);

            setTimeout(() => {
                if (document.body.contains(ghost)) document.body.removeChild(ghost);
            }, 0);

            e.dataTransfer.setData('shipId', ship.id);
            e.dataTransfer.setData('size', ship.size);
            e.dataTransfer.setData('dir', ship.dir);

            ship.coords.forEach(c => data.board[c] = null);
            data.ships = data.ships.filter(s => s.id !== ship.id);

            drawBoard(playerNum);
            renderInventories();
            checkSetupComplete();
        } else {
            e.preventDefault();
        }
    }

    function renderInventories() {
        renderInventory(1, listP1);
        renderInventory(2, listP2);
    }

    function renderInventory(playerNum, listEl) {
        listEl.innerHTML = '';
        const playerData = playerNum === 1 ? p1Data : p2Data;

        fleetDefinitions.forEach(shipDef => {
            const placedShip = playerData.ships.find(s => s.id === shipDef.id);
            const isPlaced = !!placedShip;
            const isSunken = placedShip && placedShip.isSunken;

            const isSetup = gameState.startsWith('SETUP');
            const showInSetup = isSetup && !isPlaced;
            const showInBattle = (gameState === 'BATTLE');
            const showInGameOver = (gameState === 'GAME_OVER');

            if (showInSetup || showInBattle || showInGameOver) {
                const shipEl = document.createElement('div');
                shipEl.className = 'draggable-ship';
                shipEl.style.flexDirection = 'column';

                if (showInGameOver) {
                    shipEl.style.opacity = "1";
                    shipEl.style.filter = "none";
                    if (isSunken) shipEl.classList.add('sunken');
                } else if (isSunken) {
                    shipEl.classList.add('sunken');
                    shipEl.style.opacity = "1";
                } else if (showInBattle && isPlaced) {
                    shipEl.style.opacity = "0.2";
                    shipEl.style.filter = "grayscale(1)";
                } else {
                    shipEl.draggable = (gameState === `SETUP_P${playerNum}`);
                    shipEl.style.opacity = "1";
                }

                for (let i = 0; i < shipDef.size; i++) {
                    const part = document.createElement('div');
                    part.className = 'ship-part';
                    shipEl.appendChild(part);
                }

                if (isSetup && !isPlaced) {
                    shipEl.ondragstart = (e) => {
                        const startDir = 1;
                        handleDragStartData(e, shipDef.size, startDir);
                        const ghost = createDragGhost(shipDef.size, startDir);
                        e.dataTransfer.setDragImage(ghost, 15, 15);
                        setTimeout(() => {
                            if (document.body.contains(ghost)) document.body.removeChild(ghost);
                        }, 0);
                        e.dataTransfer.setData('shipId', shipDef.id);
                        e.dataTransfer.setData('size', shipDef.size);
                        e.dataTransfer.setData('dir', startDir);
                    };
                }
                listEl.appendChild(shipEl);
            }
        });
    }

    function handleDragEnter(e, index, playerNum) {
        if (gameState !== `SETUP_P${playerNum}`) return;
        clearHoverEffects();

        const size = parseInt(window.currentDragSize);
        const dir = parseInt(window.currentDragDir);

        const coords = calculateShipCoords(index, size, dir);
        const gridEl = playerNum === 1 ? gridP1 : gridP2;
        const isValid = coords && checkCollision(coords, playerNum);

        if (coords) {
            coords.forEach(coordIndex => {
                const targetCell = gridEl.children[coordIndex];
                if (targetCell) {
                    targetCell.classList.add(isValid ? 'drag-hover-group' : 'invalid-drag-group');
                }
            });
        }
    }

    function handleDrop(e, index, playerNum) {
        e.preventDefault();
        if (gameState !== `SETUP_P${playerNum}`) return;

        const shipId = e.dataTransfer.getData('shipId');
        const size = parseInt(e.dataTransfer.getData('size'));
        const dir = parseInt(e.dataTransfer.getData('dir'));

        const coords = calculateShipCoords(index, size, dir);

        if (coords && checkCollision(coords, playerNum)) {
            placeShip(shipId, size, coords, dir, playerNum);
            renderInventories();
            checkSetupComplete();
        } else {
            // Falls Platzierung ungültig, Inventar refreshen um Schiff wieder anzuzeigen
            renderInventories();
        }
    }

    function calculateShipCoords(startIndex, size, dir) {
        const coords = [];
        const startX = startIndex % 8;
        const startY = Math.floor(startIndex / 8);

        for (let i = 0; i < size; i++) {
            let x = startX;
            let y = startY;

            if (dir === 0) x += i;      // Rechts
            else if (dir === 1) y += i; // Runter
            else if (dir === 2) x -= i; // Links
            else if (dir === 3) y -= i; // Hoch

            if (x < 0 || x > 7 || y < 0 || y > 7) return null;
            coords.push(y * 8 + x);
        }
        return coords;
    }

    function checkCollision(coords, playerNum) {
        const data = playerNum === 1 ? p1Data : p2Data;
        return coords.every(idx => data.board[idx] === null);
    }

    function placeShip(id, size, coords, dir, playerNum) {
        const data = playerNum === 1 ? p1Data : p2Data;
        const shipObj = { id, size, coords, dir, hits: 0 };
        data.ships.push(shipObj);
        coords.forEach(c => data.board[c] = shipObj);
        drawBoard(playerNum);
    }

    function handleCellClick(index, playerNum) {
        if (gameState.startsWith('SETUP')) {
            if (gameState === 'SETUP_P1' && playerNum === 1) tryRotateShip(index, 1);
            if (gameState === 'SETUP_P2' && playerNum === 2) tryRotateShip(index, 2);
        } else if (gameState === 'BATTLE') {
            const targetPlayer = currentPlayer === 1 ? 2 : 1;
            if (playerNum === targetPlayer) handleShot(index, targetPlayer);
        }
    }

    function tryRotateShip(index, playerNum) {
        const data = playerNum === 1 ? p1Data : p2Data;
        const ship = data.board[index];
        if (!ship) return;

        ship.coords.forEach(c => data.board[c] = null);
        const newDir = (ship.dir + 1) % 4;
        const headIndex = ship.coords[0];
        const newCoords = calculateShipCoords(headIndex, ship.size, newDir);

        if (newCoords && checkCollision(newCoords, playerNum)) {
            ship.coords = newCoords;
            ship.dir = newDir;
        }

        ship.coords.forEach(c => data.board[c] = ship);
        drawBoard(playerNum);
    }

    function checkSetupComplete() {
        const data = gameState === 'SETUP_P1' ? p1Data : p2Data;
        if (data.ships.length === fleetDefinitions.length) {
            actionBtn.disabled = false;
            actionBtn.classList.add('ready');
        } else {
            actionBtn.disabled = true;
            actionBtn.classList.remove('ready');
        }
    }

    actionBtn.onclick = () => {
        if (gameState === 'SETUP_P1') {
            gameState = 'SETUP_P2';
            actionBtn.disabled = true;
            actionBtn.classList.remove('ready');
            renderInventories();
            updateUI();
        } else if (gameState === 'SETUP_P2') {
            gameState = 'BATTLE';
            renderInventories();
            updateUI();
        }
    };

    function handleShot(index, targetPlayer) {
        if (isProcessing) return;

        const data = targetPlayer === 1 ? p1Data : p2Data;
        const gridEl = targetPlayer === 1 ? gridP1 : gridP2;
        const cell = gridEl.children[index];

        if (cell.classList.contains('hit') || cell.classList.contains('miss')) return;

        const targetShip = data.board[index];

        if (targetShip && typeof targetShip === 'object') {
            // 1. SOFORT die Zelle visuell markieren
            cell.classList.add('hit');
            targetShip.hits++;

            // 2. Prüfen, ob versenkt
            if (targetShip.hits === targetShip.size) {
                targetShip.isSunken = true;

                // Animation starten
                targetShip.coords.forEach(coord => {
                    gridEl.children[coord].classList.add('sunken-animation');
                });

                // 3. Wichtig: Erst das Inventar und Board neu zeichnen
                renderInventories();
                drawBoard(targetPlayer);

                // 4. Eine winzige Verzögerung einbauen, damit das Auge das rote Feld sieht, 
                // bevor das Popup alles überdeckt
                setTimeout(() => {
                    checkGameOver();
                }, 100);
            } else {
                updateUI();
            }
        } else {
            // Fehlschuss Logik bleibt gleich...
            cell.classList.add('miss');
            isProcessing = true;
            setTimeout(() => {
                currentPlayer = (currentPlayer === 1 ? 2 : 1);
                isProcessing = false;
                updateUI();
            }, 800);
        }
    }

    function checkGameOver() {
        const p1Win = p2Data.ships.every(s => s.isSunken);
        const p2Win = p1Data.ships.every(s => s.isSunken);

        if (p1Win || p2Win) {
            const winner = p1Win ? 1 : 2;
            const winnerColor = winner === 1 ? 'var(--p1-color)' : 'var(--p2-color)';
            const popup = document.getElementById('winner-popup');
            const popupBox = document.getElementById('popup-box');
            const winnerText = document.getElementById('winner-text');
            const showMeBtn = document.getElementById('show-me-btn');

            gameState = 'GAME_OVER';
            popup.style.display = 'flex';
            popupBox.style.borderColor = winnerColor;
            winnerText.innerText = `Player ${winner} wins!`;

            showMeBtn.onclick = () => {
                popup.style.display = 'none';
                document.body.classList.add('GAME_OVER');

                actionBtn.disabled = false;
                actionBtn.textContent = "Play again";
                actionBtn.classList.add('ready');

                // Hier die Verknüpfung zum Soft-Reset
                actionBtn.onclick = resetGame;

                const allVisuals = document.querySelectorAll('.ship-overview, .player-area');
                allVisuals.forEach(el => {
                    el.style.opacity = "1";
                    el.classList.remove('inactive');
                });

                updateUI();
                renderInventories();
            };
        }
    }

    function drawBoard(playerNum) {
        const data = playerNum === 1 ? p1Data : p2Data;
        const gridEl = playerNum === 1 ? gridP1 : gridP2;
        const cells = gridEl.querySelectorAll('.cell');

        cells.forEach((cell, idx) => {
            cell.classList.remove('ship-present');
            cell.removeAttribute('draggable'); // Reset

            const shipAtPos = data.board[idx];
            if (shipAtPos) {
                const isSetupForThisPlayer = (gameState === `SETUP_P${playerNum}`);
                const isOwnBoard = (gameState === 'BATTLE' && playerNum === currentPlayer);
                const isHit = cell.classList.contains('hit');
                const isGameOver = (gameState === 'GAME_OVER');

                if (isSetupForThisPlayer || isOwnBoard || isHit || isGameOver) {
                    cell.classList.add('ship-present');
                    if (isSetupForThisPlayer) cell.setAttribute('draggable', 'true');
                }
            }
        });
    }

    function updateUI() {
        // Wenn das Spiel vorbei ist, darf updateUI die Opacity nicht mehr drosseln
        if (gameState === 'GAME_OVER') {
            // Volle Sichtbarkeit für beide Grids
            gridP1.style.opacity = "1";
            gridP2.style.opacity = "1";
            gridP1.style.filter = "none";
            gridP2.style.filter = "none";
            gridP1.style.pointerEvents = "none";
            gridP2.style.pointerEvents = "none";

            // Auch die Container drumherum hell machen
            document.querySelectorAll('.player-area, .ship-overview').forEach(el => {
                el.style.opacity = "1";
                el.classList.remove('inactive');
            });
            return;
        }

        drawBoard(1);
        drawBoard(2);

        if (gameState === 'SETUP_P1') {
            gridP1.style.opacity = "1";
            gridP2.style.opacity = "0.3";
            actionBtn.textContent = "NEXT PLAYER";
        } else if (gameState === 'SETUP_P2') {
            gridP1.style.opacity = "0.3";
            gridP2.style.opacity = "1";
            actionBtn.textContent = "START BATTLE";
        } else if (gameState === 'BATTLE') {
            actionBtn.disabled = true;
            actionBtn.textContent = `PLAYER ${currentPlayer}'S TURN`;

            const targetPlayer = (currentPlayer === 1 ? 2 : 1);
            gridP1.style.opacity = (targetPlayer === 1) ? "1" : "0.5";
            gridP2.style.opacity = (targetPlayer === 2) ? "1" : "0.5";

            gridP1.style.pointerEvents = (targetPlayer === 1 && !isProcessing) ? "auto" : "none";
            gridP2.style.pointerEvents = (targetPlayer === 2 && !isProcessing) ? "auto" : "none";
        }
    }

    function resetGame() {
        // 1. Daten-Modelle komplett leeren
        p1Data.board.fill(null);
        p1Data.ships = [];
        p2Data.board.fill(null);
        p2Data.ships = [];

        // 2. Spielstatus zurücksetzen
        currentPlayer = 1;
        gameState = 'SETUP_P1';
        isProcessing = false;

        // 3. UI-Elemente aufräumen
        document.body.classList.remove('GAME_OVER');
        document.getElementById('winner-popup').style.display = 'none';

        // 4. GRIDS NEU ERSTELLEN 
        // Das ist der entscheidende Teil, damit Drag & Drop wieder funktioniert!
        createGrid(gridP1, 1);
        createGrid(gridP2, 2);

        // 5. Action-Button zurücksetzen
        actionBtn.disabled = true;
        actionBtn.textContent = "NEXT PLAYER";
        actionBtn.classList.remove('ready');
        actionBtn.style.backgroundColor = "";
        actionBtn.style.borderColor = "";

        // Klick-Logik wieder auf Setup stellen
        actionBtn.onclick = handleActionBtnClick;

        // 6. Alles neu zeichnen
        updateUI();
        renderInventories();
    }

    function handleActionBtnClick() {
        if (gameState === 'SETUP_P1') {
            gameState = 'SETUP_P2';
            actionBtn.disabled = true;
            actionBtn.classList.remove('ready');
            renderInventories();
            updateUI();
        } else if (gameState === 'SETUP_P2') {
            gameState = 'BATTLE';
            renderInventories();
            updateUI();
        }
    }

    // Belegung der Buttons
    actionBtn.onclick = handleActionBtnClick;
    resetBtn.onclick = resetGame; // Der Button oben links nutzt jetzt auch resetGame

    init();
});