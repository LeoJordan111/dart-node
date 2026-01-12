// IMPORTATION NÉCESSAIRE pour accéder aux scores des deux joueurs en PvP
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
     * Met à jour le bloc score principal (Solo ou PvP)
     */
    refreshScoreBoard: (activePlayer) => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode') || 'pvp';

        // 1. Mise à jour du score principal (le gros score au milieu)
        if (UI.elements.mainScore) {
            UI.elements.mainScore.textContent = activePlayer.score;
        }

        // 2. Gestion des layouts selon le mode
        const layoutSolo = document.getElementById('score-layout-solo');
        const layoutPvp = document.getElementById('score-layout-pvp');

        if (mode === 'solo') {
            if (layoutSolo) layoutSolo.style.display = 'block';
            if (layoutPvp) layoutPvp.style.display = 'none';
            
            // Mise à jour textes Solo
            const nameSolo = document.getElementById('current-player-name-solo');
            const setSolo = document.getElementById('set-count-solo');
            const legSolo = document.getElementById('leg-count-solo');

            if (nameSolo) nameSolo.textContent = activePlayer.name;
            if (setSolo) setSolo.textContent = `Sets: ${activePlayer.sets}`;
            if (legSolo) legSolo.textContent = `Legs: ${activePlayer.legs}`;
            
        } else {
            // --- MODE PVP ---
            if (layoutSolo) layoutSolo.style.display = 'none';
            if (layoutPvp) layoutPvp.style.display = 'block';

            // Mise à jour des deux blocs PvP
            GameState.state.players.forEach((p, index) => {
                const playerNum = index + 1;
                const container = document.getElementById(`p${playerNum}-info`);
                
                if (container) {
                    // Nom, Sets et Legs
                    container.querySelector('.p-name').textContent = p.name;
                    container.querySelector('.p-sets').textContent = `S: ${p.sets}`;
                    container.querySelector('.p-legs').textContent = `L: ${p.legs}`;

                    // MISE À JOUR DU SCORE INDIVIDUEL (Sous le nom)
                    const individualScore = container.querySelector('.p-current-score');
                    if (individualScore) {
                        individualScore.textContent = p.score;
                    }

                    // Mise en évidence du joueur actif
                    if (p.id === activePlayer.id) {
                        container.classList.add('active');
                    } else {
                        container.classList.remove('active');
                    }
                }
            });
        }
    },

    /**
     * Met à jour une des 3 cases F1, F2 ou F3
     */
    updateDartInputs: (dartIndex, points) => {
        const input = UI.elements.scoreInputs[dartIndex];
        if (input) {
            input.textContent = points;
            if (points === "-") {
                input.classList.remove('filled');
            } else {
                input.classList.add('filled');
            }
        }
    },

    /**
     * Vide les inputs de fléchettes
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
    addHistoryRow: (tourLabel, playerName, scores, remainingScore) => {
        const historyBody = document.getElementById('history-body');
        if (!historyBody) return;

        const total = scores.reduce((a, b) => a + b, 0);
        const tr = document.createElement('tr');
        
        // Couleur de fond légère pour différencier les joueurs
        tr.style.backgroundColor = playerName === GameState.state.players[1].name ? "#f2f2f2" : "#ffffff";
        
        // On remplit le contenu du TR (sans réécrire <tr> dedans)
        tr.innerHTML = `
            <td>
                <div>${playerName}</div>
                <div>${tourLabel}</div>
            </td>
            <td>${scores[0]}</td>
            <td>${scores[1]}</td>
            <td>${scores[2]}</td>
            <td><strong>${total}</strong></td>
            <td>${remainingScore}</td>
        `;

        // On insère en haut du tableau
        historyBody.prepend(tr);
    },

    /**
     * Gestion des Modales
     */
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