/* ============================================
   Plataforma — Navegación entre vistas
   Maneja la visualización de Visitas, Propiedades, Clientes
   ============================================ */

function mostrarVista(vista) {
  // Mapear nombres amigables a IDs reales
  const mapeo = {
    'visitas': 'list',
    'propiedades': 'propiedades',
    'clientes': 'clientes'
  };

  const vistaReal = mapeo[vista] || vista;

  // Ocultar todas las vistas
  document.querySelectorAll('.view').forEach((v) => {
    v.classList.remove('active');
  });

  // Mostrar la vista seleccionada
  const selector = `#view-${vistaReal}`;
  const elemento = document.querySelector(selector);
  if (elemento) {
    elemento.classList.add('active');
  }

  // Actualizar botones de navegación
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.remove('activo');
  });
  event?.target?.classList.add('activo');

  // Scroll al top
  window.scrollTo(0, 0);
}

// Mostrar menú de plataforma después de autenticarse
function mostrarMenuPlataforma() {
  const nav = document.getElementById('plataformaNav');
  if (nav) {
    nav.style.display = 'flex';
    document.body.classList.add('plataforma-abierta');
  }
}

// Ocultar menú de plataforma al desautenticarse
function ocultarMenuPlataforma() {
  const nav = document.getElementById('plataformaNav');
  if (nav) {
    nav.style.display = 'none';
    document.body.classList.remove('plataforma-abierta');
  }
}

// Hook para que visita.js llame a esto después de autenticarse
// (se llamará desde visita.js cuando el usuario se autentica)
window.onPlataformaReady = function () {
  mostrarMenuPlataforma();
  // Mostrar vista de visitas por defecto
  mostrarVista('visitas');
};
