'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('clientes', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
      nome: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      cpf: {
        type: Sequelize.STRING(14),
        allowNull: true,
        unique: true
      },
      data_nascimento: {
        type: Sequelize.DATE,
        allowNull: true
      },
      telefone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(180),
        allowNull: true
      },
      cep: {
        type: Sequelize.STRING(9),
        allowNull: true
      },
      logradouro: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      numero: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      complemento: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      bairro: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      cidade: {
        type: Sequelize.STRING(120),
        allowNull: true
      },
      estado: {
        type: Sequelize.STRING(2),
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('clientes', ['usuario_id']);
    await queryInterface.addIndex('clientes', ['nome']);
    await queryInterface.addIndex('clientes', ['cidade']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('clientes');
  }
};
