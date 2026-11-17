const { Cliente } = require('../models');
const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');

const camposCliente = [
  'nome',
  'cpf',
  'data_nascimento',
  'telefone',
  'email',
  'cep',
  'logradouro',
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'estado'
];

function selecionarCampos(dados) {
  return camposCliente.reduce((campos, campo) => {
    if (Object.prototype.hasOwnProperty.call(dados, campo)) {
      campos[campo] = dados[campo];
    }

    return campos;
  }, {});
}

function respostaCliente(cliente) {
  const dados = { id: cliente.id };

  camposCliente.forEach((campo) => {
    dados[campo] = cliente[campo];
  });

  return dados;
}

function erroBanco(error, res, acao) {
  if (error instanceof UniqueConstraintError) {
    return res.status(409).json({
      mensagem: 'Este CPF já está cadastrado.'
    });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({
      mensagem: 'Os dados do cliente são inválidos.'
    });
  }

  if (error instanceof ForeignKeyConstraintError && acao === 'excluir') {
    return res.status(409).json({
      mensagem: 'Não foi possível excluir o cliente porque existem registros vinculados.'
    });
  }

  console.error(`Erro ao ${acao} cliente:`, error);
  return res.status(500).json({
    mensagem: `Erro interno ao ${acao} cliente.`
  });
}

function idValido(id) {
  return /^[1-9]\d*$/.test(id);
}

async function cadastrar(req, res) {
  try {
    const campos = selecionarCampos(req.body || {});

    if (typeof campos.nome !== 'string' || !campos.nome.trim()) {
      return res.status(400).json({
        mensagem: 'O nome do cliente é obrigatório.'
      });
    }
    campos.nome = campos.nome.trim();

    if (campos.cpf) {
      const clienteExistente = await Cliente.findOne({
        where: { cpf: campos.cpf }
      });

      if (clienteExistente) {
        return res.status(409).json({
          mensagem: 'Este CPF já está cadastrado.'
        });
      }
    }

    const cliente = await Cliente.create({
      ...campos,
      usuario_id: req.usuario.id
    });

    return res.status(201).json({
      mensagem: 'Cliente cadastrado com sucesso!',
      cliente: respostaCliente(cliente)
    });
  } catch (error) {
    return erroBanco(error, res, 'cadastrar');
  }
}

async function listar(req, res) {
  try {
    const clientes = await Cliente.findAll({
      where: { usuario_id: req.usuario.id },
      attributes: ['id', ...camposCliente],
      order: [['id', 'ASC']]
    });

    return res.status(200).json({
      clientes: clientes.map(respostaCliente)
    });
  } catch (error) {
    return erroBanco(error, res, 'listar');
  }
}

async function consultarPorId(req, res) {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      mensagem: 'ID do cliente inválido.'
    });
  }

  try {
    const cliente = await Cliente.findOne({
      where: {
        id: req.params.id,
        usuario_id: req.usuario.id
      },
      attributes: ['id', ...camposCliente]
    });

    if (!cliente) {
      return res.status(404).json({
        mensagem: 'Cliente não encontrado.'
      });
    }

    return res.status(200).json({
      cliente: respostaCliente(cliente)
    });
  } catch (error) {
    return erroBanco(error, res, 'consultar');
  }
}

async function atualizar(req, res) {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      mensagem: 'ID do cliente inválido.'
    });
  }

  try {
    const campos = selecionarCampos(req.body || {});

    if (Object.keys(campos).length === 0) {
      return res.status(400).json({
        mensagem: 'Informe ao menos um campo válido para atualizar.'
      });
    }

    if (Object.prototype.hasOwnProperty.call(campos, 'nome')) {
      if (typeof campos.nome !== 'string' || !campos.nome.trim()) {
        return res.status(400).json({
          mensagem: 'O nome do cliente não pode ser vazio.'
        });
      }
      campos.nome = campos.nome.trim();
    }

    const cliente = await Cliente.findOne({
      where: {
        id: req.params.id,
        usuario_id: req.usuario.id
      }
    });

    if (!cliente) {
      return res.status(404).json({
        mensagem: 'Cliente não encontrado.'
      });
    }

    if (campos.cpf) {
      const clienteComCpf = await Cliente.findOne({
        where: { cpf: campos.cpf }
      });

      if (clienteComCpf && String(clienteComCpf.id) !== String(cliente.id)) {
        return res.status(409).json({
          mensagem: 'Este CPF já está cadastrado.'
        });
      }
    }

    await cliente.update(campos);

    return res.status(200).json({
      mensagem: 'Cliente atualizado com sucesso!',
      cliente: respostaCliente(cliente)
    });
  } catch (error) {
    return erroBanco(error, res, 'atualizar');
  }
}

async function excluir(req, res) {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      mensagem: 'ID do cliente inválido.'
    });
  }

  try {
    const cliente = await Cliente.findOne({
      where: {
        id: req.params.id,
        usuario_id: req.usuario.id
      }
    });

    if (!cliente) {
      return res.status(404).json({
        mensagem: 'Cliente não encontrado.'
      });
    }

    await cliente.destroy();
    return res.status(204).end();
  } catch (error) {
    return erroBanco(error, res, 'excluir');
  }
}

module.exports = {
  cadastrar,
  listar,
  consultarPorId,
  atualizar,
  excluir
};
