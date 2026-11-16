CREATE DATABASE IF NOT EXISTS lembrafarma
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lembrafarma;

CREATE TABLE usuarios (
    id BIGINT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NULL,
    status ENUM('ativo', 'inativo', 'bloqueado') NOT NULL DEFAULT 'ativo',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB;

CREATE TABLE clientes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT NULL,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NULL,
    data_nascimento DATE NULL,
    telefone VARCHAR(20) NULL,
    email VARCHAR(180) NULL,
    cep VARCHAR(9) NULL,
    logradouro VARCHAR(200) NULL,
    numero VARCHAR(20) NULL,
    complemento VARCHAR(100) NULL,
    bairro VARCHAR(100) NULL,
    cidade VARCHAR(120) NULL,
    estado VARCHAR(2) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_clientes_cpf (cpf),
    KEY idx_clientes_usuario_id (usuario_id),
    KEY idx_clientes_nome (nome),
    KEY idx_clientes_cidade (cidade),
    CONSTRAINT fk_clientes_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pedidos (
    id BIGINT NOT NULL AUTO_INCREMENT,
    cliente_id BIGINT NOT NULL,
    usuario_id BIGINT NULL,
    data_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pendente', 'aprovado', 'cancelado', 'entregue', 'em_analise') NOT NULL DEFAULT 'pendente',
    observacoes TEXT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_pedidos_cliente_id (cliente_id),
    KEY idx_pedidos_usuario_id (usuario_id),
    KEY idx_pedidos_status (status),
    CONSTRAINT fk_pedidos_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE itens_pedido (
    id BIGINT NOT NULL AUTO_INCREMENT,
    pedido_id BIGINT NOT NULL,
    codigo_api VARCHAR(100) NULL,
    nome_medicamento VARCHAR(200) NOT NULL,
    principio_ativo VARCHAR(200) NULL,
    apresentacao VARCHAR(200) NULL,
    dosagem VARCHAR(80) NULL,
    unidade_medida VARCHAR(50) NULL,
    quantidade INT NOT NULL DEFAULT 1,
    intervalo_recompra_dias INT NOT NULL,
    data_compra DATE NOT NULL,
    proxima_recompra DATE NOT NULL,
    status ENUM('ativo', 'cancelado', 'concluido') NOT NULL DEFAULT 'ativo',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_itens_pedido_pedido_id (pedido_id),
    KEY idx_itens_pedido_codigo_api (codigo_api),
    KEY idx_itens_pedido_proxima_recompra (proxima_recompra),
    KEY idx_itens_pedido_status (status),
    CONSTRAINT fk_itens_pedido_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE alertas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    cliente_id BIGINT NOT NULL,
    item_pedido_id BIGINT NOT NULL,
    data_prevista DATE NOT NULL,
    data_envio DATETIME NULL,
    status ENUM('pendente', 'enviado', 'cancelado', 'atrasado') NOT NULL DEFAULT 'pendente',
    tipo_alerta ENUM('recompra', 'lembrativo', 'vencimento') NOT NULL DEFAULT 'recompra',
    mensagem TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_alertas_cliente_id (cliente_id),
    KEY idx_alertas_item_pedido_id (item_pedido_id),
    KEY idx_alertas_data_prevista (data_prevista),
    KEY idx_alertas_status (status),
    CONSTRAINT fk_alertas_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_alertas_item_pedido
        FOREIGN KEY (item_pedido_id)
        REFERENCES itens_pedido (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE UNIQUE INDEX uq_alertas_evento
ON alertas (item_pedido_id, data_prevista, tipo_alerta);
