const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');

router.post('/register', playerController.register);

router.get('/', playerController.getPlayers);

module.exports = router;