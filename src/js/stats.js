document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM chargé, recherche du nickname...");
    
    // On récupère le nickname dans l'URL (ex: stats.html?nickname=Léo)
    const params = new URLSearchParams(window.location.search);
    const nickname = params.get('nickname');

    if (nickname) {
        console.log("Nickname trouvé :", nickname);
        refreshStats(nickname);
    } else {
        console.error("Aucun nickname trouvé dans l'URL !");
        // Optionnel : redirection ou message si pas de joueur
        document.getElementById('stats-title').innerText = "Sélectionnez un joueur";
    }
});

async function refreshStats(nickname) {
    console.log(`--- Tentative de récupération des stats pour : ${nickname} ---`);
    
    const titleEl = document.getElementById('stats-title');
    if (titleEl) titleEl.innerText = `Stats de ${nickname}`;

    try {
        // 1. Appel des deux API en parallèle
        const [resGlobal, resLast] = await Promise.all([
            fetch(`/api/games/stats/global?nickname=${encodeURIComponent(nickname)}`),
            fetch(`/api/games/stats/last-game?nickname=${encodeURIComponent(nickname)}`)
        ]);

        const dataGlobal = await resGlobal.json();
        const dataLast = await resLast.json();

        // Debug : Affiche les résultats dans ta console (F12)
        console.log("Données Globales reçues :", dataGlobal);
        console.log("Données Dernier Match reçues :", dataLast);

        // 2. Remplissage de l'historique (Tableau du bas)
        if (dataGlobal.history) {
            renderHistory(dataGlobal.history);
        }

        // 3. Remplissage des cartes du haut (si elles existent)
        const globalAvgEl = document.getElementById('global-avg');
        const totalDartsEl = document.getElementById('total-darts');
        
        if (globalAvgEl) globalAvgEl.innerText = dataGlobal.globalAverage || "0.00";
        if (totalDartsEl) totalDartsEl.innerText = dataGlobal.totalDarts || "0";

        // 4. Remplissage du tableau de Performance (Général)
        // Note : On remplit même si dataLast est null pour remettre à zéro
        updatePerfRow('global-avg', dataGlobal.globalAverage);
        updatePerfRow('total-darts', dataGlobal.totalDarts);

        if (dataLast) {
            updatePerfRow('avg-9', dataLast.avg9);
            updatePerfRow('avg-12', dataLast.avg12);
            updatePerfRow('avg-15', dataLast.avg15);
            updatePerfRow('legs-won', dataLast.legsWon);
            
            // Mise à jour de la date dans l'en-tête du tableau
            const dateCol = document.querySelector('.date-col');
            if (dateCol && dataLast.date) {
                dateCol.innerText = new Date(dataLast.date).toLocaleDateString();
            }
        } else {
            console.warn("Aucune donnée trouvée pour le dernier match.");
        }

    } catch (err) {
        console.error("ERREUR lors de refreshStats :", err);
    }
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