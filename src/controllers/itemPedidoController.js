const { ItemPedido, Pedido, sequelize } = require('../models');
const { isId, isObject, pickFields, errorResponse } = require('../utils/api');

const camposItem = [
  'codigo_api',
  'nome_medicamento',
  'principio_ativo',
  'apresentacao',
  'dosagem',
  'unidade_medida',
  'quantidade',
  'intervalo_recompra_dias',
  'data_compra'
];

const tamanhosCampo = {
  codigo_api: 100,
  nome_medicamento: 200,
  principio_ativo: 200,
  apresentacao: 200,
  dosagem: 80,
  unidade_medida: 50
};

function dataISO(valor) {
  let texto = valor;
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    texto = valor.toISOString().slice(0, 10);
  }

  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return null;
  }

  const [ano, mes, dia] = texto.split('-').map(Number);
  if (ano < 1000) {
    return null;
  }

  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    return null;
  }

  return texto;
}

function proximaData(data, intervalo) {
  const partes = data.split('-').map(Number);
  const proxima = new Date(Date.UTC(partes[0], partes[1] - 1, partes[2] + intervalo));
  if (!Number.isFinite(proxima.getTime()) || proxima.getUTCFullYear() > 9999) {
    return null;
  }

  return proxima.toISOString().slice(0, 10);
}

function validarCampos(dados) {
  for (const [campo, tamanho] of Object.entries(tamanhosCampo)) {
    if (
      Object.prototype.hasOwnProperty.call(dados, campo) &&
      dados[campo] !== null &&
      (typeof dados[campo] !== 'string' || dados[campo].length > tamanho)
    ) {
      return `O campo ${campo} deve ser um texto de até ${tamanho} caracteres.`;
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(dados, 'nome_medicamento') &&
    (typeof dados.nome_medicamento !== 'string' || !dados.nome_medicamento.trim())
  ) {
    return 'O nome do medicamento é obrigatório.';
  }

  for (const campo of ['quantidade', 'intervalo_recompra_dias']) {
    if (
      Object.prototype.hasOwnProperty.call(dados, campo) &&
      (!Number.isSafeInteger(dados[campo]) || dados[campo] < 1)
    ) {
      return `O campo ${campo} deve ser um inteiro positivo.`;
    }
  }

  if (
    (dados.quantidade && dados.quantidade > 2147483647) ||
    (dados.intervalo_recompra_dias && dados.intervalo_recompra_dias > 2147483647)
  ) {
    return 'Quantidade e intervalo de recompra não podem exceder o limite do banco.';
  }

  if (Object.prototype.hasOwnProperty.call(dados, 'data_compra')) {
    const data = dataISO(dados.data_compra);
    if (!data) {
      return 'A data_compra deve estar no formato YYYY-MM-DD e ser uma data válida.';
    }
    dados.data_compra = data;
  }

  return null;
}

async function pedidoDoUsuario(pedidoId, usuarioId, transaction) {
  return Pedido.findOne({
    where: { id: pedidoId, usuario_id: usuarioId },
    transaction
  });
}

async function itemDoPedido(pedidoId, itemId, usuarioId, transaction) {
  const pedido = await pedidoDoUsuario(pedidoId, usuarioId, transaction);
  if (!pedido) {
    return null;
  }

  const item = await ItemPedido.findOne({
    where: { id: itemId, pedido_id: pedido.id },
    transaction
  });

  return item ? { pedido, item } : null;
}

function respostaItem(item) {
  return {
    id: item.id,
    pedido_id: item.pedido_id,
    codigo_api: item.codigo_api,
    nome_medicamento: item.nome_medicamento,
    principio_ativo: item.principio_ativo,
    apresentacao: item.apresentacao,
    dosagem: item.dosagem,
    unidade_medida: item.unidade_medida,
    quantidade: item.quantidade,
    intervalo_recompra_dias: item.intervalo_recompra_dias,
    data_compra: item.data_compra,
    proxima_recompra: item.proxima_recompra,
    status: item.status
  };
}

async function cadastrar(req, res) {
  if (!isId(req.params.pedidoId)) {
    return res.status(400).json({ mensagem: 'ID do pedido inválido.' });
  }
  if (!isObject(req.body)) {
    return res.status(400).json({ mensagem: 'Informe os dados do item.' });
  }

  const dados = pickFields(req.body, camposItem);
  if (
    typeof dados.nome_medicamento !== 'string' ||
    !dados.nome_medicamento.trim() ||
    !Object.prototype.hasOwnProperty.call(dados, 'intervalo_recompra_dias') ||
    !Object.prototype.hasOwnProperty.call(dados, 'data_compra')
  ) {
    return res.status(400).json({
      mensagem: 'Nome do medicamento, intervalo de recompra e data da compra são obrigatórios.'
    });
  }
  if (!Object.prototype.hasOwnProperty.call(dados, 'quantidade')) {
    dados.quantidade = 1;
  }
  dados.nome_medicamento = dados.nome_medicamento.trim();

  const erroValidacao = validarCampos(dados);
  if (erroValidacao) {
    return res.status(400).json({ mensagem: erroValidacao });
  }
  const proximaRecompra = proximaData(
    dados.data_compra,
    dados.intervalo_recompra_dias
  );
  if (!proximaRecompra) {
    return res.status(400).json({ mensagem: 'A data prevista para recompra é inválida.' });
  }

  try {
    const resultado = await sequelize.transaction(async (transaction) => {
      const pedido = await pedidoDoUsuario(
        req.params.pedidoId,
        req.usuario.id,
        transaction
      );
      if (!pedido) {
        return null;
      }
      if (pedido.status === 'cancelado') {
        return { pedidoCancelado: true };
      }

      return ItemPedido.create({
        ...dados,
        pedido_id: pedido.id,
        proxima_recompra: proximaRecompra,
        status: 'ativo'
      }, { transaction });
    });

    if (!resultado) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
    }
    if (resultado.pedidoCancelado) {
      return res.status(409).json({ mensagem: 'Não é possível adicionar itens a um pedido cancelado.' });
    }

    return res.status(201).json({
      mensagem: 'Item cadastrado com sucesso.',
      item: respostaItem(resultado)
    });
  } catch (error) {
    return errorResponse(error, res, 'cadastrar item');
  }
}

