// La abstracción: lo que la inscripción necesita saber del historial académico.
export const LECTOR_KARDEX = 'LECTOR_KARDEX';

export interface LectorKardex {
  // Siglas de las materias aprobadas, tal como las escribe el sistema académico (p. ej. "SIS111")
  siglasAprobadas(codigoEstudiante: string): Promise<string[]>;
}
