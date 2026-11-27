import { Materia } from './materia';
import { Paralelo } from './paralelo';
import { ReglaIncumplida } from './regla-incumplida';
import { buscarChoqueDeHorario, sumarCreditos, verificarCreditos, verificarPrerrequisitos } from './reglas';

// Lo que el estudiante eligió: un paralelo y la materia a la que pertenece.
export interface Eleccion {
  paralelo: Paralelo;
  materia: Materia;
}

export type EstadoDeInscripcion = 'PENDIENTE_PAGO' | 'PAGADA';

// Así se guarda una inscripción (y así la ve la API).
export interface DatosDeInscripcion {
  id: string;
  estudianteId: string;
  codigo: string;
  gestion: string;
  paralelos: string[];
  creditos: number;
  monto: number | null;
  pagoId: string | null;
  estado: EstadoDeInscripcion;
  fecha: string;
}

function exigir(error: string | null): void {
  if (error) {
    throw new ReglaIncumplida(error);
  }
}

// AGREGADO: la inscripción de UN estudiante en UNA gestión.
// Nadie cambia sus datos desde afuera: todo pasa por sus métodos, que protegen el reglamento.
export class InscripcionDeGestion {
  private constructor(private datos: DatosDeInscripcion) {}

  static crear(p: {
    id: string;
    estudianteId: string;
    codigo: string;
    gestion: string;
    elecciones: Eleccion[];
    inscritosPorParalelo: Map<string, number>;
    siglasAprobadas: string[];
    fecha: string;
  }): InscripcionDeGestion {
    const repetida = p.elecciones.find((e, i) => p.elecciones.findIndex((o) => o.materia.sigla === e.materia.sigla) !== i);
    if (repetida) {
      throw new ReglaIncumplida(`Elegiste dos paralelos de ${repetida.materia.sigla}`);
    }
    const paralelos = p.elecciones.map((e) => e.paralelo);
    const materias = p.elecciones.map((e) => e.materia);
    const creditos = sumarCreditos(materias);

    exigir(verificarCreditos(creditos));
    for (const paralelo of paralelos) {
      paralelo.verificarQueHayCupo(p.inscritosPorParalelo.get(paralelo.id) ?? 0);
    }
    exigir(buscarChoqueDeHorario(paralelos));
    exigir(verificarPrerrequisitos(materias, p.siglasAprobadas));

    return new InscripcionDeGestion({
      id: p.id,
      estudianteId: p.estudianteId,
      codigo: p.codigo,
      gestion: p.gestion,
      paralelos: paralelos.map((x) => x.id),
      creditos,
      monto: null,
      pagoId: null,
      estado: 'PENDIENTE_PAGO',
      fecha: p.fecha,
    });
  }

  static desde(datos: DatosDeInscripcion): InscripcionDeGestion {
    return new InscripcionDeGestion({ ...datos, paralelos: [...datos.paralelos] });
  }

  get creditos(): number {
    return this.datos.creditos;
  }

  esDe(estudianteId: string): boolean {
    return this.datos.estudianteId === estudianteId;
  }

  registrarPago(pagoId: string, monto: number): void {
    this.datos.pagoId = pagoId;
    this.datos.monto = monto;
    this.datos.estado = 'PAGADA';
  }

  retirar(paraleloId: string, creditosDeLaMateria: number): void {
    if (!this.datos.paralelos.includes(paraleloId)) {
      throw new ReglaIncumplida(`No estás inscrito en ${paraleloId}`);
    }
    if (this.datos.paralelos.length === 1) {
      throw new ReglaIncumplida('No puedes retirar tu última materia');
    }
    this.datos.paralelos = this.datos.paralelos.filter((id) => id !== paraleloId);
    this.datos.creditos -= creditosDeLaMateria;
  }

  aDatos(): DatosDeInscripcion {
    return { ...this.datos, paralelos: [...this.datos.paralelos] };
  }
}
