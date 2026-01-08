const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// 1. Création de la connexion PostgreSQL brute
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Transformation pour Prisma
const adapter = new PrismaPg(pool);

// 3. Instanciation du client avec l'adaptateur
const prisma = new PrismaClient({ adapter });

module.exports = prisma;