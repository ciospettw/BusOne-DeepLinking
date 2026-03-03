import express from 'express';

const app = express();

const PORT = Number(process.env.PORT || 8080);
const APPLE_TEAM_ID = (process.env.APPLE_TEAM_ID || 'HPQ583U5HP').trim();
const IOS_BUNDLE_ID = (process.env.IOS_BUNDLE_ID || 'com.busone.app').trim();
const APP_SCHEME = (process.env.APP_SCHEME || 'busone').trim();
const ALLOWED_PATHS = (process.env.IOS_PATHS || '/*')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getAasaPayload() {
  const appID = `${APPLE_TEAM_ID}.${IOS_BUNDLE_ID}`;
  return {
    applinks: {
      apps: [],
      details: [
        {
          appID,
          paths: ALLOWED_PATHS.length ? ALLOWED_PATHS : ['/*'],
        },
      ],
    },
  };
}

app.disable('x-powered-by');

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/.well-known/apple-app-site-association', (_req, res) => {
  const payload = getAasaPayload();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).send(JSON.stringify(payload));
});

app.get('/apple-app-site-association', (_req, res) => {
  const payload = getAasaPayload();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).send(JSON.stringify(payload));
});

app.get('/:namespace/:tripId', (req, res) => {
  const namespace = String(req.params.namespace || '').trim();
  const tripId = String(req.params.tripId || '').trim();

  if (!namespace || !tripId) {
    res.status(400).send('Invalid deep link path');
    return;
  }

  const encodedNamespace = encodeURIComponent(namespace);
  const encodedTripId = encodeURIComponent(tripId);
  const httpsLink = `https://link.busone.app/${encodedNamespace}/${encodedTripId}`;
  const appLink = `${APP_SCHEME}://${encodedNamespace}/${encodedTripId}`;

  const html = `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Apri corsa BusOne</title>
    <style>
      body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0b0f; color: #f4f4f5; }
      .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
      .card { width: 100%; max-width: 520px; border: 1px solid #2a2a33; background: #14141b; padding: 20px; border-radius: 12px; }
      h1 { margin: 0 0 8px; font-size: 22px; }
      p { margin: 0 0 12px; line-height: 1.4; color: #d4d4d8; }
      .pill { display: inline-block; font-family: ui-monospace, Menlo, monospace; font-size: 13px; background: #1e1e29; border: 1px solid #303043; padding: 6px 8px; border-radius: 8px; margin-bottom: 12px; }
      .btn { display: inline-block; text-decoration: none; padding: 12px 14px; border-radius: 10px; font-weight: 600; }
      .btn-primary { background: #22c55e; color: #052e16; }
      .btn-secondary { margin-left: 8px; background: #27272a; color: #f4f4f5; border: 1px solid #3f3f46; }
      .muted { margin-top: 14px; font-size: 13px; color: #a1a1aa; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1>Apri in BusOne</h1>
        <p>Se l'app è installata, tocca il pulsante qui sotto per aprire direttamente la corsa.</p>
        <div class="pill">${escapeHtml(namespace)} / ${escapeHtml(tripId)}</div>
        <div>
          <a class="btn btn-primary" href="${escapeHtml(appLink)}">Apri app</a>
          <a class="btn btn-secondary" href="${escapeHtml(httpsLink)}">Ricarica link</a>
        </div>
        <p class="muted">Se non si apre automaticamente, usa “Apri app”. Alcuni browser non aprono l'app quando l'URL viene digitato manualmente nella barra indirizzi.</p>
      </div>
    </div>
    <script>
      setTimeout(function () {
        window.location.href = ${JSON.stringify(appLink)};
      }, 120);
    </script>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(html);
});

app.get('/.well-known/assetlinks.json', (_req, res) => {
  res.status(404).json({
    error: 'Android App Links not configured yet',
    note: 'Requested by project scope: iOS only for now',
  });
});

app.listen(PORT, () => {
  console.log(`[deeplinking] listening on :${PORT}`);
  console.log(`[deeplinking] appID: ${APPLE_TEAM_ID}.${IOS_BUNDLE_ID}`);
  console.log(`[deeplinking] appScheme: ${APP_SCHEME}`);
});
