const formatoBs = (monto: number) => `Bs ${monto.toFixed(2)}`;

// Arma el texto del correo que confirma una inscripción.
export function correoDeConfirmacion(datos: {
  estudiante: any;
  paralelos: any[];
  materias: any[];
  creditos: number;
  monto: number;
  gestion: string;
}): { asunto: string; cuerpo: string } {
  const { estudiante, paralelos, materias, creditos, monto, gestion } = datos;
  const detalle = paralelos
    .map((p) => `- ${p.sigla} ${materias.find((m) => m.sigla === p.sigla).nombre} (grupo ${p.grupo})`)
    .join('\n');
  return {
    asunto: `Inscripción confirmada ${gestion}`,
    cuerpo: `Hola ${estudiante.nombre}:\n\nTu inscripción quedó registrada.\n${detalle}\n\nCréditos: ${creditos}\nMonto pagado: ${formatoBs(monto)}\n\nCupo · Inscripciones`,
  };
}
