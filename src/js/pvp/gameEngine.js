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
    const mode = params.get('mode') || 'pvp'; // 'solo' ou 'pvp'
    const startScore = parseInt(params.get('startScore')) || 501;

    // On envoie TOUT au setupMatch
    GameState.setupMatch(
        localStorage.getItem('player1_name') || "Joueur 1",
        localStorage.getItem('player2_name') || "Joueur 2",
        parseInt(params.get('sets')) || 1,
        parseInt(params.get('legs')) || 1,
        mode,
        startScore
    );

    UI.initLayout(mode);
    updateStarterUI(); 
    refreshView();
    bindEvents();
});

/**
 * MET À JOUR L'AFFICHAGE DU STARTER
 */
function updateStarterUI() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'solo') return;

    const starterIndex = GameState.state.startingPlayerIndex; 
    const p1Info = document.getElementById('p1-info');
    const p2Info = document.getElementById('p2-info');

    if (p1Info && p2Info) {
        p1Info.classList.toggle('is-starter', starterIndex === 0);
        p2Info.classList.toggle('is-starter', starterIndex === 1);
    }
}

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
            
            currentMultiplier = 1; 
            document.getElementById('double').classList.remove('active');
            document.getElementById('triple').classList.remove('active');
            
            refreshView();

            if (player.score === 0) {
                saveRoundToTable();
                setTimeout(() => UI.openModal(true), 300);
            }
        });
    });

    document.getElementById('double').addEventListener('click', (e) => {
        if (GameState.state.isMatchOver) return;
        currentMultiplier = 2;
        e.currentTarget.classList.add('active');
        document.getElementById('triple').classList.remove('active');
    });

    document.getElementById('triple').addEventListener('click', (e) => {
        if (GameState.state.isMatchOver) return;
        currentMultiplier = 3;
        e.currentTarget.classList.add('active');
        document.getElementById('double').classList.remove('active');
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
        const params = new URLSearchParams(window.location.search);
        const isSolo = params.get('mode') === 'solo';
        
        if (player.score === 0) {
            const result = GameState.winLeg(player);
            
            if (result === "MATCH_OVER") {
                handleMatchWin(player);
            } else {
                const startScore = parseInt(params.get('startScore')) || 501;
                // document.getElementById('history-body').innerHTML = '';
                GameState.resetScoresForNewLeg(startScore);
                updateStarterUI();
                resetRoundState();
                refreshView();
            }
        } else {
            resetRoundState();
            if (isSolo) {
                GameState.state.roundNumber++;
            } else {
                GameState.nextTurn();
            }
            refreshView();
        }
    });

    // 5. Boutons Undo
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

    // 6. Bouton No Score
    document.getElementById('btn-no-score').addEventListener('click', () => {
        if (GameState.state.isMatchOver || dartsThrownThisRound >= 3) return;
        while(dartsThrownThisRound < 3) {
            processDart(0);
        }
        completeTurn();
    });
}

/**
 * LOGIQUE DE TRANSITION
 */
function processDart(points) {
    scoresThisRound[dartsThrownThisRound] = points;
    UI.updateDartInputs(dartsThrownThisRound, points);
    dartsThrownThisRound++;
    GameState.getActivePlayer().stats.totalDarts++;
}

function saveRoundToTable() {
    const player = GameState.getActivePlayer();
    const currentLegNum = (GameState.state.players[0].legs + GameState.state.players[1].legs) + 1;
    const tourLabel = `L${currentLegNum} - T${GameState.state.roundNumber}`;
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
    currentMultiplier = 1;
    document.querySelectorAll('.container-multi .num').forEach(b => b.classList.remove('active'));
}

function handleMatchWin(winner) {
    GameState.state.isMatchOver = true;
    const overlay = document.getElementById('stats-summary-overlay');
    document.getElementById('final-winner-name').textContent = winner.name;
    const avg = (winner.stats.pointsScored / (winner.stats.totalDarts || 1) * 3).toFixed(2);
    document.getElementById('stat-avg').textContent = avg;
    document.getElementById('stat-score').textContent = `${winner.sets} - ${winner.legs}`;
    overlay.style.display = 'flex';
}