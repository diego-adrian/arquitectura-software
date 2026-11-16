import { LectorKardex } from './lector-kardex';

// El detalle: lee el kardex del sistema académico legado (CSV separado por ';').
export class KardexLegadoClient implements LectorKardex {
  async siglasAprobadas(codigoEstudiante: string): Promise<string[]> {
    const url = process.env.LEGADO_URL || 'http://localhost:4001';
    const cod = codigoEstudiante.replace('-', '');
    const csv = await (await fetch(`${url}/sia/kardex?cod=${cod}`)).text();
    return csv
      .trim()
      .split('\n')
      .slice(1)
      .map((linea) => linea.split(';'))
      .filter((col) => col[3] === 'APROB')
      .map((col) => col[1]);
  }
}
