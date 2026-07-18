const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
});

transporter.verify((error) => {
    if (error) {
        console.log('Email no verificado:', error.message);
    } else {
        console.log('Email configurado y listo para mandar');
    }
});

module.exports = transporter;
