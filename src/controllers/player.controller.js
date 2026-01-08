const playerService = require('../services/player.service');

const register = async (req, res) => {
  console.log("Contenu reçu :", req.body);
  try {
    const { nickname, email } = req.body;
    const newPlayer = await playerService.createPlayer(nickname, email);
    res.status(201).json(newPlayer);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la création du joueur", details: error.message });
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