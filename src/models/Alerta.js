'use strict';

module.exports = (sequelize, DataTypes) => {
  const Alerta = sequelize.define(
    'Alerta',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      cliente_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id'
        }
      },
      item_pedido_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'itens_pedido',
          key: 'id'
        }
      },
      data_prevista: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      data_envio: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('pendente', 'enviado', 'cancelado', 'atrasado'),
        allowNull: false,
        defaultValue: 'pendente'
      },
      tipo_alerta: {
        type: DataTypes.ENUM('recompra', 'lembrativo', 'vencimento'),
        allowNull: false,
        defaultValue: 'recompra'
      },
      mensagem: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'alertas',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          name: 'idx_alertas_cliente_id',
          fields: ['cliente_id']
        },
        {
          name: 'idx_alertas_item_pedido_id',
          fields: ['item_pedido_id']
        },
        {
          name: 'idx_alertas_data_prevista',
          fields: ['data_prevista']
        },
        {
          name: 'idx_alertas_status',
          fields: ['status']
        },
        {
          name: 'uq_alertas_evento',
          unique: true,
          fields: ['item_pedido_id', 'data_prevista', 'tipo_alerta']
        }
      ]
    }
  );

  Alerta.associate = (models) => {
    Alerta.belongsTo(models.Cliente, {
      foreignKey: 'cliente_id',
      as: 'cliente',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    Alerta.belongsTo(models.ItemPedido, {
      foreignKey: 'item_pedido_id',
      as: 'itemPedido',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return Alerta;
};
