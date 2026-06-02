# 🚀 Mejoras de Seguridad y Optimización - MARBAS Server

## ✅ Cambios Implementados

### 1. **Gestión de Variables de Entorno** 
- ✅ Creado archivo `.env` para credenciales sensibles
- ✅ Creado `.env.example` como referencia
- ✅ **IMPORTANTE**: Agregar `.env` a `.gitignore` para evitar exponer credenciales

### 2. **Seguridad Mejorada**
- ✅ **Helmet.js**: Headers de seguridad HTTP
- ✅ **CORS Restrictivo**: Solo dominios permitidos (configurado en `.env`)
- ✅ **Rate Limiting**: Protección contra DDoS y ataques de fuerza bruta
  - Login: máximo 5 intentos en 15 minutos
  - Email: máximo 3 contactos por hora
  - General: 100 solicitudes por 15 minutos
- ✅ **Validación de Entrada**: Sanitización de todos los datos
- ✅ **Validación de Email**: Usando librería `validator`
- ✅ **Filtrado de Archivos**: Solo imágenes permitidas (JPG, PNG, GIF, WebP)
- ✅ **Límites de Tamaño**: Máximo 10MB por archivo

### 3. **Optimización de Base de Datos**
- ✅ **Pool de Conexiones**: Cambio de `mysql2` a `mysql2/promise` con pool
- ✅ **Reutilización de Conexiones**: 10 conexiones simultáneas
- ✅ **Async/Await**: Mejor manejo de promesas
- ✅ **Keep Alive**: Previene desconexiones inesperadas

### 4. **Performance**
- ✅ **Compresión gzip**: Reduce tamaño de respuestas
- ✅ **JSON Limit**: Limita tamaño de solicitudes a 10MB

### 5. **Autenticación Mejorada**
- ✅ **Refresh Tokens**: Implementado endpoint `/api/refresh-token`
- ✅ **Token JWT expirable**: 2 horas (configurable en `.env`)
- ✅ **Refresh Token**: 7 días (configurable en `.env`)

### 6. **Manejo de Errores**
- ✅ Middleware de error específico para Multer
- ✅ Middleware de error genérico (no expone detalles internos)
- ✅ Logging mejorado con emojis para claridad
- ✅ Rutas 404 manejadas

### 7. **Email Mejorado**
- ✅ HTML emails en lugar de texto plano
- ✅ Escape de contenido para prevenir inyecciones
- ✅ Verificación de conexión de email al iniciar

---

## 📋 Pasos de Implementación

### 1. Instalar Nuevas Dependencias
```bash
npm install
```

**Nuevas librerías agregadas:**
- `dotenv` - Gestión de variables de entorno
- `helmet` - Headers de seguridad
- `compression` - Compresión gzip
- `express-rate-limit` - Rate limiting
- `validator` - Validación y sanitización

### 2. Configurar Variables de Entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores:
# - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
# - JWT_SECRET (cambiar a una clave fuerte)
# - EMAIL_USER, EMAIL_PASSWORD
# - ALLOWED_ORIGINS (agregar tu URL del frontend)
```

### 3. Agregar .env a .gitignore
```bash
echo ".env" >> .gitignore
```

### 4. Iniciar Servidor
```bash
node server.js
```

---

## 🔐 Checklist de Seguridad

- [ ] `.env` configurado correctamente
- [ ] `.env` agregado a `.gitignore`
- [ ] JWT_SECRET cambiado a una clave fuerte
- [ ] ALLOWED_ORIGINS actualizado con tu dominio
- [ ] Email verificado (debería recibir confirmación)
- [ ] Credenciales de email rotadas (usar contraseña de aplicación de Gmail)
- [ ] Base de datos verificada
- [ ] Servidor probado con curl o Postman

---

## 📡 Endpoints Disponibles

### Autenticación
- `POST /api/login` - Autenticación (con rate limiting)
- `POST /api/refresh-token` - Renovar token

### Propiedades
- `GET /api/propiedades` - Obtener todas
- `POST /api/propiedades` - Crear (requiere token)
- `PUT /api/propiedades/:id` - Actualizar (requiere token)
- `DELETE /api/propiedades/:id` - Eliminar (requiere token)

### Contacto
- `POST /api/contacto` - Enviar contacto (con rate limiting)

---

## 🚨 Cambios Críticos para el Frontend

Tu frontend necesitará ajustes:

### 1. Agregar Refresh Token
```javascript
// Guardar refreshToken junto con token
localStorage.setItem('token', data.token);
localStorage.setItem('refreshToken', data.refreshToken);

// Crear interceptor para renovar token expirado
```

### 2. Actualizar CORS Origins
El servidor ahora solo acepta orígenes en `ALLOWED_ORIGINS`. 
**Asegúrate de agregarlo en `.env`**

### 3. Manejo de Errores Mejorado
Los errores ahora son más consistentes:
```javascript
// Respuesta de error:
{ error: "Mensaje descriptivo" }
```

---

## 📊 Comparación: Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| Credenciales | Hardcodeadas | Variables de entorno |
| CORS | Abierto al 100% | Restrictivo |
| Rate Limiting | ❌ | ✅ |
| Validación | Mínima | Robusta |
| Pool de conexiones | ❌ | ✅ (10 conexiones) |
| Compresión | ❌ | ✅ Gzip |
| Refresh Tokens | ❌ | ✅ |
| Manejo de errores | Expone detalles | Seguro |

---

## 🧪 Testing Rápido

### 1. Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"password"}'
```

### 2. Obtener Propiedades
```bash
curl http://localhost:3000/api/propiedades
```

### 3. Crear Propiedad (con token)
```bash
curl -X POST http://localhost:3000/api/propiedades \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"title":"Casa","price":100000,"location":"Ubicación"}'
```

---

## 🔧 Próximas Mejoras Sugeridas

1. **Logging**: Agregar Winston para logs en producción
2. **Caché**: Redis para cachear propiedades
3. **Autenticación**: Implementar 2FA (Two-Factor Authentication)
4. **API Versioning**: `/api/v1/propiedades` para futuras versiones
5. **Documentación**: Swagger/OpenAPI para documentación automática
6. **Tests**: Agregar Jest para testing
7. **Monitoreo**: Application Performance Monitoring (APM)

---

## ⚠️ Notas Importantes

1. **JWT_SECRET en Producción**: Debe ser una clave fuerte y aleatoria
2. **Email de Gmail**: Usar "contraseña de aplicación" en lugar de contraseña de cuenta
3. **ALLOWED_ORIGINS**: Actualizar con tu dominio en producción
4. **Base de datos**: Asegurar backups regulares
5. **SSL/HTTPS**: En producción, usar HTTPS obligatoriamente

---

## 📞 Soporte

Si encuentras problemas:
1. Verifica que `.env` esté configurado correctamente
2. Revisa los logs del servidor (ahora con más detalles)
3. Asegúrate de que las nuevas dependencias están instaladas
4. Verifica credenciales de base de datos y email

¡Servidor mejorado y seguro! 🎉
