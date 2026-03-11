/* ------------------------------------ Kniffel Logik ------------------------------------ */
let currentDice = [0, 0, 0, 0, 0];
let rollsLeft = 3;
let currentPlayer = 1;

function rollDice() {
    if (rollsLeft > 0) {
        window.diceSound.volume = 0.05;
        playSound(window.diceSound);
        const diceElements = document.querySelectorAll('.die');
        diceElements.forEach(die => {
            if (!die.classList.contains('held')) {
                die.classList.add('shaking');
            }
        });

        setTimeout(() => {
            diceElements.forEach((die, index) => {
                if (!die.classList.contains('held')) {
                    die.classList.remove('shaking');
                    die.classList.remove('is-question');
                    const newValue = Math.floor(Math.random() * 6) + 1;
                    die.innerText = newValue;
                    currentDice[index] = newValue;
                } else {
                    currentDice[index] = parseInt(die.innerText);
                }
            });

            const counts = {};
                currentDice.forEach(x => { counts[x] = (counts[x] || 0) + 1; });
                if (Object.values(counts).includes(5)) {
                    window.correctSound.volume = 0.1;
                    playSound(window.correctSound);
                }

            rollsLeft--;
            document.getElementById('rollCount').innerText = 3 - rollsLeft;

            if (rollsLeft === 0) {
                document.getElementById('rollBtn').disabled = true;
            }
            document.querySelector('.game-field').classList.add('can-score');
        }, 400);
    }
}

// Event Listener für Würfel (nur einmal definieren!)
document.querySelectorAll('.die').forEach(die => {
    die.addEventListener('click', function () {
        if (rollsLeft < 3) {
            this.classList.toggle('held');

            window.clickSound.volume = 0.05;
            playSound(window.clickSound);
        }
    });
});

function resetTurn() {
    rollsLeft = 3;
    const btn = document.getElementById('rollBtn');
    if (btn) btn.disabled = false;

    document.getElementById('rollCount').innerText = "0";

    document.querySelectorAll('.die').forEach(die => {
        die.classList.remove('held');
        die.innerText = "?";
        die.classList.add('is-question');
    });

    currentDice = [0, 0, 0, 0, 0];
    const field = document.querySelector('.game-field');
    if (field) field.classList.remove('can-score');
}

function tSaveYazyState() {
    if (!new URLSearchParams(window.location.search).get('tournament')) return;
    const fields = {};
    document.querySelectorAll('.score-val').forEach(el => {
        fields[el.id] = { text: el.innerText, filled: el.classList.contains('filled') };
    });
    sessionStorage.setItem('t_game_snapshot', JSON.stringify({
        fields,
        currentDice,
        rollsLeft,
        currentPlayer,
        rollCount: document.getElementById('rollCount')?.innerText
    }));
}

function writeScore(id, value) {
    if (!id.startsWith('p' + currentPlayer)) {
        alert("Spieler " + (currentPlayer === 1 ? "1" : "2") + " ist gerade dran! Du hast in das falsche Feld geklickt.");
        return;
    }

    if (rollsLeft === 3) return;

    const target = document.getElementById(id);
    if (target && (target.innerText === "-" || target.innerText === "")) {
        let points = 0;
        currentDice.forEach(die => {
            if (die === value) points += value;
        });

        target.innerText = points;
        target.classList.add("filled");

        window.click2Sound.volume = 0.1;
        playSound(window.click2Sound);

        updateTotalScore();
        tSaveYazyState();
        checkGameOver();
        nextPlayer();
    }
}

