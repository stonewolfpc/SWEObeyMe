# Flash Attention and Optimizations

## Purpose and Scope

Flash Attention is a memory-efficient attention algorithm that reduces memory bandwidth requirements from O(N²) to O(N) by tiling the computation and avoiding materialization of full N × N attention matrix.

Traditional attention computes S = Q × Kᵀ, applies P = softmax(S), then multiplies O = P × V, requiring storage of the full attention scores matrix S of size (seq_len × seq_len). For a sequence of length 4096, this requires 64MB of memory just for the attention scores (at FP32), which becomes a bottleneck.

## Flash Attention Algorithm

Flash Attention eliminates the memory bottleneck by:

1. Tiling: Processing attention in blocks that fit in fast shared memory (CUDA/Vulkan) or threadgroup memory (Metal)
2. Online Softmax: Computing softmax incrementally as blocks are processed, avoiding storing the full attention matrix
3. Recomputation: Accepting some redundant compute to avoid expensive memory transfers

## llama.cpp Implementation

llama.cpp implements Flash Attention across multiple backends with architecture-specific optimizations:

- Tiled computation: Block-wise processing to fit in fast memory (Br × Bc tiles)
- Split-K parallelization: Dividing KV sequence across workgroups for better parallelism
- Cooperative matrices: Hardware-accelerated tensor operations (MMA on CUDA, Cooperative Matrix on Vulkan)
- Quantization support: On-the-fly dequantization of Q, K, V tensors within the attention kernel
- Accumulator type selection: FP16 vs FP32 trade-offs for performance and accuracy

The operation is exposed through GGML_OP_FLASH_ATTN_EXT which handles both causal and non-causal attention patterns.

## Backend-Specific Implementations

### CUDA Flash Attention

- Uses tensor cores for acceleration
- Requires NVIDIA GPUs with tensor core support (Pascal and older not supported)
- Optimized for Hopper and Blackwell GPUs

### Metal Flash Attention

- Optimized for Apple Silicon
- Uses threadgroup memory for tiling
- Kernel dispatch with function constants

### Vulkan Flash Attention

- Cooperative matrix support
- Cross-platform GPU acceleration
- Works with AMD and Intel GPUs

## Performance Considerations

### Q/K Alignment

- Proper alignment of query and key tensors is critical for performance
- Misaligned loads can significantly impact throughput

### Head Dimension Constraints

- Different backends have optimal head dimensions
- Common optimal sizes: 64, 128, 256

### Rotary Edge Cases

- Rotary position embeddings require special handling
- Edge cases at sequence boundaries need careful implementation

### Fused vs Unfused Paths

- Fused kernels are faster but less flexible
- Unfused paths provide better compatibility
- Automatic selection based on hardware capabilities

### AVX vs NEON vs CUDA Differences

- AVX: CPU vectorization, limited by memory bandwidth
- NEON: ARM CPU optimization, similar constraints to AVX
- CUDA: GPU acceleration, limited by compute capability and VRAM
