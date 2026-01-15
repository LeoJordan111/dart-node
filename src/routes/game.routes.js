const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');
const statsController = require('../controllers/stats.controller');

// --- jeu ---
router.post('/create', gameController.createGame);
router.post('/turn', gameController.saveTurn);
router.post('/:id/finish', gameController.finishGame);

// --- statistiques ---
router.get('/stats/global', statsController.getGlobalStats); 
router.get('/stats/last-game', statsController.getLastGameDetails);
router.get('/stats/last-days', statsController.getLastDaysStats);

module.exports = router;