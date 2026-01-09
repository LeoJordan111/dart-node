const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// C'est ici que Prisma reçoit la connexion, plus besoin de l'avoir dans le .prisma
const prisma = new PrismaClient({ adapter });

module.exports = prisma;