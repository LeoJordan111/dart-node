document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES ---
    const mainScoreElement = document.getElementById('main-score');
    const scoreInputs = document.querySelectorAll('.score-input');
    const retourButtons = document.querySelectorAll('.score-comeback');
    const numButtons = document.querySelectorAll('.container-num .num');
    const doubleBtn = document.getElementById('double');
    const tripleBtn = document.getElementById('triple');
    const validateBtn = document.getElementById('validate-button');
    const noScoreBtn = document.getElementById('btn-no-score');
    const historyBody = document.getElementById('history-body');

    let currentMultiplier = 1;
    let dartsThrownThisRound = 0;
    let scoresThisRound = [0, 0, 0];
    let totalLegScore = parseInt(mainScoreElement.textContent);
    let roundNumber = 1;

    // --- LOGIQUE DOUBLE / TRIPLE ---
    function resetMultipliers() {
        currentMultiplier = 1;
        doubleBtn.classList.remove('active');
        tripleBtn.classList.remove('active');
    }

    [doubleBtn, tripleBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            const multiplierValue = (btn.id === 'double') ? 2 : 3;
            if (btn.classList.contains('active')) {
                resetMultipliers();
            } else {
                resetMultipliers();
                btn.classList.add('active');
                currentMultiplier = multiplierValue;
            }
        });
    });

    // --- SAISIE DES CHIFFRES ---
    numButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (dartsThrownThisRound >= 3) return;

            const value = parseInt(btn.textContent);
            if (isNaN(value)) return;

            processScore(value * currentMultiplier);
        });
    });

    // --- BOUTON NO SCORE (MISS) ---
    noScoreBtn.addEventListener('click', () => {
        if (dartsThrownThisRound >= 3) return;
        processScore(0);
    });

    function processScore(points) {
        const potentialScore = totalLegScore - points;

        // Gestion du BUST (Score négatif ou égal à 1)
        if (potentialScore < 0 || potentialScore === 1) {
            // Le score de la fléchette est marqué 0 car c'est un bust
            recordDart(0); 
        } else {
            totalLegScore = potentialScore;
            mainScoreElement.textContent = totalLegScore;
            recordDart(points);
        }
        resetMultipliers();
    }

    function recordDart(points) {
        scoresThisRound[dartsThrownThisRound] = points;
        scoreInputs[dartsThrownThisRound].textContent = points;
        dartsThrownThisRound++;
    }

    // --- BOUTONS RETOUR (Individuels sous les fléchettes) ---
    retourButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            // On ne peut annuler que la dernière fléchette lancée pour éviter les bugs de calcul
            if (dartsThrownThisRound > 0 && index === dartsThrownThisRound - 1) {
                const scoreToCancel = scoresThisRound[index];
                totalLegScore += scoreToCancel;
                mainScoreElement.textContent = totalLegScore;
                
                scoreInputs[index].textContent = '-';
                scoresThisRound[index] = 0;
                dartsThrownThisRound--;
            }
        });
    });

    // --- VALIDATION DU TOUR ---
    validateBtn.addEventListener('click', () => {
        if (dartsThrownThisRound === 0) return;

        if (totalLegScore === 0) {
            document.getElementById('dartsModal').style.display = 'block';
            return;
        }
        completeRound();
    });

    function completeRound() {
        const totalRound = scoresThisRound.reduce((a, b) => a + b, 0);
        
        // Ajout à la table
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
    }

    // --- MODAL FIN DE PARTIE ---
    document.getElementById('dartsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        // Ici on pourrait envoyer les stats finales en base de données
        alert("Match terminé !");
        window.location.href = "/"; 
    });
});