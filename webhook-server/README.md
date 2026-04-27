# SWEObeyMe Error Reporting Webhook Server

Receives error reports from extension instances and posts them to GitHub automatically.

## Setup

### 1. Deploy to Vercel

```bash
cd webhook-server
npm install
vercel login
vercel
```

### 2. Set Environment Variables

In Vercel dashboard or via CLI:
- `GITHUB_PAT`: Your GitHub Personal Access Token (repo scope)
- `WEBHOOK_SECRET`: Optional secret to validate requests
- `GITHUB_OWNER`: Repository owner (default: stonewolfpc)
- `GITHUB_REPO`: Repository name (default: SWEObeyMe)

### 3. Get Webhook URL

After deployment, Vercel will provide a URL like:
```
https://sweobeyme-webhook.vercel.app
```

The endpoint is: `https://sweobeyme-webhook.vercel.app/report`

## Rate Limiting

- 30 requests per minute per IP
- Prevents abuse while allowing legitimate error reporting

## Security

- GitHub PAT stored only on server (never in extension)
- Optional webhook signature validation
- HTTPS required for production

## Alternative Deployments

### Render
```bash
render deploy
```

### Railway
```bash
railway up
```

### Local Testing
```bash
npm install
npm run dev
# Server runs on http://localhost:3000
```

## Testing

```bash
curl -X POST http://localhost:3000/report \
  -H "Content-Type: application/json" \
  -d '{
    "type": "validation_failure",
    "domain": "file_ops",
    "action": "write",
    "handlerName": "surgical_compliance",
    "diagnostics": "Forbidden pattern detected"
  }'
```
