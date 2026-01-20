const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');
const statsController = require('../controllers/stats.controller');

// --- JEU ---
router.post('/create', gameController.createGame);
router.post('/turn', gameController.saveTurn);
router.post('/:id/finish', gameController.finishGame);

// --- STATISTIQUES ---
router.get('/stats/global', statsController.getGlobalStats); 
router.get('/stats/last-game', statsController.getLastGameDetails);
router.get('/stats/last-days', statsController.getLastDaysStats);
router.get('/stats/checkouts', statsController.getCheckoutStats);
router.get('/stats/legs', statsController.getLegStats);
router.get('/stats/distribution', statsController.getScoreDistribution);

module.exports = router;