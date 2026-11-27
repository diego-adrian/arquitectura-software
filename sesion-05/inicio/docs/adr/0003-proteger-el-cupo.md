# ADR-0003 · Reservar el cupo de forma atómica antes de cobrar

- **Estado:** Aceptada (se implementa en la Sesión 9)
- **Fecha:** 2026-11-04
- **Atributos de calidad afectados:** consistencia, escalabilidad, disponibilidad, experiencia del estudiante

## Contexto

Hoy `inscribir()` revisa si queda cupo, **espera** al sistema académico y a la pasarela, y recién después guarda la inscripción. Entre la revisión y el guardado hay dos `await`: dos estudiantes que piden el último lugar al mismo tiempo pasan la revisión y entran los dos. La prueba `Problema · S9 · sobrecupo` lo demuestra con un paralelo de cupo 1: las dos inscripciones responden 201.

El escenario de calidad que manda (ver `docs/atam-ligero.md`):

> El primer día de inscripciones, 3000 estudiantes se inscriben en 10 minutos. **Ningún paralelo supera su cupo**, y el 95 % de las inscripciones responde en menos de 2 segundos.

Hay tensión entre dos atributos: **consistencia** (nunca pasar el cupo) y **rendimiento/disponibilidad** (no hacer esperar ni bloquear a todos por un banco lento).

## Opciones consideradas

1. **Bloqueo pesimista.** Bloquear el paralelo durante toda la inscripción, incluido el cobro. Nunca hay sobrecupo, pero si la pasarela tarda 5 s, todos los que piden ese paralelo esperan 5 s en fila.
2. **Bloqueo optimista.** Guardar con un número de versión y reintentar si alguien cambió el paralelo mientras tanto. Sin esperas cuando hay poca competencia; con 3000 estudiantes peleando el mismo paralelo, muchos reintentos y cobros que hay que devolver.
3. **Reserva atómica antes de cobrar.** En una sola operación atómica (contar y guardar sin `await` en medio), registrar la inscripción como `PENDIENTE_PAGO`; esa reserva ya ocupa el cupo. Después cobrar: si el cobro sale bien, pasa a `PAGADA`; si falla, se libera o queda pendiente para reintentar el pago.

## Decisión

Usamos la **opción 3: reservar el cupo de forma atómica antes de cobrar**. Con archivos JSON y una sola instancia, "atómico" significa contar y escribir en el mismo tramo de código síncrono. Con SQLite (Sesión 6), significa una transacción. Se implementa en la Sesión 9; la prueba `Problema · S9 · sobrecupo` es el criterio de aceptación.

## Consecuencias

- **Gana:** nunca hay sobrecupo; nadie espera a la pasarela para saber si tiene lugar; si el banco cae, el cupo queda reservado (Sesión 10).
- **Paga:** aparece un estado nuevo (`PENDIENTE_PAGO`) que el frontend, los reportes y los correos tienen que entender; hay que liberar las reservas que nunca se pagan.
- **Riesgos:** reservas "zombis" que ocupan cupo sin pagarse. Se mitiga con un vencimiento de la reserva.
- **Pendiente:** la implementación (Sesión 9) y el manejo de la pasarela caída (Sesión 10).
