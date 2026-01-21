// --- ÉTAT INITIAL ---
export let state = {
    players: [],
    currentPlayerIndex: 0,
    roundNumber: 1,
    isMatchOver: false,
    config: {
        setsToWin: 1,
        legsPerSet: 3
    }
};

/**
 * INITIALISATION
 */
export function setupMatch(playerObjects, sets, legs, mode, startScore = 501) {

    state.players = playerObjects.map(function(p) {
        return {
            id: p.id,
            name: p.name,
            score: startScore,
            sets: 0,
            legs: 0,
            stats: { totalDarts: 0, pointsScored: 0 }
        };
    });

    state.config.setsToWin = sets;
    state.config.legsPerSet = legs;
    state.currentPlayerIndex = 0;
    state.roundNumber = 1;
    state.isMatchOver = false;
}

/**
 * ACTIONS DE SCORE
 */
export function getActivePlayer() {
    return state.players[state.currentPlayerIndex];
}

export function updatePlayerScore(points, dartsCount = 1) {
    const player = getActivePlayer();
    if (player) {
        player.score -= points;
        player.stats.pointsScored += points;
        //player.stats.totalDarts += dartsCount;
    }
}

export function nextTurn() {
    const totalPlayers = state.players.length;
    
    if (state.currentPlayerIndex === totalPlayers - 1) {
        state.roundNumber++;
    }

    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % totalPlayers;
}

/**
 * GESTION DES VICTOIRES
 */
export function winLeg(player) {
    player.legs++;

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

export function resetScoresForNewLeg(startScore = 501) {
    state.players.forEach(p => {
        p.score = startScore;
        p.stats.totalDarts = 0;
    });
    state.currentPlayerIndex = 0;
    state.roundNumber = 1;
}

export function undoLastDartScore(points) {
    const player = getActivePlayer();
    if (player) {
        player.score += points;
        player.stats.pointsScored -= points;
        if (player.stats.totalDarts > 0) player.stats.totalDarts--;
    }
}

export async function saveTurnToDatabase(turnData) {
    try {
        const response = await fetch('/api/games/turn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(turnData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || "Erreur lors de l'enregistrement");
        }
        
        return await response.json();
    } catch (error) {
        console.error("Détails de l'erreur Prisma/API:", error);
        alert("Erreur de sauvegarde : le tour n'a pas été enregistré en base de données.");
    }
}