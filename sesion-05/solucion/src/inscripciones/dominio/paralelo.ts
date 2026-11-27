import { ReglaIncumplida } from './regla-incumplida';

export interface Horario {
  dia: string;
  inicio: string;
  fin: string;
}

// Un paralelo es un grupo (A, B…) de una materia, con su docente, su horario y su cupo.
// Es el ÚNICO lugar que conoce la regla "nunca más inscritos que el cupo".
export class Paralelo {
  private constructor(
    readonly id: string,
    readonly sigla: string,
    readonly grupo: string,
    readonly docente: string,
    readonly cupo: number,
    readonly horarios: Horario[],
  ) {}

  static desde(datos: any): Paralelo {
    return new Paralelo(datos.id, datos.sigla, datos.grupo, datos.docente, datos.cupo, datos.horarios);
  }

  disponibles(inscritos: number): number {
    return Math.max(this.cupo - inscritos, 0);
  }

  verificarQueHayCupo(inscritos: number): void {
    if (inscritos >= this.cupo) {
      throw new ReglaIncumplida(`Ya no hay cupo en ${this.id}`, 'conflicto');
    }
  }

  ocupacion(inscritos: number): { cupo: number; inscritos: number; disponibles: number; porcentaje: number } {
    return { cupo: this.cupo, inscritos, disponibles: this.disponibles(inscritos), porcentaje: Math.round((inscritos / this.cupo) * 100) };
  }
}
