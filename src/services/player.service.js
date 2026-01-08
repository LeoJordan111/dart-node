const prisma = require('../database/client');

const createPlayer = async (nickname, email) => {
  return await prisma.player.create({
    data: {
      nickname,
      email
    },
  });
};

const getAllPlayers = async () => {
    return await prisma.player.findMany({
        orderBy: {
            createdAt: 'desc'
        }
    });
};

module.exports = {
  createPlayer,
  getAllPlayers,
};