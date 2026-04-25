# GPU Kernel & CUDA Fundamentals

## Overview

This document covers CUDA programming fundamentals including warp scheduling, shared memory, tensor cores, memory coalescing, occupancy calculators, and GPU kernel optimization. These concepts are essential for GPU offloading, hybrid CPU/GPU inference, custom CUDA kernels, and future-proofing for Blackwell.

## CUDA Programming Model

### Kernels

- **Kernel**: Function executed on GPU
- **Launched from CPU**: Host code calls kernel
- **Executed by many threads**: Massive parallelism
- **SIMT**: Single Instruction, Multiple Threads

### Thread Hierarchy

1. **Thread**: Basic execution unit
2. **Warp**: Group of 32 threads (NVIDIA)
3. **Thread Block**: Group of threads (typically 128-1024)
4. **Grid**: Collection of thread blocks

### Grid and Block Dimensions

```cpp
dim3 grid(256, 256);  // 256x256 blocks
dim3 block(32, 32);   // 32x32 threads per block
kernel<<<grid, block>>>(args);
```

### Memory Hierarchy

- **Registers**: Per-thread, fastest
- **Shared Memory**: Per-block, fast, programmer-managed
- **Global Memory**: Per-grid, slow, large
- **Constant Memory**: Read-only, cached
- **Texture Memory**: Read-only, cached, spatial locality

## Warp Scheduling

### Warp Basics

- **Warp Size**: 32 threads (NVIDIA GPUs)
- **Warp Execution**: Threads in warp execute in lockstep
- **SIMT**: Single instruction, multiple threads
- **Divergence**: Conditional branches cause serialization

### Warp Scheduler

- **Scheduler**: Selects warps to execute
- **Hides Latency**: Switch between warps when one stalls
- **Multiple Schedulers**: Modern GPUs have several
- **Warp-Level Primitives**: Warp shuffle, warp reduction

### Warp Divergence

- **Cause**: Branches where threads take different paths
- **Impact**: Serial execution of paths
- **Mitigation**: Minimize branches, use predication
- **Warp Aggregation**: Combine divergent paths when possible

### Warp-Level Operations

- **Warp Shuffle**: Exchange data between threads in warp
- **Warp Reduction**: Sum, min, max across warp
- **Warp Ballot**: Test condition across all threads
- **Warp Sync**: Synchronize threads in warp

### Independent Thread Scheduling

- **Pascal+**: More flexible thread scheduling
- **Not lockstep**: Threads can execute independently
- **Better divergence handling
- **Still 32-thread warps for efficiency

## Shared Memory

### Overview

- **Per-Block**: Shared by all threads in block
- **Fast**: ~100x faster than global memory
- **Limited**: Typically 48KB-96KB per SM
- **Programmer-Managed**: Explicit data movement

### Bank Conflicts

- **Banks**: 32 banks (typically)
- **Bank Width**: 4 bytes
- **Conflict**: Multiple threads access same bank simultaneously
- **Serializes**: Reduces performance

### Avoiding Bank Conflicts

- **Padding**: Add padding to avoid same-bank access
- **Strided Access**: Use different strides
- **Vectorized Access**: Use 4/8-byte accesses
- **Bank Conflicts**: Use `__shared__` with careful access patterns

### Shared Memory Optimization

```cpp
// Bad: Bank conflicts
__shared__ float data[32];
data[threadIdx.x] = ...;  // Each thread accesses different bank

// Better: Padding
__shared__ float data[33];  // Pad to avoid conflicts
```

### L1 vs Shared Memory

- **Configurable**: Can be configured as L1 or shared
- **Trade-off**: L1 caches global memory, shared is programmer-managed
- **Default**: Split between L1 and shared
- **Tuning**: Adjust based on kernel needs

## Tensor Cores

### Overview

- **Specialized Hardware**: For matrix multiplication
- **Volta+**: Available on modern NVIDIA GPUs
- **Mixed Precision**: FP16, BF16, FP8, INT8
- **Huge Speedup**: 8-16x faster than FP32

### Tensor Core Operations

- **Matrix Multiply-Accumulate**: D = A * B + C
- **Dimensions**: Typically 16x16 or smaller
- **Mixed Precision**: Input A/B in FP16/BF16/INT8, accumulator in FP32
- **Warp-Level**: All 32 threads in warp cooperate

