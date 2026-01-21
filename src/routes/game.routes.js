const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');
const statsController = require('../controllers/stats.controller');

// --- JEU ---
router.post('/create', gameController.createGame);
router.post('/turn', gameController.saveTurn);
router.post('/:id/finish', gameController.finishGame);

module.exports = router;