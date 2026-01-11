import { state, setupMatch, getActivePlayer, nextTurn, updatePlayerScore } from './gameState.js';
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
 * GESTION DES CLICS (Fusionnée et sécurisée)
 */
function bindEvents() {
    // 1. Chiffres 0-25
    document.querySelectorAll('.container-num .num').forEach(btn => {
        btn.addEventListener('click', () => {
            // Sécurité match fini
            if (state.isMatchOver || dartsThrownThisRound >= 3) return;

            const val = parseInt(btn.textContent);
            const points = val * currentMultiplier;
            const player = getActivePlayer();

            // Logique de "Bust"
            if (player.score - points < 0 || player.score - points === 1) {
                // On annule les points restants du tour mais on compte les fléchettes
                processDart(0);
                // Optionnel: On pourrait forcer la validation ici car le tour est cassé
            } else {
                updatePlayerScore(points);
                processDart(points);
            }
            
            currentMultiplier = 1; 
            refreshView();

            // Victoire immédiate si score tombe à 0 sans attendre de valider le tour entier
            if (player.score === 0) {
                state.isMatchOver = true;
                setTimeout(() => UI.openModal(true), 500); // Ouvre la modale de fin
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

    // 3. Bouton Valider
    document.getElementById('validate-button').addEventListener('click', () => {
        if (state.isMatchOver || dartsThrownThisRound === 0) return;

        const player = getActivePlayer();
        
        // Si fini ou checkout possible, on passe par la modale
        if (player.score === 0 || (player.score + scoresThisRound.reduce((a,b)=>a+b,0)) <= 170) {
            UI.openModal(player.score === 0);
        } else {
            completeTurn();
        }
    });

    // 4. Formulaire de la Modale
    document.getElementById('dartsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        UI.closeModal();
        if (state.isMatchOver) {
            handleMatchWin(getActivePlayer());
        } else {
            completeTurn();
        }
    });
}

function processDart(points) {
    scoresThisRound[dartsThrownThisRound] = points;
    UI.updateDartInputs(dartsThrownThisRound, points);
    dartsThrownThisRound++;
    // Mise à jour des stats globales de fléchettes lancées
    getActivePlayer().stats.totalDarts++;
}

function completeTurn() {
    const player = getActivePlayer();
    
    // On enregistre l'historique
    UI.addHistoryRow(state.roundNumber, player.name, scoresThisRound);
    
    // Reset tour local
    dartsThrownThisRound = 0;
    scoresThisRound = [0, 0, 0];
    UI.clearDartInputs();
    
    nextTurn();
    refreshView();
}

function handleMatchWin(winner) {
    const overlay = document.getElementById('stats-summary-overlay');
    document.getElementById('final-winner-name').textContent = winner.name;
    
    // Calcul de la moyenne (Points / (Darts/3))
    const avg = (winner.stats.pointsScored / (winner.stats.totalDarts / 3 || 1)).toFixed(2);
    document.getElementById('stat-avg').textContent = avg;

    overlay.style.display = 'flex';
}