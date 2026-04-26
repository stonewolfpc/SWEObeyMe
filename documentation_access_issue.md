# SWEObeyMe Documentation Access Issue

## Date: April 25, 2026

## Problem Description
Attempted to use `mcp1_docs_lookup` to verify Q4_K dequantization and LFM2.5 tensor shape expectations against documentation, but encountered errors.

## Error Details
```
Error searching llama documentation: ENOENT: no such file or directory, scandir 'C:\Users\StoneWolfPC\AppData\Local\Programs\Windsurf Next\ide_mcp_corpus'
```

## Attempted Operations
1. `mcp1_docs_lookup` with corpus="unified" - Failed with "Unknown corpus 'unified'"
2. `mcp1_docs_list_corpora` - Available corpora: godot, llama
3. `mcp1_docs_lookup` with corpus="llama" - Failed with ENOENT error for corpus directory

## Expected Behavior
The documentation system should provide access to:
- Q4_K dequantization specifications
- Tensor layout and transposition documentation
- LLM/GGUF quantization standards
- Mathematical formulas for quantization

## Impact
Unable to systematically verify implementation against documentation, leading to:
- Guesswork about correct tensor access patterns
- Uncertainty about quantization formulas
- Repeated trial-and-error without authoritative reference
- Difficulty distinguishing between implementation bugs and specification misunderstandings

## Required Fix
The corpus directory path needs to be configured correctly or the documentation files need to be installed to the expected location.