function writeSpecial(id, type) {
    if (!id.startsWith('p' + currentPlayer)) {
        alert("Spieler " + (currentPlayer === 1 ? "1" : "2") + " ist gerade dran!");
        return;
    }

    if (rollsLeft === 3) return;

    const target = document.getElementById(id);
    if (!target || (target.innerText !== "-" && target.innerText !== "")) return;

    let points = 0;
    const sumAll = currentDice.reduce((a, b) => a + b, 0);
    const counts = {};
    currentDice.forEach(x => { counts[x] = (counts[x] || 0) + 1; });
    const values = Object.values(counts);
    const uniqueDice = [...new Set(currentDice)].sort((a, b) => a - b);

    switch (type) {
        case '3pasch': if (values.some(v => v >= 3)) points = sumAll; break;
        case '4pasch': if (values.some(v => v >= 4)) points = sumAll; break;
        case 'fullhouse': if (values.includes(3) && values.includes(2)) points = 25; break;
        case 'klstr':
            const strKl = uniqueDice.join("");
            if (/1234|2345|3456/.test(strKl)) points = 30;
            break;
        case 'grstr':
            const strGr = uniqueDice.join("");
            if (strGr === "12345" || strGr === "23456") points = 40;
            break;
        case 'kniffel': if (values.includes(5)) points = 50; break;
        case 'chance': points = sumAll; break;
    }

    target.innerText = points;
    target.classList.add("filled");

    window.click2Sound.volume = 0.1;
    playSound(window.click2Sound);

    updateTotalScore();
    tSaveYazyState();
    checkGameOver();
    nextPlayer();
}

function updateTotalScore() {
    const p = currentPlayer;
    const upperFields = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixs'];
    let upperSum = 0;

    upperFields.forEach(field => {
        const val = document.getElementById('p' + p + '-' + field);
        if (val && val.classList.contains('filled')) {
            upperSum += parseInt(val.innerText) || 0;
        }
    });

    const bonusField = document.getElementById('p' + p + '-bonus');
    let bonus = 0;
    if (upperSum >= 63) {
        bonus = 35;
        if (bonusField) bonusField.innerText = "35";
    } else if (bonusField) {
        bonusField.innerText = "0";
    }

    const allUpperFilled = upperFields.every(field => {
        const el = document.getElementById('p' + p + '-' + field);
        return el && el.classList.contains('filled');
    });

    const bonusRow = document.querySelector('.player' + p + ' .score-row:has(#p' + p + '-bonus)');
    if (bonusRow && allUpperFilled) {
        bonusRow.querySelector('span:first-child').style.opacity = '0.5';
    } else if (bonusRow) {
        bonusRow.querySelector('span:first-child').style.opacity = '1';
    }

    const allFilled = document.querySelectorAll('.player' + p + ' .score-val.filled');
    let total = 0;
    allFilled.forEach(s => {
        total += parseInt(s.innerText) || 0;
    });

    const totalDisplay = document.getElementById('p' + p + '-total');
    if (totalDisplay) totalDisplay.innerText = total + bonus;
}

function nextPlayer() {
    checkGameOver();

    currentPlayer = (currentPlayer === 1) ? 2 : 1;

    const p1Table = document.querySelector('.player1');
    const p2Table = document.querySelector('.player2');

    if (currentPlayer === 1) {
        p1Table.classList.add('active-player');
        p2Table.classList.remove('active-player');
    } else {
        p2Table.classList.add('active-player');
        p1Table.classList.remove('active-player');
    }

    resetTurn();
}

function resetGame() {
    const allScores = document.querySelectorAll('.score-val');
    allScores.forEach(field => {
        field.innerText = "-";
        field.classList.remove('filled');
    });

    document.getElementById('p1-bonus').innerText = "0";
    document.getElementById('p2-bonus').innerText = "0";
    document.getElementById('p1-total').innerText = "0";
    document.getElementById('p2-total').innerText = "0";

    currentDice = [0, 0, 0, 0, 0];
    const diceElements = document.querySelectorAll('.die');
    diceElements.forEach(die => {
        die.innerText = "?";
        die.classList.remove('held');
        die.classList.add('is-question');
    });

    [1, 2].forEach(p => {
        const bonusRow = document.querySelector('.player' + p + ' .score-row:has(#p' + p + '-bonus)');
        if (bonusRow) bonusRow.querySelector('span:first-child').style.opacity = '1';
    });

    rollsLeft = 3;
    document.getElementById('rollCount').innerText = "0";
    document.getElementById('rollBtn').disabled = false;

    currentPlayer = 1;
    document.querySelector('.player1').classList.add('active-player');
    document.querySelector('.player2').classList.remove('active-player');

    document.querySelector('.game-field').classList.remove('can-score');

    // Snapshot löschen beim Reset
    sessionStorage.removeItem('t_game_snapshot');

    console.log("Spiel wurde zurückgesetzt!");
}

