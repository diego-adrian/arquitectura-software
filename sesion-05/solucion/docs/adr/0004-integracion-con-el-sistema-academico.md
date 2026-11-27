# ADR-0004 · Leer el kardex del sistema académico legado, sin modificarlo

- **Estado:** Aceptada (la traducción se rehace en la Sesión 7)
- **Fecha:** 2026-11-04
- **Atributos de calidad afectados:** interoperabilidad, mantenibilidad, disponibilidad

## Contexto

Las materias aprobadas de cada estudiante viven en el sistema académico de la universidad, un sistema antiguo que no podemos modificar (es una **restricción**). Entrega el kardex en CSV separado por `;`, con códigos sin guion (`20231001`, `SIS111`) y estados abreviados (`APROB`, `REPROB`, `ABAND`, `CONV`). Responde lento (300 ms en el simulador) y a veces no responde.

Hoy hay dos clientes que lo leen (`SistemaAcademicoClient` y `KardexLegadoClient`) y cada uno traduce los códigos a su manera. Ninguno entiende `CONV` (convalidada): por eso Diego, estudiante de traspaso, no puede inscribirse a SIS-112.

## Opciones consideradas

1. **Copiar el kardex a nuestra base** cada noche. Rápido y disponible, pero los datos pueden estar desactualizados el día de inscripciones.
2. **Consultar al legado en cada inscripción** (lo que hacemos hoy). Siempre actualizado, pero dependemos de su velocidad y su disponibilidad.
3. **Consultar al legado a través de una capa anticorrupción** que traduzca su modelo al nuestro en un solo lugar.

## Decisión

**Seguimos consultando al legado en cada operación (opción 2)**, y en la Sesión 7 lo envolvemos en una **capa anticorrupción** (opción 3): un solo lugar donde `SIS111` pasa a ser `SIS-111` y `CONV` pasa a ser `CONVALIDADA`.

## Consecuencias

- **Gana:** el kardex siempre está actualizado; no duplicamos datos de otro sistema.
- **Paga:** cada inscripción espera al legado; si el legado cae, Cupo no puede validar prerrequisitos.
- **Riesgos:** que el modelo del legado (códigos sin guion, estados abreviados) se filtre a todo Cupo. Ya pasó: lo demuestran las pruebas `Problema · S7`.
- **Pendiente:** la capa anticorrupción (Sesión 7) y un timeout con caché para cuando el legado no responde (Sesión 10).
