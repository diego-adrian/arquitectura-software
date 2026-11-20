# Matriz de estilos arquitectónicos · Sesión 2

Escala: 1 (malo) a 5 (muy bueno) para cada criterio, en el contexto de **cada escenario**.
El peso dice cuánto importa el criterio en ese escenario (1 a 3). El puntaje es la suma de `nota × peso`.

## Escenario A · Cupo en una regional de la UCB (el caso real del curso)

Equipo de TI de 3 personas, una sola carrera al inicio, picos fuertes el día de inscripciones, un sistema académico legado que no se puede cambiar.

| Criterio (peso) | Monolito sin capas | Monolito por capas | Hexagonal | Event-driven | Microservicios |
|---|---|---|---|---|---|
| Simplicidad para un equipo de 3 (3) | 4 | 5 | 4 | 2 | 1 |
| Mantenibilidad del reglamento (3) | 1 | 3 | 5 | 3 | 4 |
| Testabilidad sin sistemas externos (2) | 1 | 3 | 5 | 3 | 4 |
| Escalar el día de inscripciones (2) | 2 | 3 | 3 | 4 | 5 |
| Costo de operación (2) | 5 | 5 | 5 | 3 | 1 |
| **Puntaje** | **31** | **46** | **53** | **35** | **35** |

**Decisión:** hoy, **monolito por capas** (lo que dejamos al terminar la sesión). **Objetivo:** un **monolito modular con arquitectura hexagonal en cada módulo** (sesiones 6 y 7). Microservicios no: el costo de operar varios despliegues supera lo que gana un equipo de 3.

## Escenario B · Las cuatro regionales con un solo Cupo

Varias sedes, más carreras, más usuarios simultáneos, equipos que podrían crecer.

| Criterio (peso) | Monolito por capas | Monolito modular | Microservicios |
|---|---|---|---|
| Escalar a varias sedes (3) | 2 | 4 | 5 |
| Equipos trabajando en paralelo (2) | 2 | 4 | 5 |
| Consistencia del cupo (3) | 5 | 5 | 2 |
| Costo de operación (2) | 5 | 4 | 2 |
| **Puntaje** | **35** | **43** | **35** |

**Decisión:** monolito modular con instancias sin estado detrás de un balanceador (sesión 9). Partir en servicios solo si un módulo necesita escalar o desplegarse aparte.

## Escenario C · Inscripción a un evento puntual (un congreso de dos días)

Se usa una semana y se descarta. Un desarrollador.

| Criterio (peso) | Monolito sin capas | Monolito por capas | Microservicios |
|---|---|---|---|
| Tiempo para tenerlo listo (3) | 5 | 4 | 1 |
| Mantenibilidad a largo plazo (1) | 1 | 3 | 4 |
| Costo de operación (2) | 5 | 5 | 1 |
| **Puntaje** | **26** | **25** | **9** |

**Decisión:** un monolito simple. Aquí la mantenibilidad casi no pesa: KISS gana.

## Lo que aprendimos

El mismo estilo saca puntajes distintos en escenarios distintos. No hay un estilo "mejor": hay uno que encaja con los drivers de cada caso. En la Sesión 3 esta decisión se escribe como un ADR.
