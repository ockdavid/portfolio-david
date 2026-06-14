/* ============================================
   Portal de Cliente — Gestión de sesión
   ============================================ */

let sb = null;
let clienteActual = null;
let propiedadActual = null;
let imagenesActuales = [];
let indexImagenActual = 0;
let propiedadesOriginal = [];
let propiedadesFiltradas = [];

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
  const config = window.SUPABASE_CONFIG;
  if (!config) {
    console.error('Falta SUPABASE_CONFIG');
    return;
  }

  sb = supabase.createClient(config.url, config.key);

  // Determinar en qué página estamos
  if (document.getElementById('formLogin')) {
    // Página de login
    document.getElementById('formLogin').addEventListener('submit', handleLogin);
  } else if (document.getElementById('listadoOportunidades')) {
    // Portal
    const cliente = obtenerClienteDeSession();
    if (!cliente) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 300);
      return;
    }
    clienteActual = cliente;
    document.getElementById('clienteNombre').textContent = `${cliente.nombre}`;
    await cargarOportunidades();
  } else {
    // No hay cliente en sesión, redirigir a login
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
  }
});

// ===== LOGIN =====
async function handleLogin(e) {
  e.preventDefault();
  const telefono = document.getElementById('telefono').value.trim();
  const errorMsg = document.getElementById('errorMsg');

  try {
    const { data, error } = await sb
      .from('clientes')
      .select('*')
      .eq('telefono', telefono)
      .single();

    if (error || !data) {
      errorMsg.textContent = '❌ Número de teléfono no registrado';
      errorMsg.style.display = 'block';
      return;
    }

    // Guardar en sessionStorage
    sessionStorage.setItem('cliente', JSON.stringify(data));

    // Esperar un momento y redirigir
    setTimeout(() => {
      window.location.href = 'portal.html';
    }, 500);
  } catch (err) {
    errorMsg.textContent = `❌ Error: ${err.message}`;
    errorMsg.style.display = 'block';
  }
}

// ===== PORTAL =====
async function cargarOportunidades() {
  const listado = document.getElementById('listadoOportunidades');
  listado.innerHTML = '<div class="loading">Cargando tus propiedades...</div>';

  try {
    // Obtener asignaciones del cliente
    const { data: asignaciones, error: errAsignaciones } = await sb
      .from('asignaciones')
      .select('propiedad_id')
      .eq('cliente_id', clienteActual.id);

    if (errAsignaciones) throw errAsignaciones;

    if (!asignaciones || asignaciones.length === 0) {
      listado.innerHTML =
        '<div class="vacio">📭 Aún no tienes propiedades asignadas. David te contactará pronto con oportunidades especiales.</div>';
      return;
    }

    const propiedadIds = asignaciones.map((a) => a.propiedad_id);

    // Obtener propiedades
    const { data: propiedades, error: errPropiedades } = await sb
      .from('propiedades')
      .select('*')
      .in('id', propiedadIds)
      .order('fecha_creacion', { ascending: false });

    if (errPropiedades) throw errPropiedades;

    propiedadesOriginal = propiedades;
    propiedadesFiltradas = propiedades;

    // Llenar selector de ubicación
    const ubicaciones = [...new Set(propiedades.map((p) => p.distrito || p.municipio).filter(Boolean))];
    const selectUbicacion = document.getElementById('filtroUbicacion');
    ubicaciones.forEach((ubicacion) => {
      const option = document.createElement('option');
      option.value = ubicacion;
      option.textContent = ubicacion;
      selectUbicacion.appendChild(option);
    });

    mostrarPropiedades(propiedadesFiltradas);
  } catch (err) {
    console.error('Error:', err);
    listado.innerHTML = `<div class="vacio">❌ Error: ${err.message}</div>`;
  }
}

