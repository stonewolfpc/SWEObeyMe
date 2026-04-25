# Compiler & Runtime Optimization Theory

## Overview

This document covers compiler optimization theory, CPU pipeline behavior, branch prediction, instruction scheduling, register allocation, cache-aware algorithms, tiling strategies, and vectorization theory. These concepts form the foundation for understanding and implementing high-performance inference kernels.

## LLVM Optimization Passes

### Code Generator Phases

The LLVM code generator operates through several phases:

1. **Instruction Selection**: Select target machine instructions
2. **SSA-based Machine Code Optimizations**: Modulo-scheduling, peephole optimization
3. **Register Allocation**: Assign virtual registers to physical registers
4. **Prolog/Epilog Code Insertion**: Function setup/teardown
5. **Late Machine Code Optimizations**: Final cleanup
6. **Code Emission**: Generate object code

### Instruction Selection

- Pattern-based instruction selection
- DAG-based matching
- Target-specific instruction combinations
- Legalization of unsupported operations

### SSA-based Optimizations

- **Modulo Scheduling**: Software pipelining for loops
- **Peephole Optimization**: Local instruction pattern replacement
- Dead code elimination
- Constant propagation

### Register Allocation

- **Live Intervals**: Track register liveness
- **Graph Coloring**: Assign registers to avoid conflicts
- **Spilling**: Move values to memory when registers exhausted
- **Coalescing**: Eliminate unnecessary copies

### Phase Ordering

Register allocation and instruction scheduling must be carefully ordered:

- Pre-RA scheduling: Before register allocation
- Post-RA scheduling: After register allocation
- Interaction affects final code quality

## CPU Pipeline Behavior

### Pipeline Stages

Modern CPUs use deep pipelines:

1. **Fetch**: Retrieve instructions from cache
2. **Decode**: Interpret instruction encoding
3. **Dispatch**: Allocate resources
4. **Execute**: Perform operation
5. **Memory**: Access memory (if needed)
6. **Writeback**: Write results to registers

### Pipeline Hazards

- **Data Hazards**: RAW, WAR, WAW dependencies
- **Control Hazards**: Branch mispredictions
- **Structural Hazards**: Resource conflicts

### Out-of-Order Execution

CPUs execute instructions out of program order when:

- Dependencies are satisfied
- Resources are available
- Improves throughput by hiding latency

### Speculative Execution

- Execute instructions before knowing if they're needed
- Roll back on misprediction
- Critical for performance

## Branch Prediction

### How Branch Predictors Work

Branch prediction relies on hardware components that guess conditional branch outcomes before actual computation. Success directly affects performance in low-latency systems.

### Prediction Mechanisms

- **Branch Target Buffer (BTB)**: Caches branch targets
- **Pattern History Table (PHT)**: Records branch patterns
- **Global History Predictor**: Tracks multiple branch behaviors
- **Local History Predictor**: Per-branch patterns
- **Loop Predictor**: Special handling for loop branches

### When Prediction Fails

- Pipeline flush (15-30 cycle penalty on modern CPUs)
- Lost work from speculatively executed instructions
- Cascading effects on subsequent predictions

### Factors Affecting Accuracy

- **Branch Pattern Stability**: Consistent patterns predict better
- **Data Dependence**: Branches on unpredictable data hurt accuracy
- **Branch Frequency**: Too many branches increase misprediction risk
- **Code Layout**: Hot/cold code separation helps

### Techniques to Improve Prediction

1. **Keep Branch Patterns Stable**: Use consistent control flow
2. **Avoid Data-Dependent Branches**: Use branchless alternatives when possible
3. **Reduce Branch Frequency**: Merge conditions, use lookup tables
4. **Structure Loops for Predictability**: Simple loop patterns
5. **Align Code for Hot Branches**: Improve I-cache utilization
6. **Use Profile-Guided Optimization (PGO)**: Train predictor on real data

### Branchless Programming

Replace branches with arithmetic:

