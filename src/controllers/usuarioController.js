
const { Usuario } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { errorResponse, isObject } = require('../utils/api');

async function cadastrar(req, res) {
  if (!isObject(req.body)) {
    return res.status(400).json({
      mensagem: 'Informe os dados do usuário.'
    });
  }

  try {
    const { nome, email, senha, telefone } = req.body;

    if (
      typeof nome !== 'string' ||
      !nome.trim() ||
      nome.trim().length > 150 ||
      typeof email !== 'string' ||
      !email.trim() ||
      email.trim().length > 180 ||
      typeof senha !== 'string' ||
      !senha ||
      (
        telefone !== undefined &&
        telefone !== null &&
        (typeof telefone !== 'string' || telefone.length > 20)
      )
    ) {
      return res.status(400).json({
        mensagem: 'Nome, e-mail e senha são obrigatórios.'
      });
    }
    const nomeNormalizado = nome.trim();
    const emailNormalizado = email.trim();

    const usuarioExistente = await Usuario.findOne({
      where: { email: emailNormalizado }
    });

    if (usuarioExistente) {
      return res.status(409).json({
        mensagem: 'Este e-mail já está cadastrado.'
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await Usuario.create({
      nome: nomeNormalizado,
      email: emailNormalizado,
      senha: senhaHash,
      telefone
    });

    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso!',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        status: usuario.status
      }
    });

  } catch (error) {
    return errorResponse(error, res, 'cadastrar usuário', 'Este e-mail já está cadastrado.');
  }
}

async function login(req, res) {
  if (!isObject(req.body)) {
    return res.status(400).json({
      mensagem: 'Informe e-mail e senha.'
    });
  }

  try {
    const { email, senha } = req.body;

    if (typeof email !== 'string' || !email.trim() || typeof senha !== 'string' || !senha) {
      return res.status(400).json({
        mensagem: 'E-mail e senha são obrigatórios.'
      });
    }

    const usuario = await Usuario.findOne({
      where: { email: email.trim() }
    });

    if (!usuario) {
      return res.status(401).json({
        mensagem: 'E-mail ou senha inválidos.'
      });
    }

    const senhaValida = await bcrypt.compare(
      senha,
      usuario.senha
    );

    if (!senhaValida) {
      return res.status(401).json({
        mensagem: 'E-mail ou senha inválidos.'
      });
    }

    if (usuario.status !== 'ativo') {
      return res.status(403).json({
        mensagem: 'Usuário não está ativo.'
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });

  } catch (error) {
    return errorResponse(error, res, 'realizar login');
  }
}

module.exports = {
  cadastrar,
  login
};
