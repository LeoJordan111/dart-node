const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');
const rateLimit = require('express-rate-limit');

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5, 
  message: { error: "Trop de comptes créés, réessayez plus tard." }
});

router.post('/register', playerController.register);

router.get('/', playerController.getPlayers);

module.exports = router;