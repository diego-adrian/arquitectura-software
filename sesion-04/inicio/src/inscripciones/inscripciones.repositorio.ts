import { Injectable } from '@nestjs/common';
import { escribirJson, leerJson } from '../utils/utils';

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
