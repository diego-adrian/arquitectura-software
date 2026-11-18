import { aMinutos } from '../utils/utils';

// Las reglas del reglamento de inscripción, como funciones simples.
// Cada una devuelve el mensaje de error, o null si la regla se cumple.
// No usan Nest, ni archivos, ni red: se prueban con datos en memoria.

export const MAX_CREDITOS = 24;

export function validarSolicitud(body: any): string | null {
  if (!body || !Array.isArray(body.paralelos) || body.paralelos.length === 0) {
    return 'Debes elegir al menos un paralelo';
  }
  if (body.paralelos.some((p: any) => typeof p !== 'string')) {
    return 'Los paralelos deben ser códigos de texto';
  }
  return null;
}

export function sumarCreditos(materias: any[]): number {
  return materias.reduce((total, materia) => total + materia.creditos, 0);
}

export function verificarCreditos(creditos: number): string | null {
  if (creditos > MAX_CREDITOS) {
    return `Máximo ${MAX_CREDITOS} créditos por gestión (elegiste ${creditos})`;
  }
  return null;
}

export function buscarChoqueDeHorario(paralelos: any[]): string | null {
  for (let i = 0; i < paralelos.length; i++) {
    for (let j = i + 1; j < paralelos.length; j++) {
      for (const h1 of paralelos[i].horarios) {
        for (const h2 of paralelos[j].horarios) {
          const seCruzan = aMinutos(h1.inicio) < aMinutos(h2.fin) && aMinutos(h2.inicio) < aMinutos(h1.fin);
          if (h1.dia === h2.dia && seCruzan) {
            return `Choque de horario entre ${paralelos[i].id} y ${paralelos[j].id} (${h1.dia})`;
          }
        }
      }
    }
  }
  return null;
}

// `aprobadas` llega con las siglas del sistema académico (sin guion: "SIS111")
export function verificarPrerrequisitos(materias: any[], aprobadas: string[]): string | null {
  for (const materia of materias) {
    for (const pre of materia.prerrequisitos) {
      if (!aprobadas.includes(pre.replace('-', ''))) {
        return `Te falta aprobar ${pre} para inscribirte a ${materia.sigla}`;
      }
    }
  }
  return null;
}
