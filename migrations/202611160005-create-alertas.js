'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('alertas', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      cliente_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      item_pedido_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'itens_pedido',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      data_prevista: {
        type: Sequelize.DATE,
        allowNull: false
      },
      data_envio: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pendente', 'enviado', 'cancelado', 'atrasado'),
        allowNull: false,
        defaultValue: 'pendente'
      },
      tipo_alerta: {
        type: Sequelize.ENUM('recompra', 'lembrativo', 'vencimento'),
        allowNull: false,
        defaultValue: 'recompra'
      },
      mensagem: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('alertas', ['cliente_id']);
    await queryInterface.addIndex('alertas', ['item_pedido_id']);
    await queryInterface.addIndex('alertas', ['data_prevista']);
    await queryInterface.addIndex('alertas', ['status']);
    await queryInterface.addIndex('alertas', ['tipo_alerta']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('alertas');
  }
};
