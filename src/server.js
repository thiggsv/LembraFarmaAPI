const express = require('express');
const cors = require('cors');
const db = require('./models');
const usuarioRoutes = require('./routes/usuarioRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const alertaRoutes = require('./routes/alertaRoutes');
const autenticar = require('./middlewares/autenticacao');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/usuarios', usuarioRoutes);
app.use('/clientes', clienteRoutes);
app.use('/pedidos', pedidoRoutes);
app.use('/alertas', alertaRoutes);
app.get('/perfil', autenticar, (req, res) => {
  res.json({
    mensagem: 'Acesso autorizado!',
    usuario: req.usuario
  });
});

app.get('/health', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.status(200).json({
      status: 'ok',
      database: db.sequelize.getDatabaseName()
    });
  } catch (error) {
    console.error('Falha ao verificar conexão com banco:', error.name);
    res.status(500).json({
      status: 'error',
      message: 'Falha ao conectar com o banco de dados'
    });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET não está configurada.');
    process.exit(1);
  }

  db.sequelize
    .authenticate()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
      });
    })
    .catch((error) => {
      const detalhes = { tipo: error.name };
      if (error.original && error.original.code) {
        detalhes.codigo = error.original.code;
      }
      console.error('Falha ao conectar ao banco de dados:', detalhes);
      process.exit(1);
    });
}

module.exports = app;
