// --- VARIABLES GLOBALES ---
const params = new URLSearchParams(window.location.search);
const mode = params.get('mode') || 'pvp';

// Adaptation visuelle immédiate
document.addEventListener('DOMContentLoaded', () => {
    if (mode === 'solo') {
        document.getElementById('setup-title').innerText = "Mode Solo";
        document.getElementById('player-label').innerText = "Sélectionner votre profil";
        document.getElementById('instruction').innerText = "Choisissez 1 joueur.";
    } else {
        document.getElementById('setup-title').innerText = "Mode Versus";
    }
    loadPlayers();
});

// Chargement des joueurs depuis l'API
async function loadPlayers() {
    try {
        const response = await fetch('/api/players');
        const players = await response.json();
        const container = document.getElementById('player-checkboxes');
        
        container.innerHTML = players.map(p => `
            <label class="player-option">
                <input type="checkbox" name="players" value="${p.id}" data-nickname="${p.nickname}" onchange="checkSelectionLimit(event)">
                <span>${p.nickname}</span>
            </label>
        `).join('');
    } catch (err) {
        console.error("Erreur chargement joueurs:", err);
    }
}

// Limite le nombre de joueurs cochés selon le mode
function checkSelectionLimit(event) {
    const checked = document.querySelectorAll('input[name="players"]:checked');
    const limit = (mode === 'solo') ? 1 : 2;
    
    if (checked.length > limit) {
        event.target.checked = false;
        alert(`En mode ${mode}, vous ne pouvez sélectionner que ${limit} joueur(s).`);
    }
}

// Envoi au serveur pour créer la partie
async function validateAndStart() {
    const checkedInputs = Array.from(document.querySelectorAll('input[name="players"]:checked'));
    const limit = (mode === 'solo') ? 1 : 2;

    // 1. On vérifie d'abord si le nombre de joueurs est correct
    if (checkedInputs.length !== limit) {
        return alert(`Veuillez sélectionner exactement ${limit} joueur(s).`);
    }

    // 2. Maintenant qu'on est sûr qu'ils existent, on stocke les noms
    if (mode === 'solo') {
        const name1 = checkedInputs[0].getAttribute('data-nickname');
        localStorage.setItem('player1_name', name1);
        localStorage.setItem('currentPlayerNickname', name1); // Pour ton ancien code solo
    } else {
        localStorage.setItem('player1_name', checkedInputs[0].getAttribute('data-nickname'));
        localStorage.setItem('player2_name', checkedInputs[1].getAttribute('data-nickname'));
    }

    // 3. Préparation des données pour le serveur
    const payload = {
        type: document.getElementById('game-type').value,
        setsToWin: parseInt(document.getElementById('sets-to-win').value),
        legsPerSet: parseInt(document.getElementById('legs-per-set').value),
        playerIds: checkedInputs.map(input => input.value),
        mode: mode
    };

    // 4. Envoi au serveur
    try {
        const res = await fetch('/api/games/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const game = await res.json();
            // On ajoute le "type" (301, 501...) dans l'URL pour gameEngine.js
            window.location.href = `/game?id=${game.id}&sets=${payload.setsToWin}&legs=${payload.legsPerSet}&startScore=${payload.type}`;
        }
    } catch (err) {
        console.error("Erreur lors de la création de la partie:", err);
    }
}

// Gestion de l'ajout rapide (inchangée mais propre)
function toggleQuickAdd() {
    const form = document.getElementById('quick-add-player');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function addPlayerQuick() {
    const nicknameInput = document.getElementById('quick-nickname');
    const nickname = nicknameInput.value;
    
    if (!nickname) return alert("Veuillez entrer un pseudo");

    try {
        // AJOUT DE /register ICI
        const response = await fetch('/api/players/register', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname }) // On envoie juste le pseudo
        });

        if (response.ok) {
            nicknameInput.value = '';
            toggleQuickAdd(); 
            await loadPlayers(); // Recharge la liste pour voir le nouveau joueur
        } else {
            alert("Erreur lors de la création du joueur");
        }
    } catch (error) {
        console.error("Erreur:", error);
    }
}