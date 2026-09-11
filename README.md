# condominios.net (web-condominio)

**SPA** del Sistema de Administracion de Condominios. Se despliega en
**AWS Amplify** y consume los 5 microservicios a traves del **balanceador** que
reparte entre las 2 VM de produccion.

> CS2032 Cloud Computing - UTEC | Proyecto: Sistema de Administracion de Condominios

## Responsable

[@alxgr-08](https://github.com/alxgr-08) — Frontend. Ver [INTEGRANTE.md](INTEGRANTE.md).

Integrante a cargo del **frontend**. Trabaja contra los contratos REST
documentados en el README de cada microservicio (y en su Swagger-UI), sin
depender del avance interno de cada API.

## Dominio

Interfaz web para la administracion del condominio: consultar residentes y
unidades, revisar cuotas y pagos, reportar incidencias, reservar areas comunes,
ver la ficha consolidada de un residente y los tableros analiticos.

```
web-condominio (Amplify)
        │
        ▼
   Balanceador ──> VM produccion 1 ┐
        │          VM produccion 2 ┘ (gemelas)
        ├──> ms-usuarios        :9006   (login / register)
        ├──> ms-residentes      :9001
        ├──> ms-pagos           :9002
        ├──> ms-incidencias     :9003
        ├──> ms-ficha-residente :9004
        └──> ms-analitico       :9005
```

## Stack

| Elemento    | Tecnologia              |
|-------------|-------------------------|
| Lenguaje    | JavaScript (JSX)        |
| Framework   | React 18                |
| Build tool  | Vite 5                  |
| Router      | react-router-dom        |
| Hosting     | AWS Amplify Hosting     |
| Contenedor  | Docker (nginx, solo para pruebas locales) |

## Puerto asignado

**5173**, solo para el servidor de desarrollo de Vite. En produccion la SPA vive
en Amplify, sin puerto propio.

| Microservicio | Publicado | Interno |
|---------------|-----------|---------|
| ms-residentes | 9001      | 8000    |
| ms-pagos      | 9002      | 8080    |
| ms-incidencias| 9003      | 3003    |
| ms-ficha-residente | 9004 | 8004    |
| ms-analitico  | 9005      | 8005    |
| ms-usuarios   | 9006      | 8000    |
| web-condominio (dev) | **5173** | — |

## Microservicios consumidos

La SPA consume **los 6** microservicios. Estos son los endpoints que se
integran desde el frontend (dos por API):

| Microservicio | Endpoints consumidos | Pantalla |
|---------------|----------------------|----------|
| `ms-usuarios` | `POST /auth/register`, `POST /auth/login` | **Registro y login** |
| `ms-residentes` | `GET /residentes`, `GET /residentes/{id}` | Directorio de residentes |
| `ms-pagos` | `GET /cuotas`, `GET /pagos` | Cuotas y pagos |
| `ms-incidencias` | `GET /incidencias`, `GET /reservas` | Incidencias y reservas |
| `ms-ficha-residente` | `GET /ficha/{residente_id}`, `GET /ficha/unidad/{unidad_id}` | Ficha del residente |
| `ms-analitico` | `GET /analitica/morosidad-por-edificio`, `GET /analitica/recaudacion-mensual` | Tablero analitico |
| `ms-analitico` | `GET /analitica/prediccion-area-comun` | Area comun mas visitada el proximo mes |

Un cliente por microservicio en `src/api/`.

## Paginas

| Ruta | Pantalla | Estado |
|------|----------|--------|
| `/login` | Inicio de sesion contra `ms-usuarios` (9006) | implementada |
| `/register` | Registro de cuenta contra `ms-usuarios` (9006) | implementada |
| `/` | Dashboard con datos reales de `ms-residentes` | implementada |
| `/residentes` | Directorio de residentes y unidades | implementada |
| `/residentes/:id` | Ficha consolidada (`ms-ficha-residente`) | implementada |
| `/pagos` | Cuotas emitidas y pagos registrados | implementada |
| `/incidencias` | Incidencias y su seguimiento | implementada |
| `/reservas` | Reservas de areas comunes | implementada |
| `/analitica` | Morosidad, recaudacion y prediccion de area comun | implementada |

Las rutas distintas de `/login` y `/register` estan protegidas: sin token en el
navegador la SPA redirige al login.

Para el avance del 50% el ACL pidio **login, register y el dashboard desplegados
en Amplify**, no corriendo en local.

## Conexion con los microservicios

### Por que hace falta un HTTPS delante del balanceador

Amplify sirve la SPA por **HTTPS** y el balanceador responde solo por **HTTP**.
Eso choca por dos lados:

1. El navegador **bloquea** las peticiones HTTP hechas desde una pagina HTTPS
   (*mixed content*), y no se puede evitar desde el codigo.
2. Amplify **tampoco acepta** destinos HTTP en sus reglas de reescritura:
   responde `HTTP URLs cannot be used in custom rules. Use HTTPS instead.`

Lo que **no** sirve:

- Ponerle un certificado al ALB: ACM no emite certificados para dominios
  `amazonaws.com`, y uno autofirmado seria rechazado igual.
- CloudFront: el rol de AWS Academy **no tiene permisos** sobre ese servicio
  (`not authorized to perform: cloudfront:ListDistributions`).

La solucion es **API Gateway**, que ademas es uno de los servicios que pide el
curso. Entrega una URL HTTPS y habla HTTP con el balanceador:

```
navegador ──HTTPS──> API Gateway ──HTTP──> ALB ──> microservicio
```

### Como crear el API Gateway

En la consola: **API Gateway > Create API > HTTP API > Build**.

| Paso | Valor |
|------|-------|
| Integration | **HTTP URI** |
| URL del endpoint | `http://alb-condominio-678852222.us-east-1.elb.amazonaws.com/{proxy}` |
| Method | **ANY** |
| Route | **ANY** `/{proxy+}` |
| Stage | **`$default`**, con *Auto-deploy* activado |

Tres detalles que importan:

- **El stage tiene que ser `$default`.** Con un stage con nombre (`dev`, `prod`),
  ese nombre queda en la ruta y el balanceador recibiria `/dev/residentes` en vez
  de `/residentes`, que no matchea ninguna de sus reglas.
- **La ruta tiene que ser `ANY /{proxy+}`**, no `GET /algo`. Asi pasa cualquier
  metodo y cualquier ruta, que es lo que necesita una API REST completa.
- **No activar CORS en API Gateway.** Los microservicios ya devuelven sus propias
  cabeceras CORS; si ademas las agrega el gateway, llegan duplicadas y el
  navegador rechaza la respuesta.

La URL final se ve asi:

```
https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
```

### Variables de entorno en Amplify

En **App settings > Environment variables**:

```
VITE_API_MODE=path
VITE_API_BASE_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
```

Con esto **no hacen falta reglas de reescritura**: la SPA le pega directo al API
Gateway por HTTPS. La unica regla que se mantiene es la de la SPA:

| Source | Target | Type |
|--------|--------|------|
| `/<*>` | `/index.html` | 200 (Rewrite) |

### Reglas de ruta del ALB

API Gateway reenvia la ruta tal cual, y el balanceador decide a que
microservicio va segun el path:

| Prioridad | Rutas | Target group |
|-----------|-------|--------------|
| 10 | `/residentes*`, `/unidades*`, `/edificios*` | `tg-residentes` |
| 20 | `/usuarios*`, `/auth*` | `tg-usuarios` |

Los microservicios que todavia no estan desplegados caen en la regla por
defecto hasta que @Brisseth-raton les agregue la suya.

### Modo directo

Para desarrollar contra microservicios corriendo en tu propia maquina:

```
VITE_API_MODE=direct
VITE_API_BASE_URL=http://localhost
```

Ahi las URLs se arman como `http://localhost:9001/residentes`, sin proxy.

## Variables de entorno

Copiar [.env.example](.env.example) a `.env` y completar.

> Vite expone al navegador **solo** las variables con prefijo `VITE_`, y quedan
> incrustadas en el bundle: **nunca** poner secretos ni credenciales aqui.

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `VITE_APP_NAME` | Nombre de la app | `web-condominio` |
| `VITE_API_MODE` | `proxy` (Amplify) o `direct` (desarrollo local) | `proxy` |
| `VITE_API_BASE_URL` | URL del balanceador, sin puerto ni barra final | `http://alb-condominio-678852222.us-east-1.elb.amazonaws.com` |
| `VITE_PORT_RESIDENTES` | Puerto publicado de ms-residentes | `9001` |
| `VITE_PORT_PAGOS` | Puerto publicado de ms-pagos | `9002` |
| `VITE_PORT_INCIDENCIAS` | Puerto publicado de ms-incidencias | `9003` |
| `VITE_PORT_FICHA` | Puerto publicado de ms-ficha-residente | `9004` |
| `VITE_PORT_ANALITICO` | Puerto publicado de ms-analitico | `9005` |
| `VITE_PORT_USUARIOS` | Puerto publicado de ms-usuarios (login) | `9006` |
| `VITE_TOKEN_STORAGE_KEY` | Clave del token de sesion en el navegador | `condominio_token` |

En Amplify, las mismas variables se cargan en
**App settings > Environment variables**.

## Como levantar en desarrollo

```bash
cp .env.example .env
npm install
npm run dev
```

Disponible en `http://localhost:5173`.

## Como levantar con Docker

El despliegue oficial es Amplify; el Dockerfile sirve para probar la SPA ya
construida (nginx sirviendo `dist/`):

```bash
docker build -t web-condominio .
docker run --rm -p 8080:80 web-condominio
```

Disponible en `http://localhost:8080`.

> Las variables `VITE_*` se resuelven **en tiempo de build**: si cambian, hay que
> reconstruir la imagen (`docker build --build-arg ...` o pasandolas al `npm run build`).

## Despliegue en AWS Amplify

1. Conectar este repositorio en la consola de AWS Amplify.
2. Amplify detecta [amplify.yml](amplify.yml): `npm ci` -> `npm run build` -> publica `dist/`.
3. Cargar las variables `VITE_*` en **Environment variables**.
4. Habilitar el rewrite de SPA para que las rutas del router funcionen:
   origen `/<*>` -> destino `/index.html` -> tipo `200 (Rewrite)`.

## Estructura

```
src/
├── main.jsx
├── App.jsx
├── api/
│   ├── config.js
│   ├── http.js
│   ├── usuarios.js
│   ├── residentes.js
│   ├── pagos.js
│   ├── incidencias.js
│   ├── ficha.js
│   └── analitico.js
├── auth/
│   └── AuthContext.jsx
├── components/
├── hooks/
│   └── useApi.js
├── pages/
│   ├── Login/
│   ├── Register/
│   ├── Dashboard/
│   ├── Residentes/
│   ├── Pagos/
│   ├── Incidencias/
│   ├── Reservas/
│   └── Analitica/
├── styles/
│   └── global.css
└── utils/
    └── format.js
public/
amplify.yml
```

## Sesion

`POST /auth/login` devuelve el token, que se guarda en `localStorage` bajo la
clave de `VITE_TOKEN_STORAGE_KEY`. Cada peticion posterior lo envia en la
cabecera `Authorization: Bearer <token>`.

Los clientes toleran distintas formas de respuesta (`[]`, `{ items: [] }`,
`{ data: [] }`) y distintos nombres de campo, de modo que la SPA no se rompe
mientras cada microservicio termina de fijar su contrato.

## Estado

Pantallas implementadas y consumiendo los 6 microservicios. Falta conectar el
repositorio a AWS Amplify y apuntar `VITE_API_BASE_URL` al balanceador.
