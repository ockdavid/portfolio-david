/* ============================================
   Admin — Gestión de clientes
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
  await cargarClientes();
}

// Cargar todos los clientes
async function cargarClientes() {
  const listado = document.getElementById('listadoClientes');
  listado.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    const { data, error } = await sb
      .from('clientes')
      .select(`
        *,
        asignaciones(propiedad_id)
      `)
      .order('nombre');

    if (error) throw error;

    if (!data || data.length === 0) {
      listado.innerHTML = '<div class="loading">No hay clientes aún. Agrega el primero desde arriba.</div>';
      return;
    }

    listado.innerHTML = `
      <table class="tabla-clientes">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Propiedades asignadas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (c) => `
            <tr>
              <td>${c.nombre}</td>
              <td><a href="tel:${c.telefono}">${c.telefono}</a></td>
              <td>${c.email || '-'}</td>
              <td>${c.asignaciones?.length || 0}</td>
              <td>
                <button class="btn-tabla btn-editar" onclick="editarCliente('${c.id}')">Editar</button>
                <button class="btn-tabla btn-eliminar" onclick="eliminarCliente('${c.id}', '${c.nombre}')">Eliminar</button>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error('Error cargando clientes:', err);
    listado.innerHTML = `<div class="loading">Error: ${err.message}</div>`;
  }
}

// Agregar cliente
async function setupForm() {
  const form = document.getElementById('formCliente');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!sb) {
        alert('❌ Error: Supabase no está inicializado');
        return;
      }

      const formData = new FormData(form);
      const cliente = {};
      formData.forEach((value, key) => {
        if (value !== '') cliente[key] = value;
      });

      try {
        const { error } = await sb.from('clientes').insert([cliente]);

        if (error) throw error;

        alert('✅ Cliente agregado correctamente');
        form.reset();
        await cargarClientes();
      } catch (err) {
        if (err.message.includes('duplicate')) {
          alert('⚠️ Este número de teléfono ya está registrado');
        } else {
          alert('❌ Error: ' + err.message);
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  await initSupabase();
  await setupForm();
});

// Eliminar cliente
async function eliminarCliente(clienteId, clienteNombre) {
  if (!confirm(`¿Estás seguro de que quieres eliminar a ${clienteNombre}?`)) return;

  try {
    // Las asignaciones se eliminarán automáticamente por cascada
    const { error } = await sb.from('clientes').delete().eq('id', clienteId);

    if (error) throw error;

    alert('✅ Cliente eliminado');
    await cargarClientes();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// Editar cliente (placeholder)
function editarCliente(clienteId) {
  alert('Funcionalidad de edición próximamente');
}

// Volver a visitas
function volver() {
  window.location.href = '../visita/index.html';
}
