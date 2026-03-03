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
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
    <style>
      :root {
        --bg: #0a0a0a;
        --card: #111113;
        --border: #24242b;
        --muted: #a1a1aa;
        --fg: #fafafa;
        --primary: #28e28b;
        --primary-dim: rgba(40, 226, 139, 0.14);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background:
          radial-gradient(1100px 520px at 110% -10%, rgba(40, 226, 139, 0.14), transparent 55%),
          radial-gradient(900px 420px at -10% 120%, rgba(40, 226, 139, 0.08), transparent 55%),
          var(--bg);
        color: var(--fg);
      }

      .wrap {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
      }

      .sheet {
        width: 100%;
        max-width: 560px;
        border: 1px solid var(--border);
        background: linear-gradient(180deg, #15151a 0%, var(--card) 100%);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
        overflow: hidden;
      }

      .handle {
        height: 28px;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .handle-bar {
        width: 34px;
        height: 3px;
        background: #5a5a66;
      }

      .content {
        padding: 18px;
      }

      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .badge {
        min-width: 80px;
        height: 46px;
        padding: 0 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--primary);
        color: #04150e;
        font-family: 'Space Mono', ui-monospace, Menlo, monospace;
        font-weight: 700;
        font-size: 18px;
        letter-spacing: 0.04em;
      }

      .meta {
        margin-top: 2px;
        color: var(--muted);
        font-family: 'Space Mono', ui-monospace, Menlo, monospace;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h1 {
        margin: 16px 0 8px;
        font-size: 24px;
        line-height: 1.15;
        letter-spacing: -0.02em;
      }

      p {
        margin: 0;
        color: #d4d4d8;
        line-height: 1.45;
      }

      .trip {
        margin-top: 14px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--border);
        background: #17171d;
        padding: 8px 10px;
        font-family: 'Space Mono', ui-monospace, Menlo, monospace;
        font-size: 13px;
      }

      .trip-dot {
        width: 6px;
        height: 6px;
        background: var(--primary);
      }

      .actions {
        margin-top: 18px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .btn {
        text-decoration: none;
        padding: 12px 14px;
        border-radius: 0;
        font-weight: 700;
        font-size: 14px;
        letter-spacing: 0.01em;
        border: 1px solid transparent;
      }

      .btn-primary {
        background: var(--primary-dim);
        border-color: rgba(40, 226, 139, 0.36);
        color: var(--primary);
      }

      .btn-secondary {
        background: #202028;
        border-color: #3a3a46;
        color: var(--fg);
      }

      .hint {
        margin-top: 16px;
        font-size: 13px;
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="sheet">
        <div class="handle">
          <div class="handle-bar"></div>
        </div>
        <div class="content">
          <div class="row">
            <div class="badge">BUS</div>
            <div class="meta">${escapeHtml(namespace.toUpperCase())}</div>
          </div>

          <h1>Apri questa corsa in BusOne</h1>
          <p>Usa il pulsante qui sotto per aprire direttamente la trip sheet nell'app.</p>

          <div class="trip">
            <div class="trip-dot"></div>
            <span>${escapeHtml(namespace)} / ${escapeHtml(tripId)}</span>
          </div>

          <div class="actions">
            <a class="btn btn-primary" href="${escapeHtml(appLink)}">Apri app</a>
            <a class="btn btn-secondary" href="${escapeHtml(httpsLink)}">Ricarica link</a>
          </div>

          <p class="hint">Se non si apre automaticamente, tocca “Apri app”. Alcuni browser non aprono l'app quando l'URL viene digitato manualmente nella barra indirizzi.</p>
        </div>
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
