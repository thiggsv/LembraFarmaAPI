
-- =====================================================
-- LEMBRAFARMA - SCRIPT DE TESTE DO BANCO DE DADOS
-- =====================================================

USE lembrafarma;

-- 1. INSERIR USUARIO

INSERT INTO usuarios
(nome, email, senha, telefone, status)
VALUES
('Ana Souza', 'ana@lembrafarma.com',
 '$2b$10$hashfake123456', '(11) 98888-1111', 'ativo');


-- 2. INSERIR CLIENTES

INSERT INTO clientes
(usuario_id, nome, cpf, data_nascimento, telefone,
 email, cep, logradouro, numero, complemento,
 bairro, cidade, estado)
VALUES
(1, 'Maria Oliveira', '123.456.789-09',
 '1988-05-14', '(11) 99111-0001',
 'maria@email.com', '01000-000',
 'Rua A', '100', 'Casa', 'Centro',
 'São Paulo', 'SP'),

(1, 'Pedro Santos', '987.654.321-00',
 '1992-09-20', '(11) 99111-0002',
 'pedro@email.com', '02000-000',
 'Rua B', '200', 'Apto 1', 'Vila Nova',
 'São Paulo', 'SP');


-- 3. INSERIR PEDIDO

INSERT INTO pedidos
(cliente_id, usuario_id, data_pedido, status, observacoes)
VALUES
(1, 1, '2026-10-15 09:30:00',
 'aprovado',
 'Pedido de rotina com acompanhamento mensal.');


-- 4. INSERIR ITENS DO PEDIDO

INSERT INTO itens_pedido
(pedido_id, codigo_api, nome_medicamento,
 principio_ativo, apresentacao, dosagem,
 unidade_medida, quantidade, intervalo_recompra_dias,
 data_compra, proxima_recompra, status)
VALUES

(1, 'API-001', 'Dipirona', 'Dipirona Sódica',
 'Comprimido', '500', 'mg', 2, 30,
 '2026-10-15', '2026-11-14', 'ativo'),

(1, 'API-002', 'Vitamina C', 'Ácido Ascórbico',
 'Cápsula', '1000', 'mg', 1, 60,
 '2026-10-15', '2026-12-14', 'ativo'),

(1, 'API-003', 'Omeprazol', 'Omeprazol',
 'Cápsula', '20', 'mg', 1, 7,
 '2026-10-15', '2026-10-22', 'ativo');


-- 5. INSERIR ALERTAS INDEPENDENTES

INSERT INTO alertas
(cliente_id, item_pedido_id, data_prevista,
 data_envio, status, tipo_alerta, mensagem)
VALUES

(1, 1, '2026-11-14',
 '2026-11-12 09:00:00',
 'enviado', 'recompra',
 'Sua recompra de Dipirona está próxima.'),

(1, 2, '2026-12-14',
 NULL, 'pendente', 'recompra',
 'Atenção: sua próxima recompra de Vitamina C está agendada.'),

(1, 3, '2026-10-22',
 NULL, 'pendente', 'recompra',
 'Lembrete de recompra para Omeprazol.');


-- =====================================================
-- 6. CONSULTAS DE VALIDACAO
-- =====================================================

-- Verificar usuarios
SELECT * FROM usuarios;

-- Verificar clientes e usuarios
SELECT
    c.id,
    c.nome,
    u.nome AS usuario
FROM clientes c
LEFT JOIN usuarios u
ON u.id = c.usuario_id;

-- Verificar pedidos e clientes
SELECT
    p.id,
    c.nome,
    p.status,
    p.data_pedido
FROM pedidos p
JOIN clientes c
ON c.id = p.cliente_id;

-- Verificar itens e prazos diferentes
SELECT *
FROM itens_pedido
WHERE pedido_id = 1;

-- Verificar alertas por medicamento
SELECT
    a.id,
    c.nome,
    i.nome_medicamento,
    a.data_prevista,
    a.status
FROM alertas a
JOIN clientes c
ON c.id = a.cliente_id
JOIN itens_pedido i
ON i.id = a.item_pedido_id;


-- =====================================================
-- 7. TESTE DE INTEGRIDADE
-- =====================================================

SELECT *
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'lembrafarma';

SHOW CREATE TABLE itens_pedido;

SHOW CREATE TABLE alertas;


-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
