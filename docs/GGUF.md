# GGUF - GGML Universal Format

> **License**: MIT License
> **Source**: https://github.com/ggml-org/ggml/blob/master/docs/gguf.md

## Overview

GGUF is a file format for storing models for inference with GGML and executors based on GGML. It is a binary format designed for:

- Fast loading and saving of models
- Ease of reading
- Extensibility without breaking compatibility
- Unambiguous specification containing all needed information

GGUF is the successor to GGML, GGMF, and GGJT formats.

## File Naming Convention

GGUF files follow this naming pattern:

```
<BaseName>-<SizeLabel>-<FineTune>-<Version>-<Encoding>-<Type>-<Shard>.gguf
```

Examples:

- `Mixtral-8x7B-v0.1-KQ2.gguf`
- `Grok-100B-v1.0-Q4_0-00003-of-00009.gguf`
- `Hermes-2-Pro-Llama-3-8B-v1.0-F16.gguf`

## File Structure

GGUF files have the following structure:

1. **Magic Number** (4 bytes): `GGUF` in ASCII
2. **Version** (4 bytes): File format version (e.g., 3)
3. **Tensor Count** (8 bytes): Number of tensors in the file
4. **Metadata KV Count** (8 bytes): Number of metadata key-value pairs
5. **Metadata** (variable): Key-value pairs describing the model
6. **Tensor Info** (variable): Information about each tensor
7. **Alignment Padding** (variable): Padding to align tensor data
8. **Tensor Data** (variable): Actual tensor weights

### Tensor Information

Each tensor has:

- **Name** (string): Identifier for the tensor
- **Dimensions** (array): Shape of the tensor (1-4 dimensions)
- **Type** (enum): Data type (F32, F16, Q4_0, Q4_K, Q5_0, Q5_K, Q8_0, Q8_K, etc.)
- **Offset** (uint64): Byte offset to tensor data

## Metadata Specification

### General Keys

- `general.architecture`: Model architecture (e.g., "llama", "mixtral")
- `general.quantization_version`: Quantization format version
- `general.alignment`: Global alignment for tensor data
- `general.name`: Human-readable model name
- `general.author`: Model author/creator
- `general.version`: Model version
- `general.organization`: Organization that created the model

### LLM-Specific Keys

- `llama.context_length`: Maximum context length
- `llama.embedding_length`: Embedding dimension
- `llama.block_count`: Number of transformer blocks
- `llama.feed_forward_length`: Feed-forward dimension
- `llama.attention.head_count`: Number of attention heads
- `llama.attention.head_count_kv`: Number of KV attention heads
- `llama.attention.layer_norm_rms_epsilon`: RMS norm epsilon
- `llama.rope.freq_base`: RoPE base frequency
- `llama.rope.scale_linear`: RoPE linear scaling factor

### Tokenizer Keys

- `tokenizer.ggml.model`: Tokenizer type (e.g., "llama", "gpt2")
- `tokenizer.ggml.tokens`: Array of tokens
- `tokenizer.ggml.token_type`: Token types
- `tokenizer.ggml.scores`: Token scores
- `tokenizer.ggml.merges`: BPE merges
- `tokenizer.ggml.bos_token_id`: Beginning-of-sequence token ID
- `tokenizer.ggml.eos_token_id`: End-of-sequence token ID
- `tokenizer.ggml.pad_token_id`: Padding token ID
- `tokenizer.ggml.add_bos_token`: Whether to add BOS token
- `tokenizer.ggml.add_eos_token`: Whether to add EOS token

## Tensor Names

### Standardized Naming Convention

Base layers:

- `token_embd.weight`: Token embeddings
- `output_norm.weight`: Output layer normalization
- `output.weight`: Output projection (language modeling head)

Attention layers (per block):

- `blk.N.attn_norm.weight`: Attention layer normalization
- `blk.N.attn_q.weight`: Query projection
- `blk.N.attn_k.weight`: Key projection
- `blk.N.attn_v.weight`: Value projection
- `blk.N.attn_output.weight`: Attention output projection

Feed-forward layers (per block):

- `blk.N.ffn_norm.weight`: FFN layer normalization
- `blk.N.ffn_gate.weight`: Gate projection (GLU variants)
- `blk.N.ffn_up.weight`: Up projection (GLU variants)
- `blk.N.ffn_down.weight`: Down projection

Where `N` is the block index (0-indexed).

## Data Types

GGUF supports various quantization formats:

| Type   | Description            | Bits per weight |
| ------ | ---------------------- | --------------- |
| F32    | 32-bit float           | 32              |
| F16    | 16-bit float           | 16              |
| Q4_0   | 4-bit quantization     | 4               |
| Q4_1   | 4-bit quantization (1) | 4.5             |
| Q4_K   | Q4 with K-quants       | 4               |
| Q4_K_S | Q4 small K-quants      | 4               |
| Q4_K_M | Q4 medium K-quants     | 4               |
| Q5_0   | 5-bit quantization     | 5               |
| Q5_1   | 5-bit quantization (1) | 5.5             |
| Q5_K   | Q5 with K-quants       | 5               |
| Q5_K_S | Q5 small K-quants      | 5               |
| Q5_K_M | Q5 medium K-quants     | 5               |
| Q6_K   | Q6 with K-quants       | 6               |
| Q8_0   | 8-bit quantization     | 8               |
| Q8_1   | 8-bit quantization (1) | 8               |
| Q8_K   | Q8 with K-quants       | 8               |
| I8     | 8-bit integer          | 8               |
| I16    | 16-bit integer         | 16              |
| I32    | 32-bit integer         | 32              |

## Implementing a GGUF Loader

To implement a custom GGUF loader:

1. **Read Header**: Verify magic number and version
2. **Parse Metadata**: Read all key-value pairs
3. **Parse Tensor Info**: Read tensor metadata
4. **Calculate Offsets**: Determine tensor data locations
5. **Load Tensors**: Read tensor data into memory
6. **Apply Quantization**: Dequantize if necessary

### Example (Pseudo-code)

```python
def load_gguf(filename):
    with open(filename, 'rb') as f:
        # Read header
        magic = f.read(4)
        assert magic == b'GGUF'
        version = read_uint32(f)

        # Read counts
        tensor_count = read_uint64(f)
        metadata_kv_count = read_uint64(f)

        # Read metadata
        metadata = {}
        for _ in range(metadata_kv_count):
            key = read_string(f)
            value_type = read_uint32(f)
            value = read_value(f, value_type)
            metadata[key] = value

        # Read tensor info
        tensors = []
        for _ in range(tensor_count):
            name = read_string(f)
            n_dims = read_uint32(f)
            dims = [read_uint64(f) for _ in range(n_dims)]
            type_ = read_uint32(f)
            offset = read_uint64(f)
            tensors.append({
                'name': name,
                'dims': dims,
                'type': type_,
                'offset': offset
            })

        # Align and read tensor data
        alignment = metadata.get('general.alignment', 32)
        for tensor in tensors:
            f.seek(align(f.tell(), alignment))
            tensor['data'] = read_tensor_data(f, tensor)

    return metadata, tensors
```

## Version History

- **v3 (Current)**: Added support for big-endian systems, improved metadata handling
- **v2**: Added support for more data types, improved tensor alignment
- **v1**: Initial release

## Resources

- [GGUF Specification](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md)
- [GGML Repository](https://github.com/ggml-org/ggml)
- [llama.cpp](https://github.com/ggml-org/llama.cpp)
