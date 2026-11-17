'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pedidos', {
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
        onDelete: 'RESTRICT'
      },
      usuario_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      data_pedido: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      status: {
        type: Sequelize.ENUM('pendente', 'aprovado', 'cancelado', 'entregue', 'em_analise'),
        allowNull: false,
        defaultValue: 'pendente'
      },
      observacoes: {
        type: Sequelize.TEXT,
        allowNull: true
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

    await queryInterface.addIndex('pedidos', ['cliente_id'], {
      name: 'idx_pedidos_cliente_id'
    });
    await queryInterface.addIndex('pedidos', ['usuario_id'], {
      name: 'idx_pedidos_usuario_id'
    });
    await queryInterface.addIndex('pedidos', ['status'], {
      name: 'idx_pedidos_status'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('pedidos');
  }
};
