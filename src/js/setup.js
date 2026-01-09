 // Récupération du mode via l'URL (?mode=solo ou ?mode=pvp)
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode') || 'pvp';

        // Adaptation visuelle immédiate
        if (mode === 'solo') {
            document.getElementById('setup-title').innerText = "Mode Solo";
            document.getElementById('player-label').innerText = "Sélectionner votre profil";
            document.getElementById('instruction').innerText = "Choisissez 1 joueur.";
        } else {
            document.getElementById('setup-title').innerText = "Mode Versus";
        }

        // Chargement des joueurs depuis l'API
        async function loadPlayers() {
            try {
                const response = await fetch('/api/players');
                const players = await response.json();
                const container = document.getElementById('player-checkboxes');
                
                container.innerHTML = players.map(p => `
                    <label class="player-option">
                        <input type="checkbox" name="players" value="${p.id}" onchange="checkSelectionLimit()">
                        <span>${p.nickname}</span>
                    </label>
                `).join('');
            } catch (err) {
                console.error("Erreur chargement joueurs:", err);
            }
        }

        // Limite le nombre de joueurs cochés selon le mode
        function checkSelectionLimit() {
            const checked = document.querySelectorAll('input[name="players"]:checked');
            const limit = (mode === 'solo') ? 1 : 2;
            
            if (checked.length > limit) {
                event.target.checked = false;
                alert(`En mode ${mode}, vous ne pouvez sélectionner que ${limit} joueur(s).`);
            }
        }

        // Envoi au serveur pour créer la partie
        async function validateAndStart() {
            const checked = Array.from(document.querySelectorAll('input[name="players"]:checked'))
                                 .map(input => input.value);
            
            const limit = (mode === 'solo') ? 1 : 2;

            if (checked.length !== limit) {
                return alert(`Veuillez sélectionner exactement ${limit} joueur(s).`);
            }

            const payload = {
                type: document.getElementById('game-type').value,
                setsToWin: parseInt(document.getElementById('sets-to-win').value),
                legsPerSet: parseInt(document.getElementById('legs-per-set').value),
                playerIds: checked,
                mode: mode // Utile pour ton futur Bot ou Solo
            };

            const res = await fetch('/api/games/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const game = await res.json();
                // On redirige vers la page de jeu en passant l'ID de la partie
                window.location.href = `/game?id=${game.id}`;
            }
        }

        // Affiche ou cache le formulaire d'ajout
        function toggleQuickAdd() {
            const form = document.getElementById('quick-add-player');
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        }

        // Enregistre le joueur et rafraîchit la liste
        async function addPlayerQuick() {
            const nickname = document.getElementById('quick-nickname').value;
            
            if (!nickname) return alert("Veuillez entrer un pseudo");

            try {
                const response = await fetch('/api/players', { // Vérifie que c'est bien ta route POST pour les joueurs
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nickname })
                });

                if (response.ok) {
                    document.getElementById('quick-nickname').value = ''; // Vide le champ
                    toggleQuickAdd(); // Cache le formulaire
                    await loadPlayers(); // Recharge la liste des joueurs sans rafraîchir la page
                } else {
                    alert("Erreur lors de la création du joueur");
                }
            } catch (error) {
                console.error("Erreur:", error);
            }
        }

        window.onload = loadPlayers;