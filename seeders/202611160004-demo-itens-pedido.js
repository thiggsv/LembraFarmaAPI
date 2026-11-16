'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('itens_pedido', [
      {
        pedido_id: 1,
        codigo_api: 'API-001',
        nome_medicamento: 'Dipirona',
        principio_ativo: 'Dipirona Sódica',
        apresentacao: 'Comprimido',
        dosagem: '500',
        unidade_medida: 'mg',
        quantidade: 2,
        intervalo_recompra_dias: 30,
        data_compra: '2026-10-15',
        proxima_recompra: '2026-11-14',
        status: 'ativo',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        pedido_id: 1,
        codigo_api: 'API-002',
        nome_medicamento: 'Vitamina C',
        principio_ativo: 'Ácido Ascórbico',
        apresentacao: 'Cápsula',
        dosagem: '1000',
        unidade_medida: 'mg',
        quantidade: 1,
        intervalo_recompra_dias: 60,
        data_compra: '2026-10-15',
        proxima_recompra: '2026-12-14',
        status: 'ativo',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        pedido_id: 2,
        codigo_api: 'API-003',
        nome_medicamento: 'Omeprazol',
        principio_ativo: 'Omeprazol',
        apresentacao: 'Cápsula',
        dosagem: '20',
        unidade_medida: 'mg',
        quantidade: 1,
        intervalo_recompra_dias: 7,
        data_compra: '2026-10-20',
        proxima_recompra: '2026-10-27',
        status: 'ativo',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('itens_pedido', null, {});
  }
};
