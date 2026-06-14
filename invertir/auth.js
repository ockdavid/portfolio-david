/* Manejo de autenticación: dropdown del menú + modal de teléfono */
(function () {
  function init() {
    const authMenu = document.querySelector('.auth-menu');
    const authBtn = document.querySelector('.auth-btn');
    const authDropdown = document.querySelector('.auth-dropdown');
    const phonePrompt = document.querySelector('.auth-phone-prompt');
    const closeBtn = document.querySelector('.phone-modal .close-btn');
    const backdrop = document.querySelector('.modal-backdrop');
    const phoneInput = document.getElementById('clientPhone');

    if (!authMenu || !authBtn || !authDropdown) return;

    /* Abrir/cerrar dropdown al clickear el botón */
    authBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      authDropdown.classList.toggle('open');
    });

    /* Cerrar dropdown al clickear fuera */
    document.addEventListener('click', function (e) {
      if (authDropdown.classList.contains('open') && !authMenu.contains(e.target)) {
        authDropdown.classList.remove('open');
      }
    });

    /* Cerrar dropdown al clickear un link */
    authDropdown.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        authDropdown.classList.remove('open');
      });
    });

    /* Cerrar modal de teléfono */
    if (phonePrompt) {
      closeBtn.addEventListener('click', function () {
        phonePrompt.style.display = 'none';
      });

      backdrop.addEventListener('click', function () {
        phonePrompt.style.display = 'none';
      });

      /* Validar y enviar teléfono */
      window.handlePhoneLogin = function () {
        const phone = phoneInput.value.trim();
        if (!phone) {
          alert('Por favor, ingresa tu número de teléfono');
          return;
        }
        // Redirigir al portal de cliente
        window.location.href = 'cliente/index.html';
      };

      /* Permitir enviar con Enter */
      phoneInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
          window.handlePhoneLogin();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
