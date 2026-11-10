// Frontend de Cupo (v0). JavaScript sin frameworks.
const API = 'http://localhost:3000/api';
const MAX_CREDITOS = 22;
const MATRICULA = 400;
const PRECIO_CREDITO = 190;

let token = localStorage.getItem('cupo.token');
let usuario = JSON.parse(localStorage.getItem('cupo.usuario') || 'null');
let oferta = null;

const $ = (id) => document.getElementById(id);

function mensaje(texto, tipo = 'ok') {
  $('mensaje').textContent = texto;
  $('mensaje').className = tipo;
}

async function api(ruta, opciones = {}) {
  const respuesta = await fetch(API + ruta, {
    ...opciones,
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.message || 'Error ' + respuesta.status);
  return datos;
}

// El mismo cálculo que hace el servidor, para mostrar el total antes de pagar
function calcularMonto(tipo, creditos) {
  if (tipo === 'becado') return MATRICULA + creditos * PRECIO_CREDITO * 0.5;
  if (tipo === 'convenio') return MATRICULA + creditos * PRECIO_CREDITO * 0.7;
  return MATRICULA + creditos * PRECIO_CREDITO;
}

function seleccionados() {
  return [...document.querySelectorAll('#tabla-oferta input:checked')].map((c) => c.value);
}

function creditosDe(ids) {
  return ids
    .map((id) => oferta.materias.find((m) => m.paralelos.some((p) => p.id === id)))
    .reduce((total, m) => total + m.creditos, 0);
}

function actualizarResumen() {
  const creditos = creditosDe(seleccionados());
  const monto = calcularMonto(usuario.tipo, creditos);
  $('resumen').textContent = `Créditos: ${creditos} / ${MAX_CREDITOS} · Total a pagar: Bs ${monto.toFixed(2)}`;
  $('btn-inscribir').disabled = creditos === 0 || creditos > MAX_CREDITOS;
}

function fila(materia, paralelo) {
  const tr = document.createElement('tr');
  const celdas = [
    paralelo.id,
    materia.nombre,
    materia.creditos,
    paralelo.docente,
    paralelo.horarios.map((h) => `${h.dia} ${h.inicio}-${h.fin}`).join(', '),
    `${paralelo.disponibles} / ${paralelo.cupo}`,
  ];
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.value = paralelo.id;
  check.disabled = paralelo.disponibles <= 0;
  check.addEventListener('change', actualizarResumen);
  const tdCheck = document.createElement('td');
  tdCheck.append(check);
  tr.append(tdCheck);
  for (const texto of celdas) {
    const td = document.createElement('td');
    td.textContent = texto;
    tr.append(td);
  }
  if (paralelo.disponibles <= 0) tr.lastChild.className = 'lleno';
  return tr;
}

async function cargarOferta() {
  oferta = await api('/oferta');
  $('gestion').textContent = oferta.gestion;
  $('tabla-oferta').replaceChildren(...oferta.materias.flatMap((m) => m.paralelos.map((p) => fila(m, p))));
  actualizarResumen();
}

async function cargarMia() {
  try {
    const mia = await api('/inscripciones/mia');
    $('vista-oferta').hidden = true;
    $('vista-mia').hidden = false;
    const lista = document.createElement('ul');
    for (const id of mia.paralelos) {
      const li = document.createElement('li');
      li.textContent = id + ' ';
      const retirar = document.createElement('button');
      retirar.textContent = 'Retirar';
      retirar.addEventListener('click', async () => {
        try {
          await api(`/inscripciones/${mia.id}/paralelos/${id}`, { method: 'DELETE' });
          mensaje(`Retiraste ${id}`);
          cargarMia();
        } catch (e) {
          mensaje(e.message, 'error');
        }
      });
      li.append(retirar);
      lista.append(li);
    }
    const resumen = document.createElement('p');
    resumen.textContent = `${mia.creditos} créditos · Bs ${Number(mia.monto).toFixed(2)} · ${mia.estado}`;
    $('mia').replaceChildren(resumen, lista);
  } catch {
    $('vista-mia').hidden = true;
    $('vista-oferta').hidden = false;
    await cargarOferta();
  }
}

async function cargarKardex() {
  const kardex = await api('/kardex');
  $('kardex').replaceChildren(
    ...kardex.materias.map((m) => {
      const li = document.createElement('li');
      li.textContent = `${m.sigla} · ${m.nota} · ${m.estado} (${m.gestion})`;
      return li;
    }),
  );
}

async function cargarReportes() {
  const reporte = await api('/reportes/ocupacion');
  const filas = reporte.paralelos
    .map((p) => `<tr><td>${p.id}</td><td>${p.docente}</td><td>${p.inscritos} / ${p.cupo}</td><td>${p.ocupacion}%</td></tr>`)
    .join('');
  $('reportes').innerHTML =
    `<p>Inscritos: ${reporte.totalInscritos} · Recaudado: Bs ${reporte.recaudado.toFixed(2)}</p>` +
    `<table><thead><tr><th>Paralelo</th><th>Docente</th><th>Inscritos</th><th>Ocupación</th></tr></thead><tbody>${filas}</tbody></table>`;
  $('vista-reportes').hidden = false;
}

async function entrar() {
  $('vista-login').hidden = true;
  $('sesion').hidden = false;
  $('saludo').textContent = `${usuario.nombre} (${usuario.rol})`;
  $('btn-reportes').hidden = usuario.rol !== 'director';
  if (usuario.rol === 'estudiante') {
    $('vista-kardex').hidden = false;
    await Promise.all([cargarMia(), cargarKardex()]);
  }
}

$('form-login').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const datos = Object.fromEntries(new FormData(evento.target));
  try {
    const respuesta = await fetch(API + '/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.message);
    token = cuerpo.token;
    usuario = cuerpo.usuario;
    localStorage.setItem('cupo.token', token);
    localStorage.setItem('cupo.usuario', JSON.stringify(usuario));
    mensaje('');
    await entrar();
  } catch (e) {
    mensaje(e.message, 'error');
  }
});

$('btn-inscribir').addEventListener('click', async () => {
  const paralelos = seleccionados();
  const monto = calcularMonto(usuario.tipo, creditosDe(paralelos));
  $('btn-inscribir').disabled = true;
  mensaje('Procesando el pago QR...');
  try {
    await api('/inscripciones', { method: 'POST', body: JSON.stringify({ paralelos, monto }) });
    mensaje('¡Inscripción confirmada! Revisa tu correo.');
    await cargarMia();
  } catch (e) {
    mensaje(e.message, 'error');
    $('btn-inscribir').disabled = false;
  }
});

$('btn-reportes').addEventListener('click', () => cargarReportes().catch((e) => mensaje(e.message, 'error')));

$('btn-salir').addEventListener('click', () => {
  localStorage.clear();
  location.reload();
});

if (token && usuario) {
  entrar().catch(() => {
    localStorage.clear();
    location.reload();
  });
}
