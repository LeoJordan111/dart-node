import * as GameState from './gameState.js';
import { UI } from './gameUI.js';

// --- VARIABLES LOCALES AU TOUR ---
let dartsThrownThisRound = 0;
let scoresThisRound = [0, 0, 0];
let currentMultiplier = 1;
let multipliersThisRound = [1, 1, 1];

/**
 * INITIALISATION AU CHARGEMENT
 */
document.addEventListener('DOMContentLoaded', () => {
    const gameId = sessionStorage.getItem('currentGameId');
    const legId = sessionStorage.getItem('currentLegId');
    const mode = sessionStorage.getItem('gameMode') || 'multi';
    const startScore = parseInt(sessionStorage.getItem('startScore')) || 501;
    const sets = parseInt(sessionStorage.getItem('sets')) || 1;
    const legs = parseInt(sessionStorage.getItem('legs')) || 3;

    if (!gameId || !legId) {
        console.warn("Aucune session de jeu trouvée. Redirection...");
        window.location.href = '/';
        return;
    }

    const nbPlayers = parseInt(localStorage.getItem('nb_players')) || 1;
    const playerObjects = [];

    for (let i = 1; i <= nbPlayers; i++) {
        const name = localStorage.getItem(`player${i}_name`);
        const id = parseInt(localStorage.getItem(`player${i}_id`));
        const checkout = localStorage.getItem(`player${i}_checkout`) || 'double';
        
        if (name && id) {
            playerObjects.push({ 
                id, 
                name, 
                checkoutMode: checkout 
            });
        }
    }

    // 3. SETUP DU MATCH
    GameState.setupMatch(
        playerObjects,
        sets, 
        legs,
        mode,
        startScore
    );

    UI.initLayout(mode);
    refreshView();
    bindEvents();
});

/**
 * REFRESH GLOBAL DE LA VUE
 */
function refreshView() {
    const activePlayer = GameState.getActivePlayer();
    const allPlayers = GameState.state.players;

    UI.refreshScoreBoard(activePlayer);

    const activeDartsElem = document.getElementById('active-darts');
    if (activeDartsElem) {
        activeDartsElem.innerText = activePlayer.stats.totalDarts;
    }

    const queueContainer = document.getElementById('players-queue');
    if (queueContainer) {
        queueContainer.innerHTML = '';
        allPlayers.forEach((player, index) => {
            if (index !== GameState.state.currentPlayerIndex) {
                const isNext = index === (GameState.state.currentPlayerIndex + 1) % allPlayers.length;
                const card = document.createElement('div');
                card.className = `queue-card ${isNext ? 'next' : ''}`;
                
                card.innerHTML = `
                    <span class="p-name">${player.name}</span>
                    <span class="p-score">${player.score}</span>
                    <span class="p-stats">S:${player.sets} L:${player.legs}</span>
                `;
                queueContainer.appendChild(card);
            }
        });
    }
}

/**
 * GESTION DES ÉVÉNEMENTS
 */
function bindEvents() {
    document.querySelectorAll('.container-num .num').forEach(btn => {
        btn.addEventListener('click', () => {
            if (GameState.state.isMatchOver || dartsThrownThisRound >= 3) return;

            const val = parseInt(btn.textContent);
            if (isNaN(val)) return;

            const points = val * currentMultiplier;
            const player = GameState.getActivePlayer();
            const potentialScore = player.score - points;
            const playerMode = player.checkoutMode || 'double';

            let isBust = false;
            if (potentialScore < 0) {
                isBust = true;
            } else if (potentialScore === 1 && playerMode === 'double') {
                isBust = true;
            } else if (potentialScore === 0 && playerMode === 'double' && currentMultiplier !== 2) {
                isBust = true;
            }
            
            if (isBust) {
                multipliersThisRound[dartsThrownThisRound] = currentMultiplier;
                processDart(points);
                
                while(dartsThrownThisRound < 3) {
                    multipliersThisRound[dartsThrownThisRound] = 1;
                    processDart(0);
                }
                completeTurn(0); 
                return;
            } else {
                GameState.updatePlayerScore(points);
                multipliersThisRound[dartsThrownThisRound] = currentMultiplier;
                processDart(points);
            }
            
            resetMultipliers();
            refreshView();

            if (player.score === 0) {
                if (player.checkoutMode === 'single') {
                    setTimeout(() => finishLeg(player, 0), 300);
                } else {
                    setTimeout(() => UI.openModal(true), 300);
                }
            }
        });
    });

    document.getElementById('double').addEventListener('click', toggleDouble);
    document.getElementById('triple').addEventListener('click', toggleTriple);

    document.getElementById('validate-button').addEventListener('click', () => {
        if (GameState.state.isMatchOver || dartsThrownThisRound === 0) return;

        const player = GameState.getActivePlayer();
        const totalRound = scoresThisRound.reduce((a, b) => a + b, 0);
        
        if (player.checkoutMode === 'double') {
            if ((player.score + totalRound) <= 170 && player.score !== 0) {
                UI.openModal(false);
                return;
            } else if (player.score === 0) {
                UI.openModal(true);
                return;
            }
        }
        finishLeg(player, 0);
    });

    document.getElementById('dartsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const attempts = parseInt(formData.get('checkoutDouble')) || 0;
        UI.closeModal();
        const player = GameState.getActivePlayer();
        await finishLeg(player, attempts);
    });

    document.getElementById('btn-no-score').addEventListener('click', () => {
        if (GameState.state.isMatchOver) return;
        while (dartsThrownThisRound < 3) {
            multipliersThisRound[dartsThrownThisRound] = 1; 
            processDart(0);
        }
        completeTurn(0);
    });

    document.querySelectorAll('.score-comeback').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dartsThrownThisRound > 0 && index === dartsThrownThisRound - 1) {
                const pointsToUndo = scoresThisRound[index];
                GameState.undoLastDartScore(pointsToUndo);
                scoresThisRound[index] = 0;
                dartsThrownThisRound--;
                UI.updateDartInputs(index, "-");
                refreshView();
            }
        });
    });
}

