document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const nickname = params.get('nickname');

    if (!nickname) {
        alert("Aucun joueur sélectionné");
        window.location.href = "/";
        return;
    }

    const titleElement = document.getElementById('stats-title');
    if (titleElement) {
        titleElement.innerText = `Stats de ${nickname}`;
    }

    loadStats(nickname);
});

async function loadStats(nickname) {
    const url = `/api/games/stats?nickname=${encodeURIComponent(nickname)}`;
    
    try {
        const response = await fetch(url);
        console.log("2. Appel de l'URL :", url);
        if (response.status === 404) {
            return;
        }
        const data = await response.json();
        console.log("Données reçues :", data);
        
        const historyBody = document.getElementById('stats-history-body');
        historyBody.innerHTML = '';

        data.turns.forEach(turn => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>ID: ${turn.id}</td>
                <td>${turn.dart1} | ${turn.dart2} | ${turn.dart3}</td>
                <td><strong>${turn.points}</strong></td>
                <td>${turn.remaining}</td>
                <td>${turn.isBust ? '❌' : '✅'}</td>
            `;
            historyBody.appendChild(tr);
        });
        
        document.getElementById('global-avg').innerText = data.globalAverage;
        document.getElementById('total-darts').innerText = data.totalDarts;

    } catch (err) {
        console.error("Erreur fetch:", err);
    }
}