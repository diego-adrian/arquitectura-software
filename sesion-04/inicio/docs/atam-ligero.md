# Evaluación ATAM ligera de Cupo · Sesión 3

ATAM (*Architecture Tradeoff Analysis Method*, del SEI) evalúa una arquitectura contra los atributos de calidad que más importan. Esta es una versión ligera, de una sesión: sin todos los participantes ni todas las fases, pero con sus productos principales.

## 1. Drivers del negocio

- Que los estudiantes se inscriban en la gestión 2027-1 sin filas en ventanilla.
- Que los cupos se asignen con justicia: nadie entra a un paralelo lleno.
- Que el reglamento (créditos, aranceles, tipos de estudiante) se pueda cambiar cada gestión sin miedo.
- Restricciones: equipo de 3 personas, NestJS con TypeScript, sistema académico legado que no se modifica, pasarela QR del banco.

## 2. Árbol de utilidad

Cada escenario lleva dos calificaciones: **(importancia para el negocio, dificultad técnica)**, con A = alta, M = media, B = baja. Los (A, A) son los que se analizan primero.

| Atributo | Escenario | (Imp., Dif.) |
|---|---|---|
| Consistencia | El primer día, 3000 estudiantes se inscriben en 10 minutos y **ningún paralelo supera su cupo**. | (A, A) |
| Rendimiento | En ese mismo pico, el 95 % de las inscripciones responde en menos de 2 s. | (A, A) |
| Disponibilidad | Si la pasarela QR no responde, el estudiante recibe una respuesta en menos de 5 s y su cupo queda reservado. | (A, M) |
| Mantenibilidad | Cuando cambia el reglamento (por ejemplo, el máximo de créditos), el cambio se hace en 1 archivo en menos de 1 hora, sin romper pruebas. | (A, B) |
| Seguridad | Un estudiante no puede pagar un monto distinto al que le corresponde ni ver la inscripción de otro. | (A, M) |
| Interoperabilidad | Un estudiante con materias convalidadas (`CONV` en el legado) puede inscribirse a las materias que las tienen como prerrequisito. | (M, M) |
| Testabilidad | La lógica de inscripción se prueba sin red ni banco, en menos de 1 s. | (M, B) |

## 3. Enfoques arquitectónicos actuales

| Enfoque | Dónde |
|---|---|
| Monolito por capas | ADR-0001 |
| Persistencia en archivos JSON | ADR-0002 |
| Revisar cupo → cobrar → guardar (con `await` en medio) | `inscripciones.service.ts` |
| Consulta síncrona al legado en cada inscripción | ADR-0004 |
| Sesiones en un `Map` en memoria | `auth/sesiones.ts` |

## 4. Análisis

**Puntos de sensibilidad** (una sola decisión afecta mucho a un atributo):

- **S1.** El orden "revisar cupo → cobrar → guardar" decide la **consistencia** del cupo.
- **S2.** La latencia de la pasarela entra completa en la latencia de la inscripción: decide el **rendimiento**.
- **S3.** Las sesiones en memoria deciden si Cupo puede correr en más de una instancia (**escalabilidad**).

**Puntos de compromiso (trade-offs)** (una decisión mejora un atributo y empeora otro):

- **T1.** Bloquear el paralelo mientras se cobra garantiza el cupo (consistencia) pero hace esperar a todos los que lo piden (rendimiento). Ver ADR-0003.
- **T2.** Consultar al legado en cada inscripción da datos actualizados (corrección) pero ata la disponibilidad de Cupo a la del legado. Ver ADR-0004.
- **T3.** Archivos JSON dan simplicidad pero impiden varias instancias y transacciones. Ver ADR-0002.

**Riesgos:**

- **R1.** Sobrecupo el día de inscripciones (S1). Demostrado por `Problema · S9 · sobrecupo`.
- **R2.** Si la pasarela tarda, la inscripción espera sin límite (S2). Demostrado por `Problema · S10`.
- **R3.** No se puede agregar una segunda instancia para el pico (S3). Demostrado por `Problema · S9 · sesiones`.
- **R4.** El modelo del legado se filtra por todo el sistema. Demostrado por `Problema · S7`.

**No riesgos:**

- **N1.** Cambiar el máximo de créditos o un arancel toca un solo archivo (desde la Sesión 1).
- **N2.** La lógica de inscripción se prueba con dobles, sin red (desde la Sesión 1).

## 5. Temas de riesgo y a dónde van

| Tema | Riesgos | Sesión |
|---|---|---|
| Consistencia y escala del día de inscripciones | R1, R3 | 9 |
| Dependencia de sistemas externos | R2, R4 | 7 y 10 |
| Persistencia | T3 | 6 |
