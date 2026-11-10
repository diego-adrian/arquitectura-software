# Cupo · Inscripción de materias

Proyecto de clase del módulo **Arquitectura de Software** (Especialidad Full Stack, UCB).
Es un sistema de inscripción de materias **ficticio**: los datos, nombres, correos y sistemas externos son inventados.

En cada sesión del módulo vas a **mejorar este mismo sistema** aplicando lo que se ve en clase.
El sistema funciona desde el primer día, pero tiene problemas de diseño a propósito: tu trabajo es encontrarlos, medirlos y resolverlos sin romper lo que ya funciona.

## Qué hace

Un estudiante inicia sesión, ve la **oferta** de la gestión 2027-1, elige paralelos y se inscribe.
Al inscribirse, el sistema valida créditos, cupos, choques de horario y prerrequisitos, **cobra** con una pasarela QR y envía un **correo** de confirmación.
También puede ver su **kardex** (que viene de un sistema académico antiguo) y retirar materias.
La Dirección de Carrera ve un **reporte de ocupación** de los paralelos.

## Lo que necesitas

| Herramienta | Versión | Cómo verificar |
|---|---|---|
| Node.js | 24 o superior | `node -v` |
| pnpm | 11.5.3 | `pnpm -v` (si no lo tienes: `corepack enable`) |
| Git | cualquiera reciente | `git --version` |

> Este proyecto usa **solo pnpm**. No uses `npm install` ni `npx`: usa `pnpm install` y `pnpm exec`.

## Cómo levantarlo

Necesitas **dos terminales** abiertas en la carpeta del proyecto.

```bash
pnpm install          # una sola vez
```

**Terminal 1** (los sistemas externos):

```bash
pnpm simuladores
```

**Terminal 2** (Cupo):

```bash
pnpm start
```

Abre <http://localhost:3000> y entra con:

| Usuario | Código | Tipo |
|---|---|---|
| Ana Quispe | `2023-1001` | regular |
| Luis Mamani | `2024-1002` | becado |
| Carla Rojas | `2022-1003` | convenio |
| Diego Flores | `2025-1004` | traspaso |
| Dirección de Carrera | `DIR-SIS` | director |

La contraseña de todos es `demo1234`.

Para volver los datos a su estado inicial: `pnpm datos:reiniciar`.

## Las piezas

```
cupo/
├── src/                 el sistema (NestJS)
├── public/              el frontend (HTML + JavaScript)
├── datos-semilla/       los datos iniciales; se copian a datos/ al arrancar
├── datos/               la "base de datos" (archivos JSON) — se crea sola
├── simuladores/         los dos sistemas externos que NO controlamos
│   ├── legado.ts        sistema académico antiguo: kardex en CSV, lento   (puerto 4001)
│   └── pasarela.ts      pasarela de pago QR del banco: tarda y a veces falla (puerto 4002)
└── test/
    ├── contrato/        lo que el sistema DEBE hacer (pasa en todas las versiones)
    └── problemas/       los problemas de diseño, sesión por sesión
```

## Las pruebas

```bash
pnpm test               # todo
pnpm test:contrato      # el contrato HTTP: tiene que pasar SIEMPRE
pnpm test:problemas     # las pruebas "Problema ·"
pnpm test:problemas -t "S1"   # solo los problemas de la sesión 1
```

Las pruebas `Problema ·` son raras a propósito: **pasan porque el problema existe**.
Cuando resuelves un problema, su prueba empieza a fallar. Esa es la señal de que ya no está, y la reemplazas por una prueba `Solución ·` que demuestra la mejora.

Las pruebas de `test/contrato/` son la red de seguridad: si una de ellas falla después de tu cambio, rompiste algo que el usuario usa.

## Cómo avanzar de sesión

Cada sesión del módulo tiene su carpeta con dos versiones del sistema:

| Carpeta | Para qué |
|---|---|
| `sesion-NN/inicio/` | El sistema al empezar la sesión N. **Esta es la que modificas** (mejor, una copia tuya). |
| `sesion-NN/solucion/` | El sistema al terminar la sesión N. Es la referencia para comparar. |

La carpeta `inicio` de una sesión es idéntica a la `solucion` de la anterior.
Trabaja en una copia, por ejemplo `cp -R sesion-02/inicio mi-cupo`, y deja las carpetas oficiales sin tocar.
Si en una sesión no llegas a terminar, la siguiente empiezas desde su carpeta `inicio` oficial.

## Variables de entorno (opcionales)

| Variable | Para qué | Valor por defecto |
|---|---|---|
| `LEGADO_URL` | dónde está el sistema académico | `http://localhost:4001` |
| `PASARELA_URL` | dónde está la pasarela QR | `http://localhost:4002` |
| `LEGADO_LATENCIA_MS` | cuánto tarda el legado | `300` |
| `PASARELA_LATENCIA_MS` | cuánto tarda la pasarela | `200` |
| `PASARELA_FALLA_PCT` | porcentaje de cobros que fallan | `0` |
| `CORREO_FALLA` | `true` para simular que el correo cae | — |
| `CUPO_DATOS` | carpeta de los archivos JSON | `datos/` |

Los simuladores también se pueden cambiar en vivo, sin reiniciar:

```bash
curl -X POST localhost:4002/_config -H 'content-type: application/json' -d '{"fallaPorcentaje": 100}'
```

Probado con Node.js 24, pnpm 11.5.3, NestJS 11, TypeScript 5.9 y Jest 30.
