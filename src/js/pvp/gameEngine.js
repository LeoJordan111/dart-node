import { state, setupMatch, getActivePlayer, nextTurn, updatePlayerScore, winLeg, resetScoresForNewLeg } from './gameState.js';
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
    
    // Initialisation avec les paramètres de l'URL
    setupMatch(
        localStorage.getItem('player1_name') || "Joueur 1",
        localStorage.getItem('player2_name') || "Joueur 2",
        parseInt(params.get('sets')) || 1,
        parseInt(params.get('legs')) || 1
    );

    refreshView();
    bindEvents();
});

function refreshView() {
    UI.refreshScoreBoard(getActivePlayer());
}

/**
 * GESTION DES CLICS
 */
function bindEvents() {
    // 1. Chiffres 0-25
    document.querySelectorAll('.container-num .num').forEach(btn => {
        btn.addEventListener('click', () => {
            // Sécurité : on ne joue pas si le match est fini ou si on a déjà lancé 3 fléchettes
            if (state.isMatchOver || dartsThrownThisRound >= 3) return;

            const val = parseInt(btn.textContent);
            const points = val * currentMultiplier;
            const player = getActivePlayer();

            // Logique de "Bust" (Trop de points ou reste 1)
            if (player.score - points < 0 || player.score - points === 1) {
                processDart(0); // On enregistre 0 points
                // On peut s'arrêter là pour ce tour
                dartsThrownThisRound = 3; 
            } else {
                updatePlayerScore(points);
                processDart(points);
            }
            
            currentMultiplier = 1; 
            refreshView();

            // Si le joueur arrive à 0, on ouvre la modale de validation de fin de leg
            if (player.score === 0) {
                setTimeout(() => UI.openModal(true), 300);
            }
        });
    });

    // 2. Multiplicateurs
    document.getElementById('double').addEventListener('click', () => {
        if (!state.isMatchOver) currentMultiplier = 2;
    });
    document.getElementById('triple').addEventListener('click', () => {
        if (!state.isMatchOver) currentMultiplier = 3;
    });

    // 3. Bouton Valider (Sous le pavé numérique)
    document.getElementById('validate-button').addEventListener('click', () => {
        if (state.isMatchOver || dartsThrownThisRound === 0) return;

        const player = getActivePlayer();
        const totalRound = scoresThisRound.reduce((a, b) => a + b, 0);
        
        // Si le score est 0 ou si checkout possible (score avant tour <= 170)
        if (player.score === 0 || (player.score + totalRound) <= 170) {
            UI.openModal(player.score === 0);
        } else {
            completeTurn();
        }
    });

    // 4. Formulaire de la Modale (Stats de fin de tour)
    document.getElementById('dartsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        UI.closeModal();
        
        const player = getActivePlayer();
        
        // Si le joueur a fini sa manche
        if (player.score === 0) {
            const result = winLeg(player);
            
            if (result === "MATCH_OVER") {
                handleMatchWin(player);
            } else {
                // Nouveau Leg ou Nouveau Set
                const params = new URLSearchParams(window.location.search);
                const startScore = parseInt(params.get('startScore')) || 501;
                
                alert(`${player.name} gagne la manche !`);
                resetScoresForNewLeg(startScore);
                
                resetRoundState();
                refreshView();
            }
        } else {
            // Tour normal après modale checkout raté
            completeTurn();
        }
    });
}

/**
 * LOGIQUE DE TRANSITION
 */
function processDart(points) {
    scoresThisRound[dartsThrownThisRound] = points;
    UI.updateDartInputs(dartsThrownThisRound, points);
    dartsThrownThisRound++;
    
    // Stats : on compte chaque fléchette lancée
    getActivePlayer().stats.totalDarts++;
}

function completeTurn() {
    const player = getActivePlayer();
    
    // Historique
    UI.addHistoryRow(state.roundNumber, player.name, scoresThisRound);
    
    resetRoundState();
    nextTurn();
    refreshView();
}

/**
 * Nettoie les variables du tour en cours
 */
function resetRoundState() {
    dartsThrownThisRound = 0;
    scoresThisRound = [0, 0, 0];
    UI.clearDartInputs();
}

/**
 * Écran final
 */
function handleMatchWin(winner) {
    state.isMatchOver = true;
    const overlay = document.getElementById('stats-summary-overlay');
    document.getElementById('final-winner-name').textContent = winner.name;
    
    // Moyenne : (Total Points / Total Fléchettes) * 3
    const avg = (winner.stats.pointsScored / (winner.stats.totalDarts || 1) * 3).toFixed(2);
    document.getElementById('stat-avg').textContent = avg;

    overlay.style.display = 'flex';
}