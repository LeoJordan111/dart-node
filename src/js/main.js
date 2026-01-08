// src/js/main.js

// Charger les joueurs au démarrage
async function loadPlayers() {
    try {
        const res = await fetch('/api/players');
        const players = await res.json();
        const list = document.getElementById('player-list');
        
        list.innerHTML = players.map(p => `
            <li>
                <strong>${p.nickname}</strong> 
                <span class="player-id">ID: ${p.id}</span>
            </li>
        `).join('');
    } catch (error) {
        console.error("Erreur lors du chargement:", error);
    }
}

// Envoyer un nouveau joueur
async function registerPlayer() {
    const input = document.getElementById('nickname');
    const nickname = input.value;

    if (!nickname) return alert("Choisis un pseudo !");

    try {
        const response = await fetch('/api/players/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname })
        });

        if (response.ok) {
            input.value = '';
            loadPlayers(); // Rafraîchir la liste
        } else {
            alert("Erreur lors de l'enregistrement");
        }
    } catch (error) {
        console.error("Erreur:", error);
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', loadPlayers);