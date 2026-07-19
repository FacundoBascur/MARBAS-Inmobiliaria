const express = require('express');
const router = express.Router();
const { getPropiedades, getTodasPropiedades, getPropiedadById, createPropiedad, updatePropiedad, deletePropiedad } = require('../controllers/propiedadController');
const { verificarToken } = require('../middlewares/auth');
const { configuracionSubida } = require('../config/multer');

router.get('/', getPropiedades);
router.get('/admin', verificarToken, getTodasPropiedades);
router.get('/:id', getPropiedadById);
router.post('/', verificarToken, configuracionSubida, createPropiedad);
router.put('/:id', verificarToken, configuracionSubida, updatePropiedad);
router.delete('/:id', verificarToken, deletePropiedad);

module.exports = router;
