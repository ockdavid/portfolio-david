-- ================================================
-- Schema para admin de inmuebles
-- Ejecuta esto en Supabase SQL Editor
-- ================================================

-- Tabla de clientes (los que ven las oportunidades)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL UNIQUE,
  email TEXT,
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  notas TEXT
);

-- Tabla de propiedades (inmuebles)
CREATE TABLE IF NOT EXISTS propiedades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  direccion TEXT NOT NULL,
  distrito TEXT,
  municipio TEXT,
  precio_compra NUMERIC,
  precio_alquiler NUMERIC,
  habitaciones INTEGER,
  banos INTEGER,
  metros_cuadrados NUMERIC,
  año_construccion INTEGER,
  estado TEXT DEFAULT 'activa', -- 'activa', 'vendida', 'archivada'
  foto_principal TEXT,
  fotos_urls TEXT[] DEFAULT '{}',
  videos_urls TEXT[] DEFAULT '{}',
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de asignaciones (qué propiedades ve cada cliente)
CREATE TABLE IF NOT EXISTS asignaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  propiedad_id UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cliente_id, propiedad_id)
);

-- Tabla de documentos por propiedad
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propiedad_id UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT, -- 'oferta', 'rentabilidad', 'informe', 'otro'
  url TEXT NOT NULL,
  fecha_subida TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries comunes
CREATE INDEX IF NOT EXISTS idx_asignaciones_cliente ON asignaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_propiedad ON asignaciones(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_documentos_propiedad ON documentos(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_propiedades_estado ON propiedades(estado);

-- Row Level Security (RLS)
-- Por ahora deshabilitado para simplificar. En producción, configura RLS para que:
-- - Solo el admin vea todas las propiedades
-- - Los clientes solo vean las asignadas a ellos
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE propiedades DISABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE documentos DISABLE ROW LEVEL SECURITY;
