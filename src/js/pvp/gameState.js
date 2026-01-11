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
        hundredPlus: 0 
    }
});

/**
 * ÉTAT INITIAL DU MATCH
 */
export let state = {
    players: [],
    currentPlayerIndex: 0,
    startingPlayerIndex: 0, // Qui a commencé le Leg actuel
    roundNumber: 1,
    isMatchOver: false,
    config: {
        setsToWin: 1,
        legsPerSet: 3
    }
};

/**
 * ACTIONS (Fonctions de modification)
 */

// Initialise les joueurs et la configuration au lancement du match
export function setupMatch(p1Name, p2Name, sets, legs) {
    const params = new URLSearchParams(window.location.search);
    const startScore = parseInt(params.get('startScore')) || 501;

    state.players = [
        createPlayer(1, p1Name),
        createPlayer(2, p2Name)
    ];

    // On applique le score de départ à tout le monde
    state.players.forEach(p => p.score = startScore);

    state.config.setsToWin = sets;
    state.config.legsPerSet = legs;
    state.startingPlayerIndex = 0; // Le joueur 1 commence le match
    state.currentPlayerIndex = 0;
    state.roundNumber = 1;
    state.isMatchOver = false;
}

// Retourne l'objet du joueur qui doit lancer
export function getActivePlayer() {
    return state.players[state.currentPlayerIndex];
}

// Retourne l'objet du joueur qui attend
export function getWaitingPlayer() {
    const waitingIndex = state.currentPlayerIndex === 0 ? 1 : 0;
    return state.players[waitingIndex];
}

// Alterne les joueurs à l'intérieur d'un tour
export function nextTurn() {
    if (state.currentPlayerIndex === 1) {
        state.roundNumber++;
    }
    state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
}

// Applique le score et met à jour les stats de points
export function updatePlayerScore(points) {
    const player = getActivePlayer();
    player.score -= points;
    player.stats.pointsScored += points;
}

/**
 * GESTION DES VICTOIRES DE MANCHES (LEGS ET SETS)
 */
export function winLeg(player) {
    player.legs++;
    
    // Vérifier si le set est gagné
    if (player.legs >= state.config.legsPerSet) {
        player.sets++;
        
        // Remet les legs à 0 pour les deux joueurs pour le nouveau set
        state.players.forEach(p => p.legs = 0);
        
        // Vérifier si le match est gagné
        if (player.sets >= state.config.setsToWin) {
            state.isMatchOver = true;
            return "MATCH_OVER";
        }
        return "SET_OVER";
    }
    return "LEG_OVER";
}

/**
 * RÉINITIALISATION POUR NOUVEAU LEG (AVEC ALTERNANCE)
 */
export function resetScoresForNewLeg(startScore = 501) {
    // 1. Remettre les scores au départ
    state.players.forEach(p => p.score = startScore);
    
    // 2. Alterner le joueur qui commence le Leg
    // Si l'index de départ était 0 (J1), il devient 1 (J2) et vice-versa
    state.startingPlayerIndex = (state.startingPlayerIndex === 0) ? 1 : 0;
    
    // 3. Le joueur courant devient celui qui commence
    state.currentPlayerIndex = state.startingPlayerIndex;
    
    state.roundNumber = 1;
    state.isMatchOver = false;
}