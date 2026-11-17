# LembraFarma API

API REST para organizar clientes, pedidos de medicamentos, itens e alertas de recompra. A autenticação é feita por JWT; cada registro operacional é limitado ao usuário autenticado.

## Tecnologias

- Node.js e Express
- Sequelize
- MySQL 8 ou TiDB Cloud
- SQLite em memória para os testes automatizados
- bcryptjs e JSON Web Token

## Estrutura

```text
config/       Configuração do Sequelize
migrations/   Evolução explícita do schema
seeders/      Dados demonstrativos (não executados automaticamente)
src/
  controllers/
  middlewares/
  models/
  routes/
  utils/
test/         Testes HTTP de integração
database/     DDL e DML de referência
```

## Instalação e configuração

Requer Node.js 20.17 ou superior (versão mínima da dependência SQLite de teste) e um banco MySQL/TiDB disponível.

```sh
npm ci
```

Copie `.env.example` para `.env` (no PowerShell: `Copy-Item .env.example .env`) e configure:

| Variável | Descrição |
| --- | --- |
| `NODE_ENV` | Ambiente (`development` ou `production`) |
| `PORT` | Porta HTTP; padrão `3000` |
| `DB_DIALECT` | `mysql` para MySQL/TiDB |
| `DB_HOST` | Host do banco; padrão `127.0.0.1` |
| `DB_PORT` | Porta do banco; padrão `3306` |
| `DB_NAME` | Schema/database existente |
| `DB_USER` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `DB_SSL` | Ativa TLS explicitamente (`true`/`false`) |
| `DB_SSL_CA` | Opcional: caminho para certificado CA |
| `JWT_SECRET` | Segredo aleatório forte para assinar tokens |

O serviço falha explicitamente se `DB_USER`, `DB_PASSWORD`, `DB_NAME` ou `JWT_SECRET` não estiverem configurados. Nunca versione o `.env`; o `.gitignore` já o exclui. `.env.example` contém apenas valores ilustrativos.

### Criar o schema

Crie primeiro o database vazio no MySQL/TiDB:

```sql
CREATE DATABASE lembrafarma
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Com as variáveis do `.env` configuradas, confira e aplique as migrations:

```sh
npm run db:migrate:status
npm run db:migrate
```

O servidor **não** executa migrations nem `sequelize.sync()` ao iniciar. `database/ddl.sql` é uma alternativa de referência para criar todo o schema; não o execute junto com as migrations no mesmo database. Seeders também não são executados automaticamente.

## Iniciar e testar

```sh
npm start
```

Para desenvolvimento com reinício automático:

```sh
npm run dev
```

Executar os testes de integração:

```sh
npm test
```

Os testes usam SQLite em memória e não acessam o MySQL/TiDB configurado no `.env`.

## Autenticação

Cadastre um usuário e faça login:

```sh
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome":"Ana","email":"ana@example.com","senha":"uma-senha-forte"}'

curl -X POST http://localhost:3000/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","senha":"uma-senha-forte"}'
```

Envie o token retornado em `Authorization: Bearer <TOKEN>` nas rotas privadas. O `usuario_id` é sempre obtido do token; o servidor não confia nesse campo vindo do cliente.

## Endpoints

`/health` verifica a conexão com o banco e não requer autenticação. `/perfil` e todas as rotas abaixo, exceto cadastro/login de usuários, exigem JWT.

### Usuários

| Método | Rota | Ação |
| --- | --- | --- |
| `POST` | `/usuarios` | Cadastro |
| `POST` | `/usuarios/login` | Login e emissão de JWT |
| `GET` | `/perfil` | Usuário autenticado |

### Clientes

| Método | Rota | Ação |
| --- | --- | --- |
| `POST` | `/clientes` | Cadastrar |
| `GET` | `/clientes` | Listar os clientes do usuário |
| `GET` | `/clientes/:id` | Consultar |
| `PUT` | `/clientes/:id` | Atualizar |
| `DELETE` | `/clientes/:id` | Excluir |

### Pedidos

| Método | Rota | Ação |
| --- | --- | --- |
| `POST` | `/pedidos` | Cadastrar para um cliente próprio (`cliente_id`) |
| `GET` | `/pedidos` | Listar pedidos próprios, cliente e itens |
| `GET` | `/pedidos/:id` | Consultar pedido com cliente e itens |
| `PUT` | `/pedidos/:id` | Atualizar `cliente_id`, `data_pedido`, `status` ou `observacoes` |
| `PATCH` | `/pedidos/:id/cancelar` | Cancelar |

Status aceitos: `pendente`, `aprovado`, `cancelado`, `entregue` e `em_analise`.

### Itens de pedido

| Método | Rota | Ação |
| --- | --- | --- |
| `POST` | `/pedidos/:pedidoId/itens` | Cadastrar item |
| `GET` | `/pedidos/:pedidoId/itens` | Listar itens do pedido |
| `GET` | `/pedidos/:pedidoId/itens/:itemId` | Consultar item |
| `PUT` | `/pedidos/:pedidoId/itens/:itemId` | Atualizar dados do item |
| `PATCH` | `/pedidos/:pedidoId/itens/:itemId/cancelar` | Cancelar item ativo |
| `PATCH` | `/pedidos/:pedidoId/itens/:itemId/concluir` | Concluir item ativo |

O cadastro exige `nome_medicamento`, `intervalo_recompra_dias` e `data_compra` (`YYYY-MM-DD`). `codigo_api`, princípio ativo, apresentação, dosagem, unidade e quantidade são aceitos; `proxima_recompra` é calculada pelo servidor. Não há integração externa de medicamentos neste repositório: os dados do catálogo devem ser obtidos pelo consumidor da API e enviados no cadastro do item.

### Alertas

| Método | Rota | Ação |
| --- | --- | --- |
| `POST` | `/alertas` | Criar com `item_pedido_id`, `data_prevista` e `mensagem` |
| `GET` | `/alertas` | Listar alertas próprios |
| `GET` | `/alertas/:id` | Consultar |
| `PATCH` | `/alertas/:id` | Atualizar status/dados |
| `PATCH` | `/alertas/:id/cancelar` | Cancelar |

O `cliente_id` do alerta é derivado do pedido ao qual o item pertence. Status aceitos: `pendente`, `enviado`, `cancelado` e `atrasado`; tipos: `recompra`, `lembrativo` e `vencimento`. Não há envio automático de notificações.

## TiDB Cloud

Use as credenciais e o endpoint fornecidos no painel do TiDB Cloud em `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`. Configure `DB_SSL=true`; hosts contendo `tidbcloud` também ativam TLS. A validação do certificado TLS permanece habilitada. Se o provedor fornecer CA própria, informe o caminho local em `DB_SSL_CA`. Não desative a validação do certificado para contornar erros de conexão.

O projeto mantém MySQL local e TiDB por meio do dialeto `mysql`. A conexão remota não é validada pelos testes automatizados; requer credenciais e acesso de rede da equipe.