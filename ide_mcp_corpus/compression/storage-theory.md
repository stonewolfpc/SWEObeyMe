# Compression & Storage Theory

## Overview

This document covers entropy coding, vector quantization, product quantization, sparse representations, and memory-mapped file theory. These concepts are essential for GGUF packing, KV cache compression, quantization research, and model storage optimization.

## Entropy Coding

### Concept

- **Entropy**: Theoretical lower bound on compression
- **Lossless**: Perfect reconstruction
- **Variable-Length Codes**: Frequent symbols use fewer bits
- **Optimal**: Approaches entropy limit

### Huffman Coding

- **Algorithm**: Build optimal prefix code
- **Tree-Based**: Binary tree representation
- **Optimal**: Optimal for symbol-by-symbol coding
- **Simple**: Easy to implement

### How It Works

1. **Count Frequencies**: Count symbol frequencies
2. **Build Tree**: Build Huffman tree
3. **Assign Codes**: Assign codes based on tree
4. **Encode**: Encode symbols with codes
5. **Decode**: Decode using tree

### Example

```
Symbol: A B C D
Freq:   5 2 1 1

Tree:
       (8)
      /   \
    (3)   A(5)
   /   \
  C(1) (2)
       / \
      B   D

Codes: A:0, B:110, C:100, D:111
```

### Limitations

- **Symbol-by-Symbol**: Doesn't capture dependencies
- **Integer Codes**: Code lengths must be integers
- **Static**: Requires known frequencies
- **Adaptive**: Adaptive variants available

### Arithmetic Coding

- **Fractional Bits**: Can use fractional bits
- **Interval**: Encode as interval in [0,1)
- **Optimal**: Closer to entropy limit
- **Complex**: More complex than Huffman

### How It Works

1. **Initialize**: Initialize interval [0,1)
2. **Narrow**: Narrow interval based on symbol probability
3. **Repeat**: Repeat for each symbol
4. **Output**: Output number in interval

### Advantages

- **Efficiency**: Closer to entropy limit
- **Adaptive**: Easy to make adaptive
- **Fractional**: Can use fractional bits
- **Flexible**: Easy to add context

### Applications

- **Lossless Compression**: General lossless compression
- **GGUF**: Could be used for GGUF metadata
- **Quantization**: Combine with quantization
- **KV Cache**: Compress KV cache

## Vector Quantization

### Concept

- **Vectors**: Quantize vectors, not scalars
- **Codebook**: Set of representative vectors (codewords)
- **Encoding**: Replace vectors with nearest codeword
- **Compression**: Index to codeword is smaller than vector

### Codebook

- **Codewords**: Representative vectors
- **Size**: Number of codewords (codebook size)
- **Dimension**: Dimension of vectors
- **Training**: Train codebook on data

### Encoding

1. **Find Nearest**: Find nearest codeword for each vector
2. **Store Index**: Store index to codeword
3. **Decode**: Replace index with codeword
4. **Reconstruction**: Use codeword as reconstruction

### Compression Ratio

- **Vector Size**: D dimensions
- **Codebook Size**: K codewords
- **Index Size**: log2(K) bits
- **Ratio**: (D * precision) / log2(K)

### Training

- **K-Means**: Commonly used
- **LBG (Linde-Buzo-Gray)**: Generalized Lloyd algorithm
- **Random**: Random initialization
- **Data**: Train on representative data

### Applications

- **Image Compression**: Image and video compression
- **Speech Compression**: Speech coding
- **LLM Quantization**: Quantize embeddings
- **KV Cache**: Compress KV cache

### Residual Vector Quantization (RVQ)

- **Multi-Stage**: Multiple quantization stages
- **Residuals**: Quantize residuals from previous stage
- **Progressive**: Progressive refinement
- **Audio**: Used in audio coding (e.g., EnCodec)

## Product Quantization

### Concept

- **Decompose**: Decompose vectors into sub-vectors
- **Quantize**: Quantize each sub-vector separately
- **Codebooks**: Multiple codebooks (one per sub-vector)
- **Combine**: Combine codes from all codebooks

### How It Works

1. **Decompose**: Split vector into M sub-vectors
2. **Quantize**: Quantize each sub-vector with its codebook
3. **Encode**: Encode as M codes
4. **Decode**: Decode by combining codewords

### Advantages

- **Scalability**: Scales to high dimensions
- **Efficiency**: Efficient encoding/decoding
- **Flexibility**: Flexible codebook sizes
- **Memory**: Reduced memory for codebooks

### Applications

- **ANN Search**: Approximate nearest neighbor search
- **Compression**: High-dimensional data compression
- **LLM**: Quantize large embeddings
- **Retrieval**: Vector database compression

### Optimized Product Quantization (OPQ)

- **Rotation**: Rotate data before quantization
- **Better**: Better compression ratio
- **Training**: Learn rotation matrix
- **Complex**: More complex training

## Sparse Representations

### Concept

- **Sparsity**: Many values are zero
- **Efficient Storage**: Store only non-zero values
- **Compression**: Significant compression
- **Computation**: Sparse computation

### Sparse Formats

- **COO**: Coordinate format (row, col, value)
- **CSR**: Compressed sparse row
- **CSC**: Compressed sparse column
- **DOK**: Dictionary of keys

### COO Format

```
Row: [0, 0, 1, 2]
Col: [0, 2, 1, 2]
Val: [1, 2, 3, 4]
```

### CSR Format

```
Values: [1, 2, 3, 4]
Col Indices: [0, 2, 1, 2]
Row Ptr: [0, 2, 3, 4]
```

### Sparse Matrices in LLMs

