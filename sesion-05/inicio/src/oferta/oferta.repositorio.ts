import { Injectable } from '@nestjs/common';
import { leerJson } from '../persistencia/archivos-json';

// Capa de datos: la oferta de la gestión (materias y paralelos).
@Injectable()
export class OfertaRepositorio {
  leer(): any {
    return leerJson('oferta.json');
  }

  // La gestión vigente sale de la oferta: es la única fuente de verdad.
  gestionActual(): string {
    return this.leer().gestion;
  }
}
