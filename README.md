# BusOne DeepLinking (iOS only)

Microservizio Docker per servire il file AASA richiesto da iOS Universal Links.

## Endpoint

- `GET /.well-known/apple-app-site-association`
- `GET /apple-app-site-association` (fallback)
- `GET /:namespace/:tripId` (deep-link web fallback page)
- `GET /health`

> Android (`assetlinks.json`) **non configurato** volutamente in questa fase.

## Variabili ambiente

- `PORT` (default: `7462`)
- `APPLE_TEAM_ID` (default: `HPQ583U5HP`)
- `IOS_BUNDLE_ID` (default: `com.busone.app`)
- `IOS_PATHS` (default: `/*`) — lista separata da virgole (es. `/roma/*,/milano/*`)
- `APP_SCHEME` (default: `busone`) — schema custom usato nel fallback web (`busone://...`)
- `RATE_LIMIT_WINDOW_MS` (default: `60000`)
- `RATE_LIMIT_MAX` (default: `120`) — limite globale richieste per IP nella finestra

`appID` generato: `<APPLE_TEAM_ID>.<IOS_BUNDLE_ID>`

## Avvio locale (Node)

```bash
npm install
npm start
```

## Avvio con Docker

```bash
docker compose up --build -d
```

Test rapido:

```bash
curl -i http://localhost:7462/.well-known/apple-app-site-association
curl -i http://localhost:7462/health
curl -i http://localhost:7462/roma/0%231128-14
```

## Deploy dietro Cloudflare

Serve esporre il dominio `link.busone.app` verso questo servizio e assicurarsi che:

- `https://link.busone.app/.well-known/apple-app-site-association` risponda `200`
- nessun redirect su quel path
- `Content-Type: application/json`
- TLS valido

## Struttura fallback HTML

Il template della pagina deep link è separato dal server in:

- `src/pages/deepLinkPage.html`

Il server in `src/server.js` si occupa solo di routing, configurazione e rate limiting globale.

## Integrazione app

Nel mobile app è già prevista la configurazione:

- iOS associated domains: `applinks:link.busone.app`
- parser deep link formato: `https://link.busone.app/{namespace}/{tripId}`