function mostrarPropiedades(propiedades) {
  const listado = document.getElementById('listadoOportunidades');
  const textoSubtitulo = document.getElementById('textoSubtitulo');

  if (propiedades.length === 0) {
    listado.innerHTML = '<div class="vacio">🔍 No hay propiedades que coincidan con tus filtros</div>';
    textoSubtitulo.textContent = 'Intenta cambiar los criterios de búsqueda';
    return;
  }

  textoSubtitulo.textContent = `${propiedades.length} propiedad${propiedades.length !== 1 ? 'es' : ''} encontrada${propiedades.length !== 1 ? 's' : ''}`;
  listado.innerHTML = '';
  propiedades.forEach((prop) => {
    const card = crearTarjetaOportunidad(prop);
    listado.appendChild(card);
  });
}

function crearTarjetaOportunidad(prop) {
  const card = document.createElement('div');
  card.className = 'oportunidad-card';

  const specs = [];
  if (prop.habitaciones) specs.push(`${prop.habitaciones} hab`);
  if (prop.banos) specs.push(`${prop.banos} baños`);
  if (prop.metros_cuadrados) specs.push(`${prop.metros_cuadrados} m²`);

  const precio = prop.precio_compra ? `€ ${prop.precio_compra.toLocaleString()}` : '';
  const alquiler = prop.precio_alquiler ? `${prop.precio_alquiler}€/mes` : '';

  const isFavorite = esFavorita(prop.id);

  card.innerHTML = `
    <div class="oportunidad-imagen" onclick="abrirPropiedad(${JSON.stringify(prop)})">
      ${
        prop.foto_principal
          ? `<img src="${prop.foto_principal}" alt="${prop.titulo}" onerror="this.style.display='none'">`
          : '🏠'
      }
    </div>
    <div class="oportunidad-info">
      <div class="oportunidad-header">
        <h3 class="oportunidad-titulo" onclick="abrirPropiedad(${JSON.stringify(prop)}); return false;">${prop.titulo}</h3>
        <button class="btn-favorito ${isFavorite ? 'favorito' : ''}" onclick="toggleFavorito('${prop.id}', '${prop.titulo}'); event.stopPropagation();">
          ${isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
      <p class="oportunidad-direccion">${prop.direccion}</p>
      <div class="oportunidad-specs">
        ${specs.map((s) => `<span class="spec">📍 ${s}</span>`).join('')}
      </div>
      <p class="oportunidad-precio">
        ${precio} ${alquiler ? `• ${alquiler}` : ''}
      </p>
      <div class="oportunidad-botones">
        <button class="btn-detalle" onclick="abrirPropiedad(${JSON.stringify(prop)}); event.stopPropagation();">Ver detalles</button>
        <a href="https://wa.me/34695128762?text=Hola%20David%2C%20me%20interesa%20la%20propiedad%3A%20${encodeURIComponent(prop.titulo)}%20en%20${encodeURIComponent(prop.direccion)}" target="_blank" class="btn-whatsapp" onclick="event.stopPropagation();">
          💬 WhatsApp
        </a>
      </div>
    </div>
  `;

  return card;
}

// ===== MODAL =====
async function abrirPropiedad(prop) {
  propiedadActual = prop;
  indexImagenActual = 0;

  // Actualizar header
  document.getElementById('modalTitulo').textContent = prop.titulo;
  document.getElementById('modalDireccion').textContent = prop.direccion;

  // Cargar documentos
  try {
    const { data: documentos } = await sb
      .from('documentos')
      .select('*')
      .eq('propiedad_id', prop.id);

    const propiedadConDocs = { ...prop, documentos: documentos || [] };
    llenarTabs(propiedadConDocs);
  } catch (err) {
    console.error('Error cargando documentos:', err);
    llenarTabs(prop);
  }

  // Mostrar modal
  document.getElementById('modalPropiedad').style.display = 'flex';
  cambiarTab('fotos');
}

