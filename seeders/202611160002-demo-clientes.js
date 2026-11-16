'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('clientes', [
      {
        usuario_id: 1,
        nome: 'Maria Oliveira',
        cpf: '123.456.789-09',
        data_nascimento: '1988-05-14',
        telefone: '(11) 99111-0001',
        email: 'maria@email.com',
        cep: '01000-000',
        logradouro: 'Rua A',
        numero: '100',
        complemento: 'Casa',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        usuario_id: 1,
        nome: 'Pedro Santos',
        cpf: '987.654.321-00',
        data_nascimento: '1992-09-20',
        telefone: '(11) 99111-0002',
        email: 'pedro@email.com',
        cep: '02000-000',
        logradouro: 'Rua B',
        numero: '200',
        complemento: 'Apto 1',
        bairro: 'Vila Nova',
        cidade: 'São Paulo',
        estado: 'SP',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        usuario_id: 2,
        nome: 'Joana Costa',
        cpf: '456.789.123-55',
        data_nascimento: '1979-11-07',
        telefone: '(11) 99111-0003',
        email: 'joana@email.com',
        cep: '03000-000',
        logradouro: 'Rua C',
        numero: '300',
        complemento: null,
        bairro: 'Jardim',
        cidade: 'Campinas',
        estado: 'SP',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('clientes', null, {});
  }
};
