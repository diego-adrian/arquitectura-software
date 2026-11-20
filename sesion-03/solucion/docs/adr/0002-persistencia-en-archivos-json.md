# ADR-0002 · Guardar los datos en archivos JSON (por ahora)

- **Estado:** Aceptada (se revisa en la Sesión 6)
- **Fecha:** 2026-11-04
- **Atributos de calidad afectados:** simplicidad, integridad, escalabilidad, disponibilidad

## Contexto

Cupo guarda la oferta, los usuarios, las inscripciones y los pagos en archivos JSON dentro de `datos/`. Fue la opción más rápida para tener el sistema funcionando: no hay que instalar nada y se puede abrir el archivo para ver qué pasó. Desde la Sesión 2, solo los repositorios (`*.repositorio.ts`) tocan esos archivos.

## Opciones consideradas

1. **Archivos JSON.** Cero instalación y fáciles de inspeccionar. Sin transacciones ni consultas; cada escritura reescribe el archivo entero.
2. **SQLite** (`node:sqlite`, incluido en Node 24). Un archivo, sin servidor, con transacciones. Sigue siendo una sola máquina.
3. **PostgreSQL.** Transacciones, concurrencia real y varias instancias. Exige un servidor que operar: es infraestructura de la Maestría.

## Decisión

**Por ahora seguimos con archivos JSON**, siempre detrás de los repositorios. Cambiarlos por SQLite es parte de la Sesión 6, cuando los repositorios pasen a ser adaptadores de un puerto.

## Consecuencias

- **Gana:** nada que instalar; las pruebas arman datos en una carpeta temporal en milisegundos.
- **Paga:** una sola instancia de Cupo puede escribir los archivos; no hay transacciones; las lecturas recorren todo el archivo.
- **Riesgos:** dos procesos escribiendo a la vez pierden datos. No pasa mientras haya una sola instancia (hoy se cumple).
- **Pendiente:** SQLite detrás de un puerto (Sesión 6). La concurrencia del cupo depende de esta decisión: ver ADR-0003.
