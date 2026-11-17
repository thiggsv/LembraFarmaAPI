const express = require('express');
const router = express.Router();

const alertaController = require('../controllers/alertaController');
const autenticar = require('../middlewares/autenticacao');

router.use(autenticar);

router.post('/', alertaController.cadastrar);
router.get('/', alertaController.listar);
router.get('/:id', alertaController.consultarPorId);
router.patch('/:id', alertaController.atualizar);
router.patch('/:id/cancelar', alertaController.cancelar);

module.exports = router;
