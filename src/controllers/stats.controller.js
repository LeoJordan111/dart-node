const prisma = require('../database/client');

// --- REQUÊTE 1 : HISTORIQUE ET GLOBAL ---
const getGlobalStats = async (req, res) => {
    try {
        const { nickname } = req.query;
        const player = await prisma.player.findUnique({ where: { nickname } });
        if (!player) return res.status(404).json({ error: "Joueur non trouvé" });

        const turns = await prisma.turn.findMany({
            where: { playerId: player.id },
            orderBy: { id: 'desc' },
            take: 50 
        });

        const totalPoints = turns.reduce((acc, t) => acc + t.points, 0);
        const totalDarts = turns.reduce((acc, t) => acc + t.dartsThrown, 0);

        res.json({
            globalAverage: totalDarts > 0 ? (totalPoints / totalDarts * 3).toFixed(2) : "0.00",
            totalDarts: totalDarts,
            history: turns
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur global stats" });
    }
};

// --- REQUÊTE 2 : DERNIER MATCH (Détails 9/12/15 par Leg) ---
const getLastGameDetails = async (req, res) => {
    try {
        const { nickname } = req.query;
        const player = await prisma.player.findUnique({ where: { nickname } });
        if (!player) return res.status(404).json({ error: "Joueur non trouvé" });

        const lastGameConn = await prisma.gamePlayer.findFirst({
            where: { playerId: player.id },
            orderBy: { gameId: 'desc' },
            include: { game: true }
        });

        if (!lastGameConn) return res.json(null);

        const legs = await prisma.leg.findMany({
            where: { set: { gameId: lastGameConn.gameId } },
            include: { turns: { where: { playerId: player.id }, orderBy: { id: 'asc' } } }
        });

        let sum9 = 0, sum12 = 0, sum15 = 0;
        let count9 = 0, count12 = 0, count15 = 0;

        legs.forEach(leg => {
            const t = leg.turns;
            const pts = (n) => t.slice(0, n).reduce((acc, turn) => acc + turn.points, 0);

            if (t.length >= 3) { sum9 += (pts(3)/9)*3; count9++; }
            if (t.length >= 4) { sum12 += (pts(4)/12)*3; count12++; }
            if (t.length >= 5) { sum15 += (pts(5)/15)*3; count15++; }
        });

        res.json({
            date: lastGameConn.game.createdAt,
            avg9: count9 > 0 ? (sum9 / count9).toFixed(2) : "-",
            avg12: count12 > 0 ? (sum12 / count12).toFixed(2) : "-",
            avg15: count15 > 0 ? (sum15 / count15).toFixed(2) : "-",
            legsWon: legs.filter(l => l.winnerId === player.id).length
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur last game details" });
    }
};

module.exports = { getGlobalStats, getLastGameDetails };