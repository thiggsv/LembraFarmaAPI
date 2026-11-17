'use strict';

module.exports = (sequelize, DataTypes) => {
  const Cliente = sequelize.define(
    'Cliente',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      usuario_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        }
      },
      nome: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      cpf: {
        type: DataTypes.STRING(14),
        allowNull: true
      },
      data_nascimento: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      telefone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      email: {
        type: DataTypes.STRING(180),
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      cep: {
        type: DataTypes.STRING(9),
        allowNull: true
      },
      logradouro: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      numero: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      complemento: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      bairro: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      cidade: {
        type: DataTypes.STRING(120),
        allowNull: true
      },
      estado: {
        type: DataTypes.STRING(2),
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
      tableName: 'clientes',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          name: 'uq_clientes_cpf',
          unique: true,
          fields: ['cpf']
        },
        {
          name: 'idx_clientes_usuario_id',
          fields: ['usuario_id']
        },
        {
          name: 'idx_clientes_nome',
          fields: ['nome']
        },
        {
          name: 'idx_clientes_cidade',
          fields: ['cidade']
        }
      ]
    }
  );

  Cliente.associate = (models) => {
    Cliente.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario',
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    Cliente.hasMany(models.Pedido, {
      foreignKey: 'cliente_id',
      as: 'pedidos',
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    Cliente.hasMany(models.Alerta, {
      foreignKey: 'cliente_id',
      as: 'alertas',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  };

  return Cliente;
};
