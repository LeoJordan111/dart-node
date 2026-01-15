document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM chargé, recherche du nickname...");
    
    const params = new URLSearchParams(window.location.search);
    const nickname = params.get('nickname');

    if (nickname) {
        console.log("Nickname trouvé :", nickname);
        refreshStats(nickname);
    } else {
        console.error("Aucun nickname trouvé dans l'URL !");
        document.getElementById('stats-title').innerText = "Sélectionnez un joueur";
    }
});



async function refreshStats(nickname) {
    try {
        const resLastDays = await fetch(`/api/games/stats/last-days?nickname=${encodeURIComponent(nickname)}&days=3`);
        let daysData = await resLastDays.json();

        while (daysData.length < 3) {
            daysData.push({ date: null }); 
        }

        const headerRow = document.getElementById('perf-date-header');
        headerRow.innerHTML = '<th>Indicateurs</th>';
        
        daysData.forEach(day => {
            const dateStr = day.date 
                ? new Date(day.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                : "--/--";
            headerRow.insertAdjacentHTML('beforeend', `<th class="date-col">${dateStr}</th>`);
        });

        const indicators = [
            'global-avg', 
            'checkout-rate', 
            'total-darts', 
            'avg-9', 
            'avg-12', 
            'avg-15', 
            'legs-won', 
            'darts-per-leg'
        ];

        indicators.forEach(ind => updatePerfRowMultiColumns(ind, daysData));

    } catch (err) { 
        console.error("Erreur stats:", err); 
    }
}
function updatePerfRowMultiColumns(indicator, daysData) {
    const row = document.querySelector(`tr[data-indicator="${indicator}"]`);
    if (!row) return;

    while (row.cells.length > 1) row.deleteCell(1);

    daysData.forEach(day => {
        const newCell = row.insertCell(-1);
        let value = day[indicator];
        
        if (value === null || value === undefined) {
            newCell.innerText = "-";
        } else if (indicator.includes('avg') || indicator.includes('darts-per-leg')) {
            newCell.innerText = parseFloat(value).toFixed(2);
        } else if (indicator === 'checkout-rate') {
            newCell.innerText = value + "%";
        } else {
            newCell.innerText = value;
        }
    });
}

function updatePerfRow(indicator, value) {
    const row = document.querySelector(`tr[data-indicator="${indicator}"]`);
    if (row && row.cells[1]) {
        row.cells[1].innerText = value !== undefined && value !== null ? value : "-";
        console.log(`MAJ Tableau Performance : ${indicator} -> ${value}`);
    }
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
