// Arma un Cupo completo para cada prueba: datos en una carpeta temporal,
// los dos simuladores en puertos libres y la aplicación Nest en memoria.
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as fs from 'node:fs';
import { AddressInfo } from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { Server } from 'node:http';
import request from 'supertest';
import { crearLegado, OpcionesLegado } from '../../simuladores/legado';
import { crearPasarela, OpcionesPasarela } from '../../simuladores/pasarela';

export const ANA = '2023-1001'; // regular
export const LUIS = '2024-1002'; // becado
export const CARLA = '2022-1003'; // convenio
export const DIEGO = '2025-1004'; // traspaso
export const DIRECCION = 'DIR-SIS';
export const CLAVE = 'demo1234';

export const RAIZ = path.join(__dirname, '..', '..');

export interface OpcionesEntorno {
  pasarela?: OpcionesPasarela;
  legado?: OpcionesLegado;
  // Para cambiar la oferta antes de arrancar (por ejemplo, dejar un cupo en 1)
  ajustarOferta?: (oferta: any) => void;
}

export interface Entorno {
  app: INestApplication;
  http: () => ReturnType<typeof request>;
  datos: string;
  urlPasarela: string;
  entrar: (codigo: string) => Promise<string>;
  leerDatos: (archivo: string) => any;
  cerrar: () => Promise<void>;
}

function escuchar(servidor: Server): Promise<string> {
  return new Promise((resolver) =>
    servidor.listen(0, () => resolver(`http://127.0.0.1:${(servidor.address() as AddressInfo).port}`)),
  );
}

/** Copia datos-semilla/ a una carpeta temporal y la deja en CUPO_DATOS. */
export function prepararDatos(ajustarOferta?: (oferta: any) => void): string {
  const datos = fs.mkdtempSync(path.join(os.tmpdir(), 'cupo-'));
  fs.cpSync(path.join(RAIZ, 'datos-semilla'), datos, { recursive: true });
  if (ajustarOferta) {
    const ruta = path.join(datos, 'oferta.json');
    const oferta = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    ajustarOferta(oferta);
    fs.writeFileSync(ruta, JSON.stringify(oferta));
  }
  process.env.CUPO_DATOS = datos;
  return datos;
}

/** Crea la app Nest. Con `cargar` se puede usar una copia aislada de los módulos. */
export async function crearApp(cargar: (ruta: string) => any = require): Promise<INestApplication> {
  const { Test: TestAislado } = cargar('@nestjs/testing') as { Test: typeof Test };
  const { AppModule } = cargar(path.join(RAIZ, 'src', 'app.module'));
  const modulo = await TestAislado.createTestingModule({ imports: [AppModule] }).compile();
  const app = modulo.createNestApplication({ logger: false });
  await app.init();
  return app;
}

export async function levantar(opciones: OpcionesEntorno = {}): Promise<Entorno> {
  const datos = prepararDatos(opciones.ajustarOferta);
  const legado = crearLegado({ latenciaMs: 0, ...opciones.legado });
  const pasarela = crearPasarela({ latenciaMs: 0, fallaPorcentaje: 0, ...opciones.pasarela });
  process.env.LEGADO_URL = await escuchar(legado);
  const urlPasarela = await escuchar(pasarela);
  process.env.PASARELA_URL = urlPasarela;

  const app = await crearApp();
  const http = () => request(app.getHttpServer());

  return {
    app,
    http,
    datos,
    urlPasarela,
    entrar: async (codigo) => {
      const respuesta = await http().post('/api/login').send({ codigo, password: CLAVE }).expect(201);
      return respuesta.body.token;
    },
    leerDatos: (archivo) => JSON.parse(fs.readFileSync(path.join(datos, archivo), 'utf8')),
    cerrar: async () => {
      await app.close();
      legado.closeAllConnections();
      pasarela.closeAllConnections();
      await new Promise((r) => legado.close(r));
      await new Promise((r) => pasarela.close(r));
      fs.rmSync(datos, { recursive: true, force: true });
    },
  };
}

/** Lee un archivo del proyecto (para las pruebas que miden el código). */
export function fuente(ruta: string): string {
  return fs.readFileSync(path.join(RAIZ, ruta), 'utf8');
}

/** Todos los .ts de una carpeta del proyecto, recursivamente. */
export function archivosTs(carpeta: string): string[] {
  return fs
    .readdirSync(path.join(RAIZ, carpeta), { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.ts'))
    .map((f) => path.join(carpeta, f));
}

/** Cuántas líneas mide un método, contando desde su firma hasta la llave que lo cierra. */
export function lineasDelMetodo(codigo: string, firma: string): number {
  const inicio = codigo.indexOf(firma);
  let profundidad = 0;
  let abierto = false;
  for (let i = codigo.indexOf('{', inicio); i < codigo.length; i++) {
    if (codigo[i] === '{') {
      profundidad++;
      abierto = true;
    }
    if (codigo[i] === '}') profundidad--;
    if (abierto && profundidad === 0) {
      return codigo.slice(inicio, i).split('\n').length;
    }
  }
  return -1;
}
