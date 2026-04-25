# Database & Storage Patterns

## Overview

This document covers indexing strategies, query optimization, transaction isolation, event sourcing, caching patterns, NoSQL vs SQL tradeoffs, and sharding/partitioning. These concepts enable MasterControl to become a backend architect.

## Indexing Strategies

### Index Types

#### B-Tree Index

- **Structure**: Balanced tree structure
- **Use Case**: Equality and range queries
- **Benefits**: Fast lookups, ordered data
- **Drawbacks**: Slower writes, storage overhead

```sql
CREATE INDEX idx_users_email ON users(email);
```

#### Hash Index

- **Structure**: Hash table
- **Use Case**: Equality queries only
- **Benefits**: Very fast equality lookups
- **Drawbacks**: No range queries, no ordering

```sql
CREATE INDEX idx_users_email_hash ON users USING HASH(email);
```

#### Bitmap Index

- **Structure**: Bitmap for each value
- **Use Case**: Low cardinality columns
- **Benefits**: Compact, fast for AND/OR
- **Drawbacks**: Not for high cardinality

```sql
CREATE INDEX idx_users_status ON users(status) USING bitmap;
```

#### Full-Text Index

- **Structure**: Inverted index
- **Use Case**: Text search
- **Benefits**: Fast text search
- **Drawbacks**: Storage overhead

```sql
CREATE INDEX idx_posts_content ON posts USING gin(to_tsvector('english', content));
```

#### Composite Index

- **Structure**: Index on multiple columns
- **Use Case**: Queries on multiple columns
- **Benefits**: Single index for multi-column queries
- **Drawbacks**: Only useful for prefix queries

```sql
CREATE INDEX idx_users_name_email ON users(name, email);
```

### Index Best Practices

- **Selective Columns**: Index selective columns
- **Foreign Keys**: Index foreign keys
- **Query Patterns**: Index based on query patterns
- **Monitor**: Monitor index usage
- **Remove Unused**: Remove unused indexes

### Index Maintenance

- **Rebuild**: Rebuild fragmented indexes
- **Analyze**: Analyze index statistics
- **Monitor**: Monitor index performance
- **Optimize**: Optimize index strategy

## Query Optimization

### Query Analysis

#### EXPLAIN

```sql
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
```

#### EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

### Optimization Techniques

#### Select Only Needed Columns

```sql
-- Bad
SELECT * FROM users;

-- Good
SELECT id, name FROM users;
```

#### Use WHERE Instead of HAVING

```sql
-- Bad
SELECT status, COUNT(*) FROM users GROUP BY status HAVING status = 'active';

-- Good
SELECT status, COUNT(*) FROM users WHERE status = 'active' GROUP BY status;
```

#### Use LIMIT

```sql
-- Bad
SELECT * FROM posts;

-- Good
SELECT * FROM posts LIMIT 100;
```

#### Use EXISTS Instead of IN

```sql
-- Bad
SELECT * FROM users WHERE id IN (SELECT user_id FROM posts);

-- Good
SELECT * FROM users WHERE EXISTS (SELECT 1 FROM posts WHERE user_id = users.id);
```

#### Avoid Wildcard Leading

```sql
-- Bad
SELECT * FROM users WHERE name LIKE '%john%';

-- Good
SELECT * FROM users WHERE name LIKE 'john%';
```

#### Use UNION ALL Instead of UNION

```sql
-- Bad (deduplicates)
SELECT name FROM users_a UNION SELECT name FROM users_b;

-- Good (no deduplication)
SELECT name FROM users_a UNION ALL SELECT name FROM users_b;
```

### Join Optimization

#### Join Order

- **Small Tables First**: Join small tables first
- **Filtered Tables**: Join filtered tables first
- **Index**: Use indexes on join columns

#### Join Types

- **INNER JOIN**: Only matching rows
- **LEFT JOIN**: All left table rows
- **RIGHT JOIN**: All right table rows
- **FULL JOIN**: All rows from both tables

### Subquery Optimization

#### Convert to JOIN

```sql
-- Bad
SELECT * FROM users WHERE id IN (SELECT user_id FROM posts);

-- Good
SELECT DISTINCT users.* FROM users JOIN posts ON users.id = posts.user_id;
```

#### Use CTE

```sql
WITH active_users AS (
  SELECT * FROM users WHERE status = 'active'
)
SELECT * FROM active_users WHERE created_at > '2024-01-01';
```

## Transaction Isolation

