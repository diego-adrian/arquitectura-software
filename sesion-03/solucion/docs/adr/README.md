# Decisiones de arquitectura de Cupo (ADR)

Un **ADR** (Architecture Decision Record) registra una decisión de arquitectura: el contexto, las opciones, lo que se decidió y sus consecuencias. Se escriben cuando se toma la decisión y **no se borran**: si una decisión cambia, se escribe un ADR nuevo que la reemplaza y el viejo pasa a "Reemplazada por".

Formato: el de Michael Nygard (2011), con dos secciones agregadas para el curso: *Opciones consideradas* y *Atributos de calidad afectados*. La plantilla está en [`0000-plantilla.md`](0000-plantilla.md).

| ADR | Decisión | Estado |
|---|---|---|
| [0001](0001-estilo-arquitectonico.md) | Monolito por capas hoy; monolito modular con hexagonal como objetivo | Aceptada |
| [0002](0002-persistencia-en-archivos-json.md) | Guardar los datos en archivos JSON (por ahora) | Aceptada |
| [0003](0003-proteger-el-cupo.md) | Reservar el cupo de forma atómica antes de cobrar | Aceptada |
| [0004](0004-integracion-con-el-sistema-academico.md) | Leer el kardex del sistema académico legado, sin modificarlo | Aceptada |
