const prisma = require('../database/client');

/**
 * Crée une partie avec sa configuration, lie les joueurs 
 * et initialise le premier Set et le premier Leg.
 */
const createNewGame = async (gameConfig) => {
    const { type, playerIds, setsToWin, legsPerSet } = gameConfig;
    const startScore = parseInt(type) || 501;

    const game = await prisma.game.create({
        data: {
            type: startScore.toString(),
            status: "IN_PROGRESS",
            players: {
                create: playerIds.map(id => ({
                    player: { connect: { id: parseInt(id) } }
                }))
            },
            sets: {
                create: [{
                    legs: {
                        create: [{}]
                    }
                }]
            }
        },
        include: {
            sets: {
                include: { legs: true }
            }
        }
    });

    const firstSet = game.sets[0];
    const firstLeg = firstSet.legs[0];

    return {
        ...game,
        firstLegId: firstLeg.id
    };
};

/**
 * Historiques
 */
const getAllGames = async () => {
    return await prisma.game.findMany({
        include: {
            players: { include: { player: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};

module.exports = {
    createNewGame,
    getAllGames
};