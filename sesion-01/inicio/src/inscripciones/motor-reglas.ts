import { aMinutos } from '../utils/utils';

// Motor de reglas de inscripción: cada regla se registra por nombre en la fábrica
// y el motor las ejecuta en el orden que le pidan. Así mañana se pueden agregar
// reglas nuevas desde configuración sin tocar el código.

export interface ContextoRegla {
  estudiante: any;
  paralelos: any[];
  materias: any[];
}

export abstract class Regla {
  abstract readonly nombre: string;
  // Devuelve el mensaje de error, o null si la regla se cumple.
  abstract validar(contexto: ContextoRegla): string | null;
}

export class ReglaChoqueHorario extends Regla {
  readonly nombre = 'choque-horario';

  validar(contexto: ContextoRegla): string | null {
    const ps = contexto.paralelos;
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        for (const h1 of ps[i].horarios) {
          for (const h2 of ps[j].horarios) {
            if (h1.dia === h2.dia && aMinutos(h1.inicio) < aMinutos(h2.fin) && aMinutos(h2.inicio) < aMinutos(h1.fin)) {
              return `Choque de horario entre ${ps[i].id} y ${ps[j].id} (${h1.dia})`;
            }
          }
        }
      }
    }
    return null;
  }
}

export class ReglaPrerrequisitos extends Regla {
  readonly nombre = 'prerrequisitos';

  // El kardex viene del sistema académico, así que esta regla tiene que esperar la respuesta.
  validar(contexto: ContextoRegla): any {
    return this.validarConKardex(contexto);
  }

  private async validarConKardex(contexto: ContextoRegla): Promise<string | null> {
    try {
      const url = process.env.LEGADO_URL || 'http://localhost:4001';
      const cod = contexto.estudiante.codigo.replace('-', '');
      const csv = await (await fetch(`${url}/sia/kardex?cod=${cod}`)).text();
      const aprobadas = csv
        .trim()
        .split('\n')
        .slice(1)
        .map((linea) => linea.split(';'))
        .filter((col) => col[3] === 'APROB')
        .map((col) => col[1]);

      for (const materia of contexto.materias) {
        for (const pre of materia.prerrequisitos) {
          if (!aprobadas.includes(pre.replace('-', ''))) {
            return `Te falta aprobar ${pre} para inscribirte a ${materia.sigla}`;
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  }
}

export class FabricaDeReglas {
  private static registro = new Map<string, new () => Regla>();

  static registrar(nombre: string, clase: new () => Regla): void {
    FabricaDeReglas.registro.set(nombre, clase);
  }

  static crear(nombre: string): Regla {
    const Clase = FabricaDeReglas.registro.get(nombre);
    if (!Clase) {
      throw new Error(`Regla desconocida: ${nombre}`);
    }
    return new Clase();
  }
}

FabricaDeReglas.registrar('choque-horario', ReglaChoqueHorario);
FabricaDeReglas.registrar('prerrequisitos', ReglaPrerrequisitos);

export class MotorDeReglas {
  constructor(private readonly nombres: string[]) {}

  evaluar(contexto: ContextoRegla): string[] {
    const errores: string[] = [];
    for (const nombre of this.nombres) {
      const resultado = FabricaDeReglas.crear(nombre).validar(contexto);
      // solo contamos los mensajes de texto (a veces llegaba otra cosa)
      if (typeof resultado === 'string') {
        errores.push(resultado);
      }
    }
    return errores;
  }
}
