document.addEventListener('DOMContentLoaded', () => {
    // --- INITIALISATION DES PARAMÈTRES URL ---
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('id');
    const playerId = params.get('playerId');
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
    let totalLegScore = startScoreArg; 
    let roundNumber = 1;
    
    let setsWon = 0;
    let legsWon = 0;
    const SETS_TO_WIN_MATCH = parseInt(params.get('sets')) || 1; 
    const LEGS_TO_WIN_SET = parseInt(params.get('legs')) || 3;

    let totalDartsCount = 0;      
    let totalDoubleAttempts = 0;  
    let totalPointsScored = 0; 

    mainScoreElement.textContent = totalLegScore;

    // --- FONCTIONS DE MATCH ---

    function updateMatchDisplay() {
        if (setDisplay) setDisplay.innerText = `Sets: ${setsWon}`;
        if (legDisplay) legDisplay.innerText = `Legs: ${legsWon}`;
    }

    function startNewLeg() {
        totalLegScore = startScoreArg;
        mainScoreElement.textContent = totalLegScore;
        roundNumber = 1;
        dartsThrownThisRound = 0;
        scoresThisRound = [0, 0, 0];
        if (historyBody) historyBody.innerHTML = '';
        scoreInputs.forEach(input => input.textContent = '-');
        resetMultipliers();
    }

    async function saveGameStats(isFinished = false) {
        const avg = totalDartsCount > 0 ? ((totalPointsScored / totalDartsCount) * 3).toFixed(2) : 0;
        
        const totalLegsCompleted = (setsWon * LEGS_TO_WIN_SET) + legsWon;
        const checkoutRate = totalDoubleAttempts > 0 
            ? ((totalLegsCompleted / totalDoubleAttempts) * 100).toFixed(2) 
            : 0;

        const statsPayload = {
            status: isFinished ? "FINISHED" : "IN_PROGRESS",
            winner: isFinished ? savedNickname : null,
            totalDarts: totalDartsCount,
            totalAttempts: totalDoubleAttempts,
            checkoutRate: checkoutRate,
            average: parseFloat(avg)
        };

        try {
            await fetch(`/api/games/${gameId}/finish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(statsPayload)
            });
        } catch (err) {
            console.error("Erreur stats:", err);
        }
    }

    function handleLegWin() {
        legsWon++;

        if (legsWon >= LEGS_TO_WIN_SET) {
            setsWon++;
            legsWon = 0;
        }

        updateMatchDisplay();
        
        if (setsWon >= SETS_TO_WIN_MATCH) {
       
            saveGameStats(true); 
        
            setTimeout(() => {
                showFinalStats();
            }, 500);

        } else {
            console.log("Leg terminé. Préparation du suivant...");
            
            saveGameStats(false); 
            
            setTimeout(() => {
                alert("Leg terminé ! Préparez-vous pour le suivant.");
                startNewLeg();
            }, 1000);
        }
    }

    async function completeRound(exactCount = 3) {
        const totalRound = scoresThisRound.reduce((a, b) => a + b, 0);
        

        const turnData = {
            gameId: parseInt(gameId),
            legId: 1, 
            playerId: parseInt(playerId),
            points: totalRound,
            dartsThrown: exactCount,
            remaining: totalLegScore,
            isBust: (totalLegScore === (totalLegScore + totalRound)) && totalRound === 0 
        };

        try {
            const response = await fetch('/api/games/turn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(turnData)
            });

            if (!response.ok) {
                console.error("Erreur lors de l'enregistrement en base de données");
            }
        } catch (err) {
            console.error("Erreur réseau (Prisma non atteint):", err);
        }

        totalDartsCount += exactCount;

        const row = `<tr>
            <td>T${roundNumber}</td>
            <td>${scoresThisRound[0]}</td>
            <td>${scoresThisRound[1]}</td>
            <td>${scoresThisRound[2]}</td>
            <td><strong>${totalRound}</strong></td>
            <td>${totalLegScore}</td>
        </tr>`;
        
        if (historyBody) {
            historyBody.insertAdjacentHTML('afterbegin', row);
        }

        roundNumber++;
        dartsThrownThisRound = 0;
        scoresThisRound = [0, 0, 0];
        
        scoreInputs.forEach(input => input.textContent = '-');
        resetMultipliers();
    }

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

    function showFinalStats() {
        const avg = totalDartsCount > 0 ? ((totalPointsScored / totalDartsCount) * 3).toFixed(2) : "0.00";
        
        const totalLegsCompleted = (setsWon * LEGS_TO_WIN_SET) + legsWon;
        const checkoutRate = totalDoubleAttempts > 0 
            ? ((totalLegsCompleted / totalDoubleAttempts) * 100).toFixed(2) 
            : "0.00";

        const winnerNameElement = document.getElementById('final-winner-name');
        const statAvgElement = document.getElementById('stat-avg');
        const statDartsElement = document.getElementById('stat-darts');
        const statCheckoutElement = document.getElementById('stat-checkout');
        const overlay = document.getElementById('stats-summary-overlay');

        if (winnerNameElement) winnerNameElement.innerText = savedNickname;
        if (statAvgElement) statAvgElement.innerText = avg;
        if (statDartsElement) statDartsElement.innerText = totalDartsCount;
        if (statCheckoutElement) statCheckoutElement.innerText = `${checkoutRate}%`;

        if (overlay) {
            overlay.style.display = 'flex';
        }

        const homeBtn = document.getElementById('btn-back-home');
        if (homeBtn) {
            homeBtn.onclick = () => {
                window.location.href = '/stats';
            };
        }
    }

    // --- ÉCOUTEURS ---

    doubleBtn.addEventListener('click', () => {
        if (currentMultiplier === 2) {
            resetMultipliers();
        } else {
            resetMultipliers();
            currentMultiplier = 2;
            doubleBtn.classList.add('active');
        }
    });

    tripleBtn.addEventListener('click', () => {
        if (currentMultiplier === 3) {
            resetMultipliers();
        } else {
            resetMultipliers();
            currentMultiplier = 3;
            tripleBtn.classList.add('active');
        }
    });

    numButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (dartsThrownThisRound >= 3) return;
            const val = parseInt(btn.textContent);
            
            if (val === 25 && currentMultiplier === 3) {
                resetMultipliers();
                return;
            }

            const points = val * currentMultiplier;
            const potential = totalLegScore - points;

            if (potential < 0 || potential === 1) {
                const remainingDarts = 3 - dartsThrownThisRound;
                for(let i=0; i < remainingDarts; i++) {
                    recordDart(0);
                }
                completeRound(3);
            } else {
                totalLegScore = potential;
                mainScoreElement.textContent = totalLegScore;
                recordDart(points);
                
                if (totalLegScore === 0) {
                    setTimeout(() => modal.style.display = 'block', 300);
                }
            }
            resetMultipliers();
        });
    });


    if (noScoreBtn) {
        noScoreBtn.addEventListener('click', () => {
            if (dartsThrownThisRound < 3) {
                recordDart(0);
                if (dartsThrownThisRound === 3) completeRound(3);
            }
            resetMultipliers();
        });
    }

    validateBtn.addEventListener('click', () => {
        if (dartsThrownThisRound === 0) return;

        if (totalLegScore <= 170 && totalLegScore > 0) {
            modal.style.display = 'block';
        } else if (totalLegScore > 0) {
            completeRound(dartsThrownThisRound);
        }
    });


    dartsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(dartsForm);
        const doublesAttempted = parseInt(fd.get('checkoutDouble')) || 0;
        const exactDarts = parseInt(fd.get('dartsCount')) || dartsThrownThisRound;

        totalDoubleAttempts += doublesAttempted;
        modal.style.display = 'none';
        
        const isLegOver = (totalLegScore === 0);
        
        completeRound(exactDarts); 

        if (isLegOver) {
            handleLegWin();
        }
        dartsForm.reset();
    });

    updateMatchDisplay();
});