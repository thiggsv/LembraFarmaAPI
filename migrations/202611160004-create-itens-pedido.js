'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('itens_pedido', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      pedido_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'pedidos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      codigo_api: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      nome_medicamento: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      principio_ativo: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      apresentacao: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      dosagem: {
        type: Sequelize.STRING(80),
        allowNull: true
      },
      unidade_medida: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      quantidade: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      intervalo_recompra_dias: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      data_compra: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      proxima_recompra: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('ativo', 'cancelado', 'concluido'),
        allowNull: false,
        defaultValue: 'ativo'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        )
      }
    });

    await queryInterface.addIndex('itens_pedido', ['pedido_id'], {
      name: 'idx_itens_pedido_pedido_id'
    });
    await queryInterface.addIndex('itens_pedido', ['codigo_api'], {
      name: 'idx_itens_pedido_codigo_api'
    });
    await queryInterface.addIndex('itens_pedido', ['proxima_recompra'], {
      name: 'idx_itens_pedido_proxima_recompra'
    });
    await queryInterface.addIndex('itens_pedido', ['status'], {
      name: 'idx_itens_pedido_status'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('itens_pedido');
  }
};
