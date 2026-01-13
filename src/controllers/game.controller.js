const prisma = require('../database/client'); 
const gameService = require('../services/game.service');

const createGame = async (req, res) => {
    try {
        const game = await gameService.createNewGame(req.body);
        res.status(201).json(game);
    } catch (error) {
        res.status(500).json({ error: "Erreur création partie", details: error.message });
    }
};

const saveTurn = async (req, res) => {
    const { legId, playerId, points, dartsThrown, remaining, isBust } = req.body;

    try {
        const result = await prisma.turn.create({
            data: {
                legId: parseInt(legId),
                playerId: parseInt(playerId),
                points: parseInt(points),
                dartsThrown: parseInt(dartsThrown) || 3, 
                remaining: parseInt(remaining) || 0,
                isBust: isBust || false
            }
        });
        res.json(result);
    } catch (error) {
        console.error("Détail erreur Prisma Turn:", error);
        res.status(500).json({ error: "Erreur lors de l'enregistrement de la volée", details: error.message });
    }
};

const finishGame = async (req, res) => {
    const { id } = req.params; 
    const { status } = req.body;

    try {
        const updatedGame = await prisma.game.update({
            where: { id: parseInt(id) },
            data: { 
                status: status || "FINISHED"
            }
        });
        res.json(updatedGame);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la clôture de la partie", details: error.message });
    }
};

module.exports = { 
    createGame, 
    saveTurn, 
    finishGame 
};