const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Esperar a que el servidor esté listo
  let ready = false;
  for (let i = 0; i < 10; i++) {
    try {
      await page.goto('http://localhost:8000/invertir/index.html', { waitUntil: 'networkidle' });
      ready = true;
      break;
    } catch (e) {
      console.log(`Intento ${i + 1}: servidor no está listo, esperando...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (!ready) {
    console.error('❌ No se pudo conectar al servidor');
    process.exit(1);
  }

  console.log('✅ Página cargada');

  // 1. Verificar que el ícono de usuario existe
  const authBtn = await page.querySelector('.auth-btn');
  if (!authBtn) {
    console.error('❌ El botón de autenticación no existe');
    process.exit(1);
  }
  console.log('✅ Botón de autenticación encontrado');

  // 2. Clickear en el botón de autenticación
  await authBtn.click();
  console.log('✅ Botón clickeado');

  // 3. Esperar a que el dropdown sea visible
  const dropdown = await page.querySelector('.auth-dropdown.open');
  if (!dropdown) {
    console.error('❌ El dropdown no se abrió');
    process.exit(1);
  }
  console.log('✅ Dropdown abierto');

  // 4. Verificar que hay dos opciones en el dropdown
  const options = await page.$$('.auth-option');
  if (options.length !== 2) {
    console.error(`❌ Se esperaban 2 opciones en el dropdown, pero hay ${options.length}`);
    process.exit(1);
  }
  console.log('✅ Dos opciones encontradas en el dropdown');

  // 5. Verificar el texto de las opciones
  const option1Text = await options[0].textContent();
  const option2Text = await options[1].textContent();
  if (option1Text.trim() !== 'Iniciar sesión') {
    console.error(`❌ Primera opción debería ser "Iniciar sesión", pero es "${option1Text}"`);
    process.exit(1);
  }
  if (option2Text.trim() !== 'Ver mis oportunidades') {
    console.error(`❌ Segunda opción debería ser "Ver mis oportunidades", pero es "${option2Text}"`);
    process.exit(1);
  }
  console.log('✅ Textos de las opciones correctos');

  // 6. Clickear en "Ver mis oportunidades"
  await options[1].click();
  await page.waitForSelector('.auth-phone-prompt[style*="flex"]', { timeout: 2000 }).catch(() => {
    throw new Error('Modal de teléfono no se abrió');
  });
  console.log('✅ Modal de teléfono abierto al clickear "Ver mis oportunidades"');

  // 7. Verificar que el modal tiene los elementos esperados
  const phoneInput = await page.querySelector('#clientPhone');
  if (!phoneInput) {
    console.error('❌ Input de teléfono no encontrado');
    process.exit(1);
  }
  console.log('✅ Input de teléfono encontrado');

  // 8. Ingresarun número de teléfono
  await phoneInput.fill('+34 695 128 762');
  const inputValue = await phoneInput.inputValue();
  if (inputValue !== '+34 695 128 762') {
    console.error(`❌ El valor del input no se guardó correctamente: "${inputValue}"`);
    process.exit(1);
  }
  console.log('✅ Número de teléfono ingresado correctamente');

  // 9. Verificar que el botón de acceder existe
  const accessBtn = await page.$('button.btn.btn-gold');
  if (!accessBtn) {
    console.error('❌ Botón de acceder no encontrado');
    process.exit(1);
  }
  console.log('✅ Botón de acceder encontrado');

  // 10. Tomar una captura de pantalla
  await page.screenshot({ path: '/tmp/auth-screenshot.png' });
  console.log('✅ Captura de pantalla tomada: /tmp/auth-screenshot.png');

  console.log('\n✅ TODAS LAS PRUEBAS PASARON\n');

  await browser.close();
  process.exit(0);
})().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
