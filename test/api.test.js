process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-jwt-secret';
process.env.DB_HOST = 'tidbcloud-test.invalid';
process.env.DB_SSL = 'false';

const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const databaseConfig = require('../config/config');
const db = require('../src/models');
const app = require('../src/server');

let server;
let baseUrl;

before(async () => {
  await db.sequelize.sync();
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await db.sequelize.close();
});

async function request(path, options) {
  const config = options || {};
  const headers = {};

  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }
  if (config.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: config.method || 'GET',
    headers,
    body: config.body === undefined ? undefined : JSON.stringify(config.body)
  });
  const text = await response.text();

  return {
    status: response.status,
    data: text ? JSON.parse(text) : null
  };
}

test('configuração MySQL ativa TLS validado para TiDB Cloud', () => {
  assert.equal(databaseConfig.development.dialect, 'mysql');
  assert.equal(databaseConfig.development.dialectOptions.ssl.rejectUnauthorized, true);
});

test('API autenticada, CRUD e integridade de pedidos, itens e alertas', async (t) => {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const userOneEmail = `api-one-${unique}@example.test`;
  const userTwoEmail = `api-two-${unique}@example.test`;
  let tokenOne;
  let tokenTwo;
  let clientOneId;
  let clientTwoId;
  let orderId;
  let itemOneId;
  let itemTwoId;
  let alertOneId;
  let alertTwoId;

  await t.test('health e autenticação obrigatória', async () => {
    assert.equal((await request('/health')).status, 200);
    for (const path of ['/clientes', '/pedidos', '/alertas']) {
      assert.equal((await request(path)).status, 401);
    }
    assert.equal((await request('/pedidos', {
      token: 'token-invalido'
    })).status, 401);
  });

  await t.test('cadastro/login preservam hash e validam duplicidade', async () => {
    const senha = 'Senha-Teste-123';
    const cadastradoUm = await request('/usuarios', {
      method: 'POST',
      body: { nome: 'Usuário Um', email: userOneEmail, senha }
    });
    const cadastradoDois = await request('/usuarios', {
      method: 'POST',
      body: { nome: 'Usuário Dois', email: userTwoEmail, senha }
    });

    assert.equal(cadastradoUm.status, 201);
    assert.equal(cadastradoUm.data.usuario.senha, undefined);
    assert.equal(cadastradoDois.status, 201);
    assert.equal((await request('/usuarios', {
      method: 'POST',
      body: { nome: 'Duplicado', email: userOneEmail, senha }
    })).status, 409);
    assert.equal((await request('/usuarios', {
      method: 'POST',
      body: { nome: '', email: 'invalido', senha }
    })).status, 400);
    assert.equal((await request('/usuarios/login', {
      method: 'POST',
      body: { email: userOneEmail, senha: 'senha-incorreta' }
    })).status, 401);

    const loginUm = await request('/usuarios/login', {
      method: 'POST',
      body: { email: userOneEmail, senha }
    });
    const loginDois = await request('/usuarios/login', {
      method: 'POST',
      body: { email: userTwoEmail, senha }
    });
    assert.equal(loginUm.status, 200);
    assert.equal(loginDois.status, 200);
    tokenOne = loginUm.data.token;
    tokenTwo = loginDois.data.token;
  });

  await t.test('clientes ficam isolados por usuário', async () => {
    const clienteUm = await request('/clientes', {
      method: 'POST',
      token: tokenOne,
      body: {
        nome: 'Cliente Um',
        cpf: '111.111.111-11',
        usuario_id: 99999
      }
    });
    const clienteDois = await request('/clientes', {
      method: 'POST',
      token: tokenTwo,
      body: { nome: 'Cliente Dois', cpf: '222.222.222-22' }
    });

    assert.equal(clienteUm.status, 201);
    assert.equal(clienteUm.data.cliente.usuario_id, undefined);
    assert.equal(clienteDois.status, 201);
    clientOneId = clienteUm.data.cliente.id;
    clientTwoId = clienteDois.data.cliente.id;
    assert.equal((await request('/clientes', {
      method: 'POST',
      token: tokenOne,
      body: { nome: 'CPF duplicado', cpf: '111.111.111-11' }
    })).status, 409);
    assert.equal((await request('/clientes', {
      method: 'POST',
      token: tokenOne,
      body: { cpf: '333.333.333-33' }
    })).status, 400);

    const listaUm = await request('/clientes', { token: tokenOne });
    assert.equal(listaUm.status, 200);
    assert.deepEqual(listaUm.data.clientes.map((cliente) => cliente.id), [clientOneId]);
    assert.equal((await request(`/clientes/${clientTwoId}`, {
      token: tokenOne
    })).status, 404);
    assert.equal((await request(`/clientes/${clientTwoId}`, {
      method: 'PUT',
      token: tokenOne,
      body: { nome: 'Tentativa indevida' }
    })).status, 404);
    assert.equal((await request(`/clientes/${clientTwoId}`, {
      method: 'DELETE',
      token: tokenOne
    })).status, 404);
  });

  await t.test('pedidos verificam cliente e usuário proprietário', async () => {
    const criado = await request('/pedidos', {
      method: 'POST',
      token: tokenOne,
      body: {
        cliente_id: clientOneId,
        observacoes: 'Pedido inicial',
        usuario_id: 99999
      }
    });
    assert.equal(criado.status, 201);
    assert.equal(criado.data.pedido.usuario_id, undefined);
    orderId = criado.data.pedido.id;
    assert.equal((await request('/pedidos', {
      method: 'POST',
      token: tokenOne,
      body: { cliente_id: clientTwoId }
    })).status, 404);
    assert.equal((await request(`/pedidos/${orderId}`, {
      token: tokenTwo
    })).status, 404);

    const atualizacao = await request(`/pedidos/${orderId}`, {
      method: 'PUT',
      token: tokenOne,
      body: { observacoes: 'Pedido atualizado' }
    });
    assert.equal(atualizacao.status, 200);
    assert.equal(atualizacao.data.pedido.observacoes, 'Pedido atualizado');
    assert.equal((await request('/pedidos', { token: tokenOne })).data.pedidos.length, 1);
  });

  await t.test('itens registram dados recebidos e calculam recompra', async () => {
    const itemUm = await request(`/pedidos/${orderId}/itens`, {
      method: 'POST',
      token: tokenOne,
      body: {
        codigo_api: 'MED-001',
        nome_medicamento: 'Medicamento Teste',
        principio_ativo: 'Composto Teste',
        apresentacao: 'Comprimido',
        dosagem: '500',
        unidade_medida: 'mg',
        quantidade: 2,
        intervalo_recompra_dias: 30,
        data_compra: '2026-10-15',
        proxima_recompra: '2026-10-16',
        pedido_id: 99999
      }
    });
    assert.equal(itemUm.status, 201);
    assert.equal(itemUm.data.item.pedido_id, orderId);
    assert.match(itemUm.data.item.proxima_recompra, /^2026-11-14/);
    itemOneId = itemUm.data.item.id;

    assert.equal((await request(`/pedidos/${orderId}/itens`, {
      method: 'POST',
      token: tokenOne,
      body: {
        nome_medicamento: 'Data Inválida',
        intervalo_recompra_dias: 10,
        data_compra: '2026-02-31'
      }
    })).status, 400);
    assert.equal((await request(`/pedidos/${orderId}/itens/${itemOneId}`, {
      token: tokenTwo
    })).status, 404);

    const atualizado = await request(`/pedidos/${orderId}/itens/${itemOneId}`, {
      method: 'PUT',
      token: tokenOne,
      body: {
        intervalo_recompra_dias: 60,
        proxima_recompra: '2026-10-16'
      }
    });
    assert.equal(atualizado.status, 200);
    assert.match(atualizado.data.item.proxima_recompra, /^2026-12-14/);

    const itemDois = await request(`/pedidos/${orderId}/itens`, {
      method: 'POST',
      token: tokenOne,
      body: {
        nome_medicamento: 'Outro Medicamento',
        intervalo_recompra_dias: 7,
        data_compra: '2026-10-20'
      }
    });
    assert.equal(itemDois.status, 201);
    itemTwoId = itemDois.data.item.id;
    assert.equal((await request(`/pedidos/${orderId}/itens`, {
      token: tokenOne
    })).data.itens.length, 2);

    const pedidoComItens = await request(`/pedidos/${orderId}`, {
      token: tokenOne
    });
    assert.equal(pedidoComItens.data.pedido.itens.length, 2);
    assert.equal((await request(`/pedidos/${orderId}/itens/${itemOneId}/cancelar`, {
      method: 'PATCH',
      token: tokenOne
    })).data.item.status, 'cancelado');
    assert.equal((await request(`/pedidos/${orderId}/itens/${itemTwoId}/concluir`, {
      method: 'PATCH',
      token: tokenOne
    })).data.item.status, 'concluido');
  });

  await t.test('alertas derivam cliente do pedido e respeitam ownership', async () => {
    const alertaUm = await request('/alertas', {
      method: 'POST',
      token: tokenOne,
      body: {
        item_pedido_id: itemOneId,
        cliente_id: clientTwoId,
        data_prevista: '2026-11-14',
        tipo_alerta: 'recompra',
        mensagem: 'Lembrete de teste'
      }
    });
    assert.equal(alertaUm.status, 201);
    assert.equal(String(alertaUm.data.alerta.cliente_id), String(clientOneId));
    alertOneId = alertaUm.data.alerta.id;

    assert.equal((await request('/alertas', {
      method: 'POST',
      token: tokenOne,
      body: {
        item_pedido_id: itemOneId,
        data_prevista: '2026-11-14',
        tipo_alerta: 'recompra',
        mensagem: 'Duplicado'
      }
    })).status, 409);
    assert.equal((await request('/alertas', {
      method: 'POST',
      token: tokenTwo,
      body: {
        item_pedido_id: itemOneId,
        data_prevista: '2026-11-15',
        mensagem: 'Acesso indevido'
      }
    })).status, 404);
    assert.equal((await request(`/alertas/${alertOneId}`, {
      token: tokenTwo
    })).status, 404);
    assert.equal((await request(`/alertas/${alertOneId}`, {
      method: 'PATCH',
      token: tokenTwo,
      body: { status: 'cancelado' }
    })).status, 404);

    const enviado = await request(`/alertas/${alertOneId}`, {
      method: 'PATCH',
      token: tokenOne,
      body: { status: 'enviado' }
    });
    assert.equal(enviado.status, 200);
    assert.equal(enviado.data.alerta.status, 'enviado');
    assert.ok(enviado.data.alerta.data_envio);

    const alertaDois = await request('/alertas', {
      method: 'POST',
      token: tokenOne,
      body: {
        item_pedido_id: itemTwoId,
        data_prevista: '2026-12-01',
        tipo_alerta: 'lembrativo',
        mensagem: 'Alerta cancelável'
      }
    });
    assert.equal(alertaDois.status, 201);
    alertTwoId = alertaDois.data.alerta.id;
    const cancelado = await request(`/alertas/${alertTwoId}/cancelar`, {
      method: 'PATCH',
      token: tokenOne
    });
    assert.equal(cancelado.status, 200);
    assert.equal(cancelado.data.alerta.status, 'cancelado');
    assert.equal((await request('/alertas', {
      token: tokenOne
    })).data.alertas.length, 2);
  });

  await t.test('cancelamento de pedido e exclusão própria de cliente', async () => {
    const cancelado = await request(`/pedidos/${orderId}/cancelar`, {
      method: 'PATCH',
      token: tokenOne
    });
    assert.equal(cancelado.status, 200);
    assert.equal(cancelado.data.pedido.status, 'cancelado');
    assert.equal((await request(`/pedidos/${orderId}/itens`, {
      method: 'POST',
      token: tokenOne,
      body: {
        nome_medicamento: 'Item após cancelamento',
        intervalo_recompra_dias: 1,
        data_compra: '2026-10-20'
      }
    })).status, 409);
    assert.equal((await request(`/clientes/${clientOneId}`, {
      method: 'DELETE',
      token: tokenOne
    })).status, 409);

    assert.equal((await request(`/clientes/${clientTwoId}`, {
      method: 'DELETE',
      token: tokenTwo
    })).status, 204);
  });
});
