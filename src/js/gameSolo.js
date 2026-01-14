document.addEventListener('DOMContentLoaded', () => {
    // --- INITIALISATION DES PARAMÈTRES URL ---
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('id');
    const playerId = params.get('playerId');
    let currentLegId = params.get('legId');
    const startScoreArg = parseInt(params.get('startScore')) || 501;

    // --- SÉLECTEURS ---
    const playerNameElement = document.getElementById('current-player-name-solo');
    const mainScoreElement = document.getElementById('main-score');
    const scoreInputs = document.querySelectorAll('.score-input');
    const numButtons = document.querySelectorAll('.container-num .num');
    const doubleBtn = document.getElementById('double');
    const tripleBtn = document.getElementById('triple');
    const validateBtn = document.getElementById('validate-button');
    const noScoreBtn = document.getElementById('btn-no-score');
    const undoButtons = document.querySelectorAll('.score-comeback');
    const historyBody = document.getElementById('history-body');
    const dartsForm = document.getElementById('dartsForm');
    const modal = document.getElementById('dartsModal');
    const setDisplay = document.getElementById('set-count-solo');
    const legDisplay = document.getElementById('leg-count-solo');

    // --- VARIABLES D'ÉTAT ---
    const savedNickname = localStorage.getItem('player1_name') || "Joueur Solo";
    if (playerNameElement) playerNameElement.textContent = savedNickname;

    let currentMultiplier = 1;
    let dartsThrownThisRound = 0;
    let scoresThisRound = [0, 0, 0];
    let dartsDetailThisRound = [
        { value: 0, multiplier: 1 }, { value: 0, multiplier: 1 }, { value: 0, multiplier: 1 }
    ];

    let totalLegScore = startScoreArg; 
    let roundNumber = 1;
    let setsWon = 0;
    let legsWon = 0;

    const SETS_TO_WIN_MATCH = parseInt(params.get('sets')) || 1; 
    const LEGS_TO_WIN_SET = parseInt(params.get('legs')) || 3;

    mainScoreElement.textContent = totalLegScore;

    // --- FONCTIONS DE MATCH ---

    function updateMatchDisplay() {
        if (setDisplay) setDisplay.innerText = `Sets: ${setsWon}`;
        if (legDisplay) legDisplay.innerText = `Legs: ${legsWon}`;
    }

    function renderHistoryRow(totalRound) {
        const row = `<tr>
            <td>T${roundNumber}</td>
            <td>${scoresThisRound[0]}</td>
            <td>${scoresThisRound[1]}</td>
            <td>${scoresThisRound[2]}</td>
            <td><strong>${totalRound}</strong></td>
            <td>${totalLegScore}</td>
        </tr>`;
        if (historyBody) historyBody.insertAdjacentHTML('afterbegin', row);
    }

    function resetMultipliers() {
        currentMultiplier = 1;
        doubleBtn.classList.remove('active');
        tripleBtn.classList.remove('active');
    }

    function startNewLeg() {
        totalLegScore = startScoreArg;
        mainScoreElement.textContent = totalLegScore;
        roundNumber = 1;
        dartsThrownThisRound = 0;
        scoresThisRound = [0, 0, 0];
        dartsDetailThisRound = [{value:0,multiplier:1},{value:0,multiplier:1},{value:0,multiplier:1}];
        if (historyBody) historyBody.innerHTML = '';
        scoreInputs.forEach(input => input.textContent = '-');
        resetMultipliers();
    }

    async function completeRound(exactCount = 3, isBust = false) {
        const totalRound = scoresThisRound.reduce((a, b) => a + b, 0);

        if (!currentLegId || currentLegId == 0) {
            alert("Erreur: legId manquant.");
            return;
        }

        const turnData = {
            legId: parseInt(currentLegId),
            playerId: parseInt(playerId),
            dart1: dartsDetailThisRound[0].value,
            multiplier1: dartsDetailThisRound[0].multiplier,
            dart2: dartsDetailThisRound[1].value,
            multiplier2: dartsDetailThisRound[1].multiplier,
            dart3: dartsDetailThisRound[2].value,
            multiplier3: dartsDetailThisRound[2].multiplier,
            points: totalRound,
            dartsThrown: exactCount,
            remaining: totalLegScore,
            isBust: isBust
        };

        try {
            await fetch('/api/games/turn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(turnData)
            });
        } catch (err) {
            console.error("Erreur API:", err);
        }

        renderHistoryRow(totalRound);
        roundNumber++;
        dartsThrownThisRound = 0;
        scoresThisRound = [0, 0, 0];
        dartsDetailThisRound = [{value:0,multiplier:1},{value:0,multiplier:1},{value:0,multiplier:1}];
        scoreInputs.forEach(input => input.textContent = '-');
        resetMultipliers();
    }

    function recordDart(points, val = 0, mult = 1) {
        scoresThisRound[dartsThrownThisRound] = points;
        dartsDetailThisRound[dartsThrownThisRound] = { value: val, multiplier: mult };
        scoreInputs[dartsThrownThisRound].textContent = points;
        dartsThrownThisRound++;
    }

    function undoLastDart() {
        if (dartsThrownThisRound === 0) return;
        dartsThrownThisRound--;
        const pointsRemoved = scoresThisRound[dartsThrownThisRound];
        totalLegScore += pointsRemoved;
        mainScoreElement.textContent = totalLegScore;
        scoresThisRound[dartsThrownThisRound] = 0;
        dartsDetailThisRound[dartsThrownThisRound] = { value: 0, multiplier: 1 };
        scoreInputs[dartsThrownThisRound].textContent = '-';
        resetMultipliers();
    }

    // --- ÉCOUTEURS ---

    doubleBtn.addEventListener('click', () => {
        const isActive = doubleBtn.classList.contains('active');
        resetMultipliers();
        if (!isActive) {
            currentMultiplier = 2;
            doubleBtn.classList.add('active');
        }
    });

    tripleBtn.addEventListener('click', () => {
        const isActive = tripleBtn.classList.contains('active');
        resetMultipliers();
        if (!isActive) {
            currentMultiplier = 3;
            tripleBtn.classList.add('active');
        }
    });

    undoButtons.forEach(btn => btn.addEventListener('click', undoLastDart));

    numButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (dartsThrownThisRound >= 3) return;
            const val = parseInt(btn.textContent);
            if (val === 25 && currentMultiplier === 3) return resetMultipliers();

            const points = val * currentMultiplier;
            const potential = totalLegScore - points;

            if (potential < 0 || potential === 1) {
                while (dartsThrownThisRound < 3) recordDart(0, 0, 1);
                alert("BUST ! Validez le tour.");
            } else {
                totalLegScore = potential;
                mainScoreElement.textContent = totalLegScore;
                recordDart(points, val, currentMultiplier);
                
                if (totalLegScore === 0) {
                    setTimeout(() => modal.style.display = 'block', 300);
                }
            }
            resetMultipliers();
        });
    });

    noScoreBtn.addEventListener('click', () => {
        if (dartsThrownThisRound < 3) {
            recordDart(0, 0, 1);
            resetMultipliers();
        }
    });

    /**
     * ACTION SUR LE BOUTON VALIDER
     */
    validateBtn.addEventListener('click', async () => {
        if (dartsThrownThisRound === 0) return;

        const isBust = (scoresThisRound.every(s => s === 0) && totalLegScore > 0);
        
        if (totalLegScore <= 170 && !isBust && modal.style.display !== 'block') {
            modal.style.display = 'block';
            return;
        }

        await completeRound(dartsThrownThisRound, isBust);
    });

    dartsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(dartsForm);
        const exactDarts = parseInt(fd.get('dartsCount')) || dartsThrownThisRound;
        const isWinner = (totalLegScore === 0);
        
        modal.style.display = 'none';
        
        await completeRound(exactDarts, false); 

        if (isWinner) {
            handleLegWin();
        }
        dartsForm.reset();
    });

    function handleLegWin() {
        legsWon++;
        if (legsWon >= LEGS_TO_WIN_SET) { setsWon++; legsWon = 0; }
        updateMatchDisplay();
        if (setsWon >= SETS_TO_WIN_MATCH) {
            saveGameStats(true); 
            setTimeout(showFinalStats, 500);
        } else {
            saveGameStats(false);
            setTimeout(() => { alert("Leg gagné !"); startNewLeg(); }, 500);
        }
    }

    async function saveGameStats(isFinished = false) {
        try {
            await fetch(`/api/games/${gameId}/finish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: isFinished ? "FINISHED" : "IN_PROGRESS" })
            });
        } catch (err) { console.error(err); }
    }

    function showFinalStats() {
        document.getElementById('stats-summary-overlay').style.display = 'flex';
        document.getElementById('btn-back-home').onclick = () => window.location.href = '/';
    }

    updateMatchDisplay();
});