/* ===========================================================
   Cloud — capa de sincronización con Supabase (PSI visitas)
   El objetivo es que la app SIGA funcionando offline igual que antes:
   la nube es un añadido. Toda llamada está protegida; si falla, se marca
   la visita como "pendiente" y se reintenta al recuperar conexión.
   =========================================================== */
(function () {
  'use strict';
  const cfg = window.SUPABASE_CONFIG;
  let client = null;

  function dataUrlToBlob(dataUrl) {
    const [head, b64] = dataUrl.split(',');
    const mime = (head.match(/:(.*?);/) || [])[1] || 'image/jpeg';
    const bin = atob(b64);
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u], { type: mime });
  }
  // foto puede ser string (dataURL antigua) u objeto {dataUrl, path, pending}
  function normPhoto(p) { return typeof p === 'string' ? { dataUrl: p } : (p || {}); }

  const _signedCache = new Map();   // path -> { url, exp }

  const Cloud = {
    available() { return !!(cfg && cfg.url && cfg.key && window.supabase); },

    init() {
      if (!this.available()) return null;
      if (!client) {
        client = window.supabase.createClient(cfg.url, cfg.key, {
          auth: { persistSession: true, autoRefreshToken: true }
        });
      }
      return client;
    },
    client() { return client || this.init(); },

    /* ---- sesión / login ---- */
    async getUser() {
      try { const { data } = await this.client().auth.getUser(); return data && data.user; }
      catch (e) { return null; }
    },
    async getSession() {
      try { const { data } = await this.client().auth.getSession(); return data && data.session; }
      catch (e) { return null; }
    },
    onAuth(cb) { this.client().auth.onAuthStateChange((_e, session) => cb(session ? session.user : null)); },
    signIn(email, password) { return this.client().auth.signInWithPassword({ email, password }); },
    signOut() { return this.client().auth.signOut(); },

    /* ---- mapear fila <-> visita local ---- */
    rowToVisita(r) {
      return {
        id: r.id, cliente: r.cliente || '', agencia: r.agencia || '', agente: r.agente || '',
        fecha: r.fecha || '', campos: r.campos || {}, checks: r.checks || {},
        fotos: r.fotos || {}, notas: r.notas || '',
        createdAt: r.created_at ? Date.parse(r.created_at) : Date.now(),
        updatedAt: r.updated_at ? Date.parse(r.updated_at) : Date.now(),
        _dirty: false
      };
    },

    async pullAll() {
      const { data, error } = await this.client()
        .from('visitas').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(this.rowToVisita);
    },

    /* ---- subir/guardar una visita ----
       Sube las fotos que aún tengan dataURL (mutando v.fotos para añadir path)
       y hace upsert de la fila. Devuelve el objeto de fotos para la nube. */
    async push(v) {
      const user = await this.getUser();
      if (!user) throw new Error('sin-sesion');

      const cloudFotos = {};
      const fotos = v.fotos || {};
      for (const itemId of Object.keys(fotos)) {
        const arr = fotos[itemId] || [];
        const cloudArr = [];
        for (let i = 0; i < arr.length; i++) {
          const obj = normPhoto(arr[i]);
          arr[i] = obj; // normaliza en local a objeto
          if (!obj.path && obj.dataUrl) {
            const blob = dataUrlToBlob(obj.dataUrl);
            const path = user.id + '/' + v.id + '/' + itemId + '/' +
              Date.now() + '_' + Math.random().toString(36).slice(2, 7) + '.jpg';
            const { error } = await this.client().storage
              .from(cfg.bucket).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
            if (error) throw error;
            obj.path = path;
            obj.pending = false;
          }
          if (obj.path) cloudArr.push({ path: obj.path });
        }
        if (cloudArr.length) cloudFotos[itemId] = cloudArr;
      }

      const row = {
        id: v.id, user_id: user.id,
        cliente: v.cliente || '', agencia: v.agencia || '', agente: v.agente || '',
        fecha: v.fecha || null,
        campos: v.campos || {}, checks: v.checks || {}, fotos: cloudFotos, notas: v.notas || ''
      };
      const { error } = await this.client().from('visitas').upsert(row);
      if (error) throw error;
      return cloudFotos;
    },

    async remove(v) {
      const user = await this.getUser();
      if (!user) throw new Error('sin-sesion');
      const paths = [];
      Object.keys(v.fotos || {}).forEach((it) =>
        (v.fotos[it] || []).forEach((p) => { const o = normPhoto(p); if (o.path) paths.push(o.path); }));
      if (paths.length) { try { await this.client().storage.from(cfg.bucket).remove(paths); } catch (e) {} }
      const { error } = await this.client().from('visitas').delete().eq('id', v.id);
      if (error) throw error;
    },

    /* ---- URL firmada para mostrar una foto (con caché) ---- */
    async signedUrl(path) {
      const now = Date.now();
      const hit = _signedCache.get(path);
      if (hit && hit.exp > now + 30000) return hit.url;
      try {
        const { data, error } = await this.client().storage
          .from(cfg.bucket).createSignedUrl(path, 3600);
        if (error || !data) return null;
        _signedCache.set(path, { url: data.signedUrl, exp: now + 3600 * 1000 });
        return data.signedUrl;
      } catch (e) { return null; }
    },

    normPhoto: normPhoto
  };

  window.Cloud = Cloud;
})();