function llenarTabs(prop) {
  // FOTOS
  const galeriaFotos = document.querySelector('.galeria-fotos');
  galeriaFotos.innerHTML = '';

  if (prop.foto_principal) {
    const fotoItem = document.createElement('div');
    fotoItem.className = 'foto-item';
    fotoItem.innerHTML = `<img src="${prop.foto_principal}" alt="Foto principal" onerror="this.style.display='none'">`;
    fotoItem.onclick = () => abrirVisor([prop.foto_principal]);
    galeriaFotos.appendChild(fotoItem);
  }

  if (prop.fotos_urls && prop.fotos_urls.length > 0) {
    const fotos = prop.fotos_urls.filter((f) => f);
    fotos.forEach((foto) => {
      const fotoItem = document.createElement('div');
      fotoItem.className = 'foto-item';
      fotoItem.innerHTML = `<img src="${foto}" alt="Foto" onerror="this.style.display='none'">`;
      fotoItem.onclick = () => abrirVisor(fotos, fotos.indexOf(foto));
      galeriaFotos.appendChild(fotoItem);
    });
  }

  if (galeriaFotos.children.length === 0) {
    galeriaFotos.innerHTML = '<div class="vacio">📸 Sin fotos aún</div>';
  }

  // VIDEOS
  const galeriaVideos = document.querySelector('.galeria-videos');
  galeriaVideos.innerHTML = '';

  if (prop.videos_urls && prop.videos_urls.length > 0) {
    const videos = prop.videos_urls.filter((v) => v);
    videos.forEach((videoUrl) => {
      const videoItem = document.createElement('div');
      videoItem.className = 'video-item';

      // Detectar tipo de video (YouTube, Vimeo, archivo)
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = extraerYouTubeId(videoUrl);
        videoItem.innerHTML = `
          <div class="video-container">
            <iframe src="https://www.youtube.com/embed/${videoId}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        `;
      } else if (videoUrl.includes('vimeo.com')) {
        const videoId = extraerVimeoId(videoUrl);
        videoItem.innerHTML = `
          <div class="video-container">
            <iframe src="https://player.vimeo.com/video/${videoId}" allow="autoplay; fullscreen" allowfullscreen></iframe>
          </div>
        `;
      } else {
        // Archivo de video
        videoItem.innerHTML = `
          <video style="width:100%; aspect-ratio:16/9; background:#000;" controls>
            <source src="${videoUrl}" type="video/mp4">
            Tu navegador no soporta videos HTML5
          </video>
        `;
      }

      galeriaVideos.appendChild(videoItem);
    });
  }

  if (galeriaVideos.children.length === 0) {
    galeriaVideos.innerHTML = '<div class="vacio">🎥 Sin videos aún</div>';
  }

  // DOCUMENTOS
  const listaDocumentos = document.querySelector('.lista-documentos');
  listaDocumentos.innerHTML = '';

  if (prop.documentos && prop.documentos.length > 0) {
    prop.documentos.forEach((doc) => {
      const docItem = document.createElement('div');
      docItem.className = 'documento-item';

      const iconos = {
        oferta: '📄',
        rentabilidad: '📊',
        informe: '📋',
        otro: '📎',
      };

      docItem.innerHTML = `
        <div class="documento-info">
          <span class="documento-icon">${iconos[doc.tipo] || '📎'}</span>
          <div>
            <div class="documento-nombre">${doc.nombre}</div>
            <div style="font-size:12px; color:var(--muted);">${doc.tipo}</div>
          </div>
        </div>
        <a href="${doc.url}" target="_blank" download class="documento-link">
          Descargar
        </a>
      `;

      listaDocumentos.appendChild(docItem);
    });
  } else {
    listaDocumentos.innerHTML = '<div class="vacio">📄 Sin documentos aún</div>';
  }

  // DETALLES
  const detallesGrid = document.querySelector('.detalles-grid');
  detallesGrid.innerHTML = `
    <div class="detalle-item">
      <div class="detalle-label">Ubicación</div>
      <div class="detalle-valor">${prop.direccion}</div>
    </div>
    <div class="detalle-item">
      <div class="detalle-label">Distrito/Municipio</div>
      <div class="detalle-valor">${prop.distrito || ''} ${prop.municipio || ''}</div>
    </div>
    <div class="detalle-item">
      <div class="detalle-label">Precio de compra</div>
      <div class="detalle-valor">${prop.precio_compra ? `€ ${prop.precio_compra.toLocaleString()}` : '-'}</div>
    </div>
    <div class="detalle-item">
      <div class="detalle-label">Alquiler estimado</div>
      <div class="detalle-valor">${prop.precio_alquiler ? `€ ${prop.precio_alquiler}/mes` : '-'}</div>
    </div>
    <div class="detalle-item">
      <div class="detalle-label">Habitaciones</div>
      <div class="detalle-valor">${prop.habitaciones || '-'}</div>
    </div>
    <div class="detalle-item">
      <div class="detalle-label">Baños</div>
      <div class="detalle-valor">${prop.banos || '-'}</div>
    </div>
    <div class="detalle-item">
      <div class="detalle-label">Metros cuadrados</div>
      <div class="detalle-valor">${prop.metros_cuadrados ? `${prop.metros_cuadrados} m²` : '-'}</div>
    </div>
    <div class="detalle-item">
      <div class="detalle-label">Año de construcción</div>
      <div class="detalle-valor">${prop.año_construccion || '-'}</div>
    </div>
  `;

  if (prop.descripcion) {
    const detalleDesc = document.createElement('div');
    detalleDesc.className = 'detalle-item';
    detalleDesc.style.gridColumn = '1 / -1';
    detalleDesc.innerHTML = `
      <div class="detalle-label">Descripción</div>
      <div class="detalle-valor" style="font-weight: normal; line-height: 1.6;">${prop.descripcion}</div>
    `;
    detallesGrid.appendChild(detalleDesc);
  }
}

