'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('alertas', [
      {
        cliente_id: 1,
        item_pedido_id: 1,
        data_prevista: '2026-11-14',
        data_envio: '2026-11-12 09:00:00',
        status: 'enviado',
        tipo_alerta: 'recompra',
        mensagem: 'Sua recompra de Dipirona está próxima.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        cliente_id: 1,
        item_pedido_id: 2,
        data_prevista: '2026-12-14',
        data_envio: null,
        status: 'pendente',
        tipo_alerta: 'recompra',
        mensagem: 'Atenção: sua próxima recompra de Vitamina C está agendada.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        cliente_id: 2,
        item_pedido_id: 3,
        data_prevista: '2026-10-27',
        data_envio: null,
        status: 'pendente',
        tipo_alerta: 'recompra',
        mensagem: 'Lembrete de recompra para Omeprazol.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('alertas', null, {});
  }
};
