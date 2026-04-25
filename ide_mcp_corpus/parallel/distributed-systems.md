# Distributed & Parallel Systems

## Overview

This document covers thread pools, work-stealing schedulers, lock-free queues, NUMA behavior, async runtimes, fiber schedulers, and batching strategies. These concepts enable multi-model concurrency, multi-request batching, speculative decoding, and parallel KV cache updates.

## Thread Pools

### Basic Concept

A thread pool maintains a set of worker threads that execute tasks from a queue, avoiding the overhead of creating/destroying threads for each task.

### Components

- **Worker Threads**: Fixed number of threads
- **Task Queue**: Holds pending work
- **Submission Interface**: Add tasks to queue
- **Shutdown Mechanism**: Graceful termination

### Benefits

- Avoid thread creation overhead
- Limit concurrent threads (prevent resource exhaustion)
- Reuse threads for better cache locality
- Simplify resource management

### Implementation Patterns

```cpp
class ThreadPool {
  std::vector<std::thread> workers;
  std::queue<std::function<void()>> tasks;
  std::mutex queue_mutex;
  std::condition_variable condition;
  bool stop;
};
```

### Task Types

- **Fire-and-forget**: Submit, don't wait for result
- **Future-based**: Submit, get future for result
- **Batched**: Submit multiple related tasks
- **Priority**: Tasks with different priorities

### Sizing

Rule of thumb: Number of threads = number of CPU cores for CPU-bound work, more for I/O-bound work.

## Work-Stealing Schedulers

### Execution Model

Work stealing is designed for a strict fork-join model of parallel computation. Computation is a directed acyclic graph with single source and sink.

### Algorithm

Each processor has a double-ended queue (deque) of threads:

**Special behaviors:**

1. **Spawn**: New thread created, current thread pushed to bottom, execute new thread
2. **Stall**: Temporarily halt, pop from bottom of deque
3. **Die**: Same as stall
4. **Enable**: Other thread pushed to bottom, continue current

**Work stealing (when idle):**

1. Pick random processor
2. If their deque non-empty, pop from top and execute
3. Else, repeat

### Child Stealing vs Continuation Stealing

- **Child Stealing**: Steal spawned children (pushed to bottom)
- **Continuation Stealing**: Steal continuation (what to do after current task)
- Continuation stealing often better for load balancing

### Efficiency

- **Space usage**: O(P) where P is number of processors
- **Time bound**: Expected work stealing time close to optimal
- **Contention**: Random selection reduces contention

### Implementations

- Cilk: Work-stealing scheduler
- TBB: Intel Threading Building Blocks
- Go: Goroutine scheduler
- Rust: Rayon work-stealing

### NUMA Awareness

Work stealing can be NUMA-sensitive:

- Prefer stealing from same NUMA node
- Reduces remote memory access
- HPX: `--hpx:numa-sensitive` option

## Lock-Free Queues

### Motivation

Lock-based synchronization causes:

- Contention on lock
- Context switching
- Priority inversion
- Poor scalability

### Lock-Free Principles

- Use atomic operations (CAS, FAA)
- No locks or mutexes
- Wait-free or lock-free progress guarantees
- Better scalability under contention

### Common Patterns

1. **Compare-And-Swap (CAS)**: Atomic conditional update
2. **Fetch-And-Add (FAA)**: Atomic increment
3. **ABA Problem**: Need versioning or double-wide CAS
4. **Rings Buffers**: Circular buffer with head/tail pointers

### Work-Stealing Queue (WSQ)

Double-ended queue with:

- Lock-free push/pop from bottom (owner)
- Synchronized pop from top (thief)
- Private end for owner, public for thieves

### Challenges

- Memory ordering (relaxed, acquire, release)
- ABA problem (use versioning)
- Backoff under contention
- Correctness proofs difficult

### Implementations

- Boost.Lockfree
- Folly (Facebook)
- Concurrency Kit (CK)
- liblfds

