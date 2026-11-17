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
        type: Sequelize.DATEONLY,
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
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        )
      }
    });

    await queryInterface.addIndex('alertas', ['cliente_id'], {
      name: 'idx_alertas_cliente_id'
    });
    await queryInterface.addIndex('alertas', ['item_pedido_id'], {
      name: 'idx_alertas_item_pedido_id'
    });
    await queryInterface.addIndex('alertas', ['data_prevista'], {
      name: 'idx_alertas_data_prevista'
    });
    await queryInterface.addIndex('alertas', ['status'], {
      name: 'idx_alertas_status'
    });
    await queryInterface.addIndex(
      'alertas',
      ['item_pedido_id', 'data_prevista', 'tipo_alerta'],
      {
        unique: true,
        name: 'uq_alertas_evento'
      }
    );
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('alertas');
  }
};
