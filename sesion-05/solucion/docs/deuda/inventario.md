# Inventario de deuda técnica de Cupo · Sesión 4

Medido con `pnpm metricas` y con las pruebas `Problema ·` que siguen pasando al empezar la sesión.

## Las métricas al empezar

| Módulo | Archivos | Ca | Ce | I |
|---|---|---|---|---|
| auth | 5 | 4 | 1 | 0.20 |
| inscripciones | 8 | 3 | 6 | 0.67 |
| kardex | 3 | 0 | 2 | 1.00 |
| notificaciones | 2 | 1 | 1 | 0.50 |
| oferta | 3 | 2 | 3 | 0.60 |
| pagos | 4 | 2 | 2 | 0.50 |
| reportes | 2 | 0 | 4 | 1.00 |
| usuarios | 1 | 3 | 1 | 0.25 |
| utils | 1 | 5 | 0 | 0.00 |

- **Ciclos entre archivos:** 1 (`inscripciones.service.ts ⇄ pagos.service.ts`).
- **Ciclos entre módulos:** 1 (`inscripciones ⇄ oferta ⇄ pagos`).
- **Archivo más usado:** `utils/utils.ts`, importado por 9 archivos.

## Las métricas al terminar la sesión

| Módulo | Archivos | Ca | Ce | I |
|---|---|---|---|---|
| auth | 5 | 4 | 1 | 0.20 |
| inscripciones | 8 | 2 | 6 | 0.75 |
| kardex | 3 | 0 | 2 | 1.00 |
| notificaciones | 2 | 1 | 1 | 0.50 |
| oferta | 3 | 2 | 3 | 0.60 |
| pagos | 4 | 2 | 1 | 0.33 |
| persistencia | 1 | 5 | 0 | 0.00 |
| reportes | 2 | 0 | 4 | 1.00 |
| usuarios | 1 | 3 | 1 | 0.25 |

- **Ciclos entre archivos:** 0 (antes, 1).
- **Ciclos entre módulos:** 1, `inscripciones ⇄ oferta` (antes, `inscripciones ⇄ oferta ⇄ pagos`). Queda para la Sesión 7 (D4).
- **Archivo más usado:** `auth/sesiones.ts` y `persistencia/archivos-json.ts`, con 5 cada uno (antes, `utils/utils.ts` con 9).
- `pagos` dejó de depender de `inscripciones`: su Ce bajó de 2 a 1.

## El inventario

Tipo según el cuadrante de Martin Fowler: **deliberada** (sabíamos) o **inadvertida** (no nos dimos cuenta), **prudente** (con un plan) o **imprudente** (sin plan).

| ID | Deuda | Tipo | Evidencia | Impacto | Esfuerzo | Sesión |
|---|---|---|---|---|---|---|
| D1 | Ciclo `inscripciones.service ⇄ pagos.service`: según el orden de los imports, Nest no arranca | inadvertida · imprudente | `Problema · S4 · por el ciclo…` | alto | bajo | S4 |
| D2 | `utils.ts` es un cajón de sastre: 6 funciones sin relación, importado por 9 archivos | inadvertida · imprudente | `pnpm metricas` | medio | bajo | S4 |
| D3 | La gestión tiene dos fuentes de verdad: `GESTION_ACTUAL` en el código y `gestion` en `oferta.json` | inadvertida · imprudente | `Problema · S4 · GESTION_ACTUAL…` | alto | bajo | S4 |
| D4 | Ciclo entre módulos `inscripciones ⇄ oferta` (cada uno usa repositorios del otro) | inadvertida · prudente | `pnpm metricas` | medio | medio | S7 |
| D5 | Modelo anémico: la regla "inscritos ≤ cupo" se calcula en 3 archivos | inadvertida · imprudente | `Problema · S5` | alto | medio | S5 |
| D6 | El mismo concepto tiene dos nombres: "paralelo" y "grupo" | inadvertida · imprudente | `Problema · S5` | bajo | bajo | S5 |
| D7 | El negocio depende del reloj real y de repositorios concretos (sin puertos) | deliberada · prudente (ADR-0001) | `Problema · S6` | medio | medio | S6 |
| D8 | El modelo del legado se filtra: `CONV` crudo, dos traducciones de siglas, Diego bloqueado | inadvertida · imprudente | `Problema · S7` | alto | medio | S7 |
| D9 | Si el correo falla, la inscripción responde 500 aunque ya cobró | inadvertida · imprudente | `Problema · S8` | alto | medio | S8 |
| D10 | Sobrecupo con inscripciones simultáneas | deliberada · prudente (ADR-0003) | `Problema · S9 · sobrecupo` | alto | medio | S9 |
| D11 | Sesiones en memoria: no se puede agregar una segunda instancia | inadvertida · imprudente | `Problema · S9 · sesiones` | alto | bajo | S9 |
| D12 | Fronteras de confianza: monto del cliente, inscripción ajena visible, rol solo en el frontend, contraseñas en texto plano | inadvertida · imprudente | `Problema · S10` | alto | bajo | S10 |
| D13 | La pasarela no tiene timeout ni plan B | inadvertida · imprudente | `Problema · S10` | alto | medio | S10 |
| D14 | No hay diagramas ni pruebas que hagan cumplir la arquitectura completa | deliberada · prudente | `Problema · S11` | medio | bajo | S11 |

## Prioridad: impacto contra esfuerzo

| | **Esfuerzo bajo** | **Esfuerzo medio** |
|---|---|---|
| **Impacto alto** | D1, D3, D11, D12 → **hacer ya** | D5, D8, D9, D10, D13 → **planificar** |
| **Impacto medio** | D2, D14 → **hacer cuando se pase cerca** | D4, D7 → **planificar** |
| **Impacto bajo** | D6 → **de paso** | |

Hoy se pagan D1, D2 y D3: impacto alto o medio y esfuerzo bajo, y además son las que hacen frágil todo lo demás. El resto queda asignado a su sesión: este inventario es el **backlog** del módulo.
