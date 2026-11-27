# Lenguaje ubicuo de Cupo · Sesión 5

Las palabras que usan la Dirección de Carrera, Tesorería y los estudiantes, y **el mismo nombre en el código**. Si una palabra no está aquí, no se inventa en el código: se acuerda primero y se agrega.

| Término | Qué significa | En el código | No confundir con |
|---|---|---|---|
| **Gestión** | Periodo académico (por ejemplo, `2027-1`). Hay una inscripción por estudiante y gestión. | `gestion` (sale de `oferta.json`) | Año calendario |
| **Materia** | Asignatura del plan de estudios, identificada por su **sigla** (`SIS-211`). Tiene créditos y prerrequisitos. | `Materia` | Paralelo |
| **Sigla** | Código de una materia: tres letras, guion y número (`SIS-211`). | `sigla` | La sigla del legado, sin guion (`SIS211`) |
| **Paralelo** | Un grupo concreto de una materia, con docente, horario y **cupo** (`SIS-211-B`). El estudiante se inscribe en paralelos. | `Paralelo` | Materia; "curso" |
| **Grupo** | La letra que distingue los paralelos de una materia (`A`, `B`). Es un dato del paralelo, no otro concepto. | `paralelo.grupo` | Paralelo |
| **Cupo** | Cuántos estudiantes caben en un paralelo. **Nunca puede haber más inscritos que el cupo.** | `Paralelo.verificarQueHayCupo()` | Disponibles |
| **Disponibles** | Cupo menos inscritos, nunca menos de cero. | `Paralelo.disponibles()` | Cupo |
| **Crédito** | Peso académico de una materia. Máximo 24 por gestión. | `MAX_CREDITOS` | — |
| **Prerrequisito** | Materia que hay que tener aprobada antes de inscribirse a otra. | `materia.prerrequisitos` | Correquisito (no existe en Cupo) |
| **Kardex** | El historial académico del estudiante: materias, notas y estados. Vive en el sistema académico legado. | `LectorKardex`, `KardexService` | Inscripción |
| **Inscripción de gestión** | Las materias que un estudiante cursa en una gestión, con sus créditos, su monto y su estado. Es un **agregado**. | `InscripcionDeGestion` | El acto de inscribirse (`inscribir()`) |
| **Retiro** | Sacar un paralelo de la inscripción. No se puede retirar la última materia. | `InscripcionDeGestion.retirar()` | Anulación (en ventanilla) |
| **Arancel** | Lo que paga un estudiante según su tipo (regular, becado, convenio, traspaso). | `Arancel`, `ARANCELES` | Monto (el resultado) |
| **Matrícula** | La parte fija del arancel (Bs 400). | `MATRICULA` | Inscripción |
| **Convalidación** | Materia aprobada en otra universidad y reconocida. El legado la marca `CONV`. | — (llega en la Sesión 7) | Aprobación |