### ACID Properties

- **Atomicity**: All or nothing
- **Consistency**: Valid state
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed transactions persist

### Isolation Levels

#### Read Uncommitted

- **Description**: Can read uncommitted changes
- **Phenomena**: Dirty reads, non-repeatable reads, phantoms
- **Use Case**: Rarely used

#### Read Committed

- **Description**: Can only read committed changes
- **Phenomena**: Non-repeatable reads, phantoms
- **Use Case**: Default in many databases

#### Repeatable Read

- **Description**: Same query returns same results
- **Phenomena**: Phantoms
- **Use Case**: When repeatable reads needed

#### Serializable

- **Description**: Full isolation
- **Phenomena**: None
- **Use Case**: When strict isolation needed

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

### Concurrency Control

#### Optimistic Concurrency

- **Versioning**: Use version numbers
- **Check**: Check version on update
- **Retry**: Retry on conflict

```sql
UPDATE users SET name = 'John', version = version + 1
WHERE id = 1 AND version = 5;
```

#### Pessimistic Concurrency

- **Locking**: Lock resources
- **Block**: Block other transactions
- **Commit**: Release locks on commit

```sql
SELECT * FROM users WHERE id = 1 FOR UPDATE;
```

### Deadlocks

- **Detection**: Detect deadlocks
- **Prevention**: Order resource access
- **Timeout**: Set lock timeouts
- **Retry**: Retry on deadlock

## Event Sourcing

### Concept

- **Events**: Store events instead of state
- **Replay**: Replay events to rebuild state
- **Audit**: Complete audit trail
- **Temporal**: Query state at any point in time

### Event Structure

```json
{
  "eventId": "123",
  "eventType": "UserCreated",
  "aggregateId": "user-123",
  "data": {
    "name": "John",
    "email": "john@example.com"
  },
  "timestamp": "2024-04-24T20:00:00Z",
  "version": 1
}
```

### Event Store

- **Append Only**: Events only appended
- **Immutable**: Events never changed
- **Ordered**: Events ordered by time
- **Versioned**: Version for optimistic concurrency

### Projection

- **Read Model**: Separate read model
- **Subscribe**: Subscribe to events
- **Update**: Update read model on events
- **Query**: Query read model

### Benefits

- **Audit Trail**: Complete audit trail
- **Temporal**: Query past state
- **Debugging**: Replay events to debug
- **Scalability**: Scale read/write separately

### Challenges

- **Complexity**: More complex architecture
- **Event Schema**: Event schema evolution
- **Debugging**: Harder to debug
- **Learning Curve**: Steep learning curve

## Caching Patterns

### Cache Aside

- **Read**: Check cache, if miss, load from DB, update cache
- **Write**: Write to DB, invalidate cache
- **Benefits**: Simple, consistent
- **Drawbacks**: Cache stampede possible

```python
def get_user(user_id):
    user = cache.get(user_id)
    if user is None:
        user = db.get_user(user_id)
        cache.set(user_id, user)
    return user
```

### Write Through

- **Write**: Write to cache and DB
- **Read**: Read from cache
- **Benefits**: Cache always consistent
- **Drawbacks**: Slower writes

```python
def update_user(user):
    cache.set(user.id, user)
    db.update_user(user)
```

### Write Behind

- **Write**: Write to cache, async write to DB
- **Read**: Read from cache
- **Benefits**: Fast writes
- **Drawbacks**: Data loss possible

### Refresh Ahead

- **Refresh**: Refresh cache before expiry
- **Benefits**: No cache misses
- **Drawbacks**: Complex

### Cache Invalidation

- **Time-Based**: Time-based expiration
- **Event-Based**: Event-based invalidation
- **Manual**: Manual invalidation
- **Write-Through**: Automatic invalidation

### Cache Strategies

- **LRU**: Least Recently Used
- **LFU**: Least Frequently Used
- **TTL**: Time To Live
- **Size-Based**: Size-based eviction

### Distributed Caching

- **Redis**: In-memory data store
- **Memcached**: Distributed memory cache
- **Hazelcast**: Distributed data grid
- **Consistency**: Cache consistency

## NoSQL vs SQL

### SQL (Relational)

#### Advantages

- **Schema**: Enforced schema
- **Relations**: Strong relations
- **ACID**: ACID transactions
- **Mature**: Mature ecosystem
- **SQL**: Standard query language

#### Use Cases

- **Structured Data**: Structured data
- **Relations**: Complex relations
- **Transactions**: ACID transactions
- **Reporting**: Complex queries

