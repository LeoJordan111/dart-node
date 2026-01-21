document.addEventListener('DOMContentLoaded', () => {
    loadPlayersForStats();
});

async function loadPlayersForStats() {
    const select = document.getElementById('player-stats-select');
    if (!select) return;

    try {
        const response = await fetch('/api/players');
        const players = await response.json();

        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.nickname;
            option.textContent = player.nickname;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Erreur lors du chargement des joueurs pour les stats:", err);
    }
}

function goToStats(nickname) {
    if (nickname) {
        window.location.href = `/stats?nickname=${encodeURIComponent(nickname)}`;
    }
}

async function loadPlayersForSetup() {
    const container = document.getElementById('player-checkboxes');
    
    if (!container) return; 

    try {
        const res = await fetch('/api/players');
        const players = await res.json();
        
        container.innerHTML = players.map(p => `
            <label>
                <input type="checkbox" name="players" value="${p.id}"> ${p.nickname}
            </label>
        `).join('<br>');
    } catch (error) {
        console.error("Erreur lors du chargement des joueurs :", error);
    }
}

async function startGame() {
    const type = document.getElementById('game-type').value;
    const setsToWin = document.getElementById('sets-to-win').value;
    const legsPerSet = document.getElementById('legs-per-set').value;
    
    const selectedPlayers = Array.from(document.querySelectorAll('input[name="players"]:checked'))
        .map(cb => parseInt(cb.value));

    if (selectedPlayers.length < 2) return alert("Sélectionnez au moins 2 joueurs !");

    const response = await fetch('/api/games/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type,
            setsToWin,
            legsPerSet,
            playerIds: selectedPlayers
        })
    });

    if (response.ok) {
        const gameData = await response.json();
        console.log("Partie créée avec succès :", gameData);
        
        document.getElementById('setup-container').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        
        initGameEngine(gameData);
    }
}

async function selectPlayerForStats() {
    const res = await fetch('/api/players');
    const players = await res.json();
    
    const name = prompt("De quel joueur voulez-vous voir les stats ?\n" + 
                        players.map(p => p.nickname).join(', '));
    
    if (name) {
        window.location.href = `/stats?nickname=${encodeURIComponent(name)}`;
    }
}

loadPlayersForSetup();