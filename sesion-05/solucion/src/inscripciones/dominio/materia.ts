// Una materia del plan de estudios. Se identifica por su sigla (por ejemplo, SIS-211).
export interface Materia {
  sigla: string;
  nombre: string;
  creditos: number;
  prerrequisitos: string[];
}
