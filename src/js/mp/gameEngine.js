import * as GameState from './gameState.js';
import { UI } from './gameUI.js';

// --- VARIABLES LOCALES AU TOUR ---
let dartsThrownThisRound = 0;
let scoresThisRound = [0, 0, 0];
let currentMultiplier = 1;

/**
 * INITIALISATION AU CHARGEMENT
 */
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || 'solo';
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
    UI.refreshScoreBoard(GameState.getActivePlayer());
}

/**
 * GESTION DES CLICS
 */
function bindEvents() {
    document.querySelectorAll('.container-num .num').forEach(btn => {
        btn.addEventListener('click', () => {
            if (GameState.state.isMatchOver || dartsThrownThisRound >= 3) return;

            const val = parseInt(btn.textContent);
            const points = val * currentMultiplier;
            const player = GameState.getActivePlayer();

            if (player.score - points < 0 || player.score - points === 1) {
                while(dartsThrownThisRound < 3) {
                    processDart(0);
                }
                completeTurn(); 
                return;
            } else {
                GameState.updatePlayerScore(points);
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

    document.getElementById('double').addEventListener('click', (e) => {
        currentMultiplier = (currentMultiplier === 2) ? 1 : 2;
        toggleMultiplierUI();
    });

    document.getElementById('triple').addEventListener('click', (e) => {
        currentMultiplier = (currentMultiplier === 3) ? 1 : 3;
        toggleMultiplierUI();
    });

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

    document.getElementById('dartsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        UI.closeModal();
        
        const player = GameState.getActivePlayer();
        
        if (player.score === 0) {
            const result = GameState.winLeg(player);
            if (result === "MATCH_OVER") {
                handleMatchWin(player);
            } else {
                const params = new URLSearchParams(window.location.search);
                GameState.resetScoresForNewLeg(parseInt(params.get('startScore')) || 501);
                resetRoundState();
                refreshView();
            }
        } else {
            completeTurn();
        }
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

    document.getElementById('btn-no-score').addEventListener('click', () => {
        if (GameState.state.isMatchOver || dartsThrownThisRound >= 3) return;
        while(dartsThrownThisRound < 3) processDart(0);
        completeTurn();
    });
}

/**
 * LOGIQUE DE TRANSITION ET RESET
 */
function processDart(points) {
    scoresThisRound[dartsThrownThisRound] = points;
    UI.updateDartInputs(dartsThrownThisRound, points);
    dartsThrownThisRound++;
    GameState.getActivePlayer().stats.totalDarts++;
}

function resetMultipliers() {
    currentMultiplier = 1;
    document.getElementById('double').classList.remove('active');
    document.getElementById('triple').classList.remove('active');
}

function toggleMultiplierUI() {
    document.getElementById('double').classList.toggle('active', currentMultiplier === 2);
    document.getElementById('triple').classList.toggle('active', currentMultiplier === 3);
}

function saveRoundToTable() {
    const player = GameState.getActivePlayer();
    const tourLabel = `T${GameState.state.roundNumber}`;
    UI.addHistoryRow(tourLabel, player.name, scoresThisRound, player.score);
}

function completeTurn() {
    saveRoundToTable();
    resetRoundState();
    GameState.nextTurn();
    refreshView();
}

function resetRoundState() {
    dartsThrownThisRound = 0;
    scoresThisRound = [0, 0, 0];
    UI.clearDartInputs();
    resetMultipliers();
}

function handleMatchWin(winner) {
    GameState.state.isMatchOver = true;
    const overlay = document.getElementById('stats-summary-overlay');
    document.getElementById('final-winner-name').textContent = winner.name;
    const avg = (winner.stats.pointsScored / (winner.stats.totalDarts || 1) * 3).toFixed(2);
    document.getElementById('stat-avg').textContent = avg;
    overlay.style.display = 'flex';
}