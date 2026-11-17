'use strict';

module.exports = (sequelize, DataTypes) => {
  const Pedido = sequelize.define(
    'Pedido',
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
      usuario_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        }
      },
      data_pedido: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      status: {
        type: DataTypes.ENUM('pendente', 'aprovado', 'cancelado', 'entregue', 'em_analise'),
        allowNull: false,
        defaultValue: 'pendente'
      },
      observacoes: {
        type: DataTypes.TEXT,
        allowNull: true
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
      tableName: 'pedidos',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          name: 'idx_pedidos_cliente_id',
          fields: ['cliente_id']
        },
        {
          name: 'idx_pedidos_usuario_id',
          fields: ['usuario_id']
        },
        {
          name: 'idx_pedidos_status',
          fields: ['status']
        }
      ]
    }
  );

  Pedido.associate = (models) => {
    Pedido.belongsTo(models.Cliente, {
      foreignKey: 'cliente_id',
      as: 'cliente',
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    Pedido.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    Pedido.hasMany(models.ItemPedido, {
      foreignKey: 'pedido_id',
      as: 'itens',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return Pedido;
};
