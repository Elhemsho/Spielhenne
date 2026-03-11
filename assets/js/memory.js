/* ------------------------------------ Memory Logik mit Früchten ------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
    const gameField = document.querySelector('.game-field');
    const playAgainBtn = document.getElementById('playAgainBtn');

    const fruitImages = {
        'A': 'apfel.png',
        'B': 'banane.png',
        'C': 'erdbeere.png',
        'D': 'ananas.png',
        'E': 'wassermelone.png',
        'F': 'kirschen.png',
        'G': 'himbeere.png',
        'H': 'blaubeere.png',
        'I': 'pfirsich.png',
        'J': 'zitrone.png',
        'K': 'orange.png',
        'L': 'trauben.png'
    };

    const symbols = Object.keys(fruitImages);
    let cards = [...symbols, ...symbols];
    let flippedCards = [];
    let matchedPairs = 0;
    let currentPlayer = 1;
    let scores = { player1: 0, player2: 0 };
    let lockBoard = false;
    let winOverlayVisible = false;

    const scoreBoard = document.createElement('div');
    scoreBoard.className = 'score-board';
    updateScoreDisplay();
    document.querySelector('.main').insertBefore(scoreBoard, gameField);

    function tSaveMemoryState() {
        if (!new URLSearchParams(window.location.search).get('tournament')) return;
        const order = [...document.querySelectorAll('.memory-card')].map(c => c.dataset.symbol);
        const matchedIndices = [];
        document.querySelectorAll('.memory-card').forEach((c, idx) => {
            if (c.classList.contains('matched')) matchedIndices.push(idx);
        });
        sessionStorage.setItem('t_game_snapshot', JSON.stringify({
            order, matchedIndices, scores, currentPlayer, matchedPairs
        }));
    }

    function initGame(skipRestore) {
        // Turnier-Snapshot wiederherstellen (nur beim ersten Aufruf, nicht nach Play Again)
        if (!skipRestore && new URLSearchParams(window.location.search).get('tournament')) {
            const raw = sessionStorage.getItem('t_game_snapshot');
            if (raw) {
                try {
                    const s = JSON.parse(raw);
                    scores = s.scores;
                    currentPlayer = s.currentPlayer;
                    matchedPairs = s.matchedPairs;
                    lockBoard = false;
                    flippedCards = [];
                    gameField.innerHTML = '';
                    updateScoreDisplay();

                    s.order.forEach((symbol, idx) => {
                        const card = document.createElement('div');
                        card.classList.add('memory-card');
                        card.dataset.symbol = symbol;
                        card.innerHTML = `
                            <div class="card-inner">
                                <div class="card-front">
                                    <img src="../assets/images/favicon.png" alt="Logo" class="card-logo">
                                </div>
                                <div class="card-back">
                                    <img src="../assets/images/${fruitImages[symbol]}" alt="${symbol}" class="fruit-img">
                                </div>
                            </div>`;
                        if (s.matchedIndices.includes(idx)) {
                            card.classList.add('flipped', 'matched');
                        }
                        card.addEventListener('click', flipCard);
                        gameField.appendChild(card);
                    });
                    return; // Restore erfolgreich – normales initGame überspringen
                } catch(e) { console.warn('Memory restore error:', e); }
            }
        }

        // Normales Init
        gameField.innerHTML = '';
        flippedCards = [];
        matchedPairs = 0;
        scores = { player1: 0, player2: 0 };
        currentPlayer = 1;
        lockBoard = false;

        updateScoreDisplay();
        cards.sort(() => Math.random() - 0.5);

        cards.forEach((symbol) => {
            const card = document.createElement('div');
            card.classList.add('memory-card');
            card.dataset.symbol = symbol;

            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">
                        <img src="../assets/images/favicon.png" alt="Logo" class="card-logo">
                    </div>
                    <div class="card-back">
                        <img src="../assets/images/${fruitImages[symbol]}" alt="${symbol}" class="fruit-img">
                    </div>
                </div>
            `;

            card.addEventListener('click', flipCard);
            gameField.appendChild(card);
        });

        // Snapshot löschen beim echten Reset
        sessionStorage.removeItem('t_game_snapshot');
    }

    function flipCard() {
        if (lockBoard || this.classList.contains('flipped') || this.classList.contains('matched')) return;

        this.classList.add('flipped');
        flippedCards.push(this);

        window.cardSound.volume = 0.05;
        playSound(window.cardSound);

        if (flippedCards.length === 2) {
            checkMatch();
        }
    }

    function checkMatch() {
        lockBoard = true;
        const [card1, card2] = flippedCards;
        const isMatch = card1.dataset.symbol === card2.dataset.symbol;

        if (isMatch) {
            scores[`player${currentPlayer}`]++;
            matchedPairs++;

            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                window.correctSound.volume = 0.1;
                playSound(window.correctSound);
                resetTurn(true);

                tSaveMemoryState();

                if (matchedPairs === symbols.length) {
                    setTimeout(showWinPopup, 500);
                    setTimeout(startConfetti, 500);
                }
            }, 300);

            updateScoreDisplay();
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                currentPlayer = currentPlayer === 1 ? 2 : 1;
                resetTurn(false);
                tSaveMemoryState();
            }, 1000);
        }
    }

    function resetTurn(keepPlayer) {
        flippedCards = [];
        lockBoard = false;
        updateScoreDisplay();
    }

    function updateScoreDisplay() {
        scoreBoard.innerHTML = `
            <div class="player-score ${currentPlayer === 1 ? 'active' : ''}" data-i18n="player1">
                Player 1: <span>${scores.player1}</span>
            </div>
            <div class="player-score ${currentPlayer === 2 ? 'active' : ''}" data-i18n="player2">
                Player 2: <span>${scores.player2}</span>
            </div>
        `;
    }

    function showWinPopup() {
        playSound(window.winSound);
        window.winSound.volume = 0.05;

        const overlay = document.getElementById("overlay");
        if (scores.player1 > scores.player2) {
            overlay.dataset.winner = "1";
        } else if (scores.player2 > scores.player1) {
            overlay.dataset.winner = "2";
        } else {
            overlay.dataset.winner = "draw";
        }

        overlay.id = 'winOverlay';
        overlay.className = 'win-overlay';
        overlay.style.display = "flex";
        overlay.style.minWidth = "300px";
        winOverlayVisible = true;

        renderWinPopupContent(overlay);
        document.querySelector('.main').appendChild(overlay);

        overlay.querySelector('#modal-close').onclick = () => {
            overlay.style.display = "none";
            winOverlayVisible = false;
        };
        overlay.querySelector('#playAgainPopupBtn').onclick = () => {
            overlay.style.display = "none";
            winOverlayVisible = false;
            initGame(true); // true = skipRestore, echtes Neu-Spiel
        };
    }

    function renderWinPopupContent(overlay) {
        const currentLang = localStorage.getItem('selectedLanguage') || 'de';
        const langData = window.cachedData?.languages?.[currentLang];
        const winner = overlay.dataset.winner;

        let winnerText = "";
        if (winner === "draw") {
            winnerText = langData?.draw_result || "Draw!";
        } else {
            winnerText = langData ? langData.player_wins.replace('{n}', winner) : `☆ Player ${winner} wins ☆`;
        }

        const s1 = scores.player1;
        const s2 = scores.player2;
        const playAgainLabel = langData?.show_result || "Play Again";

        overlay.innerHTML = `
            <div class="win-popup">
                <button class="modal-close2" id="modal-close">&times;</button>
                <h1>${winnerText}</h1>
                <p>${langData?.final_score || "Final Score:"} ${s1} - ${s2}</p>
                <button class="pABtn" id="playAgainPopupBtn">${playAgainLabel}</button>
            </div>
        `;
    }

    window.refreshChampionText = () => {
        if (!winOverlayVisible) return;
        const overlay = document.getElementById('winOverlay');
        if (!overlay) return;

        renderWinPopupContent(overlay);
        overlay.querySelector('#modal-close').onclick = () => {
            overlay.style.display = "none";
            winOverlayVisible = false;
        };
        overlay.querySelector('#playAgainPopupBtn').onclick = () => {
            overlay.style.display = "none";
            winOverlayVisible = false;
            initGame(true);
        };
    };

    playAgainBtn.addEventListener('click', () => initGame(true));
    initGame();
});