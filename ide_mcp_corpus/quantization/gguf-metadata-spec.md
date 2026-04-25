# GGUF Metadata Specification

## Specification

GGUF is a format based on the existing GGJT, but makes a few changes to the format to make it more extensible and easier to use.

## Key Features

- Single-file deployment
- Extensible metadata system
- mmap compatibility
- Easy to use
- Full information contained in model file

## Key Difference from GGJT

The key difference between GGJT and GGUF is the use of a key-value structure for the hyperparameters (now referred to as metadata), rather than a list of untyped values. This allows for:

- New metadata to be added without breaking compatibility
- Annotating models with additional information for inference
- Model identification
- Architecture-specific parameters

## Standardized Tensor Names

To minimize complexity and maximize compatibility, it is recommended that models using the transformer architecture use the following naming convention for their tensors.

## Common Metadata Keys

### General
- general.version: GGUF format version
- general.architecture: Model architecture identifier
- general.quantization_version: Quantization scheme version

### LLM
- general.context_length: Maximum context size
- general.embedding_length: Embedding dimension
- general.block_count: Number of transformer blocks
- general.head_count: Number of attention heads
- general.layer_norm_rms_epsilon: Layer normalization epsilon

### Tokenizer
- tokenizer.ggml.model: Tokenizer model type
- tokenizer.ggml.tokens: Token vocabulary
- tokenizer.ggml.merges: BPE merges
- tokenizer.ggml.bos_token_id: Beginning of sequence token ID
- tokenizer.ggml.eos_token_id: End of sequence token ID

### RoPE Scaling
- tokenizer.rope.freq_base: Rotary position encoding base frequency
- tokenizer.rope.freq_scale: Rotary position encoding frequency scaling
- tokenizer.rope.dimension_count: Number of rotary embedding dimensions

## Architecture Tags

Standardized architecture identifiers:
- llama: LLaMA and LLaMA 2
- mistral: Mistral models
- qwen: Qwen models
- falcon: Falcon models
- mpt: MosaicML MPT
- gptneox: GPT-NeoX
- gptj: GPT-J
- bloom: BLOOM
- opt: OPT models
- phi: Phi models

## Quantization Metadata

- general.quantization_version: Version of quantization scheme
- quantization.implementation: Quantization implementation details
- quantization.block_size: Block size for quantization
- quantization.type: Quantization type (Q4_0, Q4_K_M, etc.)
