# web-condominio

**SPA** del Sistema de Administracion de Condominios. Se despliega en
**AWS Amplify** y consume los 5 microservicios a traves del **API Gateway**.

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
   API Gateway
   ├──> ms-residentes      (8001)
   ├──> ms-pagos           (8002)
   ├──> ms-incidencias     (8003)
   ├──> ms-ficha-residente (8004)
   └──> ms-analitico       (8005)
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

**5173** (servidor de desarrollo de Vite)

| Microservicio       | Puerto |
|---------------------|--------|
| ms-residentes       | 8001   |
| ms-pagos            | 8002   |
| ms-incidencias      | 8003   |
| ms-ficha-residente  | 8004   |
| ms-analitico        | 8005   |
| web-condominio (dev)| **5173** |

## Microservicios consumidos

La SPA consume **los 5** microservicios. Estos son los endpoints que se
integran desde el frontend (dos por API):

| Microservicio | Endpoints consumidos | Pantalla |
|---------------|----------------------|----------|
| `ms-residentes` | `GET /residentes`, `GET /residentes/{id}` | Directorio de residentes |
| `ms-pagos` | `GET /cuotas`, `GET /pagos` | Cuotas y pagos |
| `ms-incidencias` | `GET /incidencias`, `GET /reservas` | Incidencias y reservas |
| `ms-ficha-residente` | `GET /ficha/{residente_id}`, `GET /ficha/unidad/{unidad_id}` | Ficha del residente |
| `ms-analitico` | `GET /analitica/morosidad-por-edificio`, `GET /analitica/recaudacion-mensual` | Tablero analitico |

Un cliente por microservicio en `src/api/`.

## Paginas planificadas

| Ruta | Pantalla |
|------|----------|
| `/` | Tablero general |
| `/residentes` | Directorio de residentes y unidades |
| `/residentes/:id` | Ficha consolidada (ms-ficha-residente) |
| `/pagos` | Cuotas emitidas y pagos registrados |
| `/incidencias` | Incidencias y su seguimiento |
| `/reservas` | Reservas de areas comunes |
| `/analitica` | Graficos sobre los datos de Athena |

## Variables de entorno

Copiar [.env.example](.env.example) a `.env` y completar.

> Vite expone al navegador **solo** las variables con prefijo `VITE_`, y quedan
> incrustadas en el bundle: **nunca** poner secretos ni credenciales aqui.

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `VITE_APP_NAME` | Nombre de la app | `web-condominio` |
| `VITE_API_GATEWAY_URL` | URL base del API Gateway | `https://xxxx.execute-api.us-east-1.amazonaws.com/dev` |
| `VITE_API_RESIDENTES` | Ruta de ms-residentes en el gateway | `/residentes` |
| `VITE_API_PAGOS` | Ruta de ms-pagos | `/pagos` |
| `VITE_API_INCIDENCIAS` | Ruta de ms-incidencias | `/incidencias` |
| `VITE_API_FICHA` | Ruta de ms-ficha-residente | `/ficha` |
| `VITE_API_ANALITICO` | Ruta de ms-analitico | `/analitico` |

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
├── main.jsx      # montaje de React (stub)
├── App.jsx       # componente raiz (stub)
├── api/          # un cliente por microservicio
├── pages/        # una carpeta por pantalla
├── components/   # componentes reutilizables
├── hooks/        # hooks de datos
└── styles/       # estilos
public/
amplify.yml       # build spec de AWS Amplify
```

## Estado

Andamiaje inicial. Sin pantallas ni llamadas a las APIs implementadas.
