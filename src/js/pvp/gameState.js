/**
 * STRUCTURE D'UN JOUEUR
 */
const createPlayer = (id, nickname) => ({
    id: id,
    name: nickname,
    score: 501,
    sets: 0,
    legs: 0,
    stats: {
        totalDarts: 0,
        doubleAttempts: 0,
        pointsScored: 0,
        hundredPlus: 0 // Optionnel : pour compter les scores > 100
    }
});

/**
 * ÉTAT INITIAL DU MATCH
 */
export let state = {
    players: [],
    currentPlayerIndex: 0, // 0 pour Joueur 1, 1 pour Joueur 2
    roundNumber: 1,
    isMatchOver: false,
    config: {
        setsToWin: 1,
        legsPerSet: 1
    }
};

/**
 * ACTIONS (Fonctions de modification)
 */

// Initialise les joueurs et la configuration
export function setupMatch(p1Name, p2Name, sets, legs) {
    state.players = [
        createPlayer(1, p1Name),
        createPlayer(2, p2Name)
    ];
    state.config.setsToWin = sets;
    state.config.legsPerSet = legs;
    state.currentPlayerIndex = 0;
    state.roundNumber = 1;
}

// Retourne l'objet du joueur qui doit lancer
export function getActivePlayer() {
    return state.players[state.currentPlayerIndex];
}

// Retourne l'objet du joueur qui attend (pour afficher son score en petit)
export function getWaitingPlayer() {
    const waitingIndex = state.currentPlayerIndex === 0 ? 1 : 0;
    return state.players[waitingIndex];
}

// Alterne les joueurs
export function nextTurn() {
    // Si on revient au joueur 1, on augmente le numéro du tour global
    if (state.currentPlayerIndex === 1) {
        state.roundNumber++;
    }
    state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
}

// Applique le score et met à jour les stats
export function updatePlayerScore(points) {
    const player = getActivePlayer();
    player.score -= points;
    player.stats.pointsScored += points;
}

// Réinitialise les scores pour un nouveau Leg (mais garde sets/legs)
export function resetScoresForNewLeg() {
    state.players.forEach(p => p.score = 501);
    state.currentPlayerIndex = 0; // Le perdant ou le gagnant commence ? (À toi de voir)
}