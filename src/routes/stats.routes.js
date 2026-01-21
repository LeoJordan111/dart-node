const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');

// --- STATISTIQUES ---
router.get('/global', statsController.getGlobalStats); 
router.get('/last-game', statsController.getLastGameDetails);
router.get('/last-days', statsController.getLastDaysStats);
router.get('/checkouts', statsController.getCheckoutStats);
router.get('/legs', statsController.getLegStats);
router.get('/distribution', statsController.getScoreDistribution);
router.get('/precision', statsController.getPrecisionStats);

module.exports = router;