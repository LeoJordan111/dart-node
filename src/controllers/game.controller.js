const gameService = require('../services/game.service');

const createGame = async (req, res) => {
    try {
        const game = await gameService.createNewGame(req.body);
        res.status(201).json(game);
    } catch (error) {
        res.status(500).json({ error: "Erreur création partie", details: error.message });
    }
};

module.exports = { createGame };