// Cambiar entre tabs
function cambiarTab(tabName) {
  // Desactivar todos los tabs
  document.querySelectorAll('.tab-content').forEach((tab) => {
    tab.classList.remove('activo');
  });
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.remove('activo');
  });

  // Activar el tab seleccionado
  const tabContent = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  const tabBtn = event?.target;

  if (tabContent) tabContent.classList.add('activo');
  if (tabBtn) tabBtn.classList.add('activo');
}

// Visor de imágenes
function abrirVisor(fotos, index = 0) {
  imagenesActuales = fotos;
  indexImagenActual = index;
  const visor = document.getElementById('visorImagenes');
  visor.style.display = 'flex';
  actualizarVisor();
}

function cerrarVisor() {
  document.getElementById('visorImagenes').style.display = 'none';
}

function actualizarVisor() {
  const img = document.getElementById('imagenVisor');
  img.src = imagenesActuales[indexImagenActual];
  document.getElementById('contadorImagenes').textContent = `${indexImagenActual + 1} / ${imagenesActuales.length}`;
}

function imagenAnterior() {
  indexImagenActual = (indexImagenActual - 1 + imagenesActuales.length) % imagenesActuales.length;
  actualizarVisor();
}

function imagenSiguiente() {
  indexImagenActual = (indexImagenActual + 1) % imagenesActuales.length;
  actualizarVisor();
}

// Cerrar modal
function cerrarModal() {
  document.getElementById('modalPropiedad').style.display = 'none';
}

// Logout
function logout() {
  if (confirm('¿Cerrar sesión?')) {
    sessionStorage.removeItem('cliente');
    // Redirigir al login del cliente (depende de dónde estemos)
    const currentPath = window.location.pathname;
    if (currentPath.includes('portal.html')) {
      window.location.href = 'index.html';
    } else {
      window.location.href = '../index.html';
    }
  }
}

// Helpers
function obtenerClienteDeSession() {
  const clienteJson = sessionStorage.getItem('cliente');
  return clienteJson ? JSON.parse(clienteJson) : null;
}

function extraerYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : '';
}

function extraerVimeoId(url) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : '';
}

