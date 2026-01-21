document.addEventListener('DOMContentLoaded', async () => {

    await loadPlayersList();

    const params = new URLSearchParams(window.location.search);
    const nickname = params.get('nickname');

    if (nickname) {
        const select = document.getElementById('player-stats-select');
        select.value = nickname;
        refreshStats(nickname);
    } else {
        document.getElementById('stats-title').innerText = "Sélectionnez un joueur";
    }
});

async function loadPlayersList() {
    try {
        const res = await fetch('/api/players');
        const players = await res.json();
        const select = document.getElementById('player-stats-select');
        
        select.innerHTML = '<option value="">-- Choisir un joueur --</option>';
        
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.nickname; 
            option.textContent = player.nickname;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Erreur lors de la récupération des joueurs:", err);
    }
}

async function refreshStats(nickname) {
    const encodedNick = encodeURIComponent(nickname);

    Promise.all([
        fetchGlobalCards(encodedNick),     
        fetchPerformance(encodedNick),      
        fetchCheckouts(encodedNick),        
        fetchLegRecords(encodedNick),       
        fetchScoreDistribution(encodedNick),
        fetchPrecision(encodedNick)
    ]);
}

async function fetchGlobalCards(nick) {
    const res = await fetch(`/api/stats/global?nickname=${nick}`);
    const data = await res.json();
    if (data) {
        document.getElementById('global-avg').innerText = data.globalAverage || "0.00";
        document.getElementById('global-checkout').innerText = (data.checkoutRate || "0") + "%";
        document.getElementById('total-darts').innerText = data.totalDarts || "0";
        renderHistory(data.history);
    }
}

function updateTableHeader(daysData) {
    const headerRow = document.getElementById('perf-date-header');
    if (!headerRow) return;
    headerRow.innerHTML = '<th>Indicateurs</th>';
    daysData.forEach(day => {
        const dateStr = day.date 
            ? new Date(day.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
            : "--/--";
        headerRow.insertAdjacentHTML('beforeend', `<th class="date-col">${dateStr}</th>`);
    });
}

async function fetchPerformance(nick) {
    const res = await fetch(`/api/stats/last-days?nickname=${nick}&days=3`);
    const data = await res.json();
    while (data.length < 3) data.push({ date: null });
    
    updateTableHeader(data);
    const indicators = ['global-avg', 'total-darts', 'avg-9', 'avg-12', 'avg-15', 'legs-won', 'darts-per-leg'];
    indicators.forEach(ind => updatePerfRowMultiColumns(ind, data));
}

async function fetchCheckouts(nick) {
    const res = await fetch(`/api/stats/checkouts?nickname=${nick}&days=3`);
    const data = await res.json();
    if (!data) return;
    while (data.length < 3) data.push({ date: null });
    const indicators = ['checkout-rate', 'checkout-ratio', 'checkout-darts-avg', 'checkout-points-avg', 'checkout-max'];
    indicators.forEach(ind => updatePerfRowMultiColumns(ind, data));
}

async function fetchLegRecords(nick) {
    const res = await fetch(`/api/stats/legs?nickname=${nick}&days=3`);
    const data = await res.json();
    while (data.length < 3) data.push({ date: null });
    const indicators = ['leg-best', 'leg-best-avg', 'leg-hightscore'];
    indicators.forEach(ind => updatePerfRowMultiColumns(ind, data));
}

async function fetchScoreDistribution(nick) {
    const res = await fetch(`/api/stats/distribution?nickname=${nick}&days=3`);
    const data = await res.json();
    while (data.length < 3) data.push({ date: null });

    const allIndicators = [
        "score-noScore", "score-1-19", "score-20+", "score-40+", "score-60+", 
        "score-80+", "score-100+", "score-120+", "score-140+", "score-160+", "score-180",
        "score-noScore-pct", "score-1-19-pct", "score-20-pct", "score-40-pct", 
        "score-60-pct", "score-80-pct", "score-100-pct", "score-120-pct", 
        "score-140-pct", "score-160-pct", "score-180-pct"
    ];

    allIndicators.forEach(ind => {
        updatePerfRowMultiColumns(ind, data);
    });
}

async function fetchPrecision(nick) {
    const res = await fetch(`/api/stats/precision?nickname=${nick}&days=3`);
    const data = await res.json();
    if (!data) return;

    while (data.length < 3) data.push({ date: null });

    const indicators = [];
    for (let i = 1; i <= 20; i++) {
        indicators.push(`num-${i}-total`, `num-${i}-s`, `num-${i}-d`, `num-${i}-t`);
    }
    indicators.push('num-bull-total', 'num-bull-s', 'num-bull-d');

    indicators.forEach(ind => updatePerfRowMultiColumns(ind, data));
}

function updatePerfRowMultiColumns(indicator, daysData) {
    const row = document.querySelector(`tr[data-indicator="${CSS.escape(indicator)}"]`);
    if (!row) return;

    while (row.cells.length > 1) row.deleteCell(1);

    daysData.forEach(day => {
        const newCell = row.insertCell(-1);
        let value = day[indicator];
        
        if (value === null || value === undefined || day.date === null) {
            newCell.innerText = "-";
        } else if (indicator === 'checkout-rate') {
            newCell.innerText = Math.round(value) + "%";
        } else if (typeof value === 'string' && value.includes('%')) {
            newCell.innerText = value;
        } else if (typeof value === 'number' && !Number.isInteger(value)) {
            newCell.innerText = value.toFixed(2);
        } else {
            newCell.innerText = value;
        }
    });
}

function renderHistory(turns) {
    const body = document.getElementById('stats-history-body');
    if (!body) {
        console.error("ID 'stats-history-body' introuvable dans le HTML");
        return;
    }

    if (!turns || turns.length === 0) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center;">Aucune donnée historique</td></tr>';
        return;
    }

    body.innerHTML = turns.map(t => `
        <tr>
            <td>ID: ${t.id}</td>
            <td>${t.dart1} | ${t.dart2} | ${t.dart3}</td>
            <td><strong>${t.points}</strong></td>
            <td>${t.remaining !== null ? t.remaining : '-'}</td>
            <td>${t.isBust ? '❌' : '✅'}</td>
        </tr>
    `).join('');
}

function changePlayer(nickname) {
    if (!nickname) {
        document.getElementById('stats-title').innerText = "Sélectionnez un joueur";
        return;
    }

    document.getElementById('stats-title').innerText = `Stats de ${nickname}`;
    const newUrl = `${window.location.pathname}?nickname=${encodeURIComponent(nickname)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    refreshStats(nickname);
}
