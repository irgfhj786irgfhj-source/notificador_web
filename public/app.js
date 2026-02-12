/* global Notification */
const logEl = document.getElementById('log');
const btnPermiso = document.getElementById('btn-permiso');
const btnSuscribir = document.getElementById('btn-suscribir');
const btnEnviarPush = document.getElementById('btn-enviar-push');
const btnModal = document.getElementById('btn-modal');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');
const ding = document.getElementById('ding');
const btnInstalar = document.getElementById('btn-instalar');

let swReg = null;
let deferredPrompt = null;

function log(msg) {
  console.log(msg);
  logEl.textContent += `${msg}\n`;
}

// Registro del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      swReg = await navigator.serviceWorker.register('/sw.js');
      log('Service Worker registrado.');
    } catch (e) {
      log('Error registrando SW: ' + e.message);
    }
  });
} else {
  log('Este navegador no soporta Service Workers.');
}

// Evento de instalación (PWA)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  btnInstalar.style.display = 'inline-block';
});
btnInstalar.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  log('Instalación PWA: ' + outcome);
  deferredPrompt = null;
  btnInstalar.style.display = 'none';
});

// Botón: pedir permiso de notificaciones
btnPermiso.addEventListener('click', async () => {
  try {
    const result = await Notification.requestPermission();
    log('Permiso de notificaciones: ' + result);
  } catch (e) {
    log('Error al pedir permiso: ' + e.message);
  }
});

// Utilidad: Base64URL → Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
  return out;
}

// Obtener clave pública VAPID del servidor
async function getVapidPublicKey() {
  const res = await fetch('/vapidPublicKey');
  if (!res.ok) throw new Error('No se pudo obtener la clave pública VAPID');
  const { publicKey } = await res.json();
  return publicKey;
}

// Suscripción a push
btnSuscribir.addEventListener('click', async () => {
  try {
    if (!swReg) throw new Error('SW no registrado aún');
    const permission = Notification.permission;
    if (permission !== 'granted') {
      log('Primero concede el permiso de notificaciones.');
      return;
    }
    const publicKey = await getVapidPublicKey();
    const subscription = await swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    // Enviar al servidor
    const res = await fetch('/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
    if (!res.ok) throw new Error('No se pudo registrar la suscripción en el servidor');
    log('¡Suscripción push registrada!');
  } catch (e) {
    log('Error al suscribirse: ' + e.message);
  }
});

// Enviar push de prueba (desde el servidor hacia el dispositivo actual y otros suscritos)
btnEnviarPush.addEventListener('click', async () => {
  try {
    const title = 'Aviso de prueba';
    const body = 'Este es un mensaje push enviado desde el servidor.';
    const res = await fetch('/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, url: location.origin }),
    });
    if (!res.ok) throw new Error('Error al solicitar el envío de push');
    log('Se solicitó el envío de la notificación push.');
  } catch (e) {
    log('Error enviando push: ' + e.message);
  }
});

// Fallback: ventana emergente con sonido (cuando la página está abierta)
btnModal.addEventListener('click', () => {
  document.getElementById('modal-text').textContent =
    'Este es un aviso emergente con sonido mientras navegas en la página.';
  modal.classList.add('show');
  // Intentar reproducir sonido (requiere interacción previa del usuario en la mayoría de navegadores)
  ding.currentTime = 0;
  ding.play().catch(() => log('El navegador bloqueó el sonido hasta que haya una interacción.'));
});
modalClose.addEventListener('click', () => modal.classList.remove('show'));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
