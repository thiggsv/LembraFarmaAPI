'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('pedidos', [
      {
        cliente_id: 1,
        usuario_id: 1,
        data_pedido: '2026-10-15 09:30:00',
        status: 'aprovado',
        observacoes: 'Pedido de rotina com acompanhamento mensal.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        cliente_id: 2,
        usuario_id: 1,
        data_pedido: '2026-10-20 08:00:00',
        status: 'pendente',
        observacoes: 'Recompra para itens com intervalo diverso.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('pedidos', null, {});
  }
};