- Conditional moves (CMOV)
- Bit manipulation tricks
- Lookup tables
- SIMD masks

### Anti-Patterns

- Data-dependent branches in hot loops
- Excessive virtual calls (indirect branches)
- Highly nested conditionals
- Mixing hot and cold code paths
- Branching on timestamps or random values

## Instruction Scheduling

### Goals

- Hide instruction latency
- Maximize instruction-level parallelism
- Minimize pipeline stalls
- Balance resource usage

### Scheduling Algorithms

- **List Scheduling**: Priority-based scheduling
- **Trace Scheduling**: Schedule likely paths
- **Software Pipelining**: Overlap loop iterations
- **VLIW Packetization**: Bundle independent instructions

### Dependencies

- **True Dependencies**: RAW (Read After Write)
- **Anti-Dependencies**: WAR (Write After Read)
- **Output Dependencies**: WAW (Write After Write)
- Register renaming eliminates anti and output dependencies

### Critical Path

The longest dependency chain determines minimum execution time. Schedule critical path first.

## Register Allocation

### Problem

Map unlimited virtual registers to limited physical registers while minimizing spills.

### Algorithms

- **Graph Coloring**: Classic NP-complete approach
- **Linear Scan**: Fast, good for JIT
- **Iterative Coalescing**: Aggressive copy elimination
- **SSA-based**: Exploits SSA properties

### Spilling

When registers exhausted:

- Choose spill candidates (least frequently used)
- Insert loads/stores
- Try to spill in loops (reduces load/store overhead)

### Register Classes

Different register types:

- General purpose
- Floating point
- Vector/SIMD
- Special purpose (stack pointer, etc.)

### Calling Conventions

- Caller-saved vs callee-saved registers
- Stack frame layout
- Parameter passing conventions

## Cache-Aware Algorithms

### Memory Hierarchy

- L1 Cache: ~32KB, 1-4 cycle latency
- L2 Cache: ~256KB-1MB, 10-20 cycle latency
- L3 Cache: ~8MB-32MB, 40-80 cycle latency
- RAM: ~100+ cycle latency

### Cache Lines

- Typical size: 64 bytes
- Spatial locality: Accessing nearby data is fast
- Temporal locality: Reusing data is fast

### Cache Misses

- **Cold Miss**: First access to data
- **Capacity Miss**: Cache too small
- **Conflict Miss**: Cache line eviction
- **Coherence Miss**: Multi-core invalidation

### Optimization Techniques

1. **Data Layout**: Structure for cache line efficiency
2. **Blocking/Tiling**: Work on subsets that fit in cache
3. **Padding**: Avoid false sharing
4. **Prefetching**: Load data before needed
5. **Cache Oblivious**: Algorithms that work well regardless of cache size

### False Sharing

Multiple cores writing to same cache line cause:

- Unnecessary cache invalidations
- Performance degradation
- Fix: Pad or align data to separate cache lines

## Tiling Strategies

### Concept

Break large computations into smaller blocks that fit in cache.

### Matrix Multiplication Tiling

Instead of computing full matrix product:

- Compute tile by tile
- Each tile fits in L1/L2 cache
- Reuse tiles multiple times
- Reduces memory bandwidth

### Tiling Parameters

- Tile size: Depends on cache size
- Register blocking: Keep values in registers
- Loop ordering: Optimize for locality

### Cache Oblivious Algorithms

Algorithms that perform well without explicit cache size tuning:

- Recursive divide and conquer
- Automatically adapt to cache hierarchy
- Example: Cache oblivious matrix multiplication

### Loop Tiling

Transform nested loops:

```c
// Original
for (i = 0; i < N; i++)
  for (j = 0; j < M; j++)
    for (k = 0; k < K; k++)
      C[i][j] += A[i][k] * B[k][j];

// Tiled
for (i = 0; i < N; i += TILE)
  for (j = 0; j < M; j += TILE)
    for (k = 0; k < K; k += TILE)
      for (ii = i; ii < min(i+TILE, N); ii++)
        for (jj = j; jj < min(j+TILE, M); jj++)
          for (kk = k; kk < min(k+TILE, K); kk++)
            C[ii][jj] += A[ii][kk] * B[kk][jj];
```

