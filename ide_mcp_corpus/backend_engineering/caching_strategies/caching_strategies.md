# Caching Strategies

**Source:** AWS Whitepapers, Redis.io  
**License:** MIT

## What is Cache Invalidation?

Cache invalidation is the process of removing data from a cache when that data is no longer valid or useful. This ensures the cache only contains relevant and up-to-date information, improving cache consistency and preventing errors.

When a change is made to original data, corresponding cached files should be invalidated to reflect the updated data. Without invalidation, users may see outdated information, causing confusion or privacy issues.

Cache invalidation involves synchronizing data copies across multiple system layers (web server, application server, database) to ensure cached content remains consistent with the source of truth.

## What is a Cache?

A cache is a hardware or software component that temporarily stores data used by applications, servers, and browsers. Caching allows faster data retrieval by storing frequently accessed data in provisional storage, reducing latency and improving I/O performance.

**Cache Hit Rate:** The percentage of content requests the cache can fulfill. Higher hit rates mean better performance.

## Caching Patterns

### Cache-Aside (Lazy Loading)

The most common caching strategy:

**Process:**

1. Application needs to read data from database
2. Check cache first to determine if data is available
3. If data is available (cache hit): return cached data to caller
4. If data isn't available (cache miss): query database, populate cache with retrieved data, return data to caller

**Advantages:**

- Cache contains only data the application actually requests (cost-effective cache size)
- Straightforward implementation with immediate performance gains
- Works well with application frameworks that encapsulate lazy caching

**Disadvantages:**

- Initial response time overhead due to additional roundtrips to cache and database on cache miss
- Data only loaded into cache after a cache miss

### Write-Through

Reverses the order of cache population by proactively updating the cache immediately following database updates.

**Process:**

1. Application updates primary database
2. Immediately update cache with same data

**Implementation:**

- Almost always implemented along with lazy loading
- If cache miss occurs (data not present or expired), lazy loading pattern updates the cache

**Advantages:**

- Cache is up-to-date with primary database, higher likelihood of cache hits
- Better overall application performance and user experience
- Optimal database performance due to fewer database reads

**Disadvantages:**

- Infrequently-requested data is also written to cache, resulting in larger, more expensive cache

**Best Practice:**
Effective caching strategy combines both write-through and lazy loading with appropriate expiration times to keep data relevant and lean.

## Types of Cache Invalidation

### Time-Based Invalidation

Invalidates data based on a predetermined time interval. Often implemented by adding a timeout value within the cache entry in cache configuration files.

**Use Cases:**

- News sites displaying latest news hourly
- Weather forecasting applications updating forecasts hourly
- Stock trading applications updating prices every few minutes
- Travel planning applications updating flight availability and prices every few hours

**Advantages:**

- Simple to implement
- Predictable behavior

**Disadvantages:**

- May invalidate data too early or too late
- Doesn't account for actual data changes

### Event-Based Invalidation

Cache is invalidated when a specific event is triggered in the system. Useful when cached data is associated with a specific event or state change.

**Example:**

- Blog post is updated → previous cache data invalidated to ensure users see updated information
- User profile is updated → profile cache invalidated

**Advantages:**

- Immediate invalidation when data changes
- Ensures cache consistency

### Command-Based Invalidation

User triggers a specific defined command or action, resulting in an invalidation ID. A dependency ID is generated and associated with cached objects. When a command with an invalidation ID is executed, matching objects are invalidated.

**Example:**

- User deletes a file from storage → cache for that file invalidated to prevent reappearing in listings

### Group-Based Invalidation

Cache is invalidated based on a group or category. Useful when cached data is associated with a larger group of cache entries, making individual invalidation inefficient.

**Example:**

- News website politics section updated → all politics articles invalidated
- eCommerce product category updated → all products in category invalidated

**Dependency ID:**
A label that identifies which cache entries to invalidate. Same label can be attached to multiple cache entries, creating a group for invalidation rules.

## Cache Invalidation Strategies

### Cache-Aside Pattern

Application first checks cache for requested data. If not found (cache miss), fetch from primary storage, store in cache, then return to user. Subsequent requests served from cache.

**Implementation:**

- Use cache keys to uniquely identify data in cache
- Set appropriate expiration times
- Handle cache misses gracefully

### Write-Through Pattern

Data written to cache and primary database simultaneously. Ensures cache is always up-to-date.

### Write-Behind (Write-Back) Pattern

Data written to cache first, then asynchronously written to database. Improves write performance but risks data loss if cache fails before write to database.

### Write-Around Pattern

Data written directly to database, bypassing cache. Cache populated only on read (lazy loading). Useful for data written once but rarely read.

## Cache Invalidation Best Practices

### Set Appropriate Expiration Times

- Balance between freshness and performance
- Consider data change frequency
- Use different expiration times for different data types

### Use Hierarchical Caching

- Multi-level caching (browser → CDN → application → database)
- Each level has different expiration strategies
- Reduces load on backend systems

### Implement Cache Warming

- Pre-populate cache with frequently accessed data
- Load cache during off-peak hours
- Improve initial user experience

### Monitor Cache Performance

- Track cache hit rates
- Monitor cache size and memory usage
- Identify cache misses and optimize accordingly

### Handle Cache Failures Gracefully

- Fallback to database when cache is unavailable
- Implement circuit breakers
- Log cache failures for debugging

### Use Appropriate Cache Storage

- In-memory caches (Redis, Memcached) for high-performance needs
- Distributed caches for multi-instance deployments
- CDN caches for static content

### Consider Data Consistency

- Strong consistency for critical data
- Eventual consistency for less critical data
- Implement cache coherency protocols for distributed systems

## Distributed Caching Considerations

### Cache Coherency

Multiple service instances behind load balancers, each maintaining local cache, creates consistency challenges. Solutions include:

- Centralized cache (Redis cluster)
- Cache invalidation messages between instances
- Versioned cache keys

### Cache Stampede

Multiple cache misses cause simultaneous database queries. Mitigation strategies:

- Request coalescing
- Lock-based caching
- Probabilistic early expiration

### Cache Partitioning

Distribute cache data across multiple nodes for:

- Horizontal scaling
- Reduced single-node load
- Improved availability

## Performance Optimization

### Cache Key Design

- Use meaningful, consistent keys
- Include relevant parameters
- Avoid overly complex keys
- Consider key length impact on memory

### Compression

- Compress cached data to reduce memory usage
- Balance compression overhead against memory savings
- Use appropriate compression algorithms

### Serialization

- Choose efficient serialization formats
- Consider binary formats for performance
- Balance readability with performance

### Eviction Policies

- LRU (Least Recently Used)
- LFU (Least Frequently Used)
- FIFO (First In, First Out)
- TTL-based eviction
- Choose based on access patterns
