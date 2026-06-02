/* Menú responsive del sitio PSI.
   Inyecta el botón hamburguesa en móvil y gestiona abrir/cerrar.
   No requiere cambiar el HTML de cada página: solo enlazar este archivo. */
(function () {
  function init() {
    document.querySelectorAll('.nav').forEach(function (nav) {
      var links = nav.querySelector('.links');
      if (!links || nav.querySelector('.nav-burger')) return;

      nav.classList.add('has-burger');

      var btn = document.createElement('button');
      btn.className = 'nav-burger';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Abrir o cerrar el menú');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span></span><span></span><span></span>';
      nav.appendChild(btn);

      function cerrar() {
        links.classList.remove('open');
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var abierto = links.classList.toggle('open');
        btn.classList.toggle('is-open', abierto);
        btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      });

      // Cerrar al pulsar un enlace
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', cerrar);
      });

      // Cerrar al tocar fuera del menú
      document.addEventListener('click', function (e) {
        if (links.classList.contains('open') && !nav.contains(e.target)) cerrar();
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
