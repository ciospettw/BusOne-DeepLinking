import express from 'express';

const app = express();

const PORT = Number(process.env.PORT || 8080);
const APPLE_TEAM_ID = (process.env.APPLE_TEAM_ID || 'HPQ583U5HP').trim();
const IOS_BUNDLE_ID = (process.env.IOS_BUNDLE_ID || 'com.busone.app').trim();
const ALLOWED_PATHS = (process.env.IOS_PATHS || '/*')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

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

app.get('/.well-known/assetlinks.json', (_req, res) => {
  res.status(404).json({
    error: 'Android App Links not configured yet',
    note: 'Requested by project scope: iOS only for now',
  });
});

app.listen(PORT, () => {
  console.log(`[deeplinking] listening on :${PORT}`);
  console.log(`[deeplinking] appID: ${APPLE_TEAM_ID}.${IOS_BUNDLE_ID}`);
});
