/* ===========================================================
   ICONOS DE LÍNEA — David Landeo PSI
   Set SVG coherente (trazo 1.7, currentColor) que sustituye a los emojis.
   Uso en HTML:  <span class="ic">{{NOMBRE}}</span>
   Este script reemplaza cada token por su SVG al cargar la página.
   =========================================================== */
(function(){
  const S = (p,extra) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" `+
    `stroke-linecap="round" stroke-linejoin="round" ${extra||''}>${p}</svg>`;

  const ICONS = {
    ARROW:  S('<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>'),
    ARROWUP:S('<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>'),
    SHIELD: S('<path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>'),
    CHART:  S('<path d="M4 20h16"/><rect x="6" y="11" width="3" height="6" rx=".5"/><rect x="11" y="7" width="3" height="10" rx=".5"/><rect x="16" y="13" width="3" height="4" rx=".5"/>'),
    IMAGE:  S('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-4.5-4.5L7 21"/>'),
    BELL:   S('<path d="M5 16h14l-1.4-2.1a3 3 0 0 1-.6-1.8V10a5 5 0 0 0-10 0v2.1a3 3 0 0 1-.6 1.8L5 16z"/><path d="M10 19a2 2 0 0 0 4 0"/>'),
    TARGET: S('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>'),
    MAP:    S('<path d="M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z"/><path d="M9 4v14"/><path d="M15 6v14"/>'),
    SEARCH: S('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
    PHONE:  S('<path d="M6.5 4h3l1.5 4-2 1.4a11 11 0 0 0 5.6 5.6L16 17l4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z"/>'),
    MAIL:   S('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7l8 6 8-6"/>'),
    CHECK:  S('<path d="M5 12.5l4.5 4.5L19 7"/>'),
    XMARK:  S('<path d="M7 7l10 10M17 7L7 17"/>'),
    CLOCK:  S('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    USERS:  S('<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.4a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 13.5a5.5 5.5 0 0 1 3 5"/>'),
    SCALE:  S('<path d="M12 4v16"/><path d="M7 20h10"/><path d="M5 7h14"/><path d="M8 4.5l-4 .8"/><path d="M16 4.5l4 .8"/><path d="M5 7l-2.5 5a3 3 0 0 0 5 0L5 7z"/><path d="M19 7l-2.5 5a3 3 0 0 0 5 0L19 7z"/>'),
    DOC:    S('<path d="M7 3h7l5 5v13a0 0 0 0 1 0 0H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 16.5h6"/>'),
    PIN:    S('<path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    HANDSHAKE:S('<path d="M3 8l3-2 4 3 4-3 3 2"/><path d="M3 8v6l5 4 4-3 4 3 5-4V8"/><path d="M10 9l-2.5 2.5a1.5 1.5 0 0 0 2 2.2L12 12"/>'),
    KEY:    S('<circle cx="8" cy="12" r="4"/><path d="M12 12h9"/><path d="M17 12v3"/><path d="M20 12v2.5"/>'),
    COMPASS:S('<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/>'),
    SPARK:  S('<path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z"/>'),
    NOTE:   S('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
    USER:   S('<circle cx="12" cy="8.5" r="3.5"/><path d="M4 20a8 8 0 0 1 16 0"/>'),
  };

  function render(){
    document.querySelectorAll('.ic').forEach(el=>{
      const t = el.textContent.trim();
      const m = t.match(/^\{\{([A-Z]+)\}\}$/);
      if(m && ICONS[m[1]]) el.innerHTML = ICONS[m[1]];
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',render);
  else render();
  window.DLIcons = ICONS;
})();
