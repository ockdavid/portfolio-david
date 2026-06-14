# 🏠 Setup de la Plataforma de Inversión — David Landeo PSI

Esta guía te ayudará a configurar la plataforma completa en 3 pasos.

---

## 📋 PASO 1: Crear las Tablas en Supabase

### 1.1 Abre Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión con tu cuenta
3. Abre tu proyecto

### 1.2 Ejecuta el Script SQL
1. Ve a **SQL Editor** (en el menú lateral)
2. Copia el contenido de este archivo: `/invertir/admin/schema.sql`
3. Pégalo en el editor
4. Haz clic en **"Ejecutar"** (botón rojo)

**Esto creará:**
- Tabla `clientes` — tus clientes con teléfono
- Tabla `propiedades` — los inmuebles
- Tabla `asignaciones` — qué propiedades ve cada cliente
- Tabla `documentos` — ofertas, informes, cálculos por propiedad

---

## 🔑 PASO 2: Acceso al Admin

### URL
```
http://localhost:8000/invertir/admin/
```

### Secciones

#### 📍 Propiedades (`/invertir/admin/`)
- Agrega nuevas propiedades con: dirección, precio, m², habitaciones, fotos, etc.
- Lista todas las propiedades
- **Asignar a cliente** — selecciona un cliente para que vea esa propiedad
- Editar/Eliminar (acciones rápidas)

#### 👥 Clientes (`/invertir/admin/clientes.html`)
- Agrega clientes con: nombre, teléfono (es la clave de ingreso), email
- Lista todos los clientes
- Muestra cuántas propiedades tiene asignado cada uno

### Workflow Típico
1. Agrega clientes primero (en la sección "Clientes")
2. Luego agrega propiedades (sección "Propiedades")
3. En cada propiedad, haz clic en **"Asignar a cliente"** para seleccionar quién la ve
4. Un cliente puede ver múltiples propiedades

---

## 👁️ PASO 3: Portal de Cliente

### URL de Login
```
http://localhost:8000/invertir/cliente/
```

### Login
Los clientes ingresan su **número de teléfono** (el mismo que registraste en Admin).
**Sin contraseña** — solo el teléfono.

### Qué ve el cliente
Una vez logueado, ve sus **propiedades asignadas** con:

#### 📸 **Fotos**
- Galería de imágenes en alta calidad
- Click en una foto para ver a pantalla completa
- Navegación entre fotos (anterior/siguiente)

#### 🎥 **Videos**
- Integración con YouTube, Vimeo o videos en servidor
- Reproducción directa en el navegador
- Soporte para video responsive

#### 📄 **Documentos**
- Oferta resumen
- Calculadora de rentabilidad
- Informe de vivienda
- Otros documentos que subas
- Descargar directamente

#### ℹ️ **Detalles**
- Ubicación completa
- Precio compra/alquiler
- Habitaciones, baños, m²
- Año construcción
- Descripción

---

## 🎯 Cómo Agregar Propiedades + Documentos

### En Admin: Agregar una Propiedad

1. Ve a `/invertir/admin/`
2. Rellena el formulario:
   - **Título**: "Piso 2 dormitorios en Chamberí"
   - **Dirección**: "Calle Lope de Vega, 45"
   - **Distrito/Municipio**: "Chamberí" / "Madrid"
   - **Precio compra**: "350000"
   - **Precio alquiler**: "1200"
   - **Habitaciones**: "2"
   - **Baños**: "1"
   - **Metros cuadrados**: "75"
   - **Año construcción**: "2005"
   - **Foto principal (URL)**: link a una imagen
3. Haz clic en **"Agregar propiedad"**

### Agregar Fotos (URLs)
Las fotos se agregan mediante URLs. Tienes dos opciones:

**Opción A: Supabase Storage**
1. En Supabase, ve a **Storage** → **Buckets**
2. Crea un bucket llamado `propiedades-fotos`
3. Sube tus fotos
4. Copia el URL público de cada foto
5. Usa esas URLs en el admin

**Opción B: Cualquier servidor**
- Usa URLs de Cloudinary, Imgur, tu propio servidor, etc.
- Cualquier URL pública funciona

