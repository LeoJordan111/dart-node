const playerService = require('../services/player.service');

const register = async (req, res) => {
  try {
    let { nickname } = req.body;

    nickname = nickname ? nickname.trim() : null;

    if (!nickname) {
        return res.status(400).json({ error: "Le pseudo est requis" });
    }

    if (nickname.length < 2 || nickname.length > 20) {
        return res.status(400).json({ error: "Le pseudo doit faire entre 2 et 20 caractères" });
    }

    const safePattern = /^[a-zA-Z0-9À-ÿ\s-]+$/;
    if (!safePattern.test(nickname)) {
        return res.status(400).json({ error: "Le pseudo contient des caractères non autorisés" });
    }

    const newPlayer = await playerService.createPlayer(nickname);
    res.status(201).json(newPlayer);

  } catch (error) {
    if (error.message.includes('unique constraint') || error.code === 'P2002') {
        return res.status(409).json({ error: "Ce pseudo existe déjà" });
    }

    res.status(400).json({ 
        error: "Erreur lors de la création du joueur", 
        details: error.message 
    });
  }
};

const getPlayers = async (req, res) => {
    try {
        const players = await playerService.getAllPlayers();
        res.status(200).json(players);
    } catch (error) {
        res.status(500).json({ 
            error: "Erreur lors de la récupération des joueurs",
            details: error.message 
        });
    }
};

module.exports = {
  register,
  getPlayers
};