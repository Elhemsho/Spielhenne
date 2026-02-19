let score = 0;
let streak = 0;
let timeLeft = 60;
let timerId = null;
let gameActive = false;
let firstInput = true;
let currentAnswer = 0;
let currentMode = 'easy';
const playAgainBtn = document.getElementById('playAgainBtn');

if (playAgainBtn) {
    playAgainBtn.onclick = function () {
        resetGame();
    };
}

window.onload = () => {
    loadHighscore();
    nextQuestion();

    // Initial "Easy" im Dropdown fett markieren
    const options = document.querySelectorAll('.quiz-dropdown p');
    options.forEach(opt => {
        if (opt.getAttribute('onclick').includes('easy')) {
            opt.classList.add('active-mode');
        }
    });
};

function loadHighscore() {
    const hs = localStorage.getItem(`mathHS_${currentMode}`) || 0;
    document.getElementById('highscore-val').innerText = hs;

    // Namen für die Anzeige definieren
    const modeNames = { 'easy': 'Easy', 'medium': 'Normal', 'hard': 'Hard' };

    // Nur den Text innerhalb des <b> Tags ändern
    const modeDisplay = document.getElementById('current-mode-name');
    if (modeDisplay) {
        modeDisplay.innerText = modeNames[currentMode];
    }
}

function toggleQuizSettings(event) {
    // Verhindert, dass der Klick sofort zum window.onclick weiterwandert
    if (event) {
        event.stopPropagation();
    }
    const dropdown = document.getElementById('quizSettingsDropdown');
    dropdown.classList.toggle('show');
}

// 2. Den Klick-außerhalb-Schutz verbessern
window.addEventListener('click', function (event) {
    const dropdown = document.getElementById('quizSettingsDropdown');

    // Wir prüfen: Ist das Dropdown offen UND ist der Klick NICHT das Dropdown selbst?
    if (dropdown.classList.contains('show')) {
        // Falls der Klick nicht auf das Menü oder ein Kind des Menüs ging:
        if (!dropdown.contains(event.target)) {
            dropdown.classList.remove('show');
        }
    }
});

function changeMode(mode) {
    currentMode = mode;

    // 1. Alle "fett"-Markierungen im Dropdown entfernen
    const options = document.querySelectorAll('.quiz-dropdown p');
    options.forEach(opt => opt.classList.remove('active-mode'));

    // 2. Dem geklickten Modus die Klasse geben
    // Wir suchen das Element basierend auf dem übergebenen Modus
    options.forEach(opt => {
        if (opt.getAttribute('onclick').includes(mode)) {
            opt.classList.add('active-mode');
        }
    });

    document.getElementById('quizSettingsDropdown').classList.remove('show');
    resetGame();
}

function nextQuestion() {
    let a, b, op;
    if (currentMode === 'easy') {
        // Altes Mittel -> Plus/Minus bis 50
        a = Math.floor(Math.random() * 41) + 10;
        b = Math.floor(Math.random() * 31) + 5;
        op = Math.random() > 0.5 ? '+' : '-';
        currentAnswer = op === '+' ? a + b : a - b;
    } else if (currentMode === 'medium') {
        // Altes Schwer -> Mal-Rechnen bis 15x15
        a = Math.floor(Math.random() * 14) + 2;
        b = Math.floor(Math.random() * 14) + 2;
        op = '*';
        currentAnswer = a * b;
    } else if (currentMode === 'hard') {
        // Neues Schwer -> 3-Stellige Zahlen oder 2-Stellig mal 1-Stellig
        if (Math.random() > 0.4) {
            a = Math.floor(Math.random() * 200) + 50;
            b = Math.floor(Math.random() * 150) + 20;
            op = Math.random() > 0.5 ? '+' : '-';
            currentAnswer = op === '+' ? a + b : a - b;
        } else {
            a = Math.floor(Math.random() * 40) + 11;
            b = Math.floor(Math.random() * 12) + 3;
            op = '*';
            currentAnswer = a * b;
        }
    }
    document.getElementById('question').innerText = `${a} ${op} ${b}`;
    document.getElementById('answerInput').value = '';
}