### Using Tensor Cores

```cpp
// WMMA API (Warp Matrix Multiply-Accumulate)
#include <mma.h>
using namespace nvcuda::wmma;

fragment<a_matrix, 16, 16, 16, half, row_major> a_frag;
fragment<b_matrix, 16, 16, 16, half, row_major> b_frag;
fragment<c_matrix, 16, 16, 16, float, row_major> c_frag;

load_matrix_sync(a_frag, a_ptr);
load_matrix_sync(b_frag, b_frag);
mma_sync(c_frag, a_frag, b_frag, c_frag);
store_matrix_sync(c_ptr, c_frag);
```

### Tensor Core Performance

- **Throughput**: Up to hundreds of TFLOPS
- **Efficiency**: Near-peak for well-tuned kernels
- **Precision Trade-offs**: Lower precision = faster but less accurate
- **Use Cases**: Deep learning, matrix operations

### Tensor Cores for LLMs

- **MatMul**: GEMM operations heavily use tensor cores
- **Quantization**: INT8 tensor cores for quantized inference
- **Attention**: Matrix multiplications in attention
- **FFN**: Feed-forward network layers

## Memory Coalescing

### Concept

- **Coalesced Access**: Adjacent threads access adjacent memory
- **Single Transaction**: One memory transaction for warp
- **Uncoalesced**: Multiple transactions, slower
- **Critical for Performance**: Global memory bandwidth is bottleneck

### Coalescing Rules

- **Best Case**: Threads access contiguous 32-bit words
- **Good Case**: Contiguous 64-bit or 128-bit words
- **Bad Case**: Scattered accesses
- **Worst Case**: Each thread accesses different cache line

### Example

```cpp
// Coalesced
float data[1024];
data[threadIdx.x] = value;  // Good

// Uncoalesced
float data[1024];
data[threadIdx.x * 16] = value;  // Stride of 16
```

### Memory Access Patterns

- **Sequential**: Best for coalescing
- **Strided**: Can be coalesced if stride is power of 2
- **Random**: Poor coalescing
- **Shared Memory**: Can fix uncoalesced global access

### Texture Memory

- **Cached**: Has L1/L2 cache
- **Spatial Locality**: Good for 2D/3D access patterns
- **Read-Only**: Cannot write
- **Use Case**: Image processing, some tensor operations

## Occupancy

### Definition

- **Occupancy**: Ratio of active warps to maximum warps per SM
- **Higher is Better**: Hides latency better
- **Not Only Metric**: Must balance with other factors
- **Target**: 50-100% depending on kernel

### Factors Affecting Occupancy

1. **Registers per Thread**: More registers = fewer warps
2. **Shared Memory per Block**: More shared memory = fewer blocks
3. **Threads per Block**: More threads = more warps but less registers per thread
4. **Block Size**: Larger blocks = fewer blocks fit

### Occupancy Calculator

- **NVIDIA Tool**: CUDA Occupancy Calculator
- **Input**: Registers, shared memory, block size
- **Output**: Theoretical occupancy
- **Use**: Tune kernel parameters

### Calculating Occupancy

```
Max Warps per SM: 64 (example)
Registers per SM: 65536
Registers per Thread: 32
Max Threads: 65536 / 32 = 2048
Max Warps: 2048 / 32 = 64

Shared Memory per SM: 96KB
Shared Memory per Block: 32KB
Max Blocks: 96KB / 32KB = 3
Threads per Block: 256
Max Threads: 3 * 256 = 768
Max Warps: 768 / 32 = 24

Occupancy = min(64, 24) / 64 = 37.5%
```

### Optimizing Occupancy

1. **Reduce Register Usage**: Use `__launch_bounds__`
2. **Reduce Shared Memory**: Use less or reuse
3. **Adjust Block Size**: Find sweet spot
4. **Profile**: Measure actual performance, not just occupancy

### Occupancy vs Performance

- **High Occupancy ≠ High Performance**: Sometimes lower occupancy is better
- **Memory Bound**: Occupancy less important
- **Compute Bound**: Occupancy more important
- **Profile**: Always measure actual performance

