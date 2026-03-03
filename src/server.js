import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rateLimit from 'express-rate-limit';

const app = express();

const PORT = Number(process.env.PORT || 8080);
const APPLE_TEAM_ID = (process.env.APPLE_TEAM_ID || 'HPQ583U5HP').trim();
const IOS_BUNDLE_ID = (process.env.IOS_BUNDLE_ID || 'com.busone.app').trim();
const APP_SCHEME = (process.env.APP_SCHEME || 'busone').trim();
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 120);
const ALLOWED_PATHS = (process.env.IOS_PATHS || '/*')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEEP_LINK_TEMPLATE_PATH = path.join(__dirname, 'pages', 'deepLinkPage.html');
const DEEP_LINK_TEMPLATE = fs.readFileSync(DEEP_LINK_TEMPLATE_PATH, 'utf8');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderDeepLinkPage({ namespace, tripId, appLink, httpsLink }) {
  return DEEP_LINK_TEMPLATE
    .replaceAll('{{NAMESPACE_UPPER}}', escapeHtml(namespace.toUpperCase()))
    .replaceAll('{{NAMESPACE}}', escapeHtml(namespace))
    .replaceAll('{{TRIP_ID}}', escapeHtml(tripId))
    .replaceAll('{{APP_LINK}}', escapeHtml(appLink))
    .replaceAll('{{HTTPS_LINK}}', escapeHtml(httpsLink));
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
app.set('trust proxy', 1);

const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    note: 'Please retry in a moment',
  },
});

app.use(globalRateLimiter);

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
  const html = renderDeepLinkPage({
    namespace,
    tripId,
    appLink,
    httpsLink,
  });

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
  console.log(`[deeplinking] rateLimit: ${RATE_LIMIT_MAX}/${RATE_LIMIT_WINDOW_MS}ms`);
});
