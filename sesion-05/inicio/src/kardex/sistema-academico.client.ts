import { Injectable } from '@nestjs/common';

// Capa de datos: trae el kardex del sistema académico legado, tal como lo entrega (CSV).
@Injectable()
export class SistemaAcademicoClient {
  async kardexCsv(codigoEstudiante: string): Promise<string> {
    const url = process.env.LEGADO_URL || 'http://localhost:4001';
    const respuesta = await fetch(`${url}/sia/kardex?cod=${codigoEstudiante.replace('-', '')}`);
    return respuesta.text();
  }
}
