# Database Patterns

**Source:** Multiple sources including Ben Nadel, GeeksforGeeks  
**License:** MIT

## Indexing Strategies

### Basic Index Concepts

An index in a database is like the index in a book - it points to locations within the storage engine. The database organizes indexes so pointer values can be found extremely fast. Once the database locates desired pointer values, it can quickly read full table records.

**Core Principle:** If you need to access data quickly, index it. If performance isn't a concern, don't index it.

### Composite Indexes and Leftmost Prefixes

A composite (multi-column) index contains multiple columns from the same table. The order of columns in the index matters - you can only leverage a composite index to search for columns in the same order the index provides them.

**Leftmost Prefix Rule:** You don't have to consume all columns in a composite index to gain a performance boost. As long as the search columns match the index order from left to right, the database can leverage the index.

**Example:** Composite index on (lastName, firstName, isPrivateListing)

- ✅ WHERE lastName = ?
- ✅ WHERE lastName = ? AND firstName = ?
- ✅ WHERE lastName = ? AND firstName = ? AND isPrivateListing = ?
- ❌ WHERE isPrivateListing = ?
- ❌ WHERE firstName = ?
- ❌ WHERE firstName = ? AND isPrivateListing = ?

### B-Tree Index Structure

B-Tree is the most common index structure:

- Self-balancing, sorted variation on binary tree
- Shallow but wide shape for fast access
- Supports equality-based access, range-based scanning, and sequential access
- Provides "leftmost prefix" searches

### Range Queries with Composite Indexes

In MySQL, a query can only apply an index-based range-search to the last-consumed column in a composite index.

**Example:** Index on (lastName, firstName)

- ✅ WHERE lastName = ?
- ✅ WHERE lastName >= ?
- ✅ WHERE lastName = ? AND firstName = ?
- ✅ WHERE lastName = ? AND firstName <= ?
- ❌ WHERE lastName <= ? AND firstName >= ?
- ❌ WHERE lastName >= ? AND firstName = ?

### Uniqueness Constraints

Add uniqueness constraints to indexes when you want to guarantee unique values. This:

- Enforces business rules
- Facilitates idempotent workflows
- Prevents duplicate data insertion

**Example:**

```sql
UNIQUE KEY `byEmail` (`email`)
```

### Covering Indexes

A covering index includes all columns needed for a query, eliminating the need to access the table data. This can significantly improve query performance.

### Primary Key vs Secondary Index

- **Primary Key Index:** Typically clustered (in MySQL InnoDB), stores actual data
- **Secondary Index:** Non-clustered, stores pointers to primary key records
- Consider extension tables as an exception to primary key rules

### Index Design Best Practices

1. **Index columns used in WHERE clauses**
2. **Consider SELECTivity** - columns with many unique values benefit more from indexing
3. **Avoid over-indexing** - indexes have write overhead
4. **Use EXPLAIN** to understand how indexes are being applied
5. **Consider read replica index design** - may differ from primary

## Query Optimization

### Query Analysis

Use EXPLAIN or EXPLAIN ANALYZE to understand query execution plans and identify bottlenecks.

### Join Optimization

- Join filtering helps visualize read requirements
- Consider index join columns
- Use appropriate join types (INNER, LEFT, RIGHT, FULL)

### GROUP BY and ORDER BY Optimization

- Index columns used in GROUP BY
- Index columns used in ORDER BY
- At large scale, ORDER BY may require special consideration

### Read Replicas

Read replicas can have different index designs optimized for read patterns vs write patterns.

## Transaction Isolation Levels

### Anomalies Defining Isolation Levels

**1. Dirty Read**
A transaction reads data that has not yet been committed. If the source transaction rolls back, the read data never existed.

**2. Non-Repeatable Read**
A transaction reads the same row twice and gets different values each time due to concurrent updates.

**3. Phantom Read**
Two identical queries return different row sets because new rows matching the criteria were inserted between queries.

### Standard Isolation Levels

**1. Read Uncommitted**

- Lowest isolation level
- Can see uncommitted changes
- Allows dirty reads, non-repeatable reads, phantom reads
- Best concurrency, worst consistency

**2. Read Committed**

- Only sees committed changes
- Eliminates dirty reads
- Still allows non-repeatable reads and phantom reads
- Good balance of concurrency and consistency

**3. Repeatable Read**

- Sees same data throughout transaction duration
- Eliminates dirty reads and non-repeatable reads
- Phantom reads still possible
- Stronger consistency, reduced concurrency

**4. Serializable**

- Highest isolation level
- Transactions execute as if they were the only transaction
- Eliminates all anomalies (dirty reads, non-repeatable reads, phantom reads)
- Best consistency, worst concurrency and performance

### Choosing the Right Isolation Level

Balance data accuracy and performance:

- **Higher levels (Serializable):** Strong consistency, lower concurrency, slower performance
- **Lower levels (Read Uncommitted):** Better concurrency, faster performance, risk of inconsistencies

### Advanced Options

- **Snapshot Isolation:** Uses consistent data snapshots
- **MVCC (Multi-Version Concurrency Control):** Maintains multiple data versions for smoother concurrency
- **READ COMMITTED SNAPSHOT ISOLATION (RCSI):** Reads from versioned snapshot instead of dirty data, non-blocking and consistent

## Data Patterns

### Event Sourcing

Store state changes as a sequence of events rather than current state:

- Every change is recorded as an immutable event
- Current state reconstructed by replaying events
- Use snapshots to optimize loading
- Combine with CQRS for independent read/write scaling

### Soft Delete vs Hard Delete

Consider splitting data instead of soft-deleting it when:

- Data volume is large
- Query performance is critical
- Audit trail is not required

### Idempotent Actions

Leverage UNIQUE indexes to power idempotent workflows:

- Prevent duplicate operations
- Enable safe retries
- Ensure data consistency

## Sharding and Partitioning

### Horizontal Partitioning

Split large tables into smaller, more manageable pieces based on a key:

- Improves query performance
- Enables parallel processing
- Distributes load across servers

### Vertical Partitioning

Split tables by columns:

- Separate frequently accessed from rarely accessed columns
- Improve cache hit rates
- Reduce I/O

### Sharding

Distribute data across multiple database instances:

- Scale horizontally
- Improve availability
- Consider shard key selection carefully

## Caching Patterns

### Application-Level Caching

- Cache frequently accessed data
- Implement cache invalidation strategies
- Consider cache warming

### Database-Level Caching

- Configure buffer pool size appropriately
- Tune for workload patterns
- Monitor cache hit rates

## Performance Tuning

### Configuration Tuning

- Buffer pool size
- Connection pooling
- Query cache configuration

### Monitoring

- Query performance metrics
- Index usage statistics
- Lock wait times
- Cache hit ratios

### Optimization Techniques

- Denormalization for read-heavy workloads
- Materialized views for complex queries
- Stored procedures for frequently executed logic
- Batch operations for bulk inserts/updates
