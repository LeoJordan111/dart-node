const prisma = require('../database/client');

const getPlayerStats = async (req, res) => {
    try {
        const { nickname } = req.query;

        const player = await prisma.player.findUnique({
            where: { nickname: nickname }
        });

        if (!player) {
            return res.status(404).json({ error: "Joueur non trouvé" });
        }

        const turns = await prisma.turn.findMany({
            where: { playerId: player.id },
            orderBy: { id: 'desc' },
            take: 50 
        });

        const totalPoints = turns.reduce((acc, t) => acc + t.points, 0);
        const totalDarts = turns.reduce((acc, t) => acc + t.dartsThrown, 0);
        const average = totalDarts > 0 ? (totalPoints / totalDarts * 3).toFixed(2) : "0.00";

        res.json({
            globalAverage: average,
            totalDarts: totalDarts,
            turns: turns
        });

    } catch (error) {
        console.error("Erreur Stats:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

module.exports = { getPlayerStats };