async function listarPorPedido(req, res) {
  if (!isId(req.params.pedidoId)) {
    return res.status(400).json({ mensagem: 'ID do pedido inválido.' });
  }

  try {
    const pedido = await pedidoDoUsuario(req.params.pedidoId, req.usuario.id);
    if (!pedido) {
      return res.status(404).json({ mensagem: 'Pedido não encontrado.' });
    }

    const itens = await ItemPedido.findAll({
      where: { pedido_id: pedido.id },
      order: [['id', 'ASC']]
    });

    return res.status(200).json({ itens: itens.map(respostaItem) });
  } catch (error) {
    return errorResponse(error, res, 'listar itens');
  }
}

async function consultarPorId(req, res) {
  if (!isId(req.params.pedidoId) || !isId(req.params.itemId)) {
    return res.status(400).json({ mensagem: 'ID do pedido ou do item inválido.' });
  }

  try {
    const resultado = await itemDoPedido(
      req.params.pedidoId,
      req.params.itemId,
      req.usuario.id
    );
    if (!resultado) {
      return res.status(404).json({ mensagem: 'Item não encontrado.' });
    }

    return res.status(200).json({ item: respostaItem(resultado.item) });
  } catch (error) {
    return errorResponse(error, res, 'consultar item');
  }
}

async function atualizar(req, res) {
  if (!isId(req.params.pedidoId) || !isId(req.params.itemId)) {
    return res.status(400).json({ mensagem: 'ID do pedido ou do item inválido.' });
  }
  if (!isObject(req.body)) {
    return res.status(400).json({ mensagem: 'Informe os campos do item.' });
  }

  const dados = pickFields(req.body, camposItem);
  if (Object.keys(dados).length === 0) {
    return res.status(400).json({ mensagem: 'Informe ao menos um campo válido para atualizar.' });
  }
  if (Object.prototype.hasOwnProperty.call(dados, 'nome_medicamento')) {
    dados.nome_medicamento =
      typeof dados.nome_medicamento === 'string' ? dados.nome_medicamento.trim() : dados.nome_medicamento;
  }

  const erroValidacao = validarCampos(dados);
  if (erroValidacao) {
    return res.status(400).json({ mensagem: erroValidacao });
  }

  try {
    const resultado = await sequelize.transaction(async (transaction) => {
      const encontrado = await itemDoPedido(
        req.params.pedidoId,
        req.params.itemId,
        req.usuario.id,
        transaction
      );
      if (!encontrado) {
        return null;
      }

      const { item } = encontrado;
      const dataCompra = Object.prototype.hasOwnProperty.call(dados, 'data_compra')
        ? dados.data_compra
        : dataISO(item.data_compra);
      const intervalo = Object.prototype.hasOwnProperty.call(dados, 'intervalo_recompra_dias')
        ? dados.intervalo_recompra_dias
        : item.intervalo_recompra_dias;
      const proximaRecompra = proximaData(dataCompra, intervalo);
      if (!proximaRecompra) {
        return { dataInvalida: true };
      }

      await item.update({
        ...dados,
        proxima_recompra: proximaRecompra
      }, { transaction });

      return item;
    });

    if (!resultado) {
      return res.status(404).json({ mensagem: 'Item não encontrado.' });
    }
    if (resultado.dataInvalida) {
      return res.status(400).json({ mensagem: 'A data prevista para recompra é inválida.' });
    }

    return res.status(200).json({
      mensagem: 'Item atualizado com sucesso.',
      item: respostaItem(resultado)
    });
  } catch (error) {
    return errorResponse(error, res, 'atualizar item');
  }
}

async function alterarStatus(req, res, status, mensagem) {
  if (!isId(req.params.pedidoId) || !isId(req.params.itemId)) {
    return res.status(400).json({ mensagem: 'ID do pedido ou do item inválido.' });
  }

  try {
    const resultado = await sequelize.transaction(async (transaction) => {
      const encontrado = await itemDoPedido(
        req.params.pedidoId,
        req.params.itemId,
        req.usuario.id,
        transaction
      );
      if (!encontrado) {
        return null;
      }
      if (encontrado.item.status !== 'ativo') {
        return { conflito: true };
      }

      await encontrado.item.update({ status }, { transaction });
      return encontrado.item;
    });

    if (!resultado) {
      return res.status(404).json({ mensagem: 'Item não encontrado.' });
    }
    if (resultado.conflito) {
      return res.status(409).json({ mensagem: 'Somente itens ativos podem mudar de estado.' });
    }

    return res.status(200).json({
      mensagem,
      item: respostaItem(resultado)
    });
  } catch (error) {
    return errorResponse(error, res, 'alterar status do item');
  }
}

function cancelar(req, res) {
  return alterarStatus(req, res, 'cancelado', 'Item cancelado com sucesso.');
}

function concluir(req, res) {
  return alterarStatus(req, res, 'concluido', 'Item concluído com sucesso.');
}

module.exports = {
  cadastrar,
  listarPorPedido,
  consultarPorId,
  atualizar,
  cancelar,
  concluir
};
