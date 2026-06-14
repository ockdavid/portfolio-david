/* ============================================
   Admin — Gestión de propiedades
   Conecta con Supabase para CRUD
   ============================================ */

let sb = null;

// Inicializar Supabase
async function initSupabase() {
  const config = window.SUPABASE_CONFIG;
  if (!config) {
    console.error('Falta SUPABASE_CONFIG');
    return;
  }

  sb = supabase.createClient(config.url, config.key);
  await cargarPropiedades();
}

// Cargar todas las propiedades
async function cargarPropiedades() {
  const listado = document.getElementById('listadoPropiedades');
  listado.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    const { data, error } = await sb
      .from('propiedades')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      listado.innerHTML = '<div class="loading">No hay propiedades aún. Agrega la primera desde arriba.</div>';
      return;
    }

    listado.innerHTML = '';
    data.forEach(prop => {
      const card = crearTarjetaPropiedad(prop);
      listado.appendChild(card);
    });
  } catch (err) {
    console.error('Error cargando propiedades:', err);
    listado.innerHTML = `<div class="loading">Error: ${err.message}</div>`;
  }
}

// Crear tarjeta de propiedad
function crearTarjetaPropiedad(prop) {
  const card = document.createElement('div');
  card.className = 'propiedad-card';

  const specs = [];
  if (prop.habitaciones) specs.push(`${prop.habitaciones} hab`);
  if (prop.banos) specs.push(`${prop.banos} baños`);
  if (prop.metros_cuadrados) specs.push(`${prop.metros_cuadrados} m²`);

  const precio = prop.precio_compra ? `€ ${prop.precio_compra.toLocaleString()}` : 'Consultar';
  const alquiler = prop.precio_alquiler ? `${prop.precio_alquiler}€/mes` : '';

  card.innerHTML = `
    <div class="propiedad-img">
      ${
        prop.foto_principal
          ? `<img src="${prop.foto_principal}" alt="${prop.titulo}" onerror="this.style.display='none'">`
          : '🏠'
      }
    </div>
    <div class="propiedad-content">
      <h3 class="propiedad-titulo">${prop.titulo}</h3>
      <p class="propiedad-direccion">${prop.direccion}</p>
      <div class="propiedad-specs">
        ${specs.map(s => `<span class="spec">${s}</span>`).join('')}
      </div>
      <div class="propiedad-precio">${precio}</div>
      ${alquiler ? `<div style="font-size:13px; color:var(--gold);">${alquiler}</div>` : ''}
      <div class="propiedad-acciones">
        <button class="propiedad-btn btn-asignar" onclick="abrirModalAsignar('${prop.id}', '${prop.titulo}')">
          Asignar a cliente
        </button>
        <button class="propiedad-btn btn-editar" onclick="editarPropiedad('${prop.id}')">
          Editar
        </button>
        <button class="propiedad-btn btn-eliminar" onclick="eliminarPropiedad('${prop.id}')">
          Eliminar
        </button>
      </div>
    </div>
  `;

  return card;
}

// Agregar/editar propiedad
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('formPropiedad');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const propiedad = {};
      formData.forEach((value, key) => {
        if (value !== '') propiedad[key] = isNaN(value) ? value : Number(value);
      });

      try {
        const { error } = await sb.from('propiedades').insert([propiedad]);

        if (error) throw error;

        alert('✅ Propiedad agregada correctamente');
        form.reset();
        await cargarPropiedades();
      } catch (err) {
        alert('❌ Error: ' + err.message);
      }
    });
  }

  initSupabase();
});

// Modal para asignar a cliente
async function abrirModalAsignar(propiedadId, propiedadTitulo) {
  try {
    // Cargar clientes
    const { data: clientes, error } = await sb
      .from('clientes')
      .select('*')
      .order('nombre');

    if (error) throw error;

    if (!clientes || clientes.length === 0) {
      alert('No hay clientes registrados. Agrega clientes primero en la sección "Clientes".');
      return;
    }

    // Crear modal
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop show';

    const modal = document.createElement('div');
    modal.className = 'modal-content';

    modal.innerHTML = `
      <h3>Asignar a cliente</h3>
      <p>Selecciona un cliente para ${propiedadTitulo}</p>
      <div class="clientes-list">
        ${clientes
          .map(
            (c) => `
          <div class="cliente-item" onclick="asignarPropiedad('${propiedadId}', '${c.id}', '${c.nombre}')">
            <div class="cliente-nombre">${c.nombre}</div>
            <div class="cliente-telefono">${c.telefono}</div>
          </div>
        `
          )
          .join('')}
      </div>
      <button class="btn btn-ghost-dark" style="width:100%;" onclick="this.closest('.modal-backdrop').remove()">
        Cancelar
      </button>
    `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    backdrop.onclick = (e) => {
      if (e.target === backdrop) backdrop.remove();
    };
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// Asignar propiedad a cliente
async function asignarPropiedad(propiedadId, clienteId, clienteNombre) {
  try {
    const { error } = await sb.from('asignaciones').insert([
      {
        propiedad_id: propiedadId,
        cliente_id: clienteId,
      },
    ]);

    if (error) throw error;

    alert(`✅ Propiedad asignada a ${clienteNombre}`);
    document.querySelector('.modal-backdrop.show')?.remove();
  } catch (err) {
    if (err.message.includes('duplicate')) {
      alert('⚠️ Esta propiedad ya está asignada a este cliente');
    } else {
      alert('Error: ' + err.message);
    }
  }
}

// Eliminar propiedad
async function eliminarPropiedad(propiedadId) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) return;

  try {
    // Primero eliminar asignaciones
    await sb.from('asignaciones').delete().eq('propiedad_id', propiedadId);

    // Luego eliminar documentos
    await sb.from('documentos').delete().eq('propiedad_id', propiedadId);

    // Finalmente eliminar propiedad
    const { error } = await sb.from('propiedades').delete().eq('id', propiedadId);

    if (error) throw error;

    alert('✅ Propiedad eliminada');
    await cargarPropiedades();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// Logout
function logout() {
  if (confirm('¿Cerrar sesión?')) {
    window.location.href = '../';
  }
}

// Editar propiedad (placeholder)
function editarPropiedad(propiedadId) {
  alert('Funcionalidad de edición próximamente');
}
