const { Cliente } = require('../models');
const { errorResponse, isId, isObject, pickFields } = require('../utils/api');

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
const tamanhosCliente = {
  nome: 150,
  cpf: 14,
  telefone: 20,
  email: 180,
  cep: 9,
  logradouro: 200,
  numero: 20,
  complemento: 100,
  bairro: 100,
  cidade: 120,
  estado: 2
};

function validarCampos(campos) {
  for (const [campo, tamanho] of Object.entries(tamanhosCliente)) {
    if (
      Object.prototype.hasOwnProperty.call(campos, campo) &&
      campos[campo] !== null &&
      (typeof campos[campo] !== 'string' || campos[campo].length > tamanho)
    ) {
      return `O campo ${campo} deve ser um texto de até ${tamanho} caracteres.`;
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(campos, 'data_nascimento') &&
    campos.data_nascimento !== null &&
    !dataNascimentoValida(campos.data_nascimento)
  ) {
    return 'A data_nascimento deve ser uma data válida.';
  }

  return null;
}

function dataNascimentoValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }
  const [ano, mes, dia] = valor.split('-').map(Number);
  if (ano < 1000) {
    return false;
  }
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

function respostaCliente(cliente) {
  const dados = { id: cliente.id };

  camposCliente.forEach((campo) => {
    dados[campo] = cliente[campo];
  });

  return dados;
}

async function cadastrar(req, res) {
  if (!isObject(req.body)) {
    return res.status(400).json({ mensagem: 'Informe os dados do cliente.' });
  }

  try {
    const campos = pickFields(req.body, camposCliente);

    if (typeof campos.nome !== 'string' || !campos.nome.trim()) {
      return res.status(400).json({
        mensagem: 'O nome do cliente é obrigatório.'
      });
    }
    campos.nome = campos.nome.trim();
    const erroValidacao = validarCampos(campos);
    if (erroValidacao) {
      return res.status(400).json({ mensagem: erroValidacao });
    }

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
    return errorResponse(error, res, 'cadastrar cliente', 'Este CPF já está cadastrado.');
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
    return errorResponse(error, res, 'listar clientes');
  }
}

async function consultarPorId(req, res) {
  if (!isId(req.params.id)) {
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
    return errorResponse(error, res, 'consultar cliente');
  }
}

async function atualizar(req, res) {
  if (!isId(req.params.id)) {
    return res.status(400).json({
      mensagem: 'ID do cliente inválido.'
    });
  }

  try {
    if (!isObject(req.body)) {
      return res.status(400).json({ mensagem: 'Informe os campos do cliente.' });
    }

    const campos = pickFields(req.body, camposCliente);

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
    const erroValidacao = validarCampos(campos);
    if (erroValidacao) {
      return res.status(400).json({ mensagem: erroValidacao });
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
    return errorResponse(error, res, 'atualizar cliente', 'Este CPF já está cadastrado.');
  }
}

async function excluir(req, res) {
  if (!isId(req.params.id)) {
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
    return errorResponse(error, res, 'excluir cliente');
  }
}

module.exports = {
  cadastrar,
  listar,
  consultarPorId,
  atualizar,
  excluir
};
