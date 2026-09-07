# Integrante responsable

| | |
|---|---|
| **Repositorio** | `web-condominio` |
| **Integrante** | [@alxgr-08](https://github.com/alxgr-08) |
| **Rol** | Frontend / Amplify |
| **Puerto** | 5173 solo en desarrollo |

## Alcance

`web-condominio`: SPA en React + Vite desplegada en **AWS Amplify**, consumiendo los microservicios a traves del balanceador.

> ### Tiene que estar desplegado, no en local
>
> El ACL fue explicito: **login y dashboard funcionando en Amplify**, no
> corriendo en tu maquina. Vale 1 punto del avance.
>
> El login ya no necesita mock: pega contra `POST /auth/login` de
> `ms-residentes` en el **9001**. Dependes de que @Osomar1705 tenga la API arriba.

## Avance del 50% — entrega del 6 al 12 de septiembre

- [ ] Proyecto conectado a **AWS Amplify** y desplegando desde `main`
- [ ] Variables `VITE_*` cargadas en Amplify (Environment variables)
- [ ] Rewrite de SPA configurado: `/<*>` -> `/index.html` -> `200 (Rewrite)`
- [ ] Pantalla de **register** contra `POST /auth/register`
- [ ] Pantalla de **login** contra `POST /auth/login`, guardando el token
- [ ] **Dashboard** con datos reales de `ms-residentes` (2 metodos REST)
- [ ] Todo visible en la URL de Amplify, no en localhost

---

## Como trabajamos

Cada repositorio pertenece a un integrante y se desarrolla de forma
**independiente**: las APIs con base de datos no se llaman entre si. La unica
integracion entre microservicios vive en `ms-ficha-residente`, y la del lado del
usuario en `web-condominio`.

Los cambios a este repositorio los define su responsable. Si otro integrante
necesita algo de esta API, se pide via issue en vez de tocar el codigo.

## Equipo

| Repositorio | Integrante | Rol | Puerto |
|---|---|---|---|
| [ms-residentes](https://github.com/comdominios-cloud/ms-residentes) | @Osomar1705 | API con BD - Python / PostgreSQL | 9001 |
| [ms-pagos](https://github.com/comdominios-cloud/ms-pagos) | @sebastianperez72 | API con BD - Java / MySQL | 9002 |
| [ms-incidencias](https://github.com/comdominios-cloud/ms-incidencias) | @fabianbot1331 | API con BD - lenguaje por definir / MongoDB | 9003 |
| [ms-ficha-residente](https://github.com/comdominios-cloud/ms-ficha-residente) | @Brisseth-raton | Backend / Infraestructura | 9004 |
| [web-condominio](https://github.com/comdominios-cloud/web-condominio) | @alxgr-08 | Frontend / Amplify | 5173 (dev) |
| [ms-analitico](https://github.com/comdominios-cloud/ms-analitico) | @carloscondor1610 | Data Science | 9005 |
| [ingesta-datos](https://github.com/comdominios-cloud/ingesta-datos) | @carloscondor1610 | Data Science | — |

> CS2032 Cloud Computing - UTEC | Sistema de Administracion de Condominios
