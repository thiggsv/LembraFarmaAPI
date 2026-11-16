'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('usuarios', [
      {
        nome: 'Ana Souza',
        email: 'ana@lembrafarma.com',
        senha: '$2b$10$Q6a1Jb8TJxwQ2/9i3d1R0OQ4QnNqJ6kP8Q0jVpkJh5w2m1a5w2xvS',
        telefone: '(11) 98888-1111',
        status: 'ativo',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nome: 'Carlos Lima',
        email: 'carlos@lembrafarma.com',
        senha: '$2b$10$FQ3eC8Ibi7n8N4hY1pRlduQgP2mRz/Q2nNqR5nFv9DMx3A0d4wuyq',
        telefone: '(11) 97777-2222',
        status: 'ativo',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('usuarios', null, {});
  }
};
