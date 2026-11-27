import * as fs from 'node:fs';
import * as path from 'node:path';

// Lectura y escritura de los archivos JSON de datos/. Solo lo usan los repositorios
// (y el correo, que escribe su log en la misma carpeta).

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