document.getElementById('playAgainBtn').addEventListener('click', resetGame);

function checkGameOver() {
    const allScoreFields = document.querySelectorAll('.score-val');

    let emptyFields = 0;
    allScoreFields.forEach(field => {
        if (!field.id.includes('bonus') && field.innerText === "-") {
            emptyFields++;
        }
    });

    console.log("Noch offene Felder:", emptyFields);

    if (emptyFields === 0) {
        showWinner();
    }
}

function showWinner() {
    window.winSound.volume = 0.05;
    playSound(window.winSound);

    const currentLang = localStorage.getItem('selectedLanguage') || 'de';
    const langData = window.cachedData?.languages?.[currentLang];

    const score1 = parseInt(document.getElementById('p1-total').innerText) || 0;
    const score2 = parseInt(document.getElementById('p2-total').innerText) || 0;
    const diff = Math.abs(score1 - score2);

    const winnerText = document.getElementById('winner-text');
    const winnerScore = document.getElementById('winner-score');
    const popup = document.getElementById('winner-popup');
    const winnerContent = document.querySelector('.winner-content');

    const diffLabel = langData?.points_diff || "Difference:";
    const pointsLabel = langData?.points_label || "Points";
    const bothLabel = langData?.both_points || "Both scored";

    if (score1 > score2) {
        const p1wins = langData?.player_wins?.replace('{n}', '1') || "☆ Player 1 wins! ☆";
        winnerText.innerText = p1wins;
        winnerScore.innerText = `${diffLabel} ${diff} ${pointsLabel}`;
        if (winnerContent) winnerContent.style.width = "380px";
    } else if (score2 > score1) {
        const p2wins = langData?.player_wins?.replace('{n}', '2') || "☆ Player 2 wins! ☆";
        winnerText.innerText = p2wins;
        winnerScore.innerText = `${diffLabel} ${diff} ${pointsLabel}`;
        if (winnerContent) winnerContent.style.width = "380px";
    } else {
        winnerText.innerText = langData?.draw_result || "Draw!";
        winnerScore.innerText = `${bothLabel} ${score1} ${pointsLabel}`;
        if (winnerContent) winnerContent.style.width = "260px";
    }

    if (popup) popup.classList.add('show');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('winner-close').addEventListener('click', () => {
        document.getElementById('winner-popup').classList.remove('show');
        document.getElementById('rollBtn').disabled = true;
    });

    document.getElementById('winner-play-again').addEventListener('click', () => {
        document.getElementById('winner-popup').classList.remove('show');
        resetGame();
    });

    // Turnier-Snapshot wiederherstellen
    (function tRestoreYazyState() {
        if (!new URLSearchParams(window.location.search).get('tournament')) return;
        const raw = sessionStorage.getItem('t_game_snapshot');
        if (!raw) return;
        try {
            const s = JSON.parse(raw);
            // Score-Felder wiederherstellen
            Object.entries(s.fields).forEach(([id, val]) => {
                const el = document.getElementById(id);
                if (el) {
                    el.innerText = val.text;
                    if (val.filled) el.classList.add('filled');
                    else el.classList.remove('filled');
                }
            });
            // Würfel wiederherstellen
            currentDice = s.currentDice;
            rollsLeft = s.rollsLeft;
            currentPlayer = s.currentPlayer;
            document.querySelectorAll('.die').forEach((die, i) => {
                if (currentDice[i] && currentDice[i] !== 0) {
                    die.innerText = currentDice[i];
                    die.classList.remove('is-question');
                }
            });
            if (document.getElementById('rollCount')) {
                document.getElementById('rollCount').innerText = s.rollCount;
            }
            if (rollsLeft === 0) document.getElementById('rollBtn').disabled = true;
            // Aktiven Spieler setzen
            document.querySelector('.player1')?.classList.toggle('active-player', currentPlayer === 1);
            document.querySelector('.player2')?.classList.toggle('active-player', currentPlayer === 2);
            // can-score wiederherstellen falls Würfel geworfen wurden
            if (rollsLeft < 3) {
                document.querySelector('.game-field')?.classList.add('can-score');
            }
        } catch(e) { console.warn('Yazy restore error:', e); }
    })();
});