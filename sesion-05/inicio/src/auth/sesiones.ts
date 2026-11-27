// Las sesiones abiertas: token -> usuario que inició sesión.
// Viven en la memoria de este proceso.
export interface Sesion {
  id: string;
  rol: string;
}

export const SESIONES = new Map<string, Sesion>();
