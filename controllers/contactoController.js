const transporter = require('../config/mailer');
const { validarEmail, sanitizar } = require('../utils/helpers');
const validator = require('validator');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const enviarContacto = catchAsync(async (req, res, next) => {
    const { nombre, telefono, email, propiedad, mensaje } = req.body;

    if (!nombre || !email || !mensaje) {
        throw new AppError('Campos requeridos faltantes', 400);
    }

    if (!validarEmail(email)) {
        throw new AppError('Email inválido', 400);
    }

    const contactoData = {
        nombre: sanitizar(nombre).substring(0, 100),
        telefono: sanitizar(telefono).substring(0, 20),
        email: validator.normalizeEmail(email),
        propiedad: propiedad ? sanitizar(propiedad).substring(0, 200) : null,
        mensaje: sanitizar(mensaje).substring(0, 5000)
    };

    const textBody = `Nueva consulta de ${contactoData.nombre}\n${contactoData.propiedad ? 'Propiedad: ' + contactoData.propiedad + '\n' : ''}Mensaje:\n${contactoData.mensaje}`;
    const htmlPropiedad = contactoData.propiedad ? `<p><strong>Propiedad:</strong> ${validator.escape(contactoData.propiedad)}</p>` : '';

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        replyTo: contactoData.email,
        subject: `Nueva consulta de ${contactoData.nombre}`,
        text: textBody,
        html: `
            <h2>Nueva Consulta de Contacto</h2>
            <p><strong>Nombre:</strong> ${validator.escape(contactoData.nombre)}</p>
            <p><strong>Teléfono:</strong> ${validator.escape(contactoData.telefono)}</p>
            <p><strong>Email:</strong> ${validator.escape(contactoData.email)}</p>
            ${htmlPropiedad}
            <hr/>
            <h3>Mensaje:</h3>
            <p>${validator.escape(contactoData.mensaje).replace(/\n/g, '<br>')}</p>
        `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ mensaje: 'Correo enviado exitosamente' });
});

module.exports = {
    enviarContacto
};
