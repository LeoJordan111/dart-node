// 1. On récupère le mode dans l'URL (ex: setup.html?mode=multi)
const params = new URLSearchParams(window.location.search);
const mode = params.get('mode') || 'multi'; 

document.addEventListener('DOMContentLoaded', () => {
    // 2. On appelle la fonction pour charger les joueurs de la BD
    loadPlayers();
});

// --- CETTE FONCTION REPARE TON AFFICHAGE ---
async function loadPlayers() {
    try {
        const response = await fetch('/api/players'); // Appel à ta BD
        const players = await response.json();
        
        const container = document.getElementById('player-checkboxes');
        if (!container) return console.error("Le div 'player-checkboxes' n'existe pas dans le HTML");

        // On crée les cases à cocher pour chaque joueur trouvé
        container.innerHTML = players.map(p => `
            <label class="player-option">
                <input type="checkbox" name="players" value="${p.id}" data-nickname="${p.nickname}">
                <span>${p.nickname}</span>
            </label>
        `).join('');
    } catch (err) {
        console.error("Erreur chargement joueurs:", err);
    }
}

// --- TA FONCTION DE VALIDATION (NETTOYÉE) ---
async function validateAndStart() {
    const checkedInputs = Array.from(document.querySelectorAll('input[name="players"]:checked'));
    const nbPlayers = checkedInputs.length;

    if (nbPlayers === 0) return alert("Veuillez sélectionner au moins un joueur.");

    // On prépare le passage vers la page de jeu
    localStorage.clear(); 
    localStorage.setItem('nb_players', nbPlayers);
    
    checkedInputs.forEach((input, index) => {
        localStorage.setItem(`player${index + 1}_name`, input.getAttribute('data-nickname'));
    });

    const payload = {
        type: document.getElementById('game-type').value,
        setsToWin: parseInt(document.getElementById('sets-to-win').value) || 1,
        legsPerSet: parseInt(document.getElementById('legs-per-set').value) || 3,
        playerIds: checkedInputs.map(input => parseInt(input.value)),
        mode: nbPlayers === 1 ? 'solo' : 'multi'
    };

    try {
        const res = await fetch('/api/games/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const game = await res.json();
            // Si 1 joueur -> gameSolo.html | Si 2+ joueurs -> gameMulti.html
            const route = (nbPlayers === 1) ? '/gameSolo' : '/gameMulti';
            
            const queryParams = new URLSearchParams({
                id: game.id,
                legId: game.firstLegId || 0,
                startScore: payload.type,
                mode: payload.mode
            });

            window.location.href = `${route}?${queryParams.toString()}`;
        }
    } catch (err) { console.error("Erreur lors de la création de la partie:", err); }
}

// Fonctions utilitaires pour le bouton "Ajouter Joueur" rapide
function toggleQuickAdd() {
    const form = document.getElementById('quick-add-player');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function addPlayerQuick() {
    const nicknameInput = document.getElementById('quick-nickname');
    const nickname = nicknameInput.value;
    if (!nickname) return alert("Pseudo vide");

    await fetch('/api/players/register', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname })
    });
    nicknameInput.value = '';
    toggleQuickAdd();
    loadPlayers(); // On recharge la liste après l'ajout
}