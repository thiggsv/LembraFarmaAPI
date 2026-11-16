const express = require('express');
const cors = require('cors');
const db = require('./models');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.status(200).json({
      status: 'ok',
      database: db.sequelize.getDatabaseName()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Falha ao conectar com o banco de dados',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

db.sequelize
  .sync({ alter: false })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao sincronizar o banco de dados:', error);
    process.exit(1);
  });

module.exports = app;
