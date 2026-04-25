# Distributed Systems

**Source:** PingCAP, Google SRE  
**License:** MIT

## CAP Theorem

The CAP Theorem is a cornerstone in distributed system design, offering a framework to understand the inherent trade-offs between Consistency, Availability, and Partition Tolerance.

### Components

**Consistency (C)**
- All nodes see the same data at the same time
- Every read receives the most recent write or an error
- Ensures data reliability across the system

**Availability (A)**
- Every request receives a (non-error) response
- System remains responsive even during failures
- Guarantees the system is operational

**Partition Tolerance (P)**
- System continues operating despite network partitions
- Messages can be lost or delayed between nodes
- Essential for distributed systems over unreliable networks

### The Trade-Off

When a distributed system experiences a network partition, it must choose how to behave. You can optimize for consistency or for availability, but not both at the exact moment of the partition.

**CP Systems (Consistency + Partition Tolerance)**
- Prioritize consistency over availability
- May reject requests during partitions to maintain consistency
- Examples: Traditional databases, distributed key-value stores

**AP Systems (Availability + Partition Tolerance)**
- Prioritize availability over consistency
- Accept stale data during partitions
- Use eventual consistency to converge later
- Examples: DNS, CDN systems, many NoSQL databases

### Eventual Consistency

In AP systems, eventual consistency allows nodes to temporarily diverge but guarantees they will converge to the same state given sufficient time without new updates.

**How it works:**
- Nodes accept writes during partitions
- Conflicting writes are resolved using conflict resolution strategies
- System converges to consistent state when partition heals

### Real-World CAP Tradeoffs

**Strong Consistency Use Cases:**
- Financial transactions
- Inventory management
- User authentication

**Eventual Consistency Use Cases:**
- Social media feeds
- Product recommendations
- Analytics and logging

## PACELC Theorem

The PACELC theorem extends CAP by introducing latency as an additional trade-off factor.

**PACELC:** In case of Partition (P), trade off between Availability (A) and Consistency (C); Else (E), trade off between Latency (L) and Consistency (C).

This means:
- During partition: Choose between availability and consistency
- During normal operation: Choose between low latency and consistency

## Consensus Algorithms

Consensus algorithms enable distributed systems to agree on a single data value despite unreliable nodes and network failures.

### Paxos
- First widely-known consensus algorithm
- Complex to implement and understand
- Used in Google Chubby and Apache ZooKeeper

### Raft
- Designed for understandability
- Easier to implement correctly
- Used in etcd, Consul, CockroachDB
- Leader election, log replication, safety

### Viewstamped Replication
- Early consensus protocol
- Similar to Raft in many aspects
- Used in some distributed databases

## Distributed Data Patterns

### Replication
- **Master-Slave:** One master accepts writes, slaves replicate
- **Multi-Master:** Multiple nodes accept writes, conflict resolution required
- **Leaderless:** All nodes equal, quorum-based writes

### Sharding
- Horizontal partitioning of data
- Each shard contains subset of data
- Improves scalability and performance
- Requires careful shard key selection

### Consistent Hashing
- Distributes data across nodes uniformly
- Minimizes data movement when nodes added/removed
- Used in distributed caches and databases

## Fault Tolerance

### Replication Strategies
- **Synchronous:** Wait for all replicas before confirming write
- **Asynchronous:** Confirm write immediately, replicate in background
- **Quorum-based:** Require majority of replicas to confirm

### Failure Detection
- Heartbeat mechanisms
- Gossip protocols
- Failure detectors with timeouts

### Recovery
- Automatic failover
- Data reconciliation
- Repair mechanisms

## Distributed Transactions

### Two-Phase Commit (2PC)
- Coordinator manages transaction across participants
- Prepare phase: Participants vote to commit
- Commit phase: Coordinator commits or aborts
- Blocking protocol - coordinator failure causes blocking

### Three-Phase Commit (3PC)
- Adds pre-commit phase to 2PC
- Non-blocking under certain failure conditions
- More complex, rarely used in practice

### Saga Pattern
- Break distributed transaction into local transactions
- Each transaction has compensating action for rollback
- Choreography or orchestration coordination
- Eventual consistency model

## Clock Synchronization

### Physical Clocks
- NTP (Network Time Protocol)
- Clock drift and skew
- Limited precision

### Logical Clocks
- Lamport timestamps
- Vector clocks
- Causal ordering

### Hybrid Clocks
- TrueTime (Spanner)
- Hybrid Logical Clocks
- Combining physical and logical time
