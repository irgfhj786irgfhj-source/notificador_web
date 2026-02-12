const express = require('express');
const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cargar o generar claves VAPID
const vapidPath = path.join(__dirname, 'vapid.json');
let vapid;
if (fs.existsSync(vapidPath)) {
  vapid = JSON.parse(fs.readFileSync(vapidPath, 'utf8'));
} else {
  const keys = webpush.generateVAPIDKeys();
  fs.writeFileSync(vapidPath, JSON.stringify(keys, null, 2));
  vapid = keys;
}

webpush.setVapidDetails('mailto:admin@example.com', vapid.publicKey, vapid.privateKey);

// Almacén temporal de suscripciones (en memoria)
const subscriptions = new Set();

app.get('/vapidPublicKey', (_req, res) => {
  res.json({ publicKey: vapid.publicKey });
});

app.post('/subscribe', (req, res) => {
  const sub = req.body;
  subscriptions.add(JSON.stringify(sub));
  res.status(201).json({ success: true });
});

app.post('/push', async (req, res) => {
  const { title, body, url } = req.body || {};
  const payload = JSON.stringify({ title, body, url });

  const results = [];
  for (const subStr of Array.from(subscriptions)) {
    const sub = JSON.parse(subStr);
    try {
      await webpush.sendNotification(sub, payload);
      results.push({ ok: true });
    } catch (e) {
      // Si falla, eliminar suscripción inválida
      subscriptions.delete(subStr);
      results.push({ ok: false, error: e.body || e.message });
    }
  }
  res.json({ sent: results.length, results });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor iniciado en http://localhost:' + PORT);
});
