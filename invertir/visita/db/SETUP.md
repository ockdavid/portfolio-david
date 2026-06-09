# Alta en Supabase — paso a paso (10 minutos)

Esto lo haces **tú una sola vez**. Al final me das 2 datos y yo conecto tu web.

---

## 1. Crear la cuenta y el proyecto
1. Entra en **https://supabase.com** → **Start your project** → entra con tu Google o email.
2. **New project**.
   - **Name:** `psi-visitas` (o el que quieras).
   - **Database Password:** pon una contraseña fuerte y **guárdala** (la necesitarás si algún día accedes a la BD directamente).
   - **Region:** elige **West EU (Ireland)** o **Central EU (Frankfurt)**. ⚠️ Importante: región **europea** por el RGPD (manejas datos de clientes).
3. Pulsa **Create new project** y espera 1-2 min a que se prepare.

## 2. Crear las tablas
1. Menú lateral → **SQL Editor** → **New query**.
2. Abre el archivo [`schema.sql`](schema.sql), copia **todo** su contenido y pégalo.
3. Pulsa **Run** (abajo a la derecha). Debe decir *Success* sin errores.

## 3. Crear tu usuario de acceso (tu login)
1. Menú lateral → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Pon el **email** y la **contraseña** con los que entrarás a la app (apúntalos).
3. Marca **Auto Confirm User** si aparece la opción (así no hace falta confirmar por correo).

## 4. Pasarme los 2 datos de conexión
1. Menú lateral → **Project Settings** (el engranaje) → **API**.
2. Copia y mándame:
   - **Project URL** — algo como `https://xxxxxxxx.supabase.co`
   - **API Keys → `anon` `public`** — una clave larga que empieza por `eyJ...`

> Tranquilo: la clave `anon public` está **diseñada para ir en el navegador**; es segura porque las reglas de seguridad (RLS) que ya creamos impiden que nadie vea datos sin tu login. **No** me pases la clave `service_role` (esa es secreta y no se usa aquí).

---

Cuando me pases la **Project URL** y la **anon public**, conecto tu web: login, guardado en la nube, subida de fotos y la página «Mis visitas». 