### Agregar Videos
En la BD, agrega URLs directas a:
- **YouTube**: `https://www.youtube.com/watch?v=...` o `https://youtu.be/...`
- **Vimeo**: `https://vimeo.com/...`
- **Videos propios**: `https://tuservidor.com/video.mp4`

Edita directamente en Supabase (tabla `propiedades`, columna `videos_urls`).

### Agregar Documentos
Los documentos se suben en la tabla `documentos`:

1. En Supabase, ve a **SQL Editor**
2. Ejecuta un INSERT como este:

```sql
INSERT INTO documentos (propiedad_id, nombre, tipo, url)
VALUES (
  'id-de-tu-propiedad-aqui',
  'Oferta resumen - Chamberí',
  'oferta',
  'https://tuservidor.com/oferta-chamberí.pdf'
);
```

**Tipos de documento:**
- `oferta` — Oferta resumen
- `rentabilidad` — Calculadora de rentabilidad
- `informe` — Informe de vivienda
- `otro` — Otros documentos

---

## 🔗 Flujo Completo

### 1. Tú (Admin)
```
index.html → dropdown login → "Iniciar sesión"
↓
/invertir/admin/
├─ Agrega clientes (nombre, teléfono)
├─ Agrega propiedades (dirección, precio, etc.)
└─ Asigna propiedades a clientes
```

### 2. Cliente
```
index.html → dropdown login → "Ver mis oportunidades"
↓
/invertir/cliente/ → Ingresa teléfono
↓
/invertir/cliente/portal.html → Ve sus propiedades
├─ Click en propiedad
├─ Ve fotos (galería + pantalla completa)
├─ Ve videos (YouTube, Vimeo)
├─ Descarga documentos
└─ Ve todos los detalles
```

---

## 🚀 Lanzamiento en Producción

### Cambios necesarios:

1. **Seguridad en Admin**
   - Actualmente no hay autenticación en `/invertir/admin/`
   - Implementa login con Supabase Auth o contraseña antes de publicar
   - O configura un middleware en tu servidor

2. **URLs Correctas**
   - En desarrollo usas `http://localhost:8000/invertir/`
   - En producción usa `https://tudominio.com/invertir/`

3. **Row Level Security (RLS) en Supabase**
   - En el `schema.sql` está deshabilitado por simplicidad
   - Antes de producción, habilita RLS para que:
     - Admin solo vea todo
     - Clientes solo vean sus propiedades asignadas

4. **Almacenamiento de Fotos**
   - Usa Supabase Storage o Cloudinary para las imágenes
   - No guardes URLs de imgur (caducan)

---

## ❓ Preguntas Frecuentes

### P: ¿Cómo agrego más de una foto a una propiedad?
**R:** En Supabase, edita la tabla `propiedades`, columna `fotos_urls`. Es un array JSON:
```json
["https://foto1.jpg", "https://foto2.jpg", "https://foto3.jpg"]
```

### P: ¿Los clientes pueden cambiar su contraseña?
**R:** No hay contraseña. Solo ingresan su teléfono. Es más simple y ellos ya lo tienen.

### P: ¿Pueden dos clientes ver las mismas propiedades?
**R:** Sí, asigna la misma propiedad a múltiples clientes.

### P: ¿Qué pasa si ingreso un teléfono que no existe?
**R:** Reciben un mensaje "Número no registrado" y se les sugiere contactarte.

---

## 📞 Resumen de Archivos

```
/invertir/
├─ index.html                 (Página principal + navbar con login)
├─ auth.js                    (Lógica dropdown + modal teléfono)
├─ estilos.css               (Estilos compartidos)
├─ iconos.js                 (Iconos SVG)
│
├─ /admin/
│  ├─ index.html             (Gestión de propiedades)
│  ├─ clientes.html          (Gestión de clientes)
│  ├─ admin.js               (Lógica Supabase para admin)
│  ├─ clientes.js            (Lógica Supabase para clientes)
│  ├─ admin.css              (Estilos admin)
│  └─ schema.sql             (Creación de BD)
│
└─ /cliente/
   ├─ index.html             (Login con teléfono)
   ├─ portal.html            (Portal de propiedades)
   ├─ cliente.js             (Lógica portal cliente)
   └─ cliente.css            (Estilos cliente)
```

---

¡Listo para empezar! 🎉
