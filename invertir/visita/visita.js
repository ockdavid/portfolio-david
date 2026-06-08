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
      fotos: {},    // { itemId: [dataURL, ...] }
      notas: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
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

  /* ---------- 5. GUARDADO AUTOMÁTICO ---------- */
  function marcarSucio() {
    const dot = $('#savedDot');
    if (dot) dot.classList.add('dirty');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(guardar, 600);
  }
  function guardar() {
    if (!actual) return;
    actual.updatedAt = Date.now();
    return dbPut(actual).then(() => {
      const dot = $('#savedDot');
      if (dot) { dot.classList.remove('dirty'); dot.querySelector('span').textContent = 'Guardado'; }
    }).catch((e) => { console.error(e); toast('No se pudo guardar'); });
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
      box.innerHTML = '<span class="saved-dot" id="savedDot"><i></i><span>Guardado</span></span>';
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
        return (
          '<li><button class="vcard" data-id="' + v.id + '">' +
          '<div class="vmain"><b>' + esc(titulo) + '</b><div class="vsub">' + esc(sub) + '</div></div>' +
          '<div class="vmeta"><span class="vdate">' + esc(fmtFecha(v.fecha)) + '</span>' +
          '<span class="vprog">' + pct + '%</span></div>' +
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
    dbPut(actual).then(() => { renderEditor(); mostrarVista('edit'); });
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
    list.forEach((src, i) => {
      h += '<div class="thumb"><img src="' + src + '" alt="">' +
        '<button class="rm" data-rmphoto="' + itemId + '" data-idx="' + i + '" aria-label="Quitar foto">&times;</button></div>';
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
        actual.fotos[id].splice(idx, 1);
        if (!actual.fotos[id].length) delete actual.fotos[id];
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
  }

  /* ---------- 10. FOTOS: comprimir + guardar ---------- */
  function onAddPhotos(itemId, files) {
    if (!files || !files.length) return;
    const arr = Array.from(files);
    toast('Procesando ' + arr.length + (arr.length > 1 ? ' fotos…' : ' foto…'));
    Promise.all(arr.map(comprimir)).then((dataUrls) => {
      actual.fotos[itemId] = (actual.fotos[itemId] || []).concat(dataUrls.filter(Boolean));
      refrescarFotos(itemId);
      actualizarProgreso();
      guardar();
      toast('Foto guardada');
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
          s.items.forEach((it) => (v.fotos[it.id] || []).forEach((src) => all.push(src)));
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
  function generarPDF() {
    guardar();
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
      const id = actual.id;
      dbDelete(id).then(() => {
        cerrar(); actual = null;
        renderLista().then(() => mostrarVista('list'));
        toast('Visita eliminada');
      });
    };
  }

  /* ---------- 15. ARRANQUE ---------- */
  function init() {
    $('#btnNueva').addEventListener('click', crearVisita);
    $('#btnBack').addEventListener('click', () => {
      guardar();
      renderLista().then(() => mostrarVista('list'));
    });
    $('#homeLink').addEventListener('click', (e) => {
      e.preventDefault();
      if (actual) guardar();
      renderLista().then(() => mostrarVista('list'));
    });
    $('#btnPDF').addEventListener('click', generarPDF);
    $('#btnCompartir').addEventListener('click', compartir);
    $('#btnEliminar').addEventListener('click', pedirEliminar);
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') e.currentTarget.classList.remove('show'); });

    renderLista();

    // registrar service worker (offline / instalable)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW:', e));
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
