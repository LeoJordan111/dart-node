async function loadPlayersForSetup() {
    const res = await fetch('/api/players');
    const players = await res.json();
    const container = document.getElementById('player-checkboxes');
    
    container.innerHTML = players.map(p => `
        <label>
            <input type="checkbox" name="players" value="${p.id}"> ${p.nickname}
        </label>
    `).join('<br>');
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

loadPlayersForSetup();