import * as GameState from './gameState.js';

/**
 * GESTION DE L'INTERFACE UTILISATEUR (DOM)
 */
export const UI = {
    // Sélecteurs mis en cache
    elements: {
        mainScore: document.getElementById('main-score'),
        historyBody: document.getElementById('history-body'),
        scoreInputs: document.querySelectorAll('.score-input'),
        modal: document.getElementById('dartsModal')
    },

    /**
     * Initialise l'affichage selon le mode (Solo ou PvP)
     */
    initLayout: (mode) => {
        const soloLayout = document.getElementById('score-layout-solo');
        const pvpLayout = document.getElementById('score-layout-pvp');
        
        if (mode === 'solo') {
            if (soloLayout) soloLayout.style.display = 'block';
            if (pvpLayout) pvpLayout.style.display = 'none';
        } else {
            if (soloLayout) soloLayout.style.display = 'none';
            if (pvpLayout) pvpLayout.style.display = 'block';
        }
    },

    /**
     * Met à jour le bloc score principal
     */
refreshScoreBoard: (activePlayer) => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || 'pvp';

    if (UI.elements.mainScore) {
        UI.elements.mainScore.textContent = activePlayer.score;
    }

    if (mode === 'solo') {
        const nameSolo = document.getElementById('current-player-name-solo');
        const setSolo = document.getElementById('set-count-solo');
        const legSolo = document.getElementById('leg-count-solo');

        if (nameSolo) nameSolo.textContent = activePlayer.name;
        if (setSolo) setSolo.textContent = `Sets: ${activePlayer.sets}`;
        if (legSolo) legSolo.textContent = `Legs: ${activePlayer.legs}`;
        
        document.getElementById('score-layout-pvp').style.display = 'none';
        document.getElementById('score-layout-solo').style.display = 'block';

    } else {
        document.getElementById('score-layout-solo').style.display = 'none';
        document.getElementById('score-layout-pvp').style.display = 'block';

        GameState.state.players.forEach((p, index) => {
            const container = document.getElementById(`p${index + 1}-info`);
            if (container) {
                container.querySelector('.p-name').textContent = p.name;
                container.querySelector('.p-sets').textContent = `S: ${p.sets}`;
                container.querySelector('.p-legs').textContent = `L: ${p.legs}`;
                container.querySelector('.p-current-score').textContent = p.score;
                container.classList.toggle('active', p.id === activePlayer.id);
            }
        });
    }
},

    updateDartInputs: (dartIndex, points) => {
        const input = UI.elements.scoreInputs[dartIndex];
        if (input) {
            input.textContent = points;
            points === "-" ? input.classList.remove('filled') : input.classList.add('filled');
        }
    },

    clearDartInputs: () => {
        UI.elements.scoreInputs.forEach(input => {
            input.textContent = '-';
            input.classList.remove('filled');
        });
    },

    /**
     * Ajoute une ligne dans le tableau historique
     */
    addHistoryRow: (tourLabel, playerName, scores, remainingScore) => {
        const historyBody = document.getElementById('history-body');
        if (!historyBody) return;

        const total = scores.reduce((a, b) => a + b, 0);
        const tr = document.createElement('tr');
        
        const isPlayer2 = GameState.state.players[1] && playerName === GameState.state.players[1].name;
        tr.style.backgroundColor = isPlayer2 ? "rgba(0,0,0,0.05)" : "#ffffff";
        
        tr.innerHTML = `
            <td>
                <div>${playerName}</div>
                <div>${tourLabel}</div>
            </td>
            <td>${scores[0]}</td>
            <td>${scores[1]}</td>
            <td>${scores[2]}</td>
            <td><strong>${total}</strong></td>
            <td>
                ${remainingScore}
            </td>
        `;

        historyBody.prepend(tr);
    },

    openModal: (isWin) => {
        if (UI.elements.modal) {
            UI.elements.modal.style.display = 'block';
            const title = document.getElementById('modal-title');
            if (title) title.innerText = isWin ? "🎯 Leg Terminé !" : "Statistiques de Fin de Tour";
        }
    },

    closeModal: () => {
        if (UI.elements.modal) {
            UI.elements.modal.style.display = 'none';
            const form = document.getElementById('dartsForm');
            if (form) form.reset();
        }
    }
};