-- ================================================
-- Políticas RLS para el admin de inmuebles
-- Ejecuta esto en el SQL Editor de Supabase.
--
-- Modelo de seguridad:
--   - Usuario AUTENTICADO (David, email/contraseña) = control total
--     sobre clientes, propiedades, asignaciones y documentos.
--   - Clave anónima (publishable) = SOLO LECTURA de propiedades,
--     asignaciones y documentos (lo que necesita el portal del cliente).
--     NO puede leer ni escribir la tabla clientes.
-- ================================================

-- Activar RLS en todas las tablas
ALTER TABLE clientes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE propiedades  ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos   ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores (por si re-ejecutas este script)
DROP POLICY IF EXISTS "admin total clientes"     ON clientes;
DROP POLICY IF EXISTS "admin total propiedades"  ON propiedades;
DROP POLICY IF EXISTS "admin total asignaciones" ON asignaciones;
DROP POLICY IF EXISTS "admin total documentos"   ON documentos;
DROP POLICY IF EXISTS "anon lee propiedades"     ON propiedades;
DROP POLICY IF EXISTS "anon lee asignaciones"    ON asignaciones;
DROP POLICY IF EXISTS "anon lee documentos"      ON documentos;

-- ---- ADMIN (usuario autenticado): control total ----
CREATE POLICY "admin total clientes" ON clientes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin total propiedades" ON propiedades
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin total asignaciones" ON asignaciones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "admin total documentos" ON documentos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---- PORTAL CLIENTE (clave anónima): solo lectura ----
-- El portal del cliente usa la clave publishable para mostrar
-- las propiedades. NO se da acceso anónimo a la tabla clientes.
CREATE POLICY "anon lee propiedades" ON propiedades
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon lee asignaciones" ON asignaciones
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon lee documentos" ON documentos
  FOR SELECT TO anon USING (true);
