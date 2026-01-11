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
    
    GameState.setupMatch(
        localStorage.getItem('player1_name') || "Joueur 1",
        localStorage.getItem('player2_name') || "Joueur 2",
        parseInt(params.get('sets')) || 1,
        parseInt(params.get('legs')) || 1
    );

    updateStarterUI(); 
    refreshView();
    bindEvents();
});

/**
 * MET À JOUR L'AFFICHAGE DU STARTER (🎯)
 */
function updateStarterUI() {
    // Utilise bien startingPlayerIndex qui est maintenant synchronisé
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
    // 1. Chiffres 0-25
    document.querySelectorAll('.container-num .num').forEach(btn => {
        btn.addEventListener('click', () => {
            if (GameState.state.isMatchOver || dartsThrownThisRound >= 3) return;

            const val = parseInt(btn.textContent);
            const points = val * currentMultiplier;
            const player = GameState.getActivePlayer();

            // Logique de "Bust" (Dépassement)
            if (player.score - points < 0 || player.score - points === 1) {
                processDart(0);
                dartsThrownThisRound = 3; 
            } else {
                GameState.updatePlayerScore(points);
                processDart(points);
            }
            
            currentMultiplier = 1; 
            // On enlève visuellement l'état actif des boutons double/triple
            document.getElementById('double').classList.remove('active');
            document.getElementById('triple').classList.remove('active');
            
            refreshView();

            if (player.score === 0) {
                setTimeout(() => UI.openModal(true), 300);
            }
        });
    });

    // 2. Multiplicateurs (avec retour visuel)
    document.getElementById('double').addEventListener('click', (e) => {
        if (GameState.state.isMatchOver) return;
        currentMultiplier = 2;
        e.target.classList.add('active');
        document.getElementById('triple').classList.remove('active');
    });

    document.getElementById('triple').addEventListener('click', (e) => {
        if (GameState.state.isMatchOver) return;
        currentMultiplier = 3;
        e.target.classList.add('active');
        document.getElementById('double').classList.remove('active');
    });

    // 3. Bouton Valider
    document.getElementById('validate-button').addEventListener('click', () => {
        if (GameState.state.isMatchOver || dartsThrownThisRound === 0) return;

        const player = GameState.getActivePlayer();
        const totalRound = scoresThisRound.reduce((a, b) => a + b, 0);
        
        // Si le joueur a fini ou est en zone de checkout (<= 170)
        if (player.score === 0 || (player.score + totalRound) <= 170) {
            UI.openModal(player.score === 0);
        } else {
            completeTurn();
        }
    });

    // 4. Formulaire de la Modale (Stats de fin de tour/leg)
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
                const startScore = parseInt(params.get('startScore')) || 501;
                
                alert(`${player.name} gagne la manche !`);
                
                // Reset pour la nouvelle manche
                GameState.resetScoresForNewLeg(startScore);
                updateStarterUI();
                resetRoundState();
                refreshView();
            }
        } else {
            completeTurn();
        }
    });

    // 5. Boutons Undo (Retour arrière)
    document.querySelectorAll('.score-comeback').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dartsThrownThisRound > 0 && index === dartsThrownThisRound - 1) {
                const pointsToUndo = scoresThisRound[index];
                GameState.undoLastDartScore(pointsToUndo);
                
                scoresThisRound[index] = 0;
                dartsThrownThisRound--;
                
                UI.updateDartInputs(index, "-");
                UI.elements.scoreInputs[index].classList.remove('filled');
                refreshView();
            }
        });
    });

    // 6. Bouton No Score (0 points direct)
    document.getElementById('btn-no-score').addEventListener('click', () => {
        if (GameState.state.isMatchOver || dartsThrownThisRound >= 3) return;
        while(dartsThrownThisRound < 3) {
            processDart(0);
        }
        refreshView();
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

function completeTurn() {
    const player = GameState.getActivePlayer();
    UI.addHistoryRow(GameState.state.roundNumber, player.name, scoresThisRound);
    resetRoundState();
    GameState.nextTurn();
    refreshView();
}

function resetRoundState() {
    dartsThrownThisRound = 0;
    scoresThisRound = [0, 0, 0];
    UI.clearDartInputs();
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
    
    // Affichage score final Sets - Legs
    document.getElementById('stat-score').textContent = `${winner.sets} - ${winner.legs}`;

    overlay.style.display = 'flex';
}