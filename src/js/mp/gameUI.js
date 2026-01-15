import * as GameState from './gameState.js';

export const UI = {
    elements: {
        mainScore: document.getElementById('main-score'),
        activeName: document.getElementById('active-player-name'),
        activeSets: document.getElementById('active-sets'),
        activeLegs: document.getElementById('active-legs'),
        queueContainer: document.getElementById('players-queue'),
        scoreInputs: document.querySelectorAll('.score-input'),
        modal: document.getElementById('dartsModal'),
        historyBody: document.getElementById('history-body')
    },

    initLayout: (mode) => {
        const queue = document.getElementById('players-queue');
        if (queue) {
            queue.style.display = (mode === 'solo') ? 'none' : 'flex';
        }
    },

    refreshScoreBoard: (activePlayer) => {
        if (!activePlayer) return;

        if (UI.elements.mainScore) UI.elements.mainScore.textContent = activePlayer.score;
        if (UI.elements.activeName) UI.elements.activeName.textContent = activePlayer.name;
        if (UI.elements.activeSets) UI.elements.activeSets.textContent = activePlayer.sets;
        if (UI.elements.activeLegs) UI.elements.activeLegs.textContent = activePlayer.legs;

        if (UI.elements.queueContainer && GameState.state.players.length > 1) {
            UI.elements.queueContainer.innerHTML = ''; 
            GameState.state.players.forEach((p, index) => {
                if (index === GameState.state.currentPlayerIndex) return;

                const isNext = (index === (GameState.state.currentPlayerIndex + 1) % GameState.state.players.length);
                
                const card = document.createElement('div');
                card.className = `queue-card ${isNext ? 'next' : ''}`;
                card.innerHTML = `
                    <div class="p-name">${p.name}</div>
                    <div class="p-score">${p.score}</div>
                    <div class="p-stats">S:${p.sets} L:${p.legs}</div>
                `;
                UI.elements.queueContainer.appendChild(card);
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

    addHistoryRow: (tourLabel, playerName, scores, remainingScore) => {
        if (!UI.elements.historyBody) return;
        const total = scores.reduce((a, b) => a + b, 0);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div>${playerName}</div><div>${tourLabel}</div></td>
            <td>${scores[0]}</td><td>${scores[1]}</td><td>${scores[2]}</td>
            <td><strong>${total}</strong></td>
            <td>${remainingScore}</td>
        `;
        UI.elements.historyBody.prepend(tr);
    },

    openModal: (isWin) => {
        if (UI.elements.modal) {
            UI.elements.modal.style.display = 'block';
            const title = document.getElementById('modal-title');
            if (title) title.innerText = isWin ? "🎯 Leg Terminé !" : "Fin de Tour";
        }
    },

    closeModal: () => {
        if (UI.elements.modal) {
            UI.elements.modal.style.display = 'none';
        }
    }
};