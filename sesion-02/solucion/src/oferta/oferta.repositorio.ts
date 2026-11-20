import { Injectable } from '@nestjs/common';
import { leerJson } from '../utils/utils';

// Capa de datos: la oferta de la gestión (materias y paralelos).
@Injectable()
export class OfertaRepositorio {
  leer(): any {
    return leerJson('oferta.json');
  }
}
