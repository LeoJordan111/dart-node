const prisma = require('../database/client');

/**
 * Crée une partie avec sa configuration, lie les joueurs 
 * et initialise le premier Set et le premier Leg.
 */
const createNewGame = async (gameConfig) => {
    // On extrait les données envoyées par le menu (Front-end)
    // On s'assure que startScore est un nombre
    const { type, playerIds, setsToWin, legsPerSet } = gameConfig;
    const startScore = parseInt(type) || 501;

    return await prisma.game.create({
        data: {
            type: startScore.toString(),
            status: "IN_PROGRESS",
            // 1. Création du lien dans la table de jointure GamePlayer
            players: {
                create: playerIds.map(id => ({
                    player: { connect: { id: parseInt(id) } }
                }))
            },
            // 2. Création de la hiérarchie initiale (Set 1 -> Leg 1)
            sets: {
                create: [{
                    legs: {
                        create: [{
                            // On pourrait ajouter d'autres infos ici plus tard
                        }]
                    }
                }]
            }
        },
        // On demande à Prisma de nous renvoyer l'objet complet avec ses relations
        include: {
            players: {
                include: { player: true }
            },
            sets: {
                include: { legs: true }
            }
        }
    });
};

/**
 * Récupère toutes les parties (historique)
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