# ADR-0001 · Monolito por capas hoy; monolito modular con hexagonal como objetivo

- **Estado:** Aceptada
- **Fecha:** 2026-11-04
- **Atributos de calidad afectados:** mantenibilidad, testabilidad, simplicidad de operación, escalabilidad

## Contexto

Cupo es mantenido por el equipo de TI de la carrera: tres personas. Al empezar el módulo tenía dos estilos mezclados: las inscripciones pasaban por un servicio, pero la oferta, el kardex y los reportes hacían todo dentro del controlador. El reglamento cambia cada gestión (créditos, aranceles, tipos de estudiante) y el sistema depende de dos sistemas externos que no controlamos (el sistema académico legado y la pasarela QR del banco). El día de inscripciones hay picos fuertes de uso.

La comparación con pesos está en [`docs/matriz-de-estilos.md`](../matriz-de-estilos.md). En el escenario de una regional, los puntajes fueron: sin capas 31, por capas 46, hexagonal 53, event-driven 35, microservicios 35.

## Opciones consideradas

1. **Seguir sin un estilo definido.** No cuesta nada hoy y cuesta cada vez más mañana.
2. **Monolito por capas** (presentación → negocio → datos). Simple, conocido por el equipo, se aplica en una sesión.
3. **Monolito con arquitectura hexagonal.** El mejor puntaje, pero exige puertos y adaptadores en todo el sistema.
4. **Microservicios.** Escala por partes, pero el costo de operar varios despliegues supera lo que gana un equipo de tres.

## Decisión

Usamos un **monolito por capas** desde la Sesión 2, con reglas verificadas por pruebas (`test/soluciones/s02-capas.spec.ts`). El objetivo es llegar a un **monolito modular con arquitectura hexagonal en cada módulo** (sesiones 6 y 7). No usamos microservicios.

## Consecuencias

- **Gana:** una sola forma de organizar el código; los controladores ya no tocan archivos ni red; las reglas de capas se cumplen solas.
- **Paga:** el negocio depende de clases concretas de la capa de datos; un cambio de funcionalidad atraviesa tres capas; más archivos (de 22 a 31 en `src/`).
- **Riesgos:** que el monolito crezca sin límites internos. Se detecta con las métricas de acoplamiento de la Sesión 4.
- **Pendiente:** invertir la dependencia hacia los datos (Sesión 6) y separar módulos por contexto (Sesión 7).
