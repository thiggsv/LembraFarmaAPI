const express = require('express');
const router = express.Router();

const pedidoController = require('../controllers/pedidoController');
const itemPedidoRoutes = require('./itemPedidoRoutes');
const autenticar = require('../middlewares/autenticacao');

router.use(autenticar);

router.post('/', pedidoController.cadastrar);
router.get('/', pedidoController.listar);
router.get('/:id', pedidoController.consultarPorId);
router.put('/:id', pedidoController.atualizar);
router.patch('/:id/cancelar', pedidoController.cancelar);
router.use('/:pedidoId/itens', itemPedidoRoutes);

module.exports = router;
