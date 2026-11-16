USE lembrafarma;

INSERT INTO usuarios (nome, email, senha, telefone, status) VALUES
('Ana Souza', 'ana@lembrafarma.com', '$2b$10$Q6a1Jb8TJxwQ2/9i3d1R0OQ4QnNqJ6kP8Q0jVpkJh5w2m1a5w2xvS', '(11) 98888-1111', 'ativo'),
('Carlos Lima', 'carlos@lembrafarma.com', '$2b$10$FQ3eC8Ibi7n8N4hY1pRlduQgP2mRz/Q2nNqR5nFv9DMx3A0d4wuyq', '(11) 97777-2222', 'ativo');

INSERT INTO clientes (usuario_id, nome, cpf, data_nascimento, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado) VALUES
(1, 'Maria Oliveira', '123.456.789-09', '1988-05-14', '(11) 99111-0001', 'maria@email.com', '01000-000', 'Rua A', '100', 'Casa', 'Centro', 'São Paulo', 'SP'),
(1, 'Pedro Santos', '987.654.321-00', '1992-09-20', '(11) 99111-0002', 'pedro@email.com', '02000-000', 'Rua B', '200', 'Apto 1', 'Vila Nova', 'São Paulo', 'SP'),
(2, 'Joana Costa', '456.789.123-55', '1979-11-07', '(11) 99111-0003', 'joana@email.com', '03000-000', 'Rua C', '300', NULL, 'Jardim', 'Campinas', 'SP');

INSERT INTO pedidos (cliente_id, usuario_id, data_pedido, status, observacoes) VALUES
(1, 1, '2026-10-15 09:30:00', 'aprovado', 'Pedido de rotina com acompanhamento mensal.'),
(2, 1, '2026-10-20 08:00:00', 'pendente', 'Recompra para itens com intervalo diverso.');

INSERT INTO itens_pedido (pedido_id, codigo_api, nome_medicamento, principio_ativo, apresentacao, dosagem, unidade_medida, quantidade, intervalo_recompra_dias, data_compra, proxima_recompra, status) VALUES
(1, 'API-001', 'Dipirona', 'Dipirona Sódica', 'Comprimido', '500', 'mg', 2, 30, '2026-10-15', '2026-11-14', 'ativo'),
(1, 'API-002', 'Vitamina C', 'Ácido Ascórbico', 'Capsula', '1000', 'mg', 1, 60, '2026-10-15', '2026-12-14', 'ativo'),
(2, 'API-003', 'Omeprazol', 'Omeprazol', 'Cápsula', '20', 'mg', 1, 7, '2026-10-20', '2026-10-27', 'ativo');

INSERT INTO alertas (cliente_id, item_pedido_id, data_prevista, data_envio, status, tipo_alerta, mensagem) VALUES
(1, 1, '2026-11-14', '2026-11-12 09:00:00', 'enviado', 'recompra', 'Sua recompra de Dipirona está próxima.'),
(1, 2, '2026-12-14', NULL, 'pendente', 'recompra', 'Atenção: sua próxima recompra de Vitamina C está agendada.'),
(2, 3, '2026-10-27', NULL, 'pendente', 'recompra', 'Lembrete de recompra para Omeprazol.');