document.getElementById('answerInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (firstInput) {
            startTimer();
            firstInput = false;
            gameActive = true;
        }

        if (!gameActive) return;

        // Sprache laden
        const currentLang = localStorage.getItem('selectedLanguage') || 'de';
        const langData = cachedData.languages[currentLang];

        let val = parseInt(e.target.value);
        const streakInfo = document.getElementById('streak-info');

        if (val === currentAnswer) {
            window.correctSound.currentTime = 0; 
            window.correctSound.volume = 0.1; 
            window.correctSound.play();
            streak++;
            score += (10 + (streak > 1 ? streak - 1 : 0));
            
            if (streak > 1) {
                // Beispiel: "Serie: 5 (+4 Bonus!)"
                streakInfo.innerText = `${langData.streak_text} ${streak} (+${streak - 1} ${langData.bonus_text})`;
            } else {
                streakInfo.innerText = langData.correct;
            }
        } else {
            window.wrongSound.currentTime = 0; 
            window.wrongSound.volume = 0.4; 
            window.wrongSound.play();
            streak = 0;
            score -= 5;
            streakInfo.innerText = langData.wrong;
        }
        
        document.getElementById('current-score').innerText = score;
        e.target.value = ""; // Input leeren nach Enter
        nextQuestion();
    }
});

function startTimer() {
    timerId = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerId);
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(timerId);

    // 1. Werte aus dem Speicher holen
    const hs = parseInt(localStorage.getItem(`mathHS_${currentMode}`)) || 0;
    const isNewHighscore = score > hs;

    console.log("Aktueller Score:", score);
    console.log("Alter Highscore:", hs);
    console.log("Neuer Rekord?:", isNewHighscore);

    // 2. Elemente im Modal suchen
    const modal = document.getElementById('result-modal');
    const resultStatsBox = document.querySelector('.result-stats');
    const labelText = document.querySelector('.result-item .label');
    const modalIcon = document.querySelector('.modal-icon');
    const finalScoreDisplay = document.getElementById('final-score-display');

    // 3. Highscore speichern, wenn er neu ist
    if (isNewHighscore) {
        localStorage.setItem(`mathHS_${currentMode}`, score);

        window.winSound.currentTime = 0;
        window.winSound.volume = 0.08;
        window.winSound.play();

        // GOLD DESIGN
        if (resultStatsBox) {
            resultStatsBox.style.backgroundColor = "#fff9e6";
            resultStatsBox.style.borderColor = "#ffcc00";
            resultStatsBox.style.boxShadow = "0 0 15px 10px rgba(255, 204, 0, 0.4)";
        }
        if (labelText) {
            labelText.innerText = "New Highscore";
            labelText.style.color = "#b8860b";
        }
        if (modalIcon) modalIcon.innerText = "⭐";
    } else {
        window.goodSound.currentTime = 0;
        window.goodSound.volume = 0.1;
        window.goodSound.play();

        // NORMALES BLAU DESIGN
        if (resultStatsBox) {
            resultStatsBox.style.backgroundColor = "#f0fbfc";
            resultStatsBox.style.borderColor = "var(--blue)";
            resultStatsBox.style.boxShadow = "none";
        }
        if (labelText) {
            labelText.innerText = "Your Score";
            labelText.style.color = "#666";
        }
        if (modalIcon) modalIcon.innerText = "🏆";
    }

    // 4. Score im Modal anzeigen und Modal öffnen
    if (finalScoreDisplay) finalScoreDisplay.innerText = score;
    if (modal) modal.classList.add('active');
}

function resetGame() {
    // 1. Timer stoppen
    clearInterval(timerId);
    timerId = null;

    // 2. Werte zurücksetzen
    score = 0;
    streak = 0;
    timeLeft = 60;
    firstInput = true;   // Wichtig: Damit der nächste Enter den Timer wieder startet
    gameActive = false;  // Spiel ist erst aktiv, wenn wieder getippt wird

    // 3. Anzeige aktualisieren
    document.getElementById('timer').innerText = "60";
    document.getElementById('current-score').innerText = "0";
    document.getElementById('streak-info').innerText = "";

    // 4. UI aufräumen
    document.getElementById('result-modal').classList.remove('active');
    document.getElementById('result-modal').style.display = 'none'; // Sicherheitshalber beides
    document.getElementById('answerInput').disabled = false;
    document.getElementById('answerInput').value = "";
    document.getElementById('answerInput').focus();

    // 5. Neue Aufgabe generieren
    nextQuestion();

    // Highscore für den aktuellen Modus sicherheitshalber neu laden
    loadHighscore();
}