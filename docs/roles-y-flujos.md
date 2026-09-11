# Roles y flujos conectados

## Comportamiento

- El registro público crea una cuenta RESIDENTE, tal como exige `ms-usuarios`. Se retiró el selector de administrador que el servidor ignoraba. Las cuentas ADMIN se provisionan por el responsable usando los mecanismos del backend.
- El inicio de sesión y la restauración de sesión usan `/auth/me` para obtener el rol y la identidad del servidor. No se decide el rol por el formulario ni por el correo. Una sesión que no se puede verificar ofrece reintento o cierre de sesión.
- Administrador: resumen general, directorio con alta y edición de datos, emisión de cuotas y registro de pagos recibidos, consultas de incidencias, reservas y analítica.
- Residente: resumen personal, alta/edición de su ficha, estado de cuenta de su unidad y consulta de incidencias y reservas asociadas a su ID. Las rutas de directorio, fichas ajenas y analítica redirigen al inicio personal.
- La creación de la cuenta y la ficha son dos pasos explícitos. Si falla guardar la ficha, la cuenta permanece creada; al volver a entrar se puede completar el segundo paso sin registrar otra cuenta.
- La contraseña exige al menos 8 caracteres y no más de 72 bytes. El navegador valida correo, campos obligatorios y longitud; también hay validación antes del envío.
- Las cuotas y pagos se consultan por `unidad_id`. Además, la interfaz descarta cuotas de otras unidades y pagos que no pertenecen a esas cuotas, incluso si el servicio ignora el filtro. Los pagos son de la unidad y no necesariamente realizados por la persona que inició sesión.
- El saldo resta abonos parciales, excluye cuotas anuladas y nunca muestra saldo negativo por sobrepago. Las fechas sin hora conservan el día calendario.
- Registrar un pago es una operación contable de administración, no una pasarela de cobro. El residente no tiene un botón de pago simulado.

## Contratos verificados

Se consultaron los archivos de `main` de los repositorios del equipo al implementar:

- `comdominios-cloud/ms-usuarios`: `app/routers/auth.py`, `app/routers/usuarios.py`, `app/schemas/auth.py`, `app/schemas/usuario.py`.
- `comdominios-cloud/ms-residentes`: `app/routers/residentes.py`, `app/routers/unidades.py`, `app/schemas/residente.py`, `app/schemas/unidad.py`.
- `comdominios-cloud/ms-pagos`: controllers, DTOs, `PagoService`, `CuotaService` y `model/Pago.java` bajo `src/main/java/pe/edu/utec/condominio/pagos/`.

Los formularios usan POST `/residentes`, PUT `/residentes/{id}`, POST `/cuotas` y POST `/pagos`; no se inventaron endpoints. El alta de ficha requiere nombres, apellidos, documento, correo y una unidad existente. El documento y la unidad no se cambian por PUT porque el contrato actual no lo admite.

## Límites que requieren trabajo de backend

1. Las cuentas antiguas pueden tener `residente_id = null`. La API de usuarios no ofrece una actualización para vincularlas después del alta de ficha. En ese caso, el frontend recupera la ficha por coincidencia única de correo normalizado, nunca por nombre ni por la primera fila. Si el correo está duplicado, muestra un error para que administración corrija el padrón. Si existe `residente_id`, se usa ese identificador. No se simula una actualización de la cuenta.
2. Esa asociación por correo sirve para la integración actual, pero no acredita residencia ni propiedad. La asignación verificada de unidad y residente a la cuenta debe hacerse en backend. El alta actual permite seleccionar una unidad existente, igual que el contrato de ms-residentes.
3. La separación de pantallas NO reemplaza autorización del servidor. Las rutas públicas de lectura de residentes y los controllers de pagos revisados no aplican control de propiedad por usuario. Antes de tratar datos reales, los servicios deben validar rol/propiedad en cada lectura y escritura, proporcionar una consulta de ficha propia y evitar que el cliente pueda elegir IDs ajenos. El frontend no puede cerrar esa exposición.
4. Los repositorios revisados de incidencias y ficha consolidada aún documentan rutas planificadas. Se mantienen las consultas existentes, con estados de error/reintento; no se agregaron botones de creación de incidencias/reservas sobre endpoints sin implementación verificada.
5. La versión desplegada de cada servicio debe incluir los contratos anteriores y permitir sus métodos/cabeceras en CORS. No se modificaron AWS, reglas, listeners ni variables de entorno.

## Verificación local

```sh
npm ci
node --test tests/domain.test.js
npm run build
```

`tests/browser.mjs` usa Playwright y Edge instalado para probar sin escribir en AWS. Puede usarse `PLAYWRIGHT_MODULE` para indicar una instalación existente de Playwright y `PLAYWRIGHT_CHANNEL` para otro canal compatible. Ejecutar desde la raíz: `node tests/browser.mjs`.

Las API se interceptan con respuestas basadas en sus contratos. Se prueban: registro de 8 caracteres, alta persistida de ficha, edición, roles, bloqueo de rutas administrativas, aislamiento de cuotas/pagos, emisión de cuota, registro de abono, recuperación de errores y diseño móvil. Las capturas se guardan en `tests/artifacts/` (ignorado por Git).

La base local se actualizó por fast-forward a `da64e7f` antes de editar. La lógica de `src/api/config.js`, `.env.example`, `vite.config.js` y `amplify.yml` se conserva respecto de esa base. No hubo push ni operaciones de escritura contra las API reales.

## Publicación

Publicar los cambios en el fork `alxgr-08/web-condominio` conectado a Amplify, no asumir que `origin` apunta a ese fork (la copia local apunta al repositorio del equipo). Conservar `VITE_API_MODE=path` y la URL HTTPS de API Gateway. Tras desplegar, probar con una cuenta RESIDENTE y una cuenta que el servidor realmente devuelva como ADMIN.
