/* --- ÉTAT DU JEU (PRÊT POUR LE MULTI) --- */
export const gameState = {
    players: [],
    currentPlayerIndex: 0,
    startingScore: 501,
    isGameOver: false,
    history: []
};

/* --- LOGIQUE SOLO --- */
/*
const soloConfig = {
    isSolo: true,
    active: false
};
*/

/**
 * 1. CHARGEMENT DES JOUEURS DEPUIS LA BD
 */
async function loadPlayers() {
    try {
        const response = await fetch('/api/players');
        if (!response.ok) throw new Error("Erreur réseau");
        
        const players = await response.json();
        const container = document.getElementById('player-checkboxes');
        
        if (!container) return;

        container.innerHTML = players.map(p => `
            <label class="player-option">
                <input type="checkbox" name="players" value="${p.id}" data-nickname="${p.nickname}">
                <span>${p.nickname}</span>
            </label>
        `).join('');
        
        console.log(`${players.length} joueurs chargés.`);
    } catch (err) {
        console.error("Erreur chargement joueurs:", err);
    }
}

/**
 * 2. VALIDATION ET LANCEMENT
 */
async function validateAndStart() {
    const checkedInputs = Array.from(document.querySelectorAll('input[name="players"]:checked'));
    const nbPlayers = checkedInputs.length;

    if (nbPlayers === 0) {
        return alert("Veuillez sélectionner au moins un joueur.");
    }

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
        mode: 'multi'
    };

    try {
        const res = await fetch('/api/games/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const game = await res.json();
            const route = '/gameMulti'; 
            
            const queryParams = new URLSearchParams({
                id: game.id,
                legId: game.firstLegId || 0,
                startScore: payload.type
            });

            window.location.href = `${route}?${queryParams.toString()}`;
        }
    } catch (err) { 
        console.error("Erreur création partie:", err); 
    }
}

/**
 * 3. GESTION DE L'INTERFACE ET EXPOSITION MONDIALE
 */
function toggleQuickAdd() {
    const form = document.getElementById('quick-add-player');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

async function addPlayerQuick() {
    const nicknameInput = document.getElementById('quick-nickname');
    const nickname = nicknameInput.value;
    if (!nickname) return alert("Pseudo vide");

    try {
        const res = await fetch('/api/players/register', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname })
        });
        if (res.ok) {
            nicknameInput.value = '';
            toggleQuickAdd();
            loadPlayers();
        }
    } catch (err) {
        console.error("Erreur ajout rapide:", err);
    }
}

document.addEventListener('DOMContentLoaded', loadPlayers);

window.validateAndStart = validateAndStart;
window.toggleQuickAdd = toggleQuickAdd;
window.addPlayerQuick = addPlayerQuick;