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

// --- REQUÊTE 2 : DERNIER MATCH ---
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

// --- REQUÊTE 3 : 3 DERNIER JOURS ---
const getLastDaysStats = async (req, res) => {
    try {
        const { nickname, days = 3 } = req.query;
        const player = await prisma.player.findUnique({ where: { nickname } });
        if (!player) return res.status(404).json({ error: "Joueur non trouvé" });

        const turns = await prisma.turn.findMany({
            where: { playerId: player.id },
            orderBy: { id: 'desc' },
            include: { leg: { include: { set: { include: { game: true } } } } }
        });

        const groupedByDate = {};
        const legsData = {}; 

        turns.forEach(turn => {
            const dateKey = new Date(turn.leg.set.game.createdAt).toISOString().split('T')[0];
            
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = { 
                    date: dateKey, points: 0, darts: 0, checkouts: 0, 
                    doubleAttempts: 0, 
                    sum9: 0, count9: 0,
                    sum12: 0, count12: 0,
                    sum15: 0, count15: 0
                };
            }

            if (!legsData[turn.legId]) legsData[turn.legId] = { points: [], date: dateKey };
            legsData[turn.legId].points.push(turn.points);

            groupedByDate[dateKey].points += turn.points;
            groupedByDate[dateKey].darts += turn.dartsThrown;
            groupedByDate[dateKey].doubleAttempts += turn.doubleAttempts || 0;
            if (turn.remaining === 0 && !turn.isBust) groupedByDate[dateKey].checkouts += 1;
        });

        
        Object.values(legsData).forEach(leg => {
            const p = leg.points.reverse(); 
            const date = leg.date;

            const calcAvg = (numTurns) => p.slice(0, numTurns).reduce((a, b) => a + b, 0);

            if (p.length >= 3) { 
                groupedByDate[date].sum9 += (calcAvg(3) / 9) * 3; 
                groupedByDate[date].count9++; 
            }
            if (p.length >= 4) { 
                groupedByDate[date].sum12 += (calcAvg(4) / 12) * 3; 
                groupedByDate[date].count12++; 
            }
            if (p.length >= 5) { 
                groupedByDate[date].sum15 += (calcAvg(5) / 15) * 3; 
                groupedByDate[date].count15++; 
            }
        });

        const sortedDays = Object.values(groupedByDate)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, parseInt(days));

        res.json(sortedDays.map(d => ({
            date: d.date,
            "global-avg": d.darts > 0 ? (d.points / d.darts * 3) : 0,
            "total-darts": d.darts,
            "checkout-rate": d.doubleAttempts > 0 ? Math.round((d.checkouts / d.doubleAttempts) * 100) : 0,
            "legs-won": d.checkouts,
            "avg-9": d.count9 > 0 ? (d.sum9 / d.count9) : 0,
            "avg-12": d.count12 > 0 ? (d.sum12 / d.count12) : 0,
            "avg-15": d.count15 > 0 ? (d.sum15 / d.count15) : 0,
            "darts-per-leg": d.checkouts > 0 ? (d.darts / d.checkouts) : 0
        })));
    } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { getGlobalStats, getLastGameDetails, getLastDaysStats };