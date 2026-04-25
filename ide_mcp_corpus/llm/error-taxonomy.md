# LLM Error Taxonomy

## Quantization Errors

### Common Symptoms
1. Significant Accuracy Drop: Drastic drop in performance on evaluation metrics (perplexity, BLEU, task-specific scores) compared to floating-point baseline
2. Numerical Instability (NaNs or Infs): Quantized model produces Not-a-Number or infinity values during inference
3. Unexpected Performance: Quantized model runs slower than anticipated, or even slower than original floating-point model
4. Model Loading or Runtime Errors: Quantized model fails to load in deployment framework, or crashes during inference

### Causes
- Hardware lacks optimized low-bit kernels, forcing emulation
- Overflow due to large intermediate values exceeding representational range
- Division by zero in quantized operations
- Problems with specific operations like layer normalization or activation functions after quantization
- Unsupported operations on target device (CPU, GPU, specialized accelerator)

### Debugging Workflow
1. Verify hardware support for target quantization format
2. Check for NaN/Inf in intermediate activations
3. Profile performance to identify kernel bottlenecks
4. Validate tensor shapes and data types
5. Test with higher precision to isolate quantization issues

## Loader Errors

### Memory-Related Errors

#### Out-of-Memory Failures
- GPU OOM: "CUDA out of memory" or "failed to allocate X bytes"
- CPU OOM: Linux kernel OOM killer terminates processes
- Windows: Swap thrashing before termination

#### Memory Calculation Components
- Model weights (FP16: 2 bytes per parameter)
- KV cache (proportional to context length and batch size)
- Activations during forward pass
- Framework overhead

#### KV Cache Memory
- 7B model at 4K context: ~2GB
- 7B model at 8K context: ~4GB
- Batch size multiplies KV cache requirements linearly

#### Memory Fragmentation
- After loading/unloading models multiple times, VRAM becomes fragmented
- Even when total free memory appears sufficient, allocation fails due to lack of contiguous blocks
- Restarting inference process or system clears fragmentation

### Model Loading and Format Issues

#### Incompatible Model Formats
- Wrong quantization format for inference engine
- Version mismatch between GGUF format and loader
- Corrupted model file

#### Corrupted Downloads and Checksum Failures
- Incomplete model download
- Bit flips during transfer
- Storage corruption

#### File Path and Permission Problems
- Incorrect file paths
- Insufficient read permissions
- Locked files (Windows)

## CUDA and GPU Driver Problems

### CUDA Version Mismatches
- CUDA toolkit version mismatch with driver
- Incompatible cuDNN versions
- Driver too old for required CUDA features

### GPU Initialization Failures
- GPU not detected by driver
- Multi-GPU configuration issues
- NVIDIA driver not installed or corrupted

### Memory Fragmentation and Reset Issues
- VRAM fragmentation preventing allocation
- Need to reset GPU state
- Background processes holding VRAM

## Attention Kernel Errors

### Flash Attention Issues
- Head dimension constraints not met
- Q/K alignment problems
- Rotary edge cases not handled
- Unsupported hardware (Pascal and older NVIDIA GPUs)

### Fused vs Unfused Path Errors
- Fused kernel selected but not supported
- Automatic selection fails
- Manual override required

### AVX vs NEON vs CUDA Differences
- CPU vectorization limitations
- Memory bandwidth constraints
- GPU compute capability limitations

## Tensor Errors

### Shape Mismatches
- Incorrect tensor dimensions
- Broadcasting errors
- Layout incompatibilities (head-major vs token-major)

### Data Type Errors
- Wrong precision (FP16 vs FP32 vs INT8)
- Unsupported quantization format
- Conversion failures

### Block Stride Errors
- Incorrect block size calculations
- Misaligned block boundaries
- Offset computation errors

## KV Cache Errors

### Slot Allocation Failures
- No available slots for new sequence
- Slot finding algorithm failure
- Sequence tracking corruption

### Unified KV Cache Issues
- ISWA configuration errors
- Sliding window size mismatch
- Cache invalidation problems

### Memory Planning Errors
- Insufficient scratch buffer
- Tensor allocation failures
- Stride optimization issues
