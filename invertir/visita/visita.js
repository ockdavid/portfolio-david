/* ===========================================================
   CHECKLIST DE VISITA — Lógica de la app (PSI David Landeo)
   - Datos guardados en IndexedDB (varias visitas, fotos incluidas).
   - Guardado automático mientras escribes.
   - Fotos por apartado, comprimidas antes de guardar.
   - "Generar PDF" reproduce el documento A4 ya relleno (imprimir → guardar como PDF).
   Vanilla JS, sin dependencias.
   =========================================================== */
(function () {
  'use strict';

  /* ---------- 1. ESTRUCTURA DEL CHECKLIST ----------
     tipos: 'campos' (input de texto por ítem) | 'checks' (casilla + nota)
            'fotos' (casilla + fotos por ítem) | 'notas' (texto libre largo) */
  const CHECKLIST = [
    {
      id: 'preguntas', num: 1, tipo: 'campos',
      titulo: 'Preguntas al vendedor y datos de la vivienda',
      items: [
        { id: 'direccion', label: 'Dirección completa y número de portal' },
        { id: 'plantapuerta', label: 'Planta y puerta' },
        { id: 'precio', label: 'Precio de venta', hint: 'Precio actual y posible margen de negociación.' },
        { id: 'metros', label: 'Metros cuadrados', hint: 'Construidos y útiles.' },
        { id: 'habbanos', label: 'Nº de habitaciones y baños' },
        { id: 'comunidad', label: 'Gastos de comunidad mensuales' },
        { id: 'ibi', label: 'IBI (anual aproximado)' },
        { id: 'honorarios', label: 'Honorarios de la inmobiliaria', hint: '% o cantidad fija, y quién paga.' },
        { id: 'ite', label: '¿Ha pasado la ITE?', hint: 'Vigente o pendiente. Preguntar a administrador de fincas.' },
        { id: 'planos', label: '¿Hay planos de la vivienda?', hint: 'Útil para redistribución.' },
        { id: 'senal', label: 'Monto de señal para ofertar' },
        { id: 'arras', label: 'Monto previsto de arras' },
        { id: 'motivo', label: 'Motivo de venta' }
      ]
    },
    {
      id: 'docs', num: 2, tipo: 'checks',
      titulo: 'Documentación a pedir',
      items: [
        { id: 'notasimple', label: 'Nota simple', hint: 'Actualizada (menos de un mes). Para tasación y financiación.' },
        { id: 'anio', label: 'Año de construcción', hint: 'Si no aparece en nota simple, solicitarlo.' },
        { id: 'acta', label: 'Acta de comunidad', hint: 'Derramas en curso o aprobadas (p. ej. tejado).' },
        { id: 'catastro', label: 'Referencia catastral / datos de catastro' },
        { id: 'cee', label: 'Certificado de eficiencia energética', hint: 'Opcional.' }
      ]
    },
    {
      id: 'fotos', num: 3, tipo: 'fotos',
      titulo: 'Fotos y vídeo (no solo del piso)',
      tip: 'Al grabar: no rotes sobre ti mismo (marea). Que se note la entrada y salida de cada estancia. Una buena grabación resuelve muchísimas dudas del cliente.',
      items: [
        { id: 'fpiso', label: 'El piso completo', hint: 'Mostrando bien la distribución.' },
        { id: 'facceso', label: 'Acceso desde escalera/ascensor y estado de la escalera' },
        { id: 'fpuerta', label: 'Puerta de entrada', hint: 'Blindada, estado, cerradura.' },
        { id: 'frotulo', label: 'Rótulo de planta y puerta' },
        { id: 'fbuzones', label: 'Buzones', hint: 'Estado de la comunidad y nº de vecinos.' },
        { id: 'ffachada', label: 'Fachada del edificio' },
        { id: 'fcalle', label: 'La calle y el entorno inmediato' }
      ]
    },
    {
      id: 'zona', num: 4, tipo: 'checks',
      titulo: 'Investigar la zona y la comunidad',
      items: [
        { id: 'vecinos', label: 'Hablar con los vecinos y fijarse en quién entra/sale del portal' },
        { id: 'agencia', label: 'Preguntar a la agencia quién vive en el edificio' },
        { id: 'ambiente', label: 'Ambiente de la calle y de la finca', hint: 'Perfil de inquilino probable.' },
        { id: 'obranueva', label: 'Obra nueva o cambios cerca', hint: 'Hacia dónde va la zona.' },
        { id: 'servicios', label: 'Servicios cercanos', hint: 'Transporte, supermercados, comercios.' },
        { id: 'reforma', label: 'Estimación del tipo de reforma', hint: 'Lavado de cara / media / integral.' },
        { id: 'alquiler', label: 'Idoneidad para alquiler tradicional o por habitaciones' },
        { id: 'transparencia', label: 'Ser transparente con el cliente sobre lo bueno y lo no tan bueno' }
      ]
    },
    {
      id: 'notas', num: 5, tipo: 'notas',
      titulo: 'Notas de la visita'
    }
  ];

  // nº de ítems "completables" para la barra de progreso (excluye notas libres)
  const TOTAL_ITEMS = CHECKLIST.reduce(
    (n, s) => n + (s.tipo === 'notas' ? 0 : s.items.length), 0
  );

  /* ---------- 2. ALMACENAMIENTO (IndexedDB) ---------- */
  const DB_NAME = 'visitas-psi';
  const STORE = 'visitas';
  let _db = null;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (_db) return resolve(_db);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => { _db = req.result; resolve(_db); };
      req.onerror = () => reject(req.error);
    });
  }
  function tx(mode) { return _db.transaction(STORE, mode).objectStore(STORE); }
  function dbGetAll() {
    return openDB().then(() => new Promise((res, rej) => {
      const r = tx('readonly').getAll();
      r.onsuccess = () => res(r.result || []);
      r.onerror = () => rej(r.error);
    }));
  }
  function dbGet(id) {
    return openDB().then(() => new Promise((res, rej) => {
      const r = tx('readonly').get(id);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => rej(r.error);
    }));
  }
  function dbPut(v) {
    return openDB().then(() => new Promise((res, rej) => {
      const r = tx('readwrite').put(v);
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    }));
  }
  function dbDelete(id) {
    return openDB().then(() => new Promise((res, rej) => {
      const r = tx('readwrite').delete(id);
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    }));
  }

  /* ---------- 3. MODELO DE VISITA ---------- */
  function hoyLocal() {
    const d = new Date();
    const off = d.getTimezoneOffset();          // minutos respecto a UTC
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
  }
  function nuevaVisita() {
    return {
      id: 'v' + Date.now() + Math.random().toString(36).slice(2, 7),
      cliente: '', agencia: '', agente: '',
      fecha: hoyLocal(),
      campos: {},   // { itemId: "valor texto" }
      checks: {},   // { itemId: true }
      fotos: {},    // { itemId: [ {dataUrl, path, pending} , ...] }
      notas: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      _dirty: true
    };
  }

  function contarCompletados(v) {
    let n = 0;
    CHECKLIST.forEach((s) => {
      if (s.tipo === 'campos') {
        s.items.forEach((it) => { if ((v.campos[it.id] || '').trim()) n++; });
      } else if (s.tipo === 'checks' || s.tipo === 'fotos') {
        s.items.forEach((it) => {
          const hasPhoto = s.tipo === 'fotos' && (v.fotos[it.id] || []).length > 0;
          if (v.checks[it.id] || hasPhoto) n++;
        });
      }
    });
    return n;
  }

  /* ---------- 4. ESTADO Y UTILIDADES UI ---------- */
  let actual = null;            // visita en edición
  let saveTimer = null;
  let currentUserEmail = '';    // email de la sesión (para mostrar y cerrar sesión)
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function fmtFecha(iso) {
    if (!iso) return '';
    const p = iso.split('-');
    if (p.length !== 3) return iso;
    return p[2] + '/' + p[1] + '/' + p[0];
  }
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------- 5. GUARDADO AUTOMÁTICO + SINCRONIZACIÓN ---------- */
  let cloudTimer = null;
  const usaCloud = () => !!(window.Cloud && Cloud.available());

  // estado visible: 'ok' | 'pend' | 'run' | 'err'
  function setSyncState(state, texto) {
    const dot = $('#savedDot');
    if (!dot) return;
    dot.classList.remove('sync-ok', 'sync-pend', 'sync-run', 'sync-err');
    dot.classList.add('sync-' + state);
    const map = { ok: usaCloud() ? 'Sincronizado' : 'Guardado', pend: 'Sin conexión', run: 'Sincronizando…', err: 'Reintentando…' };
    dot.querySelector('span').textContent = texto || map[state] || 'Guardado';
  }

  function marcarSucio() {
    if (!actual) return;
    actual._dirty = true;
    setSyncState('pend', 'Guardando…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(guardarLocal, 500);
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(() => cloudPush(actual), 1200);
  }

  // guarda en el móvil (IndexedDB) — esto SIEMPRE funciona, con o sin internet
  function guardarLocal() {
    if (!actual) return Promise.resolve();
    actual.updatedAt = Date.now();
    return dbPut(actual).catch((e) => { console.error(e); toast('No se pudo guardar'); });
  }
  // compat: algunos sitios llaman guardar()
  function guardar() { marcarSucio(); return guardarLocal(); }

  // sube a la nube (si hay sesión y conexión); si no, queda pendiente
  async function cloudPush(v) {
    if (!v || !usaCloud()) return;
    if (!navigator.onLine) { setSyncState('pend'); return; }
    const user = await Cloud.getUser();
    if (!user) { setSyncState('pend'); return; }
    if (actual && actual.id === v.id) setSyncState('run');
    try {
      await Cloud.push(v);              // sube fotos pendientes y hace upsert
      v._dirty = false;
      await dbPut(v);                   // persiste las rutas de fotos ya subidas
      if (actual && actual.id === v.id) setSyncState('ok');
    } catch (e) {
      console.warn('cloudPush:', e && e.message);
      if (actual && actual.id === v.id) setSyncState('pend');
    }
  }

  // empuja todas las visitas locales con cambios sin sincronizar
  async function syncPending() {
    if (!usaCloud() || !navigator.onLine) return;
    const user = await Cloud.getUser();
    if (!user) return;
    const todas = await dbGetAll();
    for (const v of todas) {
      if (v._dirty) { try { await Cloud.push(v); v._dirty = false; await dbPut(v); } catch (e) {} }
    }
  }

  // trae las visitas de la nube y las mezcla con las locales (la más nueva gana)
  async function reconcile() {
    if (!usaCloud() || !navigator.onLine) return;
    let cloud;
    try { cloud = await Cloud.pullAll(); } catch (e) { console.warn('pull:', e && e.message); return; }
    const local = await dbGetAll();
    const lmap = {}; local.forEach((v) => (lmap[v.id] = v));
    const cmap = {}; cloud.forEach((v) => (cmap[v.id] = v));
    const ids = new Set([].concat(Object.keys(lmap), Object.keys(cmap)));
    for (const id of ids) {
      const lv = lmap[id], cv = cmap[id];
      if (cv && !lv) { await dbPut(cv); }                              // nueva en la nube
      else if (lv && !cv) { try { await Cloud.push(lv); lv._dirty = false; await dbPut(lv); } catch (e) {} } // solo local
      else {                                                          // existe en ambas
        if (lv._dirty || lv.updatedAt > cv.updatedAt + 1500) {
          try { await Cloud.push(lv); lv._dirty = false; await dbPut(lv); } catch (e) {}
        } else if (cv.updatedAt > lv.updatedAt) {
          cv.fotos = mergeFotos(lv, cv);
          await dbPut(cv);
        }
      }
    }
  }
  // conserva las dataURL locales (visibles offline) cuando la nube trae solo rutas
  function mergeFotos(lv, cv) {
    const byPath = {};
    Object.values(lv.fotos || {}).forEach((arr) =>
      (arr || []).forEach((p) => { const o = Cloud.normPhoto(p); if (o.path && o.dataUrl) byPath[o.path] = o.dataUrl; }));
    const out = {};
    Object.keys(cv.fotos || {}).forEach((it) => {
      out[it] = (cv.fotos[it] || []).map((p) => {
        const o = Cloud.normPhoto(p);
        const obj = { path: o.path };
        if (byPath[o.path]) obj.dataUrl = byPath[o.path];
        return obj;
      });
    });
    return out;
  }

  /* ---------- 6. NAVEGACIÓN ENTRE VISTAS ---------- */
  function mostrarVista(nombre) {
    $$('.view').forEach((v) => v.classList.remove('active'));
    $('#view-' + nombre).classList.add('active');
    window.scrollTo(0, 0);
    renderTopActions(nombre);
  }
  function renderTopActions(vista) {
    const box = $('#topActions');
    if (vista === 'edit') {
      box.innerHTML = '<span class="saved-dot sync-ok" id="savedDot"><i></i><span>Guardado</span></span>';
      setSyncState(actual && actual._dirty ? 'pend' : 'ok');
    } else if (usaCloud() && currentUserEmail) {
      let html = '<span class="acct"><span class="who">' + esc(currentUserEmail) + '</span>';
      if (vista === 'list') {
        html += '<button class="btn-cliente" onclick="window.open(\'../admin/clientes.html\', \'_blank\')">👥 Agregar cliente</button>';
      }
      html += '<button class="out" id="btnSignOut">Salir</button></span>';
      box.innerHTML = html;
      const so = $('#btnSignOut');
      if (so) so.addEventListener('click', doSignOut);
    } else {
      box.innerHTML = '';
    }
  }

  /* ---------- 7. LISTA DE VISITAS ---------- */
  function renderLista() {
    return dbGetAll().then((arr) => {
      arr.sort((a, b) => b.updatedAt - a.updatedAt);
      const ul = $('#visitasList');
      if (!arr.length) {
        ul.innerHTML =
          '<li class="empty">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>' +
          '<b>Aún no hay visitas</b><span>Pulsa «Nueva visita» para empezar tu primer checklist.</span></li>';
        return;
      }
      ul.innerHTML = arr.map((v) => {
        const n = contarCompletados(v);
        const pct = Math.round((n / TOTAL_ITEMS) * 100);
        const titulo = (v.campos && v.campos.direccion && v.campos.direccion.trim())
          || (v.cliente && v.cliente.trim()) || 'Visita sin dirección';
        const sub = [v.cliente, v.agencia].filter((x) => x && x.trim()).join(' · ') || 'Sin datos de cliente';
        const pend = (usaCloud() && v._dirty) ? '<span class="vcloud">Sin subir</span>' : '';
        return (
          '<li><button class="vcard" data-id="' + v.id + '">' +
          '<div class="vmain"><b>' + esc(titulo) + '</b><div class="vsub">' + esc(sub) + '</div></div>' +
          '<div class="vmeta"><span class="vdate">' + esc(fmtFecha(v.fecha)) + '</span>' +
          '<span class="vprog">' + pct + '%</span>' + pend + '</div>' +
          '<svg class="vchev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>' +
          '</button></li>'
        );
      }).join('');
      $$('.vcard', ul).forEach((b) =>
        b.addEventListener('click', () => abrirVisita(b.dataset.id))
      );
    });
  }

  /* ---------- 8. ABRIR / EDITAR VISITA ---------- */
  function abrirVisita(id) {
    dbGet(id).then((v) => {
      if (!v) { toast('Visita no encontrada'); return; }
      actual = v;
      renderEditor();
      mostrarVista('edit');
    });
  }
  function crearVisita() {
    actual = nuevaVisita();
    dbPut(actual).then(() => { renderEditor(); mostrarVista('edit'); cloudPush(actual); });
  }

  function renderEditor() {
    const v = actual;
    const form = $('#editForm');

    // cabecera meta (cliente / agencia / agente / fecha)
    let html = '<div class="meta-grid">' +
      metaField('cliente', 'Cliente', v.cliente, 'text') +
      metaField('agencia', 'Agencia / Vendedor', v.agencia, 'text') +
      metaField('agente', 'Agente', v.agente, 'text') +
      metaField('fecha', 'Fecha', v.fecha, 'date') +
      '</div>';

    // secciones
    CHECKLIST.forEach((s) => {
      const total = s.items ? s.items.length : 0;
      let hechos = 0;
      if (s.tipo === 'campos') s.items.forEach((it) => { if ((v.campos[it.id] || '').trim()) hechos++; });
      if (s.tipo === 'checks') s.items.forEach((it) => { if (v.checks[it.id]) hechos++; });
      if (s.tipo === 'fotos') s.items.forEach((it) => { if (v.checks[it.id] || (v.fotos[it.id] || []).length) hechos++; });

      const counter = total ? '<span class="seccount">' + hechos + '/' + total + '</span>' : '';
      html += '<div class="cl-section' + (s.tipo === 'notas' ? ' no-card' : '') + '" data-sec="' + s.id + '">';
      html += '<h2><span class="num">' + s.num + '</span>' + esc(s.titulo) + counter + '</h2>';

      if (s.tipo === 'notas') {
        html += '<div class="cl-body" style="background:none;border:none;padding:0;margin-top:10px;">' +
          '<div class="fld"><textarea data-notas placeholder="Apunta aquí cualquier observación de la visita…">' + esc(v.notas) + '</textarea></div></div>';
        html += '</div>';
        return;
      }

      html += '<div class="cl-body">';
      if (s.tip) {
        html += '<div class="tip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg><div><b>Al grabar:</b> ' + esc(s.tip) + '</div></div>';
      }
      s.items.forEach((it) => {
        html += renderItem(s, it, v);
      });
      html += '</div></div>';
    });

    form.innerHTML = html;
    bindEditor();
    actualizarProgreso();
    resolveCloudPhotos(form);
  }

  // carga las miniaturas que solo tienen ruta en la nube (otras devices)
  function resolveCloudPhotos(scope) {
    if (!usaCloud()) return;
    $$('img[data-path]', scope).forEach((img) => {
      if (img.getAttribute('src')) return;
      const path = img.dataset.path;
      Cloud.signedUrl(path).then((url) => {
        if (url) { img.src = url; const t = img.closest('.thumb'); if (t) t.classList.remove('loading'); }
      });
    });
  }

  function metaField(key, label, val, type) {
    return '<div class="fld"><label>' + esc(label) + '</label>' +
      '<input type="' + type + '" data-meta="' + key + '" value="' + esc(val) + '"></div>';
  }

  function renderItem(s, it, v) {
    const checkOn = v.checks[it.id] ? ' on' : '';
    const doneCls = v.checks[it.id] ? ' done' : '';
    const hint = it.hint ? '<span class="hint">' + esc(it.hint) + '</span>' : '';

    let inner = '<div class="item' + doneCls + '" data-item="' + it.id + '">';
    inner += '<button class="chk' + checkOn + '" data-check="' + it.id + '" aria-label="Marcar">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg></button>';
    inner += '<div class="itx"><div class="lbl">' + esc(it.label) + '</div>' + hint;

    if (s.tipo === 'campos') {
      inner += '<input class="val" type="text" data-campo="' + it.id + '" value="' + esc(v.campos[it.id] || '') +
        '" placeholder="Anota el dato…">';
    }
    if (s.tipo === 'fotos') {
      inner += renderPhotos(it.id, v.fotos[it.id] || []);
    }
    inner += '</div></div>';
    return inner;
  }

  function renderPhotos(itemId, list) {
    let h = '<div class="photos" data-photos="' + itemId + '">';
    list.forEach((p, i) => {
      const o = Cloud.normPhoto(p);
      const rm = '<button class="rm" data-rmphoto="' + itemId + '" data-idx="' + i + '" aria-label="Quitar foto">&times;</button>';
      if (o.dataUrl) {
        h += '<div class="thumb"><img src="' + o.dataUrl + '" alt="">' + rm + '</div>';
      } else if (o.path) {
        // foto que vive en la nube: se carga con URL firmada al renderizar
        h += '<div class="thumb loading"><img data-path="' + esc(o.path) + '" alt="">' + rm + '</div>';
      }
    });
    h += '<label class="photo-add">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/><circle cx="12" cy="12.5" r="3"/></svg>' +
      'Foto<input type="file" accept="image/*" capture="environment" multiple data-addphoto="' + itemId + '"></label>';
    h += '</div>';
    return h;
  }

  /* ---------- 9. EVENTOS DEL EDITOR ---------- */
  function bindEditor() {
    const form = $('#editForm');

    // meta
    $$('[data-meta]', form).forEach((inp) => {
      inp.addEventListener('input', () => {
        actual[inp.dataset.meta] = inp.value;
        marcarSucio();
      });
    });
    // campos de texto
    $$('[data-campo]', form).forEach((inp) => {
      inp.addEventListener('input', () => {
        actual.campos[inp.dataset.campo] = inp.value;
        // marca/desmarca el check del item según haya valor
        const item = inp.closest('.item');
        const id = inp.dataset.campo;
        const has = inp.value.trim().length > 0;
        actual.checks[id] = has;
        const chk = $('.chk', item);
        chk.classList.toggle('on', has);
        item.classList.toggle('done', has);
        actualizarProgreso(); marcarSucio();
      });
    });
    // checks
    $$('[data-check]', form).forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.check;
        const on = !actual.checks[id];
        actual.checks[id] = on;
        btn.classList.toggle('on', on);
        btn.closest('.item').classList.toggle('done', on);
        actualizarProgreso(); marcarSucio();
      });
    });
    // notas
    const ta = $('[data-notas]', form);
    if (ta) ta.addEventListener('input', () => { actual.notas = ta.value; marcarSucio(); });

    // añadir fotos
    $$('[data-addphoto]', form).forEach((inp) => {
      inp.addEventListener('change', (e) => onAddPhotos(inp.dataset.addphoto, e.target.files));
    });
    // quitar fotos (delegado)
    form.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-rmphoto]');
      if (rm) {
        const id = rm.dataset.rmphoto, idx = +rm.dataset.idx;
        const quitada = Cloud.normPhoto(actual.fotos[id][idx]);
        actual.fotos[id].splice(idx, 1);
        if (!actual.fotos[id].length) delete actual.fotos[id];
        // borrado best-effort del archivo en la nube (si ya estaba subido)
        if (quitada.path && usaCloud() && navigator.onLine) {
          try { Cloud.client().storage.from(window.SUPABASE_CONFIG.bucket).remove([quitada.path]); } catch (_) {}
        }
        refrescarFotos(id);
        actualizarProgreso(); marcarSucio();
      }
    });
  }

  function refrescarFotos(itemId) {
    const cont = $('[data-photos="' + itemId + '"]');
    if (!cont) return;
    const nuevo = document.createElement('div');
    nuevo.innerHTML = renderPhotos(itemId, actual.fotos[itemId] || []);
    const fresh = nuevo.firstChild;
    cont.replaceWith(fresh);
    // re-vincular el input file del bloque recreado
    const inp = $('[data-addphoto="' + itemId + '"]', fresh);
    if (inp) inp.addEventListener('change', (e) => onAddPhotos(itemId, e.target.files));
    resolveCloudPhotos(fresh);
  }

  /* ---------- 10. FOTOS: comprimir + guardar ---------- */
  function onAddPhotos(itemId, files) {
    if (!files || !files.length) return;
    const arr = Array.from(files);
    toast('Procesando ' + arr.length + (arr.length > 1 ? ' fotos…' : ' foto…'));
    Promise.all(arr.map(comprimir)).then((dataUrls) => {
      const nuevas = dataUrls.filter(Boolean).map((d) => ({ dataUrl: d, pending: true }));
      actual.fotos[itemId] = (actual.fotos[itemId] || []).concat(nuevas);
      refrescarFotos(itemId);
      actualizarProgreso();
      marcarSucio();   // guarda local y programa subida a la nube
      toast(usaCloud() ? 'Foto guardada (subiendo…)' : 'Foto guardada');
    }).catch((e) => { console.error(e); toast('No se pudo añadir la foto'); });
  }

  function comprimir(file) {
    return new Promise((resolve) => {
      if (!file.type || file.type.indexOf('image') !== 0) return resolve(null);
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1280;
        let { width: w, height: h } = img;
        if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        else if (h >= w && h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(cv.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  /* ---------- 11. PROGRESO ---------- */
  function actualizarProgreso() {
    const n = contarCompletados(actual);
    const pct = Math.round((n / TOTAL_ITEMS) * 100);
    $('#progBar').style.width = pct + '%';
    $('#progPct').textContent = pct + '%';
    $('#progLabel').textContent = n + ' de ' + TOTAL_ITEMS + ' puntos';
    // actualizar contadores de cada sección
    CHECKLIST.forEach((s) => {
      if (s.tipo === 'notas') return;
      const sec = $('.cl-section[data-sec="' + s.id + '"] .seccount');
      if (!sec) return;
      let hechos = 0;
      s.items.forEach((it) => {
        const has = s.tipo === 'campos'
          ? (actual.campos[it.id] || '').trim().length > 0
          : (actual.checks[it.id] || (actual.fotos[it.id] || []).length > 0);
        if (has) hechos++;
      });
      sec.textContent = hechos + '/' + s.items.length;
    });
  }

  /* ---------- 12. GENERAR PDF (imprimir documento A4) ---------- */
  function construirPrint() {
    const v = actual;
    const root = $('#print-root');
    let h = '<div class="ph-header"><div class="ph-eyebrow">Personal Shopper Inmobiliario</div>' +
      '<h1>Checklist de visita a una vivienda</h1></div>';

    h += '<div class="ph-meta">' +
      printMeta('Cliente', v.cliente) +
      printMeta('Agencia / Vendedor', v.agencia) +
      printMeta('Agente', v.agente) +
      printMeta('Fecha', fmtFecha(v.fecha)) +
      '</div>';

    CHECKLIST.forEach((s) => {
      h += '<div class="ph-sec"><h2>' + s.num + '. ' + esc(s.titulo) + '</h2>';
      if (s.tipo === 'notas') {
        h += '<div class="ph-notes">' + esc(v.notas || '') + '</div>';
      } else {
        h += '<ol>';
        s.items.forEach((it) => {
          const val = (v.campos[it.id] || '').trim();
          const checked = v.checks[it.id] || (v.fotos[it.id] || []).length > 0;
          let li = '<li class="' + (checked ? 'checked' : '') + '"><b>' + esc(it.label) + '</b>';
          if (val) li += ' — <span class="v">' + esc(val) + '</span>';
          else if (it.hint) li += ' <span class="hint">' + esc(it.hint) + '</span>';
          li += '</li>';
          h += li;
        });
        h += '</ol>';
        // fotos de la sección
        if (s.tipo === 'fotos') {
          const all = [];
          s.items.forEach((it) => (v.fotos[it.id] || []).forEach((p) => {
            const o = Cloud.normPhoto(p);
            const src = o.dataUrl || o._url;   // _url lo rellena ensurePhotoSrcs()
            if (src) all.push(src);
          }));
          if (all.length) {
            h += '<div class="ph-photos">' + all.map((src) => '<img src="' + src + '">').join('') + '</div>';
          }
        }
      }
      h += '</div>';
    });
    root.innerHTML = h;
  }
  function printMeta(label, val) {
    return '<div class="m"><div class="l">' + esc(label) + '</div><div class="v">' + esc(val || '') + '</div></div>';
  }
  // resuelve URLs firmadas de las fotos que solo viven en la nube (para el PDF)
  async function ensurePhotoSrcs() {
    if (!usaCloud()) return;
    const jobs = [];
    Object.values(actual.fotos || {}).forEach((arr) =>
      (arr || []).forEach((p) => {
        const o = Cloud.normPhoto(p);
        if (!o.dataUrl && o.path && !o._url) {
          jobs.push(Cloud.signedUrl(o.path).then((u) => { if (u && typeof p === 'object') p._url = u; }));
        }
      }));
    await Promise.all(jobs);
  }
  async function generarPDF() {
    guardarLocal();
    await ensurePhotoSrcs();
    construirPrint();
    setTimeout(() => window.print(), 60);
  }

  /* ---------- 13. COMPARTIR (texto resumen) ---------- */
  function compartir() {
    const v = actual;
    const titulo = (v.campos.direccion || v.cliente || 'Visita').trim();
    let txt = 'Checklist de visita — ' + titulo + '\n';
    if (v.fecha) txt += 'Fecha: ' + fmtFecha(v.fecha) + '\n';
    if (v.cliente) txt += 'Cliente: ' + v.cliente + '\n';
    txt += '\n';
    CHECKLIST.forEach((s) => {
      if (s.tipo === 'notas') {
        if (v.notas && v.notas.trim()) txt += s.num + '. ' + s.titulo + '\n' + v.notas.trim() + '\n\n';
        return;
      }
      const lineas = [];
      s.items.forEach((it) => {
        const val = (v.campos[it.id] || '').trim();
        const ok = v.checks[it.id] || (v.fotos[it.id] || []).length > 0;
        if (val) lineas.push('  • ' + it.label + ': ' + val);
        else if (ok) lineas.push('  ✓ ' + it.label);
      });
      if (lineas.length) txt += s.num + '. ' + s.titulo + '\n' + lineas.join('\n') + '\n\n';
    });

    if (navigator.share) {
      navigator.share({ title: 'Checklist de visita — ' + titulo, text: txt })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(txt).then(() => toast('Resumen copiado al portapapeles'))
        .catch(() => toast('No se pudo compartir'));
    } else {
      toast('Compartir no disponible en este navegador');
    }
  }

  /* ---------- 14. MODAL ELIMINAR ---------- */
  function pedirEliminar() {
    const m = $('#modal');
    $('#modalTitle').textContent = 'Eliminar visita';
    $('#modalText').textContent = 'Se borrará esta visita y sus fotos de este móvil. Esta acción no se puede deshacer.';
    m.classList.add('show');
    const ok = $('#modalOk'), cancel = $('#modalCancel');
    const cerrar = () => { m.classList.remove('show'); ok.onclick = null; cancel.onclick = null; };
    cancel.onclick = cerrar;
    ok.onclick = () => {
      const v = actual;
      if (usaCloud() && navigator.onLine) { Cloud.remove(v).catch((e) => console.warn('remove:', e && e.message)); }
      dbDelete(v.id).then(() => {
        cerrar(); actual = null;
        renderLista().then(() => mostrarVista('list'));
        toast('Visita eliminada');
      });
    };
  }

  function volverALista() {
    if (actual) { guardarLocal(); cloudPush(actual); }
    renderLista().then(() => mostrarVista('list'));
  }

  /* ---------- 14b. LOGIN / SESIÓN ---------- */
  function showLogin() {
    $('#authOverlay').hidden = false;
    $('#authOffline').hidden = navigator.onLine;
    const em = $('#authEmail'); if (em) em.focus();
  }
  function hideLogin() { $('#authOverlay').hidden = true; }

  function authError(msg) {
    const el = $('#authErr'); el.textContent = msg; el.hidden = false;
  }
  async function onAuthSubmit(e) {
    e.preventDefault();
    $('#authErr').hidden = true;
    if (!navigator.onLine) { $('#authOffline').hidden = false; return; }
    const email = $('#authEmail').value.trim();
    const pass = $('#authPass').value;
    const btn = $('#authBtn'); btn.disabled = true; btn.textContent = 'Entrando…';
    try {
      const { data, error } = await Cloud.signIn(email, pass);
      if (error) { authError(traducirAuth(error.message)); return; }
      currentUserEmail = (data && data.user && data.user.email) || email;
      $('#authPass').value = '';
      hideLogin();
      await startApp();
    } catch (err) {
      authError('No se pudo conectar. Revisa tu internet.');
    } finally {
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  }
  function traducirAuth(m) {
    if (/invalid login credentials/i.test(m)) return 'Email o contraseña incorrectos.';
    if (/email not confirmed/i.test(m)) return 'Tu email aún no está confirmado.';
    return m || 'No se pudo iniciar sesión.';
  }
  async function doSignOut() {
    try { await Cloud.signOut(); } catch (e) {}
    currentUserEmail = '';
    actual = null;
    showLogin();
  }

  // arranca la app ya con sesión: pinta la lista y sincroniza en segundo plano
  async function startApp() {
    renderTopActions('list');
    await renderLista();
    mostrarVista('list');
    if (usaCloud() && navigator.onLine) {
      await reconcile();
      await syncPending();
      await renderLista();
    }
  }

  function onOnline() {
    if (!usaCloud()) return;
    reconcile().then(syncPending).then(() => {
      if ($('#view-list').classList.contains('active')) renderLista();
      if (actual && actual._dirty) cloudPush(actual);
    });
  }

  /* ---------- 15. ARRANQUE ---------- */
  async function init() {
    $('#btnNueva').addEventListener('click', crearVisita);
    $('#btnBack').addEventListener('click', volverALista);
    $('#homeLink').addEventListener('click', (e) => { e.preventDefault(); volverALista(); });
    $('#btnPDF').addEventListener('click', generarPDF);
    $('#btnCompartir').addEventListener('click', compartir);
    $('#btnEliminar').addEventListener('click', pedirEliminar);
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') e.currentTarget.classList.remove('show'); });
    $('#authForm').addEventListener('submit', onAuthSubmit);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', () => { if (actual) setSyncState('pend'); });

    // registrar service worker (offline / instalable)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW:', e));
    }

    if (!usaCloud()) {            // sin configuración de nube → modo solo local
      renderLista().then(() => mostrarVista('list'));
      return;
    }

    Cloud.init();
    const session = await Cloud.getSession();
    if (session) {
      currentUserEmail = (session.user && session.user.email) || '';
      await startApp();
    } else {
      // sin sesión: mostramos la lista local detrás y pedimos login
      await renderLista();
      mostrarVista('list');
      showLogin();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
