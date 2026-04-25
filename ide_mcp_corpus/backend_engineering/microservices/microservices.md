# Microservices Architecture

**Source:** ArchitectureDiagram.ai, Microsoft Learn  
**License:** MIT

## API Gateway Pattern

The API Gateway is the front door to your microservice architecture. It sits between external clients and internal services, handling request routing, authentication, rate limiting, and response aggregation.

**When to use:**
- Multiple services that external clients need to access
- Want to avoid exposing internal service boundaries to outside world
- Need centralized cross-cutting concerns (auth, logging, rate limiting)

**Key trade-offs:**
- Centralizes cross-cutting concerns
- Introduces single point of failure
- Mitigate with redundant gateway instances behind load balancer

**Responsibilities:**
- Request routing and load balancing
- Authentication and authorization
- Rate limiting and throttling
- Response aggregation
- Protocol translation (REST to gRPC, etc.)
- API versioning

## Service Mesh Pattern

A service mesh adds a sidecar proxy (like Envoy or Linkerd) next to every service instance. These proxies handle service-to-service communication, including load balancing, retries, circuit breaking, mutual TLS, and observability - without requiring changes to application code.

**When to use:**
- Dozens or hundreds of services
- Need consistent networking policies across all services
- Kubernetes environments (CNCF 2023: 57% of organizations run containerized microservices)

**Key trade-offs:**
- Powerful observability and security features
- Adds operational complexity
- Resource overhead - each service has additional proxy container

**Features:**
- Service discovery and load balancing
- Traffic management (canary deployments, A/B testing)
- Security (mutual TLS, mTLS)
- Observability (metrics, tracing, logging)
- Retry and circuit breaking
- Fault injection for testing

**Popular implementations:**
- Istio
- Linkerd
- Consul Connect
- AWS App Mesh

## Event Sourcing Pattern

Instead of storing the current state of an entity, event sourcing stores every state change as an immutable event. The current state is derived by replaying the event stream. Like a Git log for your data - you can always reconstruct any past state.

**When to use:**
- Need complete audit trail (financial systems, healthcare)
- Need to reconstruct historical state
- Different consumers need different views of same data

**Key trade-offs:**
- Complete audit history
- Enables powerful event-driven workflows
- Adds complexity in event schema evolution
- Handling eventual consistency
- Debugging across event streams

**Implementation considerations:**
- Event store design
- Snapshot optimization for replay performance
- Event versioning and schema evolution
- Idempotent event handlers
- Event replay for debugging and testing

## CQRS Pattern (Command Query Responsibility Segregation)

CQRS separates read and write operations into different models. The write model handles commands (create, update, delete) with a normalized database optimized for consistency. The read model handles queries with a denormalized database optimized for fast reads.

**When to use:**
- Read and write patterns have very different performance characteristics
- High read-to-write ratios (e.g., 10:1 or higher)
- Complex queries that would slow down write operations

**Key trade-offs:**
- Enables independent scaling of reads and writes
- Introduces eventual consistency between models
- Often paired with Event Sourcing
- Increased complexity

**Implementation:**
- Write model: Normalized, optimized for consistency
- Read model: Denormalized, optimized for queries
- Synchronization: Events from write model update read model
- Separate databases for read and write

## Saga Pattern

In a monolith, you use database transactions to ensure consistency across operations. In microservices, each service has its own database, so you can't use traditional ACID transactions. The Saga pattern manages distributed transactions by breaking them into a sequence of local transactions, each with a compensating action for rollback.

**When to use:**
- Business operation spans multiple services
- Need to maintain data consistency across services
- Example: Order placement involving inventory, payment, shipping

**Saga Implementations:**

**Choreography:**
- Each service publishes events that trigger next step
- Simpler to implement
- Harder to track overall flow
- No central coordinator

**Orchestration:**
- Central orchestrator service coordinates saga
- Calls each service in sequence
- Easier to understand and debug
- Introduces coordinator dependency

**Compensating Transactions:**
- Each step has corresponding undo action
- Executed in reverse order on failure
- Must be idempotent
- May leave system in partially compensated state

## Strangler Fig Pattern

Named after a type of fig tree that grows around an existing tree, this pattern is used to incrementally migrate a monolith to microservices. Build new features as microservices, route traffic to them via API gateway or proxy, and gradually replace monolith functionality until the monolith can be decommissioned.

**When to use:**
- Migrate from monolith to microservices
- Avoid risky "big bang" rewrite
- Most common pattern for large-scale migrations

**Implementation steps:**
1. Identify monolith functionality to extract
2. Create new microservice for that functionality
3. Configure API gateway to route traffic
4. Migrate data if needed
5. Redirect traffic incrementally
6. Remove functionality from monolith
7. Repeat until monolith is retired

**Benefits:**
- Low risk - can rollback at any point
- Continuous delivery possible
- Learn and adapt during migration
- No system downtime

## Additional Patterns

### Backend for Frontend (BFF)
- Dedicated API gateway per client type
- Optimizes responses for specific clients
- Reduces over-fetching

### Bulkhead Pattern
- Isolate failures to prevent cascading
- Separate thread pools for different services
- Prevents resource exhaustion

### Sidecar Pattern
- Deploy helper components alongside main service
- Shared deployment lifecycle
- Language-agnostic extensibility

### Ambassador Pattern
- Service-specific proxy
- Handles cross-cutting concerns
- Similar to sidecar but focused on networking
