const express = require('express');
const router = express.Router();

const clienteController = require('../controllers/clienteController');
const autenticar = require('../middlewares/autenticacao');

router.use(autenticar);

router.post('/', clienteController.cadastrar);
router.get('/', clienteController.listar);
router.get('/:id', clienteController.consultarPorId);
router.put('/:id', clienteController.atualizar);
router.delete('/:id', clienteController.excluir);

module.exports = router;
