const express = require('express');
const path = require('path'); // Déclaré une seule fois ici
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. MIDDLEWARES (Toujours en premier)
app.use(express.json());

// 2. CONFIGURATION DES DOSSIERS STATIQUES
// On définit où sont les fichiers CSS, JS et les vues
app.use('/css', express.static(path.join(__dirname, 'styles')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// 3. ROUTES POUR LES PAGES HTML (Navigation)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/setup', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'setup.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'game.html'));
});

// 4. LES ROUTES API
const playerRoutes = require('./routes/player.routes');
app.use('/api/players', playerRoutes);

const gameRoutes = require('./routes/game.routes');
app.use('/api/games', gameRoutes);

// 5. LANCEMENT
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
    console.log(`Interface disponible sur http://localhost:${PORT}`);
});