## NUMA (Non-Uniform Memory Access)

### Concept

Multi-socket systems have:

- Multiple NUMA nodes (sockets)
- Each node has local memory (fast access)
- Remote memory access is slower
- NUMA ratio: 2-3x slower for remote

### NUMA Effects

- Memory allocation matters
- Thread placement matters
- Data locality critical
- Remote access hurts performance

### Optimization Strategies

1. **Local Allocation**: Allocate memory on same node as thread
2. **First-Touch**: Thread that first touches memory determines location
3. **Thread Binding**: Pin threads to specific cores/NUMA nodes
4. **Data Replication**: Copy data to each node (read-only)
5. **NUMA-Aware Scheduling**: Schedule work near data

### Tools

- `numactl`: Control NUMA policy
- `libnuma`: NUMA API
- `hwloc`: Hardware locality
- `lscpu`: Show CPU topology

### NUMA for LLM Inference

- KV cache allocation per NUMA node
- Model weights replicated or partitioned
- Thread placement for affinity
- Batch scheduling with NUMA awareness

## Async Runtimes

### Concepts

Async runtimes provide:

- Non-blocking I/O
- Task scheduling
- Futures/promises
- Coroutine support

### Models

1. **Callback-based**: Pass callback for completion
2. **Future/Promise**: Get result later
3. **Async/Await**: Coroutines with await syntax
4. **Actor Model**: Message passing between actors

### Implementations

- **libuv**: Node.js I/O backend
- **Boost.Asio**: C++ async I/O
- **Tokio**: Rust async runtime
- **asyncio**: Python async framework
- **TBB**: Intel task scheduler

### Event Loops

Single-threaded event loop:

- Process events sequentially
- Non-blocking I/O
- Good for I/O-bound work
- Poor for CPU-bound work

### Thread Pools in Async Runtimes

- Offload CPU work to thread pool
- Keep event loop responsive
- Parallelize independent tasks
- Limit thread count

### Async for LLM Inference

- Non-blocking model loading
- Async token generation
- Streaming responses
- Batch processing with async

## Fiber Schedulers

### Fibers vs Threads

- **Fibers**: User-space threads, cooperatively scheduled
- **Threads**: Kernel threads, preemptively scheduled
- Fibers cheaper to switch (no kernel transition)
- Fibers require explicit yield

### Benefits

- Very fast context switches
- Millions of fibers possible
- Custom scheduling policies
- Better cache locality

### Challenges

- No preemption (must yield)
- Blocking operations block all fibers
- Need fiber-aware APIs
- Complex scheduling logic

### Use Cases

- Game engines (task graphs)
- High-frequency trading
- Coroutine-based async
- User-level threading

### Implementations

- Boost.Fiber
- Microsoft Fibers (Windows)
- Go goroutines (similar concept)
- Lua coroutines

### Fiber Scheduling Policies

- Round-robin
- Priority-based
- Work-stealing
- Cooperative multitasking

## Batching Strategies

### Request Batching

Combine multiple requests into single batch:

- Reduces per-request overhead
- Improves throughput
- Increases latency (trade-off)
- Common in inference serving

### Dynamic Batching

- Wait for timeout or batch size
- Adaptive based on load
- Continuous batching
- vLLM, TGI use this

### Continuous Batching

- Add requests to batch as they arrive
- Remove completed requests
- Keep batch full
- Maximizes GPU utilization

### Speculative Decoding

- Predict multiple next tokens
- Verify in parallel
- Accept correct prediction
- Reduces sequential dependency

### KV Cache Batching

- Share KV cache across requests
- Paged attention (vLLM)
- Cache reuse across batches
- Reduces memory pressure

### Batching for LLMs

**Prefill batching:**

- Batch multiple prompts for prefill
- Parallelize attention computation
- Reduces prefill time

**Decode batching:**

