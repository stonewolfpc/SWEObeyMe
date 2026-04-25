# Cursor APIs Overview

**Source:** https://cursor.com/docs/api  
**License:** Proprietary

## Authentication

Cursor APIs use Basic Authentication with an API key. The API key should be sent as the username in the Basic Auth header, with an empty password.

### Creating API Keys

- Navigate to your Cursor settings
- Generate API keys in the API key management section
- Each key can be scoped to specific permissions

## Rate Limiting

Different API endpoints have different rate limits:

### Admin API

- Standard rate limits apply
- Designed for administrative operations

### Analytics API

- Rate limited to prevent abuse
- Supports HTTP caching with ETags

### AI Code Tracking API

- Rate limited based on subscription tier
- Supports HTTP caching with ETags

### Cloud Agents API

- Rate limits depend on agent type
- Higher limits for enterprise accounts

## HTTP Caching with ETags

Analytics and AI Code Tracking APIs support HTTP caching using ETags.

### Example Workflow

**Initial Request:**

```
GET /api/analytics
Authorization: Basic <api_key>:
```

**Response:**

```
ETag: "abc123"
Content-Type: application/json
{
  "data": {...}
}
```

**Subsequent Request:**

```
GET /api/analytics
Authorization: Basic <api_key>:
If-None-Match: "abc123"
```

**Response (if not modified):**

```
304 Not Modified
```

## Best Practices

### 1. Implement Exponential Backoff

When encountering rate limits, implement exponential backoff:

- Initial delay: 1 second
- Maximum delay: 60 seconds
- Multiply delay by 2 after each retry

### 2. Distribute Requests Over Time

Avoid burst requests:

- Spread requests evenly across your rate limit window
- Use request queuing for bulk operations

### 3. Leverage Caching

- Use ETags for conditional requests
- Cache responses locally when appropriate
- Respect cache-control headers

### 4. Monitor Usage

- Track your API usage in real-time
- Set up alerts for approaching rate limits
- Review usage analytics regularly

### 5. Batch Wisely

- Combine related operations when possible
- Use batch endpoints instead of individual calls
- Balance batch size against timeout limits

### 6. Poll at Appropriate Intervals

- Use webhooks when available for real-time updates
- If polling is necessary, use appropriate intervals (e.g., 5-60 seconds)
- Implement exponential backoff for long-running operations

### 7. Handle Errors Gracefully

- Implement proper error handling for all HTTP status codes
- Log errors with sufficient context
- Retry transient failures with backoff

## Common Error Responses

### 401 Unauthorized

- Invalid or missing API key
- Expired API key
- Insufficient permissions

### 429 Too Many Requests

- Rate limit exceeded
- Implement exponential backoff
- Check rate limit headers for retry information

### 500 Internal Server Error

- Server-side error
- Retry with exponential backoff
- Contact support if persistent

### 503 Service Unavailable

- Temporary service outage
- Retry with exponential backoff
- Check status page for updates

## Rate Limit Headers

Responses may include rate limit headers:

- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

Use these headers to implement client-side rate limiting and avoid hitting server limits.
