// Mide el acoplamiento de Cupo leyendo los imports de src/.
//
// Cada carpeta de primer nivel de src/ es un MÓDULO (auth, oferta, inscripciones…).
// Por cada módulo calcula (Robert C. Martin, Clean Architecture, cap. 14):
//   Ca  acoplamiento aferente: cuántos OTROS módulos dependen de él
//   Ce  acoplamiento eferente: de cuántos OTROS módulos depende él
//   I   inestabilidad = Ce / (Ca + Ce): 0 = muy estable (muchos dependen de él), 1 = muy inestable
// Además busca CICLOS de imports (entre archivos y entre módulos) y los archivos más usados (fan-in).
//
// Uso: pnpm metricas
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface MetricaModulo {
  modulo: string;
  archivos: number;
  ca: number;
  ce: number;
  inestabilidad: number;
}

export interface Metricas {
  modulos: MetricaModulo[];
  ciclos: string[][];
  ciclosDeModulos: string[][];
  masUsados: { archivo: string; dependientes: number }[];
}

const RAIZ_SRC = path.join(__dirname, '..', 'src');

function archivosDe(carpeta: string): string[] {
  return fs
    .readdirSync(carpeta, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.ts'))
    .map((f) => f.replace(/\\/g, '/'));
}

/** Los archivos de src/ que importa un archivo (solo imports relativos). */
function importsDe(src: string, archivo: string): string[] {
  const codigo = fs.readFileSync(path.join(src, archivo), 'utf8');
  return [...codigo.matchAll(/from '(\.[^']+)'/g)]
    .map((m) => path.posix.normalize(path.posix.join(path.posix.dirname(archivo), m[1])))
    .map((destino) => (fs.existsSync(path.join(src, destino + '.ts')) ? destino + '.ts' : destino + '/index.ts'));
}

const moduloDe = (archivo: string) => (archivo.includes('/') ? archivo.split('/')[0] : '(raíz)');

/** Componentes fuertemente conexos (algoritmo de Tarjan): cada uno con más de un archivo es un ciclo. */
function buscarCiclos(grafo: Map<string, string[]>): string[][] {
  let indice = 0;
  const pila: string[] = [];
  const enPila = new Set<string>();
  const idx = new Map<string, number>();
  const bajo = new Map<string, number>();
  const ciclos: string[][] = [];

  function visitar(v: string) {
    idx.set(v, indice);
    bajo.set(v, indice++);
    pila.push(v);
    enPila.add(v);
    for (const w of grafo.get(v) ?? []) {
      if (!idx.has(w)) {
        visitar(w);
        bajo.set(v, Math.min(bajo.get(v)!, bajo.get(w)!));
      } else if (enPila.has(w)) {
        bajo.set(v, Math.min(bajo.get(v)!, idx.get(w)!));
      }
    }
    if (bajo.get(v) === idx.get(v)) {
      const componente: string[] = [];
      let w: string;
      do {
        w = pila.pop()!;
        enPila.delete(w);
        componente.push(w);
      } while (w !== v);
      if (componente.length > 1) ciclos.push(componente.sort());
    }
  }

  for (const v of grafo.keys()) if (!idx.has(v)) visitar(v);
  return ciclos;
}

export function analizar(src: string = RAIZ_SRC): Metricas {
  const archivos = archivosDe(src);
  const grafo = new Map(archivos.map((a) => [a, importsDe(src, a).filter((d) => archivos.includes(d))]));

  const modulos = [...new Set(archivos.map(moduloDe))].filter((m) => m !== '(raíz)').sort();
  const usa = new Map(modulos.map((m) => [m, new Set<string>()]));
  for (const [origen, destinos] of grafo) {
    for (const destino of destinos) {
      const [mo, md] = [moduloDe(origen), moduloDe(destino)];
      if (mo !== md && mo !== '(raíz)' && md !== '(raíz)') usa.get(mo)!.add(md);
    }
  }

  const metricas = modulos.map((m) => {
    const ce = usa.get(m)!.size;
    const ca = modulos.filter((otro) => usa.get(otro)!.has(m)).length;
    return {
      modulo: m,
      archivos: archivos.filter((a) => moduloDe(a) === m).length,
      ca,
      ce,
      inestabilidad: ca + ce === 0 ? 0 : Math.round((ce / (ca + ce)) * 100) / 100,
    };
  });

  const fanIn = new Map<string, number>();
  for (const destinos of grafo.values()) for (const d of destinos) fanIn.set(d, (fanIn.get(d) ?? 0) + 1);
  const masUsados = [...fanIn]
    .map(([archivo, dependientes]) => ({ archivo, dependientes }))
    .sort((a, b) => b.dependientes - a.dependientes || a.archivo.localeCompare(b.archivo))
    .slice(0, 5);

  const grafoModulos = new Map([...usa].map(([m, destinos]) => [m, [...destinos]]));
  return { modulos: metricas, ciclos: buscarCiclos(grafo), ciclosDeModulos: buscarCiclos(grafoModulos), masUsados };
}

if (require.main === module) {
  const { modulos, ciclos, ciclosDeModulos, masUsados } = analizar();
  console.log('Módulos de src/   (Ca = cuántos lo usan · Ce = cuántos usa · I = inestabilidad)');
  console.log('módulo            archivos   Ca   Ce     I');
  for (const m of modulos) {
    console.log(
      `${m.modulo.padEnd(18)}${String(m.archivos).padStart(8)}${String(m.ca).padStart(5)}${String(m.ce).padStart(5)}${m.inestabilidad.toFixed(2).padStart(6)}`,
    );
  }
  console.log(`\nCiclos entre archivos: ${ciclos.length}`);
  for (const c of ciclos) console.log('  ' + c.join(' ⇄ '));
  console.log(`Ciclos entre módulos: ${ciclosDeModulos.length}`);
  for (const c of ciclosDeModulos) console.log('  ' + c.join(' ⇄ '));
  console.log('\nArchivos más usados (cuántos archivos los importan):');
  for (const u of masUsados) console.log(`  ${u.archivo.padEnd(48)}${String(u.dependientes).padStart(3)}`);
}
