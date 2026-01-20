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
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || 'multi';
    const startScore = parseInt(params.get('startScore')) || 501;

    const nbPlayers = parseInt(localStorage.getItem('nb_players')) || 1;
    const playerNames = [];
    for (let i = 1; i <= nbPlayers; i++) {
        const name = localStorage.getItem(`player${i}_name`);
        if (name) playerNames.push(name);
    }

    GameState.setupMatch(
        playerNames,
        parseInt(params.get('sets')) || 1,
        parseInt(params.get('legs')) || 3,
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

            if (potentialScore < 0 || potentialScore === 1) {
                multipliersThisRound[dartsThrownThisRound] = currentMultiplier;
                processDart(points);
                
                while(dartsThrownThisRound < 3) {
                    multipliersThisRound[dartsThrownThisRound] = 1;
                    processDart(0);
                }
                completeTurn(); 
                return;
            } else {
                GameState.updatePlayerScore(points);
                multipliersThisRound[dartsThrownThisRound] = currentMultiplier;
                processDart(points);
            }
            
            resetMultipliers();
            refreshView();

            if (player.score === 0) {
                saveRoundToTable();
                setTimeout(() => UI.openModal(true), 300);
            }
        });
    });

    document.getElementById('double').addEventListener('click', toggleDouble);
    document.getElementById('triple').addEventListener('click', toggleTriple);

    document.getElementById('validate-button').addEventListener('click', () => {
        if (GameState.state.isMatchOver || dartsThrownThisRound === 0) return;

        const player = GameState.getActivePlayer();
        const totalRound = scoresThisRound.reduce((a, b) => a + b, 0);
        
        if ((player.score + totalRound) <= 170 && player.score !== 0) {
            saveRoundToTable(); 
            UI.openModal(false);
        } else if (player.score === 0) {
            UI.openModal(true);
        } else {
            completeTurn(); 
        }
    });

    document.getElementById('dartsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const checkoutAttempts = parseInt(formData.get('checkoutDouble')) || 0;
        UI.closeModal();
        
        const player = GameState.getActivePlayer();
        const params = new URLSearchParams(window.location.search);
        const gameId = params.get('id');

        if (GameState.getActivePlayer().score === 0) {
            await completeTurn(checkoutAttempts);

            const result = GameState.winLeg(player);

            await fetch(`/api/games/${gameId}/finish-leg`, {
                method: 'POST',
                body: JSON.stringify({ winnerId: player.id })
            });

            if (result === "MATCH_OVER") {
                handleMatchWin(player);
            } else {
                GameState.resetScoresForNewLeg(parseInt(params.get('startScore')) || 501);
                refreshView();
            }
        } else {
            await completeTurn(checkoutAttempts);
        }
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

/**
 * LOGIQUE DE JEU
 */
function processDart(points) {
    scoresThisRound[dartsThrownThisRound] = points;
    UI.updateDartInputs(dartsThrownThisRound, points);
    dartsThrownThisRound++;

    GameState.getActivePlayer().stats.totalDarts++;
}

/**
 * LOGIQUE DE JEU - SAUVEGARDE DU TOUR ET DES FLECHETTES
 */
async function completeTurn(checkoutAttempts = 0) {
    const activePlayer = GameState.getActivePlayer();
    const params = new URLSearchParams(window.location.search);
    const currentLegId = params.get('legId'); 

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

    console.log("Envoi du TurnPayload:", turnPayload);
    await GameState.saveTurnToDatabase(turnPayload);

    saveRoundToTable();
    resetRoundState();
    GameState.nextTurn();
    refreshView();
}

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