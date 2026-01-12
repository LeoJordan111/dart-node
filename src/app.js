const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. MIDDLEWARES (Toujours en premier)
app.use(express.json());

// 2. CONFIGURATION FICHIERs STATIQUES
app.use('/css', express.static(path.join(__dirname, 'styles')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// 3. ROUTES PAGES NAV
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/setup', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'setup.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'game.html'));
});

app.get('/gameSolo', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'gameSolo.html'));
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