### NoSQL

#### Document (MongoDB)

- **Structure**: Document-based
- **Schema**: Flexible schema
- **Scaling**: Horizontal scaling
- **Query**: Rich query language

```javascript
db.users.insertOne({
  name: 'John',
  email: 'john@example.com',
  posts: [],
});
```

#### Key-Value (Redis)

- **Structure**: Key-value pairs
- **Performance**: Very fast
- **Use Case**: Caching, sessions
- **Limitations**: Limited query capabilities

```redis
SET user:123 '{"name":"John"}'
GET user:123
```

#### Column-Family (Cassandra)

- **Structure**: Column-family
- **Scaling**: Horizontal scaling
- **Use Case**: Time-series, big data
- **Query**: Limited query capabilities

```cql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT
);
```

#### Graph (Neo4j)

- **Structure**: Graph
- **Relations**: Native relations
- **Use Case**: Social networks, recommendations
- **Query**: Cypher query language

```cypher
CREATE (u:User {name: "John"})
RETURN u
```

### Tradeoffs

- **Schema**: SQL has schema, NoSQL flexible
- **Scaling**: NoSQL scales horizontally better
- **Transactions**: SQL has ACID, NoSQL varies
- **Query**: SQL has complex queries, NoSQL limited
- **Maturity**: SQL more mature

## Sharding & Partitioning

### Horizontal Partitioning (Sharding)

- **Definition**: Split data across multiple databases
- **Benefits**: Scalability, performance
- **Challenges**: Complex queries, cross-shard transactions

### Sharding Strategies

#### Range-Based Sharding

- **Strategy**: Shard by range of values
- **Example**: Shard users by ID range
- **Benefits**: Simple
- **Drawbacks**: Uneven distribution

#### Hash-Based Sharding

- **Strategy**: Shard by hash of key
- **Example**: Shard users by hash of ID
- **Benefits**: Even distribution
- **Drawbacks**: Rebalancing hard

#### Directory-Based Sharding

- **Strategy**: Use directory to map keys to shards
- **Example**: Directory service
- **Benefits**: Flexible
- **Drawbacks**: Additional hop

### Vertical Partitioning

- **Definition**: Split tables by columns
- **Benefits**: Performance for specific queries
- **Drawbacks**: More complex queries

### Functional Partitioning

- **Definition**: Partition by business function
- **Example**: Users in one DB, posts in another
- **Benefits**: Isolation
- **Drawbacks**: Cross-functional queries

### Consistent Hashing

- **Ring**: Hash ring
- **Virtual Nodes**: Multiple virtual nodes per physical node
- **Benefits**: Even distribution, minimal rebalancing
- **Use Case**: Distributed caches, databases

## Database Design Patterns

### Normalization

- **1NF**: Atomic values
- **2NF**: No partial dependencies
- **3NF**: No transitive dependencies
- **BCNF**: Boyce-Codd normal form

### Denormalization

- **Purpose**: Improve read performance
- **Trade-off**: Redundancy for speed
- **Use Case**: Read-heavy workloads

### Soft Delete

- **Concept**: Mark as deleted instead of deleting
- **Implementation**: Add deleted_at column
- **Benefits**: Can recover, audit trail
- **Drawbacks**: Storage overhead

```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
UPDATE users SET deleted_at = NOW() WHERE id = 123;
```

### Audit Trail

- **Concept**: Track all changes
- **Implementation**: Audit table or triggers
- **Benefits**: Complete history
- **Drawbacks**: Storage overhead

```sql
CREATE TABLE users_audit (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(10),
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMP DEFAULT NOW()
);
```

## Best Practices

### Schema Design

- **Normalization**: Normalize first, denormalize for performance
- **Indexes**: Index based on query patterns
- **Constraints**: Use constraints for data integrity
- **Naming**: Consistent naming conventions

### Query Design

- **EXPLAIN**: Use EXPLAIN to understand queries
- **Indexes**: Use indexes effectively
- **Joins**: Use appropriate join types
- **Limit**: Use LIMIT to limit results

### Transactions

- **Short**: Keep transactions short
- **Isolation**: Use appropriate isolation level
- **Retry**: Retry on conflicts
- **Deadlocks**: Handle deadlocks

### Performance

- **Monitor**: Monitor database performance
- **Optimize**: Optimize based on metrics
- **Cache**: Use caching appropriately
- **Partition**: Partition for scale
