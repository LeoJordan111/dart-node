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
        const players = await response.json();
        const container = document.getElementById('player-checkboxes');
        if (!container) return;

        container.innerHTML = players.map(p => `
            <div class="player-card" id="card-${p.id}">
                <label class="player-main-info">
                    <input type="checkbox" name="players" value="${p.id}" data-nickname="${p.nickname}" onchange="updateCardStyle(${p.id})">
                    <div class="player-details">
                        <span class="player-name">${p.nickname}</span>
                        <span class="player-status">Cliquer pour sélectionner</span>
                    </div>
                </label>
                
                <div class="checkout-option">
                    <label>Sortie :</label>
                    <select class="checkout-selector" data-player-id="${p.id}">
                        <option value="double">DOUBLE OUT</option>
                        <option value="single">SIMPLE OUT</option>
                    </select>
                </div>
            </div>
        `).join('');
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
        playerIds: checkedInputs.map(input => parseInt(input.value)),
        playerSettings: checkedInputs.map(input => {
            const select = document.querySelector(`.checkout-selector[data-player-id="${input.value}"]`);
            return {
                id: parseInt(input.value),
                checkoutMode: select ? select.value : 'double'
            };
        })
    };

    localStorage.clear();
    localStorage.setItem('nb_players', checkedInputs.length);
    localStorage.setItem('game_mode', payload.gameMode);
    localStorage.setItem('game_sets', payload.config.setsToWin); 
    localStorage.setItem('game_legs', payload.config.legsPerSet); 
    
    checkedInputs.forEach((input, index) => {
        const playerId = input.value;
        const playerNum = index + 1;
        const nickname = input.getAttribute('data-nickname');
        const select = document.querySelector(`.checkout-selector[data-player-id="${playerId}"]`);
        const checkoutMode = select ? select.value : 'double';

        localStorage.setItem(`player${playerNum}_name`, nickname);
        localStorage.setItem(`player${playerNum}_id`, playerId);
        localStorage.setItem(`player${playerNum}_checkout`, checkoutMode); 
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
        } else {
            alert("Erreur serveur lors de la création.");
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

window.updateCardStyle = function(playerId) {
    const card = document.getElementById(`card-${playerId}`);
    const checkbox = card.querySelector('input[type="checkbox"]');
    const statusText = card.querySelector('.player-status');
    
    if (checkbox.checked) {
        card.classList.add('selected');
        statusText.innerText = "Joueur sélectionné";
        statusText.style.color = "var(--primary)";
    } else {
        card.classList.remove('selected');
        statusText.innerText = "Cliquer pour sélectionner";
        statusText.style.color = "var(--text-muted)";
    }
}

window.validateAndStart = validateAndStart;
window.toggleQuickAdd = toggleQuickAdd;
window.addPlayerQuick = addPlayerQuick;