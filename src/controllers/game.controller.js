const prisma = require('../database/client'); 
const gameService = require('../services/game.service');
const TimeService = require('../services/time.service');

const createGame = async (req, res) => {
    try {
        // 1. On prépare les données avec la date locale
        const gameData = {
            ...req.body,
            createdAt: TimeService.getLocalDate() 
        };
        
        // 2. On envoie tout au service
        const game = await gameService.createNewGame(gameData);
        res.status(201).json(game);
    } catch (error) {
        res.status(500).json({ error: "Erreur création partie", details: error.message });
    }
};

const saveTurn = async (req, res) => {
    const { legId, playerId, points, dartsThrown, remaining, isBust, darts } = req.body;

    try {
        const result = await prisma.turn.create({
            data: {
                legId: parseInt(legId),
                playerId: parseInt(playerId),
                points: parseInt(points),
                dartsThrown: parseInt(dartsThrown) || 3, 
                remaining: parseInt(remaining) || 0,
                isBust: isBust || false,
                createdAt: TimeService.getLocalDate(),
                dart1: parseInt(req.body.dart1) || 0,
                multiplier1: parseInt(req.body.multiplier1) || 1,
                dart2: parseInt(req.body.dart2) || 0,
                multiplier2: parseInt(req.body.multiplier2) || 1,
                dart3: parseInt(req.body.dart3) || 0,
                multiplier3: parseInt(req.body.multiplier3) || 1,
                darts: {
                    create: (darts || []).map(d => ({
                        value: parseInt(d.value) || 0,
                        multiplier: parseInt(d.multiplier) || 1,
                        isCheckoutAttempt: d.isCheckoutAttempt || false
                    }))
                }
            },
            include: { darts: true }
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Erreur volée", details: error.message });
    }
};

const finishGame = async (req, res) => {
    const { id } = req.params; 
    const { status } = req.body;
    try {
        const updatedGame = await prisma.game.update({
            where: { id: parseInt(id) },
            data: { 
                status: status || "FINISHED",
                updatedAt: TimeService.getLocalDate()
            }
        });
        res.json(updatedGame);
    } catch (error) {
        res.status(500).json({ error: "Erreur clôture", details: error.message });
    }
};

module.exports = { createGame, saveTurn, finishGame };