import { Injectable } from '@nestjs/common';
import { UsuariosRepositorio } from '../usuarios/usuarios.repositorio';
import { SistemaAcademicoClient } from './sistema-academico.client';

// Capa de negocio: el kardex del estudiante, a partir del CSV del sistema académico.
@Injectable()
export class KardexService {
  constructor(
    private readonly usuarios: UsuariosRepositorio,
    private readonly sistemaAcademico: SistemaAcademicoClient,
  ) {}

  async kardexDe(estudianteId: string) {
    const usuario = this.usuarios.buscarPorId(estudianteId);
    const csv = await this.sistemaAcademico.kardexCsv(usuario.codigo);

    // COD_EST;SIGLA;NOTA;ESTADO;GESTION
    const materias = csv
      .trim()
      .split('\n')
      .slice(1)
      .filter((linea) => linea.length > 0)
      .map((linea) => {
        const col = linea.split(';');
        let estado = col[3];
        if (estado === 'APROB') estado = 'APROBADA';
        if (estado === 'REPROB') estado = 'REPROBADA';
        return {
          sigla: col[1].slice(0, 3) + '-' + col[1].slice(3),
          nota: Number(col[2]),
          estado,
          gestion: col[4],
        };
      });

    return { codigo: usuario.codigo, nombre: usuario.nombre, materias };
  }
}
