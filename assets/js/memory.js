/* ------------------------------------ Memory Logik mit Früchten ------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
    const gameField = document.querySelector('.game-field');
    const playAgainBtn = document.getElementById('playAgainBtn');

    // Config: Mapping der Buchstaben zu deinen Bilddateien
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

    const scoreBoard = document.createElement('div');
    scoreBoard.className = 'score-board';
    updateScoreDisplay();
    document.querySelector('.main').insertBefore(scoreBoard, gameField);

    function initGame() {
        gameField.innerHTML = '';
        flippedCards = [];
        matchedPairs = 0;
        scores = { player1: 0, player2: 0 };
        currentPlayer = 1;
        lockBoard = false;

        updateScoreDisplay();
        // Karten mischen
        cards.sort(() => Math.random() - 0.5);

        cards.forEach((symbol) => {
            const card = document.createElement('div');
            card.classList.add('memory-card');
            card.dataset.symbol = symbol;

            // Hier nutzen wir fruitImages[symbol], um den Dateinamen zu bekommen
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
    }

    function flipCard() {
        if (lockBoard || this.classList.contains('flipped') || this.classList.contains('matched')) return;

        this.classList.add('flipped');
        flippedCards.push(this);

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
                resetTurn(true);

                if (matchedPairs === symbols.length) {
                    setTimeout(showWinPopup, 500);
                    setTimeout(startConfetti, 500);
                }
            }, 400);

            updateScoreDisplay();
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                currentPlayer = currentPlayer === 1 ? 2 : 1;
                resetTurn(false);
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
        let winner = "";
        let message = "";
        if (scores.player1 > scores.player2) {
            winner = `☆ Player 1 wins ☆`;
            message = `Final score: ${scores.player1} - ${scores.player2}`;
        } else if (scores.player2 > scores.player1) {
            winner = `☆ Player 2 wins ☆`;
            message = `Final score: ${scores.player2} - ${scores.player1}`;
        } else {
            winner = `Draw! `;
            message = `Final score: ${scores.player2} - ${scores.player1}`;
        }

        const overlay = document.getElementById("overlay");
        overlay.id = 'winOverlay';
        overlay.className = 'win-overlay';
        overlay.innerHTML = `
            <div class="win-popup">
                <h2>${winner}</h2>
                <p>${message}</p>
                <button onclick="document.getElementById('winOverlay').remove()">Show</button>
            </div>
        `;
        document.querySelector('.main').appendChild(overlay);

        overlay.style.display = "flex";
        overlay.style.minWidth = "300px";
    }

    playAgainBtn.addEventListener('click', initGame);
    initGame();
});