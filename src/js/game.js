document.addEventListener('DOMContentLoaded', () => {
    // --- SÉLECTEURS ---
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

    // --- VARIABLES D'ÉTAT ---
    let currentMultiplier = 1;
    let dartsThrownThisRound = 0;
    let scoresThisRound = [0, 0, 0];
    let totalLegScore = parseInt(mainScoreElement.textContent);
    let roundNumber = 1;

    // --- FONCTIONS UTILES ---

    function resetMultipliers() {
        currentMultiplier = 1;
        doubleBtn.classList.remove('active');
        tripleBtn.classList.remove('active');
    }

    function recordDart(points) {
        scoresThisRound[dartsThrownThisRound] = points;
        scoreInputs[dartsThrownThisRound].textContent = points;
        dartsThrownThisRound++;
    }

    function completeRound() {
        const totalRound = scoresThisRound.reduce((a, b) => a + b, 0);
        
        // Ajout à la table HTML
        const row = `<tr>
            <td>${roundNumber}</td>
            <td>${scoresThisRound[0]}</td>
            <td>${scoresThisRound[1]}</td>
            <td>${scoresThisRound[2]}</td>
            <td><strong>${totalRound}</strong></td>
        </tr>`;
        historyBody.insertAdjacentHTML('afterbegin', row);

        // Reset pour le prochain tour
        roundNumber++;
        dartsThrownThisRound = 0;
        scoresThisRound = [0, 0, 0];
        scoreInputs.forEach(input => input.textContent = '-');
        resetMultipliers();
    }

    function openModal() {
        // On s'assure que la modale est visible
        modal.style.display = 'block';

        const groupDarts = document.getElementById('group-darts-thrown');
        
        // Si on a fini le leg (score à 0)
        if (totalLegScore === 0) {
            document.getElementById('modal-title').innerText = "🎯 Leg Terminé !";
            groupDarts.style.display = 'block'; // On montre les deux questions
        } else {
            document.getElementById('modal-title').innerText = "Statistiques de Checkout";
            groupDarts.style.display = 'block'; // Tu as dit vouloir TOUJOURS les deux
        }
    }

    // --- ÉCOUTEURS D'ÉVÉNEMENTS ---

    // Multiplicateurs
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

    // Chiffres
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

    // Miss
    noScoreBtn.addEventListener('click', () => {
        if (dartsThrownThisRound < 3) recordDart(0);
    });

    // Retours individuels
    retourButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (dartsThrownThisRound > 0 && index === dartsThrownThisRound - 1) {
                totalLegScore += scoresThisRound[index];
                mainScoreElement.textContent = totalLegScore;
                scoreInputs[index].textContent = '-';
                scoresThisRound[index] = 0;
                dartsThrownThisRound--;
            }
        });
    });

    // Validation du tour
    validateBtn.addEventListener('click', () => {
        if (dartsThrownThisRound === 0) return;

        const scoreTotalTour = scoresThisRound.reduce((a, b) => a + b, 0);
        const scoreAuDebutDuTour = totalLegScore + scoreTotalTour;

        // Modale si zone de checkout ou fini
        if (scoreAuDebutDuTour <= 170 || totalLegScore === 0) {
            openModal();
        } else {
            completeRound();
        }
    });

    // Formulaire Modale
    dartsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const doublesAttempted = document.querySelector('input[name="checkoutDouble"]:checked').value;
        const totalDartsThrown = document.querySelector('input[name="dartsCount"]:checked').value;

        modal.style.display = 'none';
        completeRound();

        if (totalLegScore === 0) {
            setTimeout(() => {
                alert("🎯 Partie terminée !");
                window.location.href = "/";
            }, 200);
        }
        e.target.reset();
    });
});