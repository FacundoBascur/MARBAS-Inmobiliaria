const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    try {
        const auth = req.header('Authorization');
        if (!auth) return res.status(401).json({ error: 'Token requerido' });
        
        const token = auth.replace('Bearer ', '').trim();
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ 
            error: error.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido' 
        });
    }
}

module.exports = {
    verificarToken
};
