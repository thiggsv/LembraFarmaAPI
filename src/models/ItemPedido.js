'use strict';

module.exports = (sequelize, DataTypes) => {
  const ItemPedido = sequelize.define(
    'ItemPedido',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      pedido_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'pedidos',
          key: 'id'
        }
      },
      codigo_api: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      nome_medicamento: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      principio_ativo: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      apresentacao: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      dosagem: {
        type: DataTypes.STRING(80),
        allowNull: true
      },
      unidade_medida: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      intervalo_recompra_dias: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      data_compra: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      proxima_recompra: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('ativo', 'cancelado', 'concluido'),
        allowNull: false,
        defaultValue: 'ativo'
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
      tableName: 'itens_pedido',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          name: 'idx_itens_pedido_pedido_id',
          fields: ['pedido_id']
        },
        {
          name: 'idx_itens_pedido_codigo_api',
          fields: ['codigo_api']
        },
        {
          name: 'idx_itens_pedido_proxima_recompra',
          fields: ['proxima_recompra']
        },
        {
          name: 'idx_itens_pedido_status',
          fields: ['status']
        }
      ]
    }
  );

  ItemPedido.associate = (models) => {
    ItemPedido.belongsTo(models.Pedido, {
      foreignKey: 'pedido_id',
      as: 'pedido',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    ItemPedido.hasMany(models.Alerta, {
      foreignKey: 'item_pedido_id',
      as: 'alertas',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return ItemPedido;
};
