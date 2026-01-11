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
    startingPlayerIndex: 0, // C'est l'index du joueur qui a le starter (🎯)
    roundNumber: 1,
    isMatchOver: false,
    config: {
        setsToWin: 1,
        legsPerSet: 3
    }
};

/**
 * ACTIONS
 */

export function setupMatch(p1Name, p2Name, sets, legs) {
    const params = new URLSearchParams(window.location.search);
    const startScore = parseInt(params.get('startScore')) || 501;

    state.players = [
        createPlayer(1, p1Name),
        createPlayer(2, p2Name)
    ];

    state.players.forEach(p => p.score = startScore);

    state.config.setsToWin = sets;
    state.config.legsPerSet = legs;
    
    // Au début du match, le Joueur 1 commence
    state.startingPlayerIndex = 0; 
    state.currentPlayerIndex = 0;
    state.roundNumber = 1;
    state.isMatchOver = false;
}

export function getActivePlayer() {
    return state.players[state.currentPlayerIndex];
}

export function getWaitingPlayer() {
    return state.players[state.currentPlayerIndex === 0 ? 1 : 0];
}

export function nextTurn() {
    if (state.currentPlayerIndex === 1) {
        state.roundNumber++;
    }
    state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
}

export function updatePlayerScore(points) {
    const player = getActivePlayer();
    player.score -= points;
    player.stats.pointsScored += points;
}

/**
 * GESTION DES VICTOIRES
 */
export function winLeg(player) {
    player.legs++;

    // Alternance du starter pour la manche suivante
    state.startingPlayerIndex = (state.startingPlayerIndex === 0) ? 1 : 0;
    
    // Le joueur qui commence la nouvelle manche est le nouveau starter
    state.currentPlayerIndex = state.startingPlayerIndex;

    if (player.legs >= state.config.legsPerSet) {
        player.sets++;
        state.players.forEach(p => p.legs = 0);
        
        if (player.sets >= state.config.setsToWin) {
            state.isMatchOver = true;
            return "MATCH_OVER";
        }
        return "SET_OVER";
    }
    return "LEG_OVER";
}

/**
 * RÉINITIALISATION POUR NOUVEAU LEG
 */
export function resetScoresForNewLeg(startScore = 501) {
    state.players.forEach(p => p.score = startScore);
    
    // On s'assure que le tour revient bien au starter actuel
    state.currentPlayerIndex = state.startingPlayerIndex;
    state.roundNumber = 1;
    state.isMatchOver = false;
}

export function undoLastDartScore(points) {
    const player = getActivePlayer();
    player.score += points;
    player.stats.pointsScored -= points;
    if (player.stats.totalDarts > 0) player.stats.totalDarts--;
}