function processDart(points) {
    scoresThisRound[dartsThrownThisRound] = points;
    UI.updateDartInputs(dartsThrownThisRound, points);
    dartsThrownThisRound++;
    GameState.getActivePlayer().stats.totalDarts++;
}

/**
 * LOGIQUE DE JEU - SAUVEGARDE DU TOUR
 */
async function completeTurn(checkoutAttempts = 0) {
    const activePlayer = GameState.getActivePlayer();
    const currentLegId = sessionStorage.getItem('currentLegId');

    const turnPayload = {
        legId: parseInt(currentLegId),
        playerId: activePlayer.id,
        points: scoresThisRound.reduce((a, b) => a + b, 0),
        dartsThrown: dartsThrownThisRound,
        remaining: activePlayer.score,
        isBust: (activePlayer.score > 0 && scoresThisRound.every(s => s === 0) && dartsThrownThisRound > 0),
        
        darts: scoresThisRound.map((s, i) => ({
            value: Math.floor(s / (multipliersThisRound[i] || 1)), 
            multiplier: multipliersThisRound[i] || 1,
            isCheckoutAttempt: checkoutAttempts > i 
        })),

        dart1: Math.floor(scoresThisRound[0] / (multipliersThisRound[0] || 1)),
        multiplier1: multipliersThisRound[0] || 1,
        dart2: Math.floor(scoresThisRound[1] / (multipliersThisRound[1] || 1)),
        multiplier2: multipliersThisRound[1] || 1,
        dart3: Math.floor(scoresThisRound[2] / (multipliersThisRound[2] || 1)),
        multiplier3: multipliersThisRound[2] || 1
    };

    await GameState.saveTurnToDatabase(turnPayload);

    saveRoundToTable();
    resetRoundState();
    GameState.nextTurn();
    refreshView();
}

/**
 * FIN DU LEG OU DU MATCH
 */
async function finishLeg(player, attempts = 0) {
    const gameId = sessionStorage.getItem('currentGameId');
    const startScore = parseInt(sessionStorage.getItem('startScore')) || 501;

    await completeTurn(attempts);

    if (player.score === 0) {
        const result = GameState.winLeg(player);

        await fetch(`/api/games/${gameId}/finish-leg`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ winnerId: player.id })
        });

        if (result === "MATCH_OVER") {
            handleMatchWin(player);
        } else {
            GameState.resetScoresForNewLeg(startScore);
            refreshView();
        }
    }
}

// --- FONCTIONS UTILITAIRES ---

function saveRoundToTable() {
    const player = GameState.getActivePlayer();
    const tourLabel = `T${GameState.state.roundNumber}`;
    UI.addHistoryRow(tourLabel, player.name, scoresThisRound, player.score);
}

function resetRoundState() {
    dartsThrownThisRound = 0;
    scoresThisRound = [0, 0, 0];
    multipliersThisRound = [1, 1, 1];
    UI.clearDartInputs();
    resetMultipliers();
}

function toggleDouble() {
    currentMultiplier = (currentMultiplier === 2) ? 1 : 2;
    document.getElementById('triple').classList.remove('active');
    document.getElementById('double').classList.toggle('active', currentMultiplier === 2);
}

function toggleTriple() {
    currentMultiplier = (currentMultiplier === 3) ? 1 : 3;
    document.getElementById('double').classList.remove('active');
    document.getElementById('triple').classList.toggle('active', currentMultiplier === 3);
}

function resetMultipliers() {
    currentMultiplier = 1;
    document.getElementById('double').classList.remove('active');
    document.getElementById('triple').classList.remove('active');
}

function handleMatchWin(winner) {
    GameState.state.isMatchOver = true;
    const overlay = document.getElementById('stats-summary-overlay');
    document.getElementById('final-winner-name').textContent = winner.name;
    const avg = (winner.stats.pointsScored / (winner.stats.totalDarts || 1) * 3).toFixed(2);
    document.getElementById('stat-avg').textContent = avg;
    overlay.style.display = 'flex';
}