## CUDA Kernel Optimization

### Optimization Checklist

1. **Memory Coalescing**: Ensure global memory accesses are coalesced
2. **Shared Memory**: Use to cache global memory data
3. **Bank Conflicts**: Avoid shared memory bank conflicts
4. **Occupancy**: Tune registers and shared memory
5. **Divergence**: Minimize branch divergence
6. **Vectorization**: Use vectorized loads/stores
7. **Tensor Cores**: Use for matrix operations if available
8. **Overlap**: Overlap computation with memory transfers

### Common Patterns

### Tiling

Break large computation into tiles that fit in shared memory:
- Load tile from global to shared
- Compute on tile
- Store result back to global

### Reduction

Parallel reduction using shared memory:
- Load data to shared memory
- Parallel reduce in shared memory
- Write result to global memory

### Prefix Sum

Parallel scan using shared memory:
- Blelloch scan or Hillis-Steele scan
- Use shared memory for intermediate results
- Multiple passes for large arrays

### Convolution

- Shared memory for input tiles
- Loop over filter
- Accumulate in registers
- Write result to global

## CUDA for LLM Inference

### Attention Kernel

- **Memory Bound**: Optimizing memory access critical
- **Tiling**: Tile attention matrix for shared memory
- **Flash Attention**: Tiling + recomputation
- **Tensor Cores**: Use for matrix multiplication

### MatMul Kernel

- **Compute Bound**: Use tensor cores if available
- **Tiling**: Tile matrices for cache efficiency
- **Vectorization**: Use vectorized loads/stores
- **cuBLAS**: Often faster than custom kernel

### Quantization Kernel

- **Vectorized**: Use SIMD for dequantization
- **Shared Memory**: Cache quantization tables
- **Tensor Cores**: INT8 tensor cores for quantized matmul
- **Fused Operations**: Fuse dequantization with computation

### KV Cache Management

- **Shared Memory**: Cache recent KV entries
- **Coalesced Access**: Ensure coalesced KV reads/writes
- **Paged Attention**: Use paged KV cache (vLLM)
- **Memory Bandwidth**: Critical bottleneck

## Multi-GPU

### NCCL

- **Collective Communication**: AllReduce, AllGather, etc.
- **GPU-Direct**: Direct GPU-to-GPU communication
- **Optimized**: Highly optimized for NVIDIA GPUs
- **Use Case**: Distributed training/inference

### Tensor Parallelism

- **Split Tensors**: Across GPUs
- **AllReduce**: Combine results
- **Memory**: Reduces per-GPU memory
- **Communication**: Overlap with computation

### Pipeline Parallelism

- **Split Layers**: Across GPUs
- **Micro-batching**: Overlap computation
- **Communication**: Between stages
- **Latency**: Pipeline bubbles

## Profiling CUDA Kernels

### Tools

- **Nsight Compute**: Detailed kernel profiling
- **Nsight Systems**: System-wide profiling
- **nvprof**: Legacy profiler
- **Visual Profiler**: GUI-based profiling

### Metrics

- **Achieved Occupancy**: Actual vs theoretical
- **Memory Throughput**: Global memory bandwidth
- **Compute Throughput**: FLOPS achieved
- **Warp Execution Efficiency**: How well warps execute

### Optimization Workflow

1. Profile with Nsight Compute
2. Identify bottlenecks (memory vs compute)
3. Apply appropriate optimizations
4. Re-profile
5. Iterate

## Future: Blackwell Architecture

### Expected Features

- **Higher Tensor Core Performance**: More TFLOPS
- **FP8 Support**: Native FP8 tensor cores
- **Improved Memory Bandwidth**: HBM3e or faster
- **Better Power Efficiency**: Performance per watt

### Implications for LLMs

- **Faster Inference**: Higher throughput
- **Lower Precision**: FP8 quantization
- **Larger Models**: More memory bandwidth
- **Better Efficiency**: Lower power consumption

### Preparation

- **FP8 Support**: Prepare for FP8 quantization
- **Tensor Cores**: Leverage increasingly
- **Memory Bandwidth**: Optimize for bandwidth-bound kernels
- **Multi-GPU**: Scale to more GPUs
