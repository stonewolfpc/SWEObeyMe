# Rate Limiting

**Source:** API7.ai, GeeksforGeeks  
**License:** MIT

## What is Rate Limiting?

Rate limiting controls how many requests a client can make to an API or service within a specific time window. When a client exceeds the limit, subsequent requests are rejected (typically with HTTP 429 Too Many Requests) until the window resets.

**Benefits:**

- Protects API from abuse and DDoS attacks
- Ensures fair resource allocation
- Prevents system overload
- Controls costs for paid APIs
- Maintains service availability for all users

## Rate Limiting Algorithms

### 1. Fixed Window Counter

Divides time into fixed windows (e.g., 60 seconds). Maintains a counter for each client per window. When a request arrives, increment counter. If counter exceeds limit, block request until next window.

**Pros:**

- Easy to implement and understand
- Minimal memory usage

**Cons:**

- "Bursty" traffic at window boundaries
- Client could make limit requests in last second of one window and limit requests in first second of next

**Example:** 100 requests per minute

- Client makes 100 requests at 59:59
- Client makes 100 requests at 00:00
- Effectively 200 requests in 2 seconds

### 2. Rolling Window Log (Sliding Window Log)

Keeps a log of timestamps for each request per client. When new request arrives, count requests within last N seconds by examining timestamps. If count exceeds limit, block request. Discard timestamps outside window.

**Pros:**

- More accurate than fixed window
- Avoids bursty boundary issue

**Cons:**

- Requires storing potentially large number of timestamps per client
- Memory-intensive for high-volume APIs

### 3. Leaky Bucket

Bucket with fixed capacity and small hole at bottom. Requests are water drops entering bucket. If bucket is full, new requests overflow and are discarded. Water leaks out at constant rate, representing processing rate.

**Pros:**

- Smooths out bursty traffic
- Ensures constant output rate
- Good for traffic shaping

**Cons:**

- Requests might be delayed if bucket is full
- Doesn't directly limit number of requests, only processing rate
- Harder to configure burst capacity

### 4. Token Bucket

Bucket contains "tokens." Requests consume tokens. If request arrives and tokens available, remove token and process request. If no tokens available, block request. Tokens added at fixed rate, up to maximum capacity.

**Pros:**

- Allows bursts of traffic (up to bucket capacity)
- Enforces long-term average rate
- Efficient - only stores current token count and last refill timestamp
- Most flexible and widely used

**Cons:**

- Requires careful tuning of bucket capacity and refill rate

**Example:** 10 tokens, refill rate 1 token/second

- Client can make 10 requests immediately (burst)
- Then 1 request per second thereafter
- If client waits 5 seconds, can make 5 requests in burst

### 5. Sliding Window Counter

Hybrid approach combining fixed window and rolling window. Divides time into smaller buckets (e.g., 1-second buckets). Maintains counters for each bucket. When calculating rate, sum counters from relevant window.

**Pros:**

- More accurate than fixed window
- Less memory than rolling window log
- Good balance of accuracy and efficiency

**Cons:**

- More complex than fixed window
- Still has some boundary issues

## Implementation Best Practices

### Where to Implement Rate Limiter

**API Gateway:**

- Centralized control
- Easy to manage and monitor
- Can apply consistent policies across all services
- Adds single point of failure (mitigate with redundancy)

**Application Layer:**

- Service-specific rate limits
- More granular control
- Distributed implementation complexity

**Edge/CDN:**

- Blocks traffic before reaching origin
- Reduces load on infrastructure
- May have limited customization

### Rate Limit Strategies

**Per-User Rate Limiting:**

- Limit based on user ID or API key
- Fair allocation per user
- Requires authentication

**Per-IP Rate Limiting:**

- Limit based on IP address
- No authentication required
- Issues with NAT and shared IPs
- Can be bypassed with proxy farms

**Global Rate Limiting:**

- Limit across all users
- Protects overall system capacity
- May unfairly limit legitimate users

**Tiered Rate Limiting:**

- Different limits for different user tiers
- Common in paid APIs
- Free tier: 100 requests/hour
- Paid tier: 10,000 requests/hour

### Handling Rate Limit Exceeded (HTTP 429)

**Response Headers:**

- `Retry-After`: Seconds until client can retry
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when window resets

**Graceful Degradation:**

- Return cached responses when possible
- Queue requests instead of rejecting
- Provide alternative endpoints with higher limits
- Implement exponential backoff for retries

**Client-Side Handling:**

- Respect Retry-After header
- Implement exponential backoff
- Cache responses to reduce requests
- Use bulk operations when possible

### Configuring Optimal Rate Limits

**Factors to Consider:**

- System capacity and resources
- Expected traffic patterns
- Business requirements
- Cost constraints
- User experience goals

**Start Conservative:**

- Begin with lower limits
- Monitor usage patterns
- Adjust based on metrics
- Gradually increase as confidence grows

## Common Challenges and Solutions

### Distributed Systems and Synchronization

**Challenge:** Multiple servers need to share rate limit state.

**Solutions:**

- Redis for distributed rate limiting
- Consistent hashing for state distribution
- Synchronized clocks (NTP)
- Accept eventual consistency

### False Positives and Legitimate Spikes

**Challenge:** Legitimate traffic spikes trigger rate limits.

**Solutions:**

- Implement burst capacity (token bucket)
- Use sliding window for smoother limits
- Manual override for known events
- Whitelist trusted sources

### Rate Limit Evasion

**Challenge:** Users bypass rate limits with multiple IPs or accounts.

**Solutions:**

- Combine multiple rate limiting strategies
- Implement CAPTCHA for suspicious activity
- Use behavioral analysis
- Monitor for evasion patterns

### Performance Impact

**Challenge:** Rate limiting adds latency and resource overhead.

**Solutions:**

- Use efficient data structures (token bucket)
- Implement in memory when possible
- Batch operations for distributed systems
- Profile and optimize critical paths

## Monitoring and Alerting

**Metrics to Track:**

- Rate limit hit rate
- Requests per client
- System-wide request rate
- Response times
- Error rates

**Alerts:**

- High rate limit hit rate
- Abnormal traffic patterns
- Rate limiter failures
- System overload

## Best Practices Summary

- Choose algorithm based on use case (token bucket for flexibility, fixed window for simplicity)
- Implement at appropriate layer (gateway for central control, application for granularity)
- Provide clear error responses with Retry-After header
- Monitor usage and adjust limits based on patterns
- Consider legitimate traffic spikes in configuration
- Use multiple strategies for comprehensive protection
- Test rate limiting under load
