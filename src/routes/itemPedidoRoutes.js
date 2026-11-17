const express = require('express');
const router = express.Router({ mergeParams: true });

const itemPedidoController = require('../controllers/itemPedidoController');
const autenticar = require('../middlewares/autenticacao');

router.use(autenticar);

router.post('/', itemPedidoController.cadastrar);
router.get('/', itemPedidoController.listarPorPedido);
router.get('/:itemId', itemPedidoController.consultarPorId);
router.put('/:itemId', itemPedidoController.atualizar);
router.patch('/:itemId/cancelar', itemPedidoController.cancelar);
router.patch('/:itemId/concluir', itemPedidoController.concluir);

module.exports = router;
