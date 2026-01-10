document.addEventListener('DOMContentLoaded', () => {
    // --- INITIALISATION DES PARAMÈTRES URL ---
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('id');

    // --- SÉLECTEURS ---
    const playerNameElement = document.getElementById('current-player-name');
    const mainScoreElement = document.getElementById('main-score');
    const scoreInputs = document.querySelectorAll('.score-input');
    const retourButtons = document.querySelectorAll('.score-comeback');
    const numButtons = document.querySelectorAll('.container-num .num');
    const doubleBtn = document.getElementById('double');
    const tripleBtn = document.getElementById('triple');
    const validateBtn = document.getElementById('validate-button');
    const noScoreBtn = document.getElementById('btn-no-score');
    const historyBody = document.getElementById('history-body');
    const dartsForm = document.getElementById('dartsForm');
    const modal = document.getElementById('dartsModal');
    const setDisplay = document.getElementById('set-count');
    const legDisplay = document.getElementById('leg-count');

    // --- VARIABLES D'ÉTAT ---
    const savedNickname = localStorage.getItem('currentPlayerNickname') || "Joueur 1";
    playerNameElement.textContent = savedNickname;

    let currentMultiplier = 1;
    let dartsThrownThisRound = 0;
    let scoresThisRound = [0, 0, 0];
    let totalLegScore = 501; 
    let roundNumber = 1;
    
    let setsWon = 0;
    let legsWon = 0;
    const SETS_TO_WIN_MATCH = parseInt(params.get('sets')) || 1; 
    const LEGS_TO_WIN_SET = parseInt(params.get('legs')) || 1;

    let totalDartsCount = 0;      
    let totalDoubleAttempts = 0;  
    let totalPointsScored = 0; 

    // --- FONCTIONS DE MATCH ---

    function updateMatchDisplay() {
        if (setDisplay) setDisplay.innerText = `Sets: ${setsWon}`;
        if (legDisplay) legDisplay.innerText = `Legs: ${legsWon}`;
    }

    function startNewLeg() {
        totalLegScore = 501;
        mainScoreElement.textContent = "501";
        roundNumber = 1;
        dartsThrownThisRound = 0;
        scoresThisRound = [0, 0, 0];
        if (historyBody) historyBody.innerHTML = '';
        scoreInputs.forEach(input => input.textContent = '-');
        resetMultipliers();
    }

    async function saveGameStats() {
        const avg = totalDartsCount > 0 ? ((totalPointsScored / totalDartsCount) * 3).toFixed(2) : 0;
        const checkoutRate = totalDoubleAttempts > 0 
            ? (((setsWon * LEGS_TO_WIN_SET) + legsWon) / totalDoubleAttempts * 100).toFixed(2) 
            : 0;

        const statsPayload = {
            gameId: gameId,
            winner: savedNickname,
            totalDarts: totalDartsCount,
            totalAttempts: totalDoubleAttempts,
            checkoutRate: checkoutRate,
            average: avg
        };

        try {
            const response = await fetch(`/api/games/${gameId}/finish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(statsPayload)
            });
            if (response.ok) console.log("Stats enregistrées !");
        } catch (err) {
            console.error("Erreur stats:", err);
        }
    }

    function showFinalStats() {
        const avg = totalDartsCount > 0 ? ((totalPointsScored / totalDartsCount) * 3).toFixed(2) : 0;
        const checkoutRate = totalDoubleAttempts > 0 
            ? Math.round(((setsWon * LEGS_TO_WIN_SET) / totalDoubleAttempts) * 100) 
            : 0;

        document.getElementById('final-winner-name').innerText = savedNickname;
        document.getElementById('stat-avg').innerText = avg;
        document.getElementById('stat-checkout').innerText = checkoutRate + "%";
        document.getElementById('stat-darts').innerText = totalDartsCount;
        document.getElementById('stat-score').innerText = `${setsWon} Sets - ${legsWon} Legs`;

        document.getElementById('stats-summary-overlay').style.display = 'flex';
    }

    // CORRECTION : Cette logique doit être DANS une fonction
    function handleLegWin() {
        legsWon++;
        
        if (legsWon === LEGS_TO_WIN_SET) {
            setsWon++;
            legsWon = 0;
            if (setsWon < SETS_TO_WIN_MATCH) alert(`🏆 SET REMPORTÉ ! (${setsWon}/${SETS_TO_WIN_MATCH})`);
        } else {
            alert(`🎯 LEG REMPORTÉ ! (${legsWon}/${LEGS_TO_WIN_SET})`);
        }

        updateMatchDisplay();
        
        if (setsWon === SETS_TO_WIN_MATCH) {
            saveGameStats(); 
            showFinalStats(); 
        } else {
            startNewLeg();
        }
    }

    // --- FONCTIONS TECHNIQUES ---

    function resetMultipliers() {
        currentMultiplier = 1;
        doubleBtn.classList.remove('active');
        tripleBtn.classList.remove('active');
    }

    function recordDart(points) {
        scoresThisRound[dartsThrownThisRound] = points;
        scoreInputs[dartsThrownThisRound].textContent = points;
        dartsThrownThisRound++;
        totalPointsScored += points; 
    }

    function completeRound() {
        const totalRound = scoresThisRound.reduce((a, b) => a + b, 0);
        const row = `<tr>
            <td>${roundNumber}</td>
            <td>${scoresThisRound[0]}</td>
            <td>${scoresThisRound[1]}</td>
            <td>${scoresThisRound[2]}</td>
            <td><strong>${totalRound}</strong></td>
        </tr>`;
        historyBody.insertAdjacentHTML('afterbegin', row);

        roundNumber++;
        dartsThrownThisRound = 0;
        scoresThisRound = [0, 0, 0];
        scoreInputs.forEach(input => input.textContent = '-');
        resetMultipliers();
    }

    function openModal() {
        modal.style.display = 'block';
        const modalTitle = document.getElementById('modal-title');
        modalTitle.innerText = (totalLegScore === 0) ? "🎯 Leg Terminé !" : "Statistiques de Checkout";
    }

    // --- ÉCOUTEURS ---

    [doubleBtn, tripleBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            const val = (btn.id === 'double') ? 2 : 3;
            if (btn.classList.contains('active')) {
                resetMultipliers();
            } else {
                resetMultipliers();
                btn.classList.add('active');
                currentMultiplier = val;
            }
        });
    });

    numButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (dartsThrownThisRound >= 3) return;
            const val = parseInt(btn.textContent);
            if (!isNaN(val)) {
                const points = val * currentMultiplier;
                const potential = totalLegScore - points;

                if (potential < 0 || potential === 1) {
                    recordDart(0); // BUST
                } else {
                    totalLegScore = potential;
                    mainScoreElement.textContent = totalLegScore;
                    recordDart(points);
                }
                resetMultipliers();
            }
        });
    });

    noScoreBtn.addEventListener('click', () => {
        if (dartsThrownThisRound < 3) recordDart(0);
    });

    retourButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (dartsThrownThisRound > 0 && index === dartsThrownThisRound - 1) {
                const pointsRemoved = scoresThisRound[index];
                totalLegScore += pointsRemoved;
                totalPointsScored -= pointsRemoved;
                mainScoreElement.textContent = totalLegScore;
                scoreInputs[index].textContent = '-';
                scoresThisRound[index] = 0;
                dartsThrownThisRound--;
            }
        });
    });

    validateBtn.addEventListener('click', () => {
        if (dartsThrownThisRound === 0) return;
        const scoreTotalTour = scoresThisRound.reduce((a, b) => a + b, 0);
        const scoreAuDebutDuTour = totalLegScore + scoreTotalTour;

        if (scoreAuDebutDuTour <= 170 || totalLegScore === 0) {
            openModal();
        } else {
            totalDartsCount += dartsThrownThisRound; 
            completeRound();
        }
    });

    dartsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const doublesAttempted = parseInt(document.querySelector('input[name="checkoutDouble"]:checked').value);
        const dartsInThisRound = parseInt(document.querySelector('input[name="dartsCount"]:checked').value);

        totalDartsCount += dartsInThisRound;
        totalDoubleAttempts += doublesAttempted;

        modal.style.display = 'none';
        const isLegOver = (totalLegScore === 0);
        completeRound();

        if (isLegOver) handleLegWin();
        e.target.reset();
    });
    
    updateMatchDisplay();
});