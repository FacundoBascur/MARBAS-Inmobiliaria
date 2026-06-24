const express = require('express');
const router = express.Router();
const { getPropiedades, createPropiedad, updatePropiedad, deletePropiedad } = require('../controllers/propiedadController');
const { verificarToken } = require('../middlewares/auth');
const { configuracionSubida } = require('../config/multer');

router.get('/', getPropiedades);
router.post('/', verificarToken, configuracionSubida, createPropiedad);
router.put('/:id', verificarToken, updatePropiedad);
router.delete('/:id', verificarToken, deletePropiedad);

module.exports = router;