- Batch multiple generation requests
- Continuous batching for efficiency
- Trade-off: throughput vs latency

**Pipeline parallelism:**

- Batch across pipeline stages
- Overlap computation
- Improve hardware utilization

## Multi-Model Concurrency

### Challenges

- Memory pressure (multiple models in GPU)
- Resource contention
- Scheduling decisions
- Quality of service

### Strategies

1. **Time Slicing**: Alternate between models
2. **Spatial Partitioning**: Allocate GPU memory per model
3. **Priority Scheduling**: Important models get preference
4. **Dynamic Allocation**: Adjust based on load

### Multi-GPU

- Model parallelism across GPUs
- Tensor parallelism
- Pipeline parallelism
- Data parallelism

### CPU Inference

- Multiple models on CPU
- Thread pool per model
- NUMA-aware placement
- Memory sharing where possible

## Multi-Request Batching

### Static Batching

- Fixed batch size
- Wait for batch to fill
- Simple but inefficient
- Poor latency under low load

### Dynamic Batching

- Variable batch size
- Timeout-based or size-based
- Better latency/throughput trade-off
- More complex implementation

### Continuous Batching (Inflight Batching)

- Add/remove requests dynamically
- No fixed batch boundaries
- Best for variable request lengths
- Requires efficient KV cache management

### Implementation Considerations

- KV cache management
- Request tracking
- Memory allocation
- Fairness
- Priority handling

## Parallel KV Cache Updates

### Challenges

- KV cache grows with sequence length
- Updates must be synchronized
- Memory bandwidth intensive
- Affects all attention layers

### Parallelization Strategies

1. **Layer Parallel**: Update different layers in parallel
2. **Head Parallel**: Update different attention heads in parallel
3. **Token Parallel**: Update different tokens in parallel
4. **Pipeline Parallel**: Overlap with computation

### Optimizations

- Fused attention with KV update
- Vectorized KV update
- Cache-friendly access patterns
- Async KV update

### PagedAttention (vLLM)

- KV cache in pages
- Non-contiguous allocation
- Efficient memory reuse
- Better cache utilization

## Speculative Decoding

### Concept

Predict multiple next tokens in parallel:

- Draft model predicts N tokens
- Verify with main model
- Accept correct predictions
- Reduces sequential steps

### Implementations

- Medusa (multiple prediction heads)
- EAGLE (draft model)
- Speculative decoding (HuggingFace)
- Lookahead decoding

### Benefits

- Faster generation (2-3x speedup)
- Better GPU utilization
- Reduced memory bandwidth per token

### Challenges

- Draft model quality matters
- Verification overhead
- Increased memory usage
- Complex implementation

## Performance Considerations

### Throughput vs Latency

- Batching improves throughput
- Batching increases latency
- Trade-off depends on use case
- Real-time: prioritize latency
- Batch: prioritize throughput

### Resource Utilization

- Maximize GPU utilization
- Balance CPU/GPU work
- Minimize idle time
- Avoid resource contention

### Scalability

- Scale to multiple GPUs
- Scale to multiple machines
- Network bandwidth considerations
- Distributed synchronization

### Monitoring

- Track batch sizes
- Measure queue lengths
- Monitor resource usage
- Profile bottlenecks

## Best Practices

### Thread Pool Design

- Size appropriately for workload
- Use work-stealing for load balancing
- Consider NUMA placement
- Monitor thread creation/destruction

### Lock-Free Programming

- Use proven libraries
- Understand memory ordering
- Test under high contention
- Profile before/after

### NUMA Optimization

- Allocate memory locally
- Bind threads to NUMA nodes
- Minimize remote access
- Profile NUMA effects

### Async Design

- Avoid blocking in async contexts
- Use thread pools for CPU work
- Handle errors properly
- Consider cancellation

### Batching

- Choose appropriate strategy
- Monitor latency impact
- Implement priority if needed
- Profile under realistic load
