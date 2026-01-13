document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const nicknameFromUrl = params.get('nickname');

    if (!nicknameFromUrl) {
        window.location.href = "/";
        return;
    }

    // 1. On remplit d'abord le menu déroulant
    await populatePlayerSelector(nicknameFromUrl);

    // 2. On charge les données du joueur sélectionné
    loadStats(nicknameFromUrl);
});

// Remplit le <select> avec tous les joueurs de la BD
async function populatePlayerSelector(currentNickname) {
    const select = document.getElementById('player-stats-select');
    if (!select) return;

    try {
        const response = await fetch('/api/players');
        const players = await response.json();

        select.innerHTML = ''; // On vide au cas où

        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.nickname;
            option.textContent = player.nickname;
            
            // On sélectionne par défaut le joueur qui est dans l'URL
            if (player.nickname === currentNickname) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Erreur chargement liste joueurs:", err);
    }
}

// Fonction appelée au changement du menu déroulant
function changePlayer(newNickname) {
    // On met à jour l'URL pour que le rafraîchissement fonctionne aussi
    const newUrl = `${window.location.pathname}?nickname=${encodeURIComponent(newNickname)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    // On met à jour le titre et les données
    document.getElementById('stats-title').innerText = `Stats de ${newNickname}`;
    loadStats(newNickname);
}

async function loadStats(nickname) {
    const url = `/api/games/stats?nickname=${encodeURIComponent(nickname)}`;
    document.getElementById('stats-title').innerText = `Stats de ${nickname}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erreur serveur");
        
        const data = await response.json();
        
        // Remplissage du tableau
        const historyBody = document.getElementById('stats-history-body');
        historyBody.innerHTML = '';

        if (data.turns && data.turns.length > 0) {
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
        } else {
            historyBody.innerHTML = '<tr><td colspan="5">Aucune donnée pour ce joueur</td></tr>';
        }
        
        // Mise à jour des compteurs globaux
        document.getElementById('global-avg').innerText = data.globalAverage || "0.00";
        document.getElementById('total-darts').innerText = data.totalDarts || 0;

    } catch (err) {
        console.error("Erreur fetch stats:", err);
    }
}