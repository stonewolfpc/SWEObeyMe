# Memory Management and KV Cache

## Purpose and Scope

This page explains the memory management system in llama.cpp, with a focus on the KV (Key-Value) cache architecture, recurrent memory, and hybrid memory systems. The memory subsystem is responsible for storing the state of the model across inference steps, including attention keys/values and recurrent states (e.g., for Mamba or RWKV models).

## Memory System Architecture

llama.cpp uses an abstract memory interface (llama_memory_i) that allows different memory implementations. The system supports multiple memory types tailored to specific model architectures:

- llama_kv_cache: Standard transformer KV cache
- llama_memory_recurrent: Recurrent state management for Mamba/RWKV
- llama_memory_hybrid: Hybrid memory systems

## KV Cache Implementation

### Cache Component Hierarchy

The KV cache is organized by layers and streams. Each layer contains tensors for:

- Keys (K)
- Values (V)
- Per-head attention state

### Slot Allocation

The system uses slot allocation to manage memory for multiple sequences:

- Unified KV cache: Shared memory pool across all sequences
- Slot finding algorithm: Efficient slot allocation for new tokens
- Sequence tracking: Per-sequence state management

### Independent Sliding Window Attention (ISWA)

Support for sliding window attention with:

- Configurable window sizes
- Efficient memory reuse
- Automatic cache invalidation

## Recurrent Memory Implementation

### Recurrent State Tensors

For models like Mamba and RWKV that don't use standard KV cache:

- llama_memory_recurrent class manages state
- Two primary state tensors per layer
- Hidden state persistence across inference steps

## Hybrid Memory System

### Layer Filtering

Selective layer memory management:

- Only cache layers that benefit from it
- Dynamic layer selection based on model architecture
- Memory-aware layer offloading

## Memory Operations

### Sequence Management

- seq_rm constraints for recurrent models
- Batch processing support
- Context lifecycle management

### Graph Input Management

- Efficient tensor allocation
- Scratch buffer usage
- Graph execution order optimization

## Memory Planning

### Tensor Allocation Rules

- Contiguous allocation for related tensors
- Alignment requirements for SIMD operations
- Block size alignment for quantization

### KV Cache Layout

- Per-layer organization
- Head-major vs token-major layouts
- Stride optimization for backend

### Scratch Buffer Usage

- Temporary computation buffers
- Reuse across operations
- Size optimization

## Memory Bandwidth Considerations

- Quantized KV cache reduces bandwidth requirements
- Different quantization formats have different bandwidth needs
- Q4_K_M vs Q4_0 performance characteristics
- Cache-friendly access patterns
