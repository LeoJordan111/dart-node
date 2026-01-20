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
            take: 50,
            include: { darts: true }
        });

        const totalPoints = turns.reduce((acc, t) => acc + t.points, 0);
        const totalDarts = turns.reduce((acc, t) => acc + t.dartsThrown, 0);
        
        const totalDoubleAttempts = turns.reduce((acc, t) => 
            acc + t.darts.filter(d => d.isCheckoutAttempt).length, 0
        );
        const totalCheckouts = turns.filter(t => t.remaining === 0 && !t.isBust).length;

        res.json({
            globalAverage: totalDarts > 0 ? (totalPoints / totalDarts * 3).toFixed(2) : "0.00",
            totalDarts: totalDarts,
            checkoutRate: totalDoubleAttempts > 0 ? ((totalCheckouts / totalDoubleAttempts) * 100).toFixed(2) : "0.00",
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
            include: { 
                turns: { 
                    where: { playerId: player.id }, 
                    orderBy: { id: 'asc' },
                    include: { darts: true }
                } 
            }
        });

        let sum9 = 0, sum12 = 0, sum15 = 0;
        let count9 = 0, count12 = 0, count15 = 0;
        let gameDoubleAttempts = 0;

        legs.forEach(leg => {
            const t = leg.turns;
            const pts = (n) => t.slice(0, n).reduce((acc, turn) => acc + turn.points, 0);

            if (t.length >= 3) { sum9 += (pts(3)/9)*3; count9++; }
            if (t.length >= 4) { sum12 += (pts(4)/12)*3; count12++; }
            if (t.length >= 5) { sum15 += (pts(5)/15)*3; count15++; }

            leg.turns.forEach(turn => {
                gameDoubleAttempts += turn.darts.filter(d => d.isCheckoutAttempt).length;
            });
        });

        const legsWon = legs.filter(l => l.winnerId === player.id).length;

        res.json({
            date: lastGameConn.game.createdAt,
            avg9: count9 > 0 ? (sum9 / count9).toFixed(2) : "-",
            avg12: count12 > 0 ? (sum12 / count12).toFixed(2) : "-",
            avg15: count15 > 0 ? (sum15 / count15).toFixed(2) : "-",
            legsWon: legsWon,
            checkoutRate: gameDoubleAttempts > 0 ? ((legsWon / gameDoubleAttempts) * 100).toFixed(2) : "0"
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur last game details" });
    }
};

// --- REQUÊTE 3 : DERNIERS JOURS (Performance Scoring) ---
const getLastDaysStats = async (req, res) => {
    try {
        const { nickname, days = 3 } = req.query;
        const player = await prisma.player.findUnique({ where: { nickname } });
        if (!player) return res.status(404).json({ error: "Joueur non trouvé" });

        const turns = await prisma.turn.findMany({
            where: { playerId: player.id },
            orderBy: { id: 'desc' },
            include: { 
                leg: { include: { set: { include: { game: true } } } }
            }
        });

        const groupedByDate = {};
        const legsData = {}; 

        turns.forEach(turn => {
            const dateKey = new Date(turn.leg.set.game.createdAt).toISOString().split('T')[0];
            
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = { 
                    date: dateKey, points: 0, darts: 0, checkouts: 0, 
                    sum9: 0, count9: 0,
                    sum12: 0, count12: 0,
                    sum15: 0, count15: 0
                };
            }

            if (!legsData[turn.legId]) legsData[turn.legId] = { points: [], date: dateKey };
            legsData[turn.legId].points.push(turn.points);

            groupedByDate[dateKey].points += turn.points;
            groupedByDate[dateKey].darts += turn.dartsThrown;

            if (turn.remaining === 0 && !turn.isBust) {
                groupedByDate[dateKey].checkouts += 1;
            }
        });

        Object.values(legsData).forEach(leg => {
            const p = leg.points.reverse();
            const date = leg.date;
            const calcSum = (numTurns) => p.slice(0, numTurns).reduce((a, b) => a + b, 0);

            if (p.length >= 3) { 
                groupedByDate[date].sum9 += (calcSum(3) / 9) * 3; 
                groupedByDate[date].count9++; 
            }
            if (p.length >= 4) { 
                groupedByDate[date].sum12 += (calcSum(4) / 12) * 3; 
                groupedByDate[date].count12++; 
            }
            if (p.length >= 5) { 
                groupedByDate[date].sum15 += (calcSum(5) / 15) * 3; 
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
            "legs-won": d.checkouts,
            "avg-9": d.count9 > 0 ? (d.sum9 / d.count9) : 0,
            "avg-12": d.count12 > 0 ? (d.sum12 / d.count12) : 0,
            "avg-15": d.count15 > 0 ? (d.sum15 / d.count15) : 0,
            "darts-per-leg": d.checkouts > 0 ? (d.darts / d.checkouts) : 0
        })));
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
};

