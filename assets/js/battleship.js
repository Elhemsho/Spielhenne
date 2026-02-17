// Diese Variablen müssen AUẞERHALB des Listeners stehen, 
// damit global.js darauf zugreifen kann!
let updateUI; 
let isProcessing = false;
let currentPlayer = 1;
let gameState = 'SETUP_P1';

document.addEventListener('DOMContentLoaded', () => {
    const gridP1 = document.getElementById('grid-p1');
    const gridP2 = document.getElementById('grid-p2');
    const listP1 = document.getElementById('list-p1');
    const listP2 = document.getElementById('list-p2');
    const actionBtn = document.getElementById('main-action-btn');
    const resetBtn = document.getElementById('playAgainBtn');
    const showBtn = document.getElementById('playAgainBtnChampion');
    const winOverlay = document.getElementById('championOverlay');

    const fleetDefinitions = [
        { id: 's4_1', size: 4 },
        { id: 's3_1', size: 3 }, { id: 's3_2', size: 3 },
        { id: 's2_1', size: 2 }, { id: 's2_2', size: 2 }
    ];

    let p1Data = { board: Array(64).fill(null), ships: [] };
    let p2Data = { board: Array(64).fill(null), ships: [] };

    function init() {
        createGrid(gridP1, 1);
        createGrid(gridP2, 2);
        updateUI(); // Erster Aufruf
        renderInventories();
    }

    // --- DEINE FUNKTIONEN (unverändert übernommen) ---
    function createGrid(gridEl, playerNum) {
        gridEl.innerHTML = '';
        for (let i = 0; i < 64; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.ondragover = (e) => e.preventDefault();
            cell.ondragenter = (e) => handleDragEnter(e, i, playerNum);
            cell.ondragleave = (e) => clearHoverEffects();
            cell.ondrop = (e) => { clearHoverEffects(); handleDrop(e, i, playerNum); };
            cell.ondragstart = (e) => handleGridDragStart(e, i, playerNum);
            cell.onclick = () => handleCellClick(i, playerNum);
            gridEl.appendChild(cell);
        }
    }

    function clearHoverEffects() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('drag-hover-group', 'invalid-drag-group');
        });
    }

    function handleDragStartData(e, size, dir) {
        window.currentDragSize = size;
        window.currentDragDir = dir;
    }

    function createDragGhost(size, dir) {
        const ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        ghost.style.display = 'flex';
        if (dir === 0) ghost.style.flexDirection = 'row';
        else if (dir === 1) ghost.style.flexDirection = 'column';
        else if (dir === 2) ghost.style.flexDirection = 'row-reverse';
        else if (dir === 3) ghost.style.flexDirection = 'column-reverse';
        for (let i = 0; i < size; i++) {
            const part = document.createElement('div');
            part.className = 'ship-part';
            part.style.backgroundColor = (currentPlayer === 1) ? 'var(--player1-color)' : 'var(--player2-color)';
            ghost.appendChild(part);
        }
        document.body.appendChild(ghost);
        return ghost;
    }

    function handleGridDragStart(e, index, playerNum) {
        if (!gameState.startsWith('SETUP')) { e.preventDefault(); return; }
        const data = playerNum === 1 ? p1Data : p2Data;
        const ship = data.board[index];
        if (ship) {
            handleDragStartData(e, ship.size, ship.dir);
            const ghost = createDragGhost(ship.size, ship.dir);
            let offsetX = 15; let offsetY = 15;
            if (ship.dir === 2) offsetX = (ship.size * 30) - 15;
            if (ship.dir === 3) offsetY = (ship.size * 30) - 15;
            e.dataTransfer.setDragImage(ghost, offsetX, offsetY);
            setTimeout(() => { if (document.body.contains(ghost)) document.body.removeChild(ghost); }, 0);
            e.dataTransfer.setData('shipId', ship.id);
            e.dataTransfer.setData('size', ship.size);
            e.dataTransfer.setData('dir', ship.dir);
            ship.coords.forEach(c => data.board[c] = null);
            data.ships = data.ships.filter(s => s.id !== ship.id);
            drawBoard(playerNum);
            renderInventories();
            checkSetupComplete();
        } else { e.preventDefault(); }
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
                    if (isSunken) shipEl.classList.add('sunken');
                } else if (isSunken) {
                    shipEl.classList.add('sunken');
                } else if (showInBattle && isPlaced) {
                    shipEl.style.opacity = "0.2";
                    shipEl.style.filter = "grayscale(1)";
                } else {
                    shipEl.draggable = (gameState === `SETUP_P${playerNum}`);
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
                        setTimeout(() => { if (document.body.contains(ghost)) document.body.removeChild(ghost); }, 0);
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
                if (targetCell) targetCell.classList.add(isValid ? 'drag-hover-group' : 'invalid-drag-group');
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
        } else { renderInventories(); }
    }

    function calculateShipCoords(startIndex, size, dir) {
        const coords = [];
        const startX = startIndex % 8;
        const startY = Math.floor(startIndex / 8);
        for (let i = 0; i < size; i++) {
            let x = startX, y = startY;
            if (dir === 0) x += i;
            else if (dir === 1) y += i;
            else if (dir === 2) x -= i;
            else if (dir === 3) y -= i;
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
        const shipObj = { id, size, coords, dir, hits: 0, isSunken: false };
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

    function handleActionBtnClick() {
        if (gameState === 'SETUP_P1') {
            gameState = 'SETUP_P2';
            currentPlayer = 2;
            actionBtn.disabled = true;
            actionBtn.classList.remove('ready');
            renderInventories();
            updateUI();
        } else if (gameState === 'SETUP_P2') {
            gameState = 'BATTLE';
            currentPlayer = 1;
            renderInventories();
            updateUI();
        }
    }

    function handleShot(index, targetPlayer) {
        if (isProcessing) return;
        const data = targetPlayer === 1 ? p1Data : p2Data;
        const gridEl = targetPlayer === 1 ? gridP1 : gridP2;
        const cell = gridEl.children[index];
        if (cell.classList.contains('hit') || cell.classList.contains('miss')) return;
        const targetShip = data.board[index];
        if (targetShip && typeof targetShip === 'object') {
            cell.classList.add('hit');
            targetShip.hits++;
            if (targetShip.hits === targetShip.size) {
                targetShip.isSunken = true;
                targetShip.coords.forEach(coord => gridEl.children[coord].classList.add('sunken-animation'));
                renderInventories();
                drawBoard(targetPlayer);
                setTimeout(() => { checkGameOver(); }, 100);
            } else { updateUI(); }
        } else {
            cell.classList.add('miss');
            isProcessing = true;
            setTimeout(() => { currentPlayer = (currentPlayer === 1 ? 2 : 1); isProcessing = false; updateUI(); }, 800);
        }
    }

    function checkGameOver() {
        const p1Win = p2Data.ships.every(s => s.isSunken);
        const p2Win = p1Data.ships.every(s => s.isSunken);
        if (p1Win || p2Win) {
            gameState = 'GAME_OVER';
            drawBoard(1); drawBoard(2);
            const winner = p1Win ? 1 : 2;
            const winText = document.getElementById('championText');
            // Hier nutzen wir wieder langData für das Overlay
            const currentLang = localStorage.getItem('selectedLanguage') || 'de';
            const langData = (window.cachedData && window.cachedData.languages) ? window.cachedData.languages[currentLang] : null;
            
            if (winText && langData) {
                winText.innerText = `☆ ${langData.player_wins.replace('{n}', winner)} ☆`;
            } else {
                winText.innerText = `☆ Player ${winner} wins! ☆`;
            }
            setTimeout(() => {
                if (winOverlay) { winOverlay.classList.remove('hidden'); winOverlay.style.display = 'flex'; }
                if (typeof startConfetti === "function") startConfetti();
                updateUI();
            }, 500);
        }
    }

    showBtn.onclick = () => {
        winOverlay.classList.add('hidden');
        winOverlay.style.display = 'none';
        gameState = 'GAME_OVER';
        document.body.classList.add('GAME_OVER');
        actionBtn.disabled = false;
        actionBtn.classList.add('ready');
        actionBtn.onclick = resetGame;
        updateUI();
        renderInventories();
    };

    function drawBoard(playerNum) {
        const data = playerNum === 1 ? p1Data : p2Data;
        const gridEl = playerNum === 1 ? gridP1 : gridP2;
        const cells = gridEl.querySelectorAll('.cell');
        cells.forEach((cell, idx) => {
            cell.classList.remove('ship-present');
            cell.removeAttribute('draggable');
            const shipAtPos = data.board[idx];
            if (shipAtPos) {
                const isSetupForThisPlayer = (gameState === `SETUP_P${playerNum}`);
                const isHit = cell.classList.contains('hit');
                const isGameOver = (gameState === 'GAME_OVER');
                if (isSetupForThisPlayer || isHit || isGameOver) {
                    cell.classList.add('ship-present');
                    if (isSetupForThisPlayer) cell.setAttribute('draggable', 'true');
                }
            }
        });
    }

    // --- DIE WICHTIGE UPDATE-FUNKTION ---
    updateUI = function() {
        const currentLang = localStorage.getItem('selectedLanguage') || 'de';
        const langData = (window.cachedData && window.cachedData.languages) ? window.cachedData.languages[currentLang] : null;

        if (gameState === 'GAME_OVER') {
            [gridP1, gridP2].forEach(g => { g.style.opacity = "1"; g.style.pointerEvents = "none"; });
            if (langData) actionBtn.textContent = langData.btn_play_again || "PLAY AGAIN";
            return;
        }

        drawBoard(1); drawBoard(2);

        if (gameState === 'SETUP_P1') {
            gridP1.style.opacity = "1"; gridP2.style.opacity = "0.3";
            actionBtn.textContent = langData ? langData.btn_next_player : "NEXT PLAYER";
        } else if (gameState === 'SETUP_P2') {
            gridP1.style.opacity = "0.3"; gridP2.style.opacity = "1";
            actionBtn.textContent = langData ? langData.btn_start_battle : "START BATTLE";
        } else if (gameState === 'BATTLE') {
            actionBtn.disabled = true;
            if (langData) {
                actionBtn.textContent = langData.btn_player_turn.replace('{n}', currentPlayer);
            } else {
                actionBtn.textContent = `PLAYER ${currentPlayer}'S TURN`;
            }
            const targetPlayer = (currentPlayer === 1 ? 2 : 1);
            gridP1.style.opacity = (targetPlayer === 1) ? "1" : "0.5";
            gridP2.style.opacity = (targetPlayer === 2) ? "1" : "0.5";
            gridP1.style.pointerEvents = (targetPlayer === 1 && !isProcessing) ? "auto" : "none";
            gridP2.style.pointerEvents = (targetPlayer === 2 && !isProcessing) ? "auto" : "none";
        }
    };

    function resetGame() {
        p1Data = { board: Array(64).fill(null), ships: [] };
        p2Data = { board: Array(64).fill(null), ships: [] };
        currentPlayer = 1;
        gameState = 'SETUP_P1';
        isProcessing = false;
        document.body.classList.remove('GAME_OVER');
        if (winOverlay) { winOverlay.classList.add('hidden'); winOverlay.style.display = 'none'; }
        createGrid(gridP1, 1);
        createGrid(gridP2, 2);
        actionBtn.disabled = true;
        actionBtn.classList.remove('ready');
        actionBtn.onclick = handleActionBtnClick;
        updateUI();
        renderInventories();
    }

    actionBtn.onclick = handleActionBtnClick;
    resetBtn.onclick = resetGame;

    init();
});