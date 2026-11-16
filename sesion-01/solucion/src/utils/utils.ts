import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

// Funciones que usa todo el sistema.

export function carpetaDatos(): string {
  return process.env.CUPO_DATOS ?? path.join(process.cwd(), 'datos');
}

export function leerJson(archivo: string): any {
  const ruta = path.join(carpetaDatos(), archivo);
  return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

export function escribirJson(archivo: string, datos: any): void {
  const ruta = path.join(carpetaDatos(), archivo);
  fs.writeFileSync(ruta, JSON.stringify(datos, null, 2));
}

export function nuevoId(prefijo: string): string {
  return `${prefijo}-${randomUUID().slice(0, 8)}`;
}

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function formatoBs(monto: number): string {
  return `Bs ${monto.toFixed(2)}`;
}

export function ahoraIso(): string {
  return new Date().toISOString();
}
