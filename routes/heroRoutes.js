const express = require('express');
const router = express.Router();
const { getHeroImagenes, createHeroImagen, deleteHeroImagen } = require('../controllers/heroController');
const { verificarToken } = require('../middlewares/auth');

router.get('/', getHeroImagenes);                         // público
router.post('/', verificarToken, createHeroImagen);       // solo admin
router.delete('/:id', verificarToken, deleteHeroImagen);  // solo admin

module.exports = router;
