/**
 * GESTION DE L'INTERFACE UTILISATEUR (DOM)
 */
export const UI = {
    // Sélecteurs mis en cache pour la performance
    elements: {
        playerName: document.getElementById('current-player-name'),
        mainScore: document.getElementById('main-score'),
        setCount: document.getElementById('set-count'),
        legCount: document.getElementById('leg-count'),
        historyBody: document.getElementById('history-body'),
        scoreInputs: document.querySelectorAll('.score-input'),
        modal: document.getElementById('dartsModal')
    },

    /**
     * Met à jour le bloc score principal
     */
    refreshScoreBoard: (activePlayer) => {
        UI.elements.playerName.textContent = activePlayer.name;
        UI.elements.mainScore.textContent = activePlayer.score;

        UI.elements.playerName.style.color = (activePlayer.id === 1) ? "var(--primary)" : "var(--accent)";
        
        if(UI.elements.setCount) UI.elements.setCount.textContent = `Sets: ${activePlayer.sets}`;
        if(UI.elements.legCount) UI.elements.legCount.textContent = `Legs: ${activePlayer.legs}`;
    },

    /**
     * Met à jour une des 3 cases F1, F2 ou F3
     */
    updateDartInputs: (dartIndex, points) => {
        if (UI.elements.scoreInputs[dartIndex]) {
            UI.elements.scoreInputs[dartIndex].textContent = points;
            UI.elements.scoreInputs[dartIndex].classList.add('filled');
        }
    },

    /**
     * UNIQUE MÉTHODE POUR VIDER LES INPUTS
     */
    clearDartInputs: () => {
        UI.elements.scoreInputs.forEach(input => {
            input.textContent = '-';
            input.classList.remove('filled');
        });
    },

    /**
     * Ajoute une ligne dans le tableau historique
     */
    addHistoryRow: (roundNumber, playerNickname, scores) => {
        const total = scores.reduce((a, b) => a + b, 0);
        const html = `
            <tr>
                <td>${roundNumber} (${playerNickname})</td>
                <td>${scores[0]}</td>
                <td>${scores[1]}</td>
                <td>${scores[2]}</td>
                <td><strong>${total}</strong></td>
            </tr>
        `;
        UI.elements.historyBody.insertAdjacentHTML('afterbegin', html);
    },

    /**
     * Gestion des Modales
     */
    openModal: (isWin) => {
        UI.elements.modal.style.display = 'block';
        const title = document.getElementById('modal-title');
        if(title) title.innerText = isWin ? "🎯 Leg Terminé !" : "Statistiques de Fin de Tour";
    },

    closeModal: () => {
        UI.elements.modal.style.display = 'none';
        const form = document.getElementById('dartsForm');
        if(form) form.reset();
    },

    /**
     * Met en évidence le joueur actif via une classe CSS
     */
    highlightActivePlayer: (activeIndex) => {
        // On enlève les deux classes avant de mettre la bonne
        UI.elements.playerName.classList.remove('player-1-turn', 'player-2-turn');
        
        const className = (activeIndex === 0) ? 'player-1-turn' : 'player-2-turn';
        UI.elements.playerName.classList.add(className);
    }
};