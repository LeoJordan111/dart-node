/* --- ÉTAT DU JEU --- */
export const gameState = {
    players: [],
    currentPlayerIndex: 0,
    startingScore: 501,
    isGameOver: false,
    history: []
};

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
    if (checkedInputs.length === 0) return alert("Veuillez sélectionner au moins un joueur.");

    const gameType = document.getElementById('game-type').value;
    const sets = parseInt(document.getElementById('sets-to-win')?.value) || 1;
    const legs = parseInt(document.getElementById('legs-per-set')?.value) || 3;

    const payload = {
        gameMode: gameType,
        config: {
            startScore: isNaN(gameType) ? 0 : parseInt(gameType), 
            setsToWin: sets,
            legsPerSet: legs
        },
        playerIds: checkedInputs.map(input => parseInt(input.value))
    };

    localStorage.clear();
    localStorage.setItem('nb_players', checkedInputs.length);
    localStorage.setItem('game_mode', payload.gameMode);
    localStorage.setItem('game_sets', payload.config.setsToWin); 
    localStorage.setItem('game_legs', payload.config.legsPerSet); 
    
    checkedInputs.forEach((input, index) => {
        localStorage.setItem(`player${index + 1}_name`, input.getAttribute('data-nickname'));
        localStorage.setItem(`player${index + 1}_id`, input.value);
    });

    try {
        const res = await fetch('/api/games/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const game = await res.json();
            
            const queryParams = new URLSearchParams({
                id: game.id,
                legId: game.firstLegId || 0,
                mode: payload.gameMode,
                startScore: payload.config.startScore,
                sets: payload.config.setsToWin,
                legs: payload.config.legsPerSet
            });

            const targetPage = isNaN(gameType) ? '/gameSpecial' : '/gameMulti';
            window.location.href = `${targetPage}?${queryParams.toString()}`;
        }
    } catch (err) {
        console.error("Erreur création partie:", err);
    }
}

/**
 * 3. GESTION DE L'INTERFACE
 */
function toggleQuickAdd() {
    const form = document.getElementById('quick-add-player');
    if (form) {
        form.style.display = (form.style.display === 'none' || form.style.display === '') ? 'block' : 'none';
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

/**
 * ÉVÉNEMENTS DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    loadPlayers();

    const gameTypeSelect = document.getElementById('game-type');
    const x01Settings = document.getElementById('settings-x01');

    function updateVisibility() {
        if (!gameTypeSelect || !x01Settings) return;
        
        const val = gameTypeSelect.value;
        x01Settings.style.display = !isNaN(val) ? 'flex' : 'none';
    }

    if (gameTypeSelect) {
        gameTypeSelect.addEventListener('change', updateVisibility);
        updateVisibility(); 
    }
});

window.validateAndStart = validateAndStart;
window.toggleQuickAdd = toggleQuickAdd;
window.addPlayerQuick = addPlayerQuick;