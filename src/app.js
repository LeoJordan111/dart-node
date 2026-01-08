const express = require('express');
const path = require('path'); // Nécessaire pour manipuler les chemins de fichiers
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. MIDDLEWARES
app.use(express.json());

// 2. CONFIGURATION DES DOSSIERS STATIQUES (SÉPARÉS)
app.use('/css', express.static(path.join(__dirname, 'styles')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/', express.static(path.join(__dirname, 'views')));

// 3. LES ROUTES API
const playerRoutes = require('./routes/player.routes');
app.use('/api/players', playerRoutes);

// 4. LANCEMENT
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
    console.log(`Interface disponible sur http://localhost:${PORT}`);
});