// ===== FILTROS =====
function aplicarFiltros() {
  // Obtener valores de filtros
  const busqueda = document.getElementById('filtroBusqueda').value.toLowerCase();
  const precioMin = parseInt(document.getElementById('filtroPrecinMin').value);
  const precioMax = parseInt(document.getElementById('filtroPrecioMax').value);
  const habitacionesMin = parseInt(
    document.querySelector('input[name="habitaciones"]:checked')?.value || '0'
  );
  const m2Min = parseInt(document.getElementById('filtroM2Min').value);
  const m2Max = parseInt(document.getElementById('filtroM2Max').value);
  const ubicacion = document.getElementById('filtroUbicacion').value;

  // Actualizar valores mostrados
  document.getElementById('valorPrecioMin').textContent = `€ ${precioMin.toLocaleString()}`;
  document.getElementById('valorPrecioMax').textContent = `€ ${precioMax.toLocaleString()}`;
  document.getElementById('valorM2Min').textContent = m2Min;
  document.getElementById('valorM2Max').textContent = m2Max;

  // Filtrar propiedades
  propiedadesFiltradas = propiedadesOriginal.filter((prop) => {
    // Búsqueda por texto
    if (busqueda) {
      const cumpleBusqueda =
        (prop.titulo && prop.titulo.toLowerCase().includes(busqueda)) ||
        (prop.direccion && prop.direccion.toLowerCase().includes(busqueda)) ||
        (prop.distrito && prop.distrito.toLowerCase().includes(busqueda)) ||
        (prop.municipio && prop.municipio.toLowerCase().includes(busqueda));
      if (!cumpleBusqueda) return false;
    }

    // Filtro precio
    const precio = prop.precio_compra || 0;
    if (precio < precioMin || precio > precioMax) return false;

    // Filtro habitaciones
    if (habitacionesMin > 0 && (!prop.habitaciones || prop.habitaciones < habitacionesMin)) {
      return false;
    }

    // Filtro m²
    const m2 = prop.metros_cuadrados || 0;
    if (m2 < m2Min || m2 > m2Max) return false;

    // Filtro ubicación
    if (ubicacion) {
      if (prop.distrito !== ubicacion && prop.municipio !== ubicacion) return false;
    }

    return true;
  });

  mostrarPropiedades(propiedadesFiltradas);
}

function limpiarFiltros() {
  document.getElementById('filtroBusqueda').value = '';
  document.getElementById('filtroPrecinMin').value = '0';
  document.getElementById('filtroPrecioMax').value = '1000000';
  document.getElementById('filtroM2Min').value = '0';
  document.getElementById('filtroM2Max').value = '500';
  document.getElementById('filtroUbicacion').value = '';
  document.querySelectorAll('input[name="habitaciones"]').forEach((radio) => {
    if (radio.value === '') radio.checked = true;
  });

  propiedadesFiltradas = propiedadesOriginal;
  mostrarPropiedades(propiedadesFiltradas);
}

// ===== FAVORITOS =====
function obtenerFavoritos() {
  const favoritosJson = localStorage.getItem('favoritos');
  return favoritosJson ? JSON.parse(favoritosJson) : [];
}

function guardarFavoritos(favoritos) {
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

function esFavorita(propiedadId) {
  return obtenerFavoritos().includes(propiedadId);
}

function toggleFavorito(propiedadId, titulo) {
  let favoritos = obtenerFavoritos();

  if (favoritos.includes(propiedadId)) {
    favoritos = favoritos.filter((id) => id !== propiedadId);
    mostrarNotificacion('❤️ Removida de favoritos');
  } else {
    favoritos.push(propiedadId);
    mostrarNotificacion('❤️ Agregada a favoritos');
  }

  guardarFavoritos(favoritos);

  // Actualizar UI
  document.querySelectorAll('.btn-favorito').forEach((btn) => {
    const cardId = btn.closest('.oportunidad-card');
    if (cardId) {
      if (favoritos.includes(propiedadId)) {
        btn.textContent = '❤️';
        btn.classList.add('favorito');
      } else {
        btn.textContent = '🤍';
        btn.classList.remove('favorito');
      }
    }
  });
}

function mostrarNotificacion(mensaje) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--gold);
    color: white;
    padding: 14px 20px;
    border-radius: 10px;
    font-weight: 600;
    z-index: 5000;
    animation: slideIn 0.3s ease;
  `;
  notif.textContent = mensaje;
  document.body.appendChild(notif);

  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 2500);
}