- **Attention**: Sparse attention patterns
- **Weights**: Sparse weight matrices
- **Activation**: Sparse activations
- **KV Cache**: Sparse KV cache

### Sparse Attention

- **Local**: Local attention windows
- **Global**: Global tokens + local
- **Random**: Random attention
- **Block**: Block sparse attention

### Training for Sparsity

- **L1 Regularization**: Encourage sparsity
- **Pruning**: Remove small weights
- **Lottery Ticket**: Find sparse subnetworks
- **Magnitude**: Prune based on magnitude

## Memory-Mapped Files

### Concept

- **Mapping**: Map file into memory address space
- **Virtual Memory**: Use virtual memory system
- **Lazy Loading**: Load pages on demand
- **Efficient**: Efficient for large files

### Advantages

- **No Load**: No explicit load needed
- **OS Managed**: OS handles paging
- **Efficient**: Efficient for random access
- **Shared**: Can be shared between processes

### How It Works

1. **Open File**: Open file
2. **Map**: Map file into memory
3. **Access**: Access like memory
4. **Unmap**: Unmap when done

### Implementation

```c
#include <sys/mman.h>

int fd = open("file.bin", O_RDONLY);
void *mapped = mmap(NULL, size, PROT_READ, MAP_PRIVATE, fd, 0);
// Use mapped memory
munmap(mapped, size);
close(fd);
```

### GGUF and mmap

- **GGUF**: Designed for mmap
- **Efficient**: Efficient loading
- **Lazy**: Lazy loading of tensors
- **Memory**: Efficient memory usage

### Paging

- **Pages**: Fixed-size blocks (typically 4KB)
- **Page Fault**: Triggered on access
- **Page In**: Load page from disk
- **Page Out**: Evict page to disk

### Prefetching

- **Sequential**: Prefetch sequentially
- **Random**: Prefetch based on pattern
- **Advice**: Use madvise for hints
- **Performance**: Improve performance

## Quantization for LLMs

### Scalar Quantization

- **Per-Tensor**: Single scale/zero-point per tensor
- **Per-Channel**: Scale/zero-point per channel
- **Symmetric**: No zero-point
- **Asymmetric**: With zero-point

### Quantization Schemes

- **FP32**: 32-bit floating point
- **FP16**: 16-bit floating point
- **BF16**: 16-bit brain floating point
- **INT8**: 8-bit integer
- **INT4**: 4-bit integer
- **NF4**: 4-bit normal float

### GGUF Quantization Types

- **Q4_0**: 4-bit, no zero-point
- **Q4_K**: 4-bit, k-means quantization
- **Q5_K**: 5-bit, k-means quantization
- **Q6_K**: 6-bit, k-means quantization
- **Q8_0**: 8-bit, no zero-point

### Quantization Process

1. **Calibration**: Collect statistics
2. **Scale/Zero-Point**: Compute scale and zero-point
3. **Quantize**: Quantize weights
4. **Dequantize**: Dequantize during inference
5. **Compute**: Compute in quantized domain

### Accuracy vs Size

- **Trade-off**: Smaller size = less accuracy
- **Perplexity**: Measure accuracy
- **Benchmark**: Benchmark on tasks
- **Choose**: Choose based on use case

## KV Cache Compression

### Need for Compression

- **Memory**: KV cache grows with sequence length
- **Bandwidth**: Memory bandwidth bottleneck
- **Long Context**: Long context needs compression
- **Multi-Request**: Multiple requests multiply memory

### Compression Techniques

- **Quantization**: Quantize KV cache
- **Sparsification**: Sparse KV cache
- **Eviction**: Evict old KV entries
- **Product Quantization**: PQ for KV cache

### KV Cache Quantization

- **FP8**: 8-bit floating point
- **INT8**: 8-bit integer
- **Per-Channel**: Per-channel quantization
- **Per-Token**: Per-token quantization

### PagedAttention (vLLM)

- **Pages**: KV cache in pages
- **Non-Contiguous**: Non-contiguous allocation
- **Efficient**: Efficient memory reuse
- **Compression**: Can combine with quantization

### Sparse KV Cache

- **Important Tokens**: Keep only important tokens
- **Eviction**: Evict less important tokens
- **Attention-Based**: Use attention scores
- **Sliding Window**: Sliding window attention

## Model Storage Optimization

### GGUF Packing

- **Single File**: Single file for model
- **Metadata**: Include metadata
- **Tensors**: Include tensors
- **Memory-Mappable**: Designed for mmap

### Tensor Layout

- **Contiguous**: Contiguous tensor storage
- **Alignment**: Proper alignment
- **Padding**: Padding for alignment
- **Strides**: Stride information

### Compression Options

- **Quantization**: Quantize weights
- **Sparsity**: Sparse weight storage
- **Entropy Coding**: Entropy code metadata
- **Delta Encoding**: Delta encode quantized values

### Loading Strategies

- **Full Load**: Load entire model
- **Lazy Load**: Load tensors on demand
- **Partial Load**: Load only needed tensors
- **Streaming**: Stream from storage

## Best Practices

### Choose Appropriate Technique

- **Data Characteristics**: Match technique to data
- **Accuracy Requirements**: Consider accuracy needs
- **Performance**: Consider performance impact
- **Complexity**: Consider implementation complexity

### Measure Impact

- **Compression Ratio**: Measure compression ratio
- **Accuracy**: Measure accuracy impact
- **Performance**: Measure performance impact
- **Trade-offs**: Understand trade-offs

### Iterate

- **Experiment**: Try different techniques
- **Profile**: Profile performance
- **Optimize**: Optimize based on profiling
- **Adapt**: Adapt to findings