## Vectorization Theory

### SIMD (Single Instruction Multiple Data)

- Process multiple data elements with single instruction
- Reduces instruction count
- Increases throughput
- Requires data alignment and predictable patterns

### Vector Registers

- SSE: 128-bit (4 floats, 2 doubles)
- AVX: 256-bit (8 floats, 4 doubles)
- AVX-512: 512-bit (16 floats, 8 doubles)

### Vectorization Techniques

1. **Loop Vectorization**: Process loop iterations in parallel
2. **SLP (Superword Level Parallelism)**: Combine scalar operations
3. **Masked Vectorization**: Handle predication
4. **Gather/Scatter**: Non-contiguous memory access

### Vectorization Challenges

- **Alignment**: Data must be properly aligned
- **Dependencies**: Prevent vectorization
- **Control Flow**: Branches inside loops
- **Stride**: Non-unit stride memory access

### Auto-Vectorization

Compilers can automatically vectorize:

- Requires simple loop patterns
- Needs aliasing information
- Pragma hints can help (e.g., `#pragma omp simd`)

### Manual Vectorization

Use intrinsics for explicit control:

- `_mm256_add_ps` (AVX add)
- `_mm256_mul_ps` (AVX multiply)
- `_mm256_fmadd_ps` (AVX fused multiply-add)
- Fused operations reduce rounding and improve performance

### Fused Multiply-Add (FMA)

- Single instruction: `a * b + c`
- Reduces rounding error
- Improves performance (2 operations in 1)
- Available on AVX2, AVX-512

### Horizontal Operations

Operations across vector elements:

- Reductions (sum, min, max)
- Permutations
- Broadcasts
- Generally slower than vertical operations

## Memory-Bound vs Compute-Bound

### Memory-Bound

- Limited by memory bandwidth
- Adding compute doesn't help
- Common in: Large matrix ops, attention
- Optimization: Reduce memory traffic, improve cache reuse

### Compute-Bound

- Limited by compute throughput
- Adding memory doesn't help
- Common in: Small dense ops, quantization
- Optimization: Use vectorization, fused operations

### Roofline Model

Performance bounded by:

- Peak compute (theoretical max FLOPS)
- Peak bandwidth (memory bandwidth limit)
- Actual performance: min(compute-bound, memory-bound)

### Analysis

Calculate arithmetic intensity:

- FLOPs per byte transferred
- If high: compute-bound
- If low: memory-bound
- Optimize accordingly

## Application to LLM Inference

### Attention Kernels

- Memory-bound (large matrices)
- Tiling critical for cache reuse
- Vectorization for compute within tiles
- Flash Attention: Tiling + recomputation

### MatMul

- Can be compute or memory-bound depending on size
- Blocking for cache efficiency
- Vectorization for compute within blocks
- FMA critical for performance

### Quantization

- Compute-bound (small operations per byte)
- Vectorization essential
- SIMD intrinsics for dequantization
- Fused operations reduce overhead

### GEMM Kernels

- Heavily optimized in libraries (cuBLAS, MKL)
- Tiling, vectorization, register blocking
- Hand-written assembly for peak performance
- Understanding helps debug and customize

## Performance Profiling

### Tools

- **perf**: Linux performance counters
- **VTune**: Intel profiler
- **uProf**: AMD profiler
- **Nsight**: NVIDIA profiler

### Metrics

- Instructions per cycle (IPC)
- Cache miss rates
- Branch misprediction rate
- Memory bandwidth utilization

### Optimization Workflow

1. Profile to find bottlenecks
2. Identify if memory or compute bound
3. Apply appropriate optimizations
4. Re-profile to verify improvement
5. Iterate
