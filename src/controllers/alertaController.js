const {
  Alerta,
  Cliente,
  ItemPedido,
  Pedido,
  sequelize
} = require('../models');
const { isId, isObject, pickFields, errorResponse } = require('../utils/api');

const statusAlerta = ['pendente', 'enviado', 'cancelado', 'atrasado'];
const tiposAlerta = ['recompra', 'lembrativo', 'vencimento'];
const camposCriacao = [
  'item_pedido_id',
  'data_prevista',
  'data_envio',
  'status',
  'tipo_alerta',
  'mensagem'
];
const camposAtualizacao = [
  'data_prevista',
  'data_envio',
  'status',
  'tipo_alerta',
  'mensagem'
];

function dataPrevistaValida(valor) {
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

function dataEnvioValida(valor) {
  return valor === null || (
    typeof valor === 'string' &&
    !Number.isNaN(Date.parse(valor))
  );
}

function validarCampos(dados) {
  if (
    Object.prototype.hasOwnProperty.call(dados, 'data_prevista') &&
    !dataPrevistaValida(dados.data_prevista)
  ) {
    return 'A data_prevista deve estar no formato YYYY-MM-DD e ser válida.';
  }

  if (
    Object.prototype.hasOwnProperty.call(dados, 'data_envio') &&
    !dataEnvioValida(dados.data_envio)
  ) {
    return 'A data_envio deve ser uma data válida ou null.';
  }

  if (
    Object.prototype.hasOwnProperty.call(dados, 'status') &&
    !statusAlerta.includes(dados.status)
  ) {
    return 'O status do alerta é inválido.';
  }

  if (
    Object.prototype.hasOwnProperty.call(dados, 'tipo_alerta') &&
    !tiposAlerta.includes(dados.tipo_alerta)
  ) {
    return 'O tipo do alerta é inválido.';
  }

  if (
    Object.prototype.hasOwnProperty.call(dados, 'mensagem') &&
    (typeof dados.mensagem !== 'string' || !dados.mensagem.trim())
  ) {
    return 'A mensagem do alerta é obrigatória.';
  }

  return null;
}

function inclusoesAlerta(usuarioId) {
  return [
    {
      model: Cliente,
      as: 'cliente',
      required: true,
      where: { usuario_id: usuarioId },
      attributes: ['id', 'nome']
    },
    {
      model: ItemPedido,
      as: 'itemPedido',
      required: true,
      attributes: ['id', 'nome_medicamento', 'pedido_id'],
      include: [{
        model: Pedido,
        as: 'pedido',
        required: true,
        where: { usuario_id: usuarioId },
        attributes: ['id', 'cliente_id']
      }]
    }
  ];
}

function respostaAlerta(alerta) {
  const dados = alerta.get({ plain: true });

  return {
    id: dados.id,
    cliente_id: dados.cliente_id,
    item_pedido_id: dados.item_pedido_id,
    data_prevista: dados.data_prevista,
    data_envio: dados.data_envio,
    status: dados.status,
    tipo_alerta: dados.tipo_alerta,
    mensagem: dados.mensagem,
    cliente: dados.cliente
      ? { id: dados.cliente.id, nome: dados.cliente.nome }
      : undefined,
    item_pedido: dados.itemPedido
      ? {
          id: dados.itemPedido.id,
          nome_medicamento: dados.itemPedido.nome_medicamento
        }
      : undefined
  };
}

function alertaConsistente(alerta) {
  const dados = alerta.get({ plain: true });
  return (
    dados.cliente &&
    dados.itemPedido &&
    dados.itemPedido.pedido &&
    String(dados.cliente_id) === String(dados.itemPedido.pedido.cliente_id)
  );
}

async function alertaDoUsuario(id, usuarioId, transaction) {
  const alerta = await Alerta.findOne({
    where: { id },
    include: inclusoesAlerta(usuarioId),
    transaction
  });

  return alerta && alertaConsistente(alerta) ? alerta : null;
}

async function cadastrar(req, res) {
  if (!isObject(req.body)) {
    return res.status(400).json({ mensagem: 'Informe os dados do alerta.' });
  }

  const dados = pickFields(req.body, camposCriacao);
  if (
    !isId(dados.item_pedido_id) ||
    !Object.prototype.hasOwnProperty.call(dados, 'data_prevista') ||
    typeof dados.mensagem !== 'string' ||
    !dados.mensagem.trim()
  ) {
    return res.status(400).json({
      mensagem: 'Item do pedido, data prevista e mensagem são obrigatórios.'
    });
  }
  dados.item_pedido_id = String(dados.item_pedido_id);
  dados.mensagem = dados.mensagem.trim();
  const erroValidacao = validarCampos(dados);
  if (erroValidacao) {
    return res.status(400).json({ mensagem: erroValidacao });
  }
  if (!Object.prototype.hasOwnProperty.call(dados, 'tipo_alerta')) {
    dados.tipo_alerta = 'recompra';
  }
  if (!Object.prototype.hasOwnProperty.call(dados, 'status')) {
    dados.status = 'pendente';
  }
  if (dados.status === 'enviado' && !dados.data_envio) {
    dados.data_envio = new Date();
  }

  try {
    const alerta = await sequelize.transaction(async (transaction) => {
      const item = await ItemPedido.findOne({
        where: { id: dados.item_pedido_id },
        include: [{
          model: Pedido,
          as: 'pedido',
          required: true,
          where: { usuario_id: req.usuario.id },
          attributes: ['id', 'cliente_id'],
          include: [{
            model: Cliente,
            as: 'cliente',
            required: true,
            where: { usuario_id: req.usuario.id },
            attributes: ['id']
          }]
        }],
        transaction
      });

      if (!item || !item.pedido.cliente) {
        return null;
      }

      const novoAlerta = await Alerta.create({
        ...dados,
        cliente_id: item.pedido.cliente.id
      }, { transaction });

      return alertaDoUsuario(novoAlerta.id, req.usuario.id, transaction);
    });

    if (!alerta) {
      return res.status(404).json({ mensagem: 'Item do pedido não encontrado.' });
    }

    return res.status(201).json({
      mensagem: 'Alerta criado com sucesso.',
      alerta: respostaAlerta(alerta)
    });
  } catch (error) {
    return errorResponse(error, res, 'criar alerta');
  }
}

async function listar(req, res) {
  try {
    const alertas = await Alerta.findAll({
      include: inclusoesAlerta(req.usuario.id),
      order: [['id', 'DESC']]
    });

    return res.status(200).json({
      alertas: alertas.filter(alertaConsistente).map(respostaAlerta)
    });
  } catch (error) {
    return errorResponse(error, res, 'listar alertas');
  }
}

async function consultarPorId(req, res) {
  if (!isId(req.params.id)) {
    return res.status(400).json({ mensagem: 'ID do alerta inválido.' });
  }

  try {
    const alerta = await alertaDoUsuario(req.params.id, req.usuario.id);
    if (!alerta) {
      return res.status(404).json({ mensagem: 'Alerta não encontrado.' });
    }

    return res.status(200).json({ alerta: respostaAlerta(alerta) });
  } catch (error) {
    return errorResponse(error, res, 'consultar alerta');
  }
}

async function atualizar(req, res) {
  if (!isId(req.params.id)) {
    return res.status(400).json({ mensagem: 'ID do alerta inválido.' });
  }
  if (!isObject(req.body)) {
    return res.status(400).json({ mensagem: 'Informe os campos do alerta.' });
  }

  const dados = pickFields(req.body, camposAtualizacao);
  if (Object.keys(dados).length === 0) {
    return res.status(400).json({ mensagem: 'Informe ao menos um campo válido para atualizar.' });
  }
  if (Object.prototype.hasOwnProperty.call(dados, 'mensagem')) {
    dados.mensagem =
      typeof dados.mensagem === 'string' ? dados.mensagem.trim() : dados.mensagem;
  }
  const erroValidacao = validarCampos(dados);
  if (erroValidacao) {
    return res.status(400).json({ mensagem: erroValidacao });
  }
  if (dados.status === 'enviado' && !dados.data_envio) {
    dados.data_envio = new Date();
  }

  try {
    const alerta = await sequelize.transaction(async (transaction) => {
      const registro = await alertaDoUsuario(
        req.params.id,
        req.usuario.id,
        transaction
      );
      if (!registro) {
        return null;
      }

      await registro.update(dados, { transaction });
      return alertaDoUsuario(registro.id, req.usuario.id, transaction);
    });

    if (!alerta) {
      return res.status(404).json({ mensagem: 'Alerta não encontrado.' });
    }

    return res.status(200).json({
      mensagem: 'Alerta atualizado com sucesso.',
      alerta: respostaAlerta(alerta)
    });
  } catch (error) {
    return errorResponse(error, res, 'atualizar alerta');
  }
}

async function cancelar(req, res) {
  if (!isId(req.params.id)) {
    return res.status(400).json({ mensagem: 'ID do alerta inválido.' });
  }

  try {
    const alerta = await alertaDoUsuario(req.params.id, req.usuario.id);
    if (!alerta) {
      return res.status(404).json({ mensagem: 'Alerta não encontrado.' });
    }

    await alerta.update({ status: 'cancelado' });
    return res.status(200).json({
      mensagem: 'Alerta cancelado com sucesso.',
      alerta: respostaAlerta(alerta)
    });
  } catch (error) {
    return errorResponse(error, res, 'cancelar alerta');
  }
}

module.exports = {
  cadastrar,
  listar,
  consultarPorId,
  atualizar,
  cancelar
};
