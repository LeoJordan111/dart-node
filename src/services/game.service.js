const prisma = require('../database/client');
const TimeService = require('./time.service');

const createNewGame = async (gameConfig) => {
    const { type, playerIds, createdAt } = gameConfig;
    const startScore = parseInt(type) || 501;
    
    // Si le contrôleur a envoyé une date, on l'utilise, sinon on en génère une
    const localNow = createdAt || TimeService.getLocalDate();

    const game = await prisma.game.create({
        data: {
            type: startScore.toString(),
            status: "IN_PROGRESS",
            createdAt: localNow, // Utilise la date unique
            players: {
                create: playerIds.map(id => ({
                    player: { connect: { id: parseInt(id) } }
                }))
            },
            sets: {
                create: [{
                    createdAt: localNow, // Même heure pour le set
                    legs: {
                        create: [{
                            createdAt: localNow // Même heure pour le leg
                        }]
                    }
                }]
            }
        },
        include: {
            sets: { include: { legs: true } }
        }
    });

    const firstLeg = game.sets[0].legs[0];
    return { ...game, firstLegId: firstLeg.id };
};

const getAllGames = async () => {
    const games = await prisma.game.findMany({
        include: { players: { include: { player: true } } },
        orderBy: { createdAt: 'desc' }
    });

    return games.map(game => ({
        ...game,
        duration: game.status === "FINISHED" 
            ? TimeService.calculateDuration(game.createdAt, game.updatedAt) 
            : "En cours"
    }));
};

module.exports = { createNewGame, getAllGames };