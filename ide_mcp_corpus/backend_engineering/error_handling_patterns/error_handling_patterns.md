# Error Handling Patterns

**Source:** Codecentric, Microsoft Learn, Martin Fowler  
**License:** MIT

## What is Resilience?

Resilience is the ability of a system to continue operating correctly despite failures, errors, or unexpected conditions. Resilience patterns help build fault-tolerant software that can handle communication issues with unreliable services over unreliable channels.

## Resilience Patterns

### Retry Pattern

Automatically retry failed operations a configurable number of times before marking as failure.

**When to Use:**

- Temporary network problems (packet loss)
- Internal errors of target service (database outage)
- No or slow responses due to high load

**Implementation Considerations:**

- Configure maximum retry attempts
- Use exponential backoff to avoid overwhelming service
- Retry only on idempotent operations
- Differentiate between retryable and non-retryable errors

**Risks:**

- Can make overload worse if service is struggling
- May cause duplicate operations
- Increases latency on failures

**Best Practices:**

- Combine with circuit breaker to prevent cascading failures
- Use jitter in backoff to avoid thundering herd
- Log retry attempts for monitoring
- Set appropriate timeout per retry attempt

### Fallback Pattern

Enable service to continue execution when request to another service fails by providing fallback value or alternative behavior.

**When to Use:**

- When degraded functionality is acceptable
- When alternative data sources exist
- When business logic can handle missing data

**Example Scenarios:**

- Payment service: Fallback to simple business rule for fraud detection
- Recommendation service: Return cached or default recommendations
- Configuration service: Use local cached configuration

**Risks:**

- May hide real failures
- Fallback values may not be appropriate
- Can introduce security vulnerabilities

**Best Practices:**

- Document fallback behavior clearly
- Monitor fallback usage
- Ensure fallback is safe and appropriate
- Consider alerting when fallback is used frequently

### Timeout Pattern

Set maximum time to wait for response, treat request as failed if no response within timeout.

**When to Use:**

- All external service calls
- Database queries
- Network operations
- Any operation that might hang

**Implementation Considerations:**

- Set timeouts appropriately - high enough for slow responses, low enough to detect failures
- Different timeouts for different operations
- Consider timeout hierarchy (connect timeout, read timeout)

**Risks:**

- Can't distinguish between timeout and failure
- May cause duplicate operations if combined with retry
- Hard to choose optimal timeout value

**Handling Timeouts:**

- Log timeout events
- Consider idempotency for timeout scenarios
- Provide clear error messages
- Monitor timeout rates

**Example:** Order placement timeout

- Can't determine if order succeeded or failed
- Risk of duplicate orders if retried
- Risk of customer dissatisfaction if marked failed

### Circuit Breaker Pattern

Protect services from being overwhelmed when already partially unavailable due to high load. Switches between three states: closed (requests flow), open (requests rejected), half-open (one probe request to test recovery).

**States:**

- **Closed:** Normal operation, requests pass through
- **Open:** Circuit is tripped, requests rejected immediately
- **Half-open:** Probe request allowed to test if service recovered

**When to Use:**

- Protecting downstream services from overload
- Preventing cascading failures
- Providing fast failure when service is down

**Implementation:**

- Track failure rate over time window
- Trip circuit when failure threshold exceeded
- After cooldown period, enter half-open state
- On success in half-open, close circuit
- On failure in half-open, return to open

**Configuration Parameters:**

- Failure threshold (e.g., 5 failures in 10 seconds)
- Success threshold for recovery (e.g., 2 successes)
- Timeout duration for open state
- Timeout duration for half-open state

**Best Practices:**

- Combine with retry pattern (but don't retry when circuit is open)
- Use fallback when circuit is open
- Monitor circuit state transitions
- Log circuit events for debugging

## Combining Patterns

### Retry + Circuit Breaker

- Retry handles transient failures
- Circuit breaker prevents overwhelming failing service
- Don't retry when circuit is open
- Configure retry attempts below circuit breaker threshold

### Retry + Fallback

- Retry first to handle transient issues
- Use fallback after retries exhausted
- Ensure fallback doesn't hide persistent failures
- Monitor fallback usage rate

### Timeout + Retry

- Set timeout per retry attempt
- Use exponential backoff between retries
- Consider total timeout across all retries
- Handle timeout-specific errors appropriately

### Circuit Breaker + Fallback

- Use fallback when circuit is open
- Provide degraded functionality during outages
- Monitor fallback usage
- Alert when circuit remains open for extended periods

## Implementation Approaches

### Libraries and Frameworks

**Java:**

- Resilience4j: Retry, Circuit Breaker, Rate Limiter, Bulkhead, Timeout
- Hystrix (deprecated, but still referenced)
- Spring Retry

**.NET:**

- Polly: Retry, Circuit Breaker, Fallback, Timeout, Bulkhead
- Microsoft Resilience Framework

**Go:**

- Hystrix-go
- Circuit breaker libraries

**JavaScript/TypeScript:**

- Cockatiel: Retry, Circuit Breaker, Timeout
- resilience: Retry, Circuit Breaker, Timeout

### Manual Implementation

- Use state machines for circuit breaker
- Implement exponential backoff with jitter
- Track metrics for monitoring
- Ensure thread safety in concurrent environments

## Best Practices

### Error Classification

Distinguish between:

- **Transient errors:** Network issues, temporary overload (retry)
- **Permanent errors:** Invalid data, authentication failures (don't retry)
- **Timeout errors:** No response within timeout (may retry with caution)

### Idempotency

- Design operations to be idempotent when possible
- Use unique request IDs for deduplication
- Implement idempotency keys for critical operations
- Document idempotency guarantees

### Monitoring and Observability

- Track pattern execution metrics
- Monitor failure rates and circuit state
- Log pattern invocations and outcomes
- Set up alerts for abnormal patterns
- Use distributed tracing to track failures

### Testing

- Test failure scenarios
- Verify pattern behavior under load
- Test timeout configurations
- Validate fallback logic
- Simulate circuit breaker state transitions

### Configuration

- Make pattern parameters configurable
- Support dynamic configuration updates
- Provide sensible defaults
- Document configuration options
- Validate configuration values

## Common Pitfalls

- **Over-retrying:** Too many retries overwhelm service
- **Wrong timeouts:** Too high = slow failures, too low = false failures
- **Inappropriate fallbacks:** Hiding real issues or providing unsafe defaults
- **Missing monitoring:** Can't detect when patterns are firing
- **Tight coupling:** Patterns too tightly integrated with business logic
- **Ignoring context:** Not considering operation semantics when applying patterns

## Summary

Resilience patterns are essential for building robust distributed systems. Key points:

- Use retry for transient failures with exponential backoff
- Implement fallback for graceful degradation
- Set appropriate timeouts for all external operations
- Use circuit breaker to protect against cascading failures
- Combine patterns appropriately based on use case
- Monitor and alert on pattern usage
- Test failure scenarios thoroughly
- Make configurations tunable
- Ensure operations are idempotent when possible
