import { Injectable } from '@nestjs/common';
import { escribirJson, leerJson } from '../persistencia/archivos-json';

// Capa de datos: guarda y lee las inscripciones (por ahora, en datos/inscripciones.json).
@Injectable()
export class InscripcionesRepositorio {
  todas(): any[] {
    return leerJson('inscripciones.json');
  }

  buscar(id: string): any {
    return this.todas().find((i) => i.id === id);
  }

  deEstudiante(estudianteId: string, gestion: string): any {
    return this.todas().find((i) => i.estudianteId === estudianteId && i.gestion === gestion);
  }

  deLaGestion(gestion: string): any[] {
    return this.todas().filter((i) => i.gestion === gestion);
  }

  // paraleloId -> cuántas inscripciones de la gestión lo incluyen
  inscritosPorParalelo(gestion: string): Map<string, number> {
    const conteo = new Map<string, number>();
    for (const inscripcion of this.deLaGestion(gestion)) {
      for (const id of inscripcion.paralelos) {
        conteo.set(id, (conteo.get(id) ?? 0) + 1);
      }
    }
    return conteo;
  }

  agregar(inscripcion: any): void {
    const inscripciones = this.todas();
    inscripciones.push(inscripcion);
    escribirJson('inscripciones.json', inscripciones);
  }

  actualizar(inscripcion: any): void {
    const inscripciones = this.todas().map((i) => (i.id === inscripcion.id ? inscripcion : i));
    escribirJson('inscripciones.json', inscripciones);
  }
}
