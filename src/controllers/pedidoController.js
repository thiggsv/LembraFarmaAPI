const { Cliente, ItemPedido, Pedido, sequelize } = require('../models');
const { isId, isObject, pickFields, errorResponse } = require('../utils/api');

const statusPedido = ['pendente', 'aprovado', 'cancelado', 'entregue', 'em_analise'];
const camposPedido = ['cliente_id', 'data_pedido', 'status', 'observacoes'];
const camposItem = [
  'id',
  'codigo_api',
  'nome_medicamento',
  'principio_ativo',
  'apresentacao',
  'dosagem',
  'unidade_medida',
  'quantidade',
  'intervalo_recompra_dias',
  'data_compra',
  'proxima_recompra',
  'status'
];

const inclusoesPedido = [
  {
    model: Cliente,
    as: 'cliente',
    attributes: ['id', 'nome']
  },
  {
    model: ItemPedido,
    as: 'itens',
    attributes: camposItem
  }
];

function respostaPedido(pedido) {
  const dados = pedido.get({ plain: true });

  return {
    id: dados.id,
    cliente_id: dados.cliente_id,
    data_pedido: dados.data_pedido,
    status: dados.status,
    observacoes: dados.observacoes,
    cliente: dados.cliente
      ? { id: dados.cliente.id, nome: dados.cliente.nome }
      : undefined,
    itens: (dados.itens || []).map((item) => {
      const resultado = {};
      camposItem.forEach((campo) => {
        resultado[campo] = item[campo];
      });
      return resultado;
    })
  };
}

function validarCampos(dados) {
  if (Object.prototype.hasOwnProperty.call(dados, 'cliente_id')) {
    if (!isId(dados.cliente_id)) {
      return 'O ID do cliente é inválido.';
    }
    dados.cliente_id = String(dados.cliente_id);
  }

  if (
    Object.prototype.hasOwnProperty.call(dados, 'status') &&
    !statusPedido.includes(dados.status)
  ) {
    return 'O status do pedido é inválido.';
  }

  if (
    Object.prototype.hasOwnProperty.call(dados, 'data_pedido') &&
    (
      typeof dados.data_pedido !== 'string' ||
      Number.isNaN(Date.parse(dados.data_pedido))
    )
  ) {
    return 'A data_pedido deve ser uma data válida.';
  }

  if (
    Object.prototype.hasOwnProperty.call(dados, 'observacoes') &&
    dados.observacoes !== null &&
    typeof dados.observacoes !== 'string'
  ) {
    return 'O campo observacoes deve ser um texto ou null.';
  }

  return null;
}

async function cadastrar(req, res) {
  if (!isObject(req.body)) {
    return res.status(400).json({ mensagem: 'Informe os dados do pedido.' });
  }

  const dados = pickFields(req.body, camposPedido);
  if (!isId(dados.cliente_id)) {
    return res.status(400).json({ mensagem: 'O ID do cliente é obrigatório e deve ser válido.' });
  }
  const erroValidacao = validarCampos(dados);
  if (erroValidacao) {
    return res.status(400).json({ mensagem: erroValidacao });
  }

  try {
    const pedido = await sequelize.transaction(async (transaction) => {
      const cliente = await Cliente.findOne({
        where: { id: dados.cliente_id, usuario_id: req.usuario.id },
        transaction
      });

      if (!cliente) {
        return null;
      }

      const novoPedido = await Pedido.create({
        ...dados,
        usuario_id: req.usuario.id
      }, { transaction });

      return Pedido.findOne({
        where: { id: novoPedido.id, usuario_id: req.usuario.id },
        include: inclusoesPedido,
        transaction
      });
    });

    if (!pedido) {
      return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
    }

    return res.status(201).json({
      mensagem: 'Pedido cadastrado com sucesso.',
      pedido: respostaPedido(pedido)
    });
  } catch (error) {
    return errorResponse(error, res, 'cadastrar pedido');
  }
}

async function listar(req, res) {
  try {
    const pedidos = await Pedido.findAll({
      where: { usuario_id: req.usuario.id },
      attributes: ['id', 'cliente_id', 'data_pedido', 'status', 'observacoes'],
      include: inclusoesPedido,
      order: [['id', 'DESC']]
    });

    return res.status(200).json({
      pedidos: pedidos.map(respostaPedido)
    });
  } catch (error) {
    return errorResponse(error, res, 'listar pedidos');
  }
}

async function consultarPorId(req, res) {
  if (!isId(req.params.id)) {
    return res.status(400).json({ mensagem: 'ID do pedido inválido.' });
  }

  try {
    const pedido = await Pedido.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id },
      attributes: ['id', 'cliente_id', 'data_pedido', 'status', 'observacoes'],
      include: inclusoesPedido
    });

    if (!pedido) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
    }

    return res.status(200).json({ pedido: respostaPedido(pedido) });
  } catch (error) {
    return errorResponse(error, res, 'consultar pedido');
  }
}

async function atualizar(req, res) {
  if (!isId(req.params.id)) {
    return res.status(400).json({ mensagem: 'ID do pedido inválido.' });
  }
  if (!isObject(req.body)) {
    return res.status(400).json({ mensagem: 'Informe os campos do pedido.' });
  }

  const dados = pickFields(req.body, camposPedido);
  if (Object.keys(dados).length === 0) {
    return res.status(400).json({ mensagem: 'Informe ao menos um campo válido para atualizar.' });
  }
  const erroValidacao = validarCampos(dados);
  if (erroValidacao) {
    return res.status(400).json({ mensagem: erroValidacao });
  }

  try {
    const pedido = await sequelize.transaction(async (transaction) => {
      const registro = await Pedido.findOne({
        where: { id: req.params.id, usuario_id: req.usuario.id },
        transaction
      });
      if (!registro) {
        return null;
      }

      if (Object.prototype.hasOwnProperty.call(dados, 'cliente_id')) {
        const cliente = await Cliente.findOne({
          where: { id: dados.cliente_id, usuario_id: req.usuario.id },
          transaction
        });
        if (!cliente) {
          return { clienteNaoEncontrado: true };
        }
      }

      await registro.update(dados, { transaction });
      return Pedido.findOne({
        where: { id: registro.id, usuario_id: req.usuario.id },
        attributes: ['id', 'cliente_id', 'data_pedido', 'status', 'observacoes'],
        include: inclusoesPedido,
        transaction
      });
    });

    if (!pedido) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
    }
    if (pedido.clienteNaoEncontrado) {
      return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
    }

    return res.status(200).json({
      mensagem: 'Pedido atualizado com sucesso.',
      pedido: respostaPedido(pedido)
    });
  } catch (error) {
    return errorResponse(error, res, 'atualizar pedido');
  }
}

async function cancelar(req, res) {
  if (!isId(req.params.id)) {
    return res.status(400).json({ mensagem: 'ID do pedido inválido.' });
  }

  try {
    const pedido = await Pedido.findOne({
      where: { id: req.params.id, usuario_id: req.usuario.id }
    });
    if (!pedido) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
    }

    await pedido.update({ status: 'cancelado' });
    return res.status(200).json({
      mensagem: 'Pedido cancelado com sucesso.',
      pedido: {
        id: pedido.id,
        cliente_id: pedido.cliente_id,
        data_pedido: pedido.data_pedido,
        status: pedido.status,
        observacoes: pedido.observacoes
      }
    });
  } catch (error) {
    return errorResponse(error, res, 'cancelar pedido');
  }
}

module.exports = {
  cadastrar,
  listar,
  consultarPorId,
  atualizar,
  cancelar
};