const getCheckoutStats = async (req, res) => {
    try {
        const { nickname, days = 3 } = req.query;
        
        const turns = await prisma.turn.findMany({
            where: { player: { nickname: nickname } },
            orderBy: { id: 'desc' },
            include: { 
                leg: { include: { set: { include: { game: true } } } },
                darts: true 
            }
        });

        const groupedByDate = {};

        turns.forEach(turn => {
            const dateKey = new Date(turn.leg.set.game.createdAt).toISOString().split('T')[0];
            
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = { 
                    date: dateKey, 
                    checkouts: 0, 
                    attempts: 0, 
                    maxCheckout: 0 
                };
            }

            const turnAttempts = turn.darts.filter(d => d.isCheckoutAttempt).length;
            groupedByDate[dateKey].attempts += turnAttempts;

            if (turn.remaining === 0 && !turn.isBust) {
                groupedByDate[dateKey].checkouts += 1;
                if (turn.points > groupedByDate[dateKey].maxCheckout) {
                    groupedByDate[dateKey].maxCheckout = turn.points;
                }
            }
        });

        const sortedDays = Object.values(groupedByDate)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, parseInt(days));

        res.json(sortedDays.map(d => ({
            date: d.date,
            "checkout-rate": d.attempts > 0 ? Math.round((d.checkouts / d.attempts) * 100) : 0,
            "checkout-ratio": `${d.checkouts}/${d.attempts}`,
            "checkout-avg": d.checkouts > 0 ? (d.attempts / d.checkouts).toFixed(1) : "-",
            "checkout-max": d.maxCheckout || "-"
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * REQUÊTE : SPÉCIFIQUE LEGS
 * Calcule le meilleur leg, la moyenne du meilleur leg et le highscore
 */
const getLegStats = async (req, res) => {
    try {
        const { nickname, days = 3 } = req.query;

        const turns = await prisma.turn.findMany({
            where: { player: { nickname: nickname } },
            orderBy: { id: 'desc' },
            include: { 
                leg: { include: { set: { include: { game: true } } } }
            }
        });

        const groupedByDate = {};
        const legsData = {};

        turns.forEach(turn => {
            const dateKey = new Date(turn.leg.set.game.createdAt).toISOString().split('T')[0];
            
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = { 
                    date: dateKey, 
                    bestLegDarts: Infinity, 
                    highScore: 0 
                };
            }

            if (turn.points > groupedByDate[dateKey].highScore) {
                groupedByDate[dateKey].highScore = turn.points;
            }

            if (!legsData[turn.legId]) {
                legsData[turn.legId] = { darts: 0, date: dateKey, isFinished: false };
            }
            legsData[turn.legId].darts += turn.dartsThrown;
            if (turn.remaining === 0 && !turn.isBust) {
                legsData[turn.legId].isFinished = true;
            }
        });

        Object.values(legsData).forEach(leg => {
            if (leg.isFinished && leg.darts < groupedByDate[leg.date].bestLegDarts) {
                groupedByDate[leg.date].bestLegDarts = leg.darts;
            }
        });

        const sortedDays = Object.values(groupedByDate)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, parseInt(days));

        res.json(sortedDays.map(d => ({
            date: d.date,
            "leg-best": d.bestLegDarts === Infinity ? "-" : d.bestLegDarts,
            "leg-best-avg": d.bestLegDarts === Infinity ? "-" : (501 / d.bestLegDarts * 3).toFixed(2),
            "leg-hightscore": d.highScore
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * REQUÊTE : DISTRIBUTION DES SCORES
 * Compte le nombre de volées par palier et calcule les pourcentages
 */
const getScoreDistribution = async (req, res) => {
    try {
        const { nickname, days = 3 } = req.query;

        const turns = await prisma.turn.findMany({
            where: { player: { nickname: nickname } },
            orderBy: { id: 'desc' },
            include: { 
                leg: { include: { set: { include: { game: true } } } }
            }
        });

        const groupedByDate = {};

        turns.forEach(turn => {
            const dateKey = new Date(turn.leg.set.game.createdAt).toISOString().split('T')[0];
            
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = { 
                    date: dateKey,
                    totalTurns: 0,
                    "score-noScore": 0, "score-1-19": 0, "score-20+": 0,
                    "score-40+": 0, "score-60+": 0, "score-80+": 0,
                    "score-100+": 0, "score-120+": 0, "score-140+": 0,
                    "score-160+": 0, "score-180": 0
                };
            }

            const d = groupedByDate[dateKey];
            const p = turn.points;
            d.totalTurns++;

            if (p === 0) d["score-noScore"]++;
            else if (p < 20) d["score-1-19"]++;
            else if (p === 180) d["score-180"]++;
            else if (p >= 160) d["score-160+"]++;
            else if (p >= 140) d["score-140+"]++;
            else if (p >= 120) d["score-120+"]++;
            else if (p >= 100) d["score-100+"]++;
            else if (p >= 80) d["score-80+"]++;
            else if (p >= 60) d["score-60+"]++;
            else if (p >= 40) d["score-40+"]++;
            else if (p >= 20) d["score-20+"]++;
        });

        const sortedDays = Object.values(groupedByDate)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, parseInt(days));

        res.json(sortedDays.map(d => {
            const stats = { date: d.date };
            
            const mapping = [
                { htmlNb: "score-noScore", htmlPct: "score-noScore-pct", raw: "score-noScore" },
                { htmlNb: "score-1-19",    htmlPct: "score-1-19-pct",    raw: "score-1-19" },
                { htmlNb: "score-20+",     htmlPct: "score-20-pct",      raw: "score-20+" },
                { htmlNb: "score-40+",     htmlPct: "score-40-pct",      raw: "score-40+" },
                { htmlNb: "score-60+",     htmlPct: "score-60-pct",      raw: "score-60+" },
                { htmlNb: "score-80+",     htmlPct: "score-80-pct",      raw: "score-80+" },
                { htmlNb: "score-100+",    htmlPct: "score-100-pct",     raw: "score-100+" },
                { htmlNb: "score-120+",    htmlPct: "score-120-pct",     raw: "score-120+" },
                { htmlNb: "score-140+",    htmlPct: "score-140-pct",     raw: "score-140+" },
                { htmlNb: "score-160+",    htmlPct: "score-160-pct",     raw: "score-160+" },
                { htmlNb: "score-180",     htmlPct: "score-180-pct",     raw: "score-180" }
            ];

            mapping.forEach(m => {
                stats[m.htmlNb] = d[m.raw]; 
                stats[m.htmlPct] = d.totalTurns > 0 
                    ? ((d[m.raw] / d.totalTurns) * 100).toFixed(1) + "%" 
                    : "0%";
            });

            return stats;
        }));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    getGlobalStats, 
    getLastGameDetails, 
    getLastDaysStats, 
    getCheckoutStats,
    getLegStats,
    getScoreDistribution
};