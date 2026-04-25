# SIMD Intrinsics Cheat Sheet

## SIMD Registers

The most notable distinction between SIMD extensions is the support for wider registers:

- SSE (1999): 16 128-bit registers (xmm0 through xmm15)
- AVX (2011): 16 256-bit registers (ymm0 through ymm15)
- AVX512 (2017): 16 512-bit registers (zmm0 through zmm15)

## Vector Types

C/C++ compilers implement special vector types:

- 128-bit: **m128, **m128d, \_\_m128i (single-precision FP, double-precision FP, integer)
- 256-bit: **m256, **m256d, \_\_m256i
- 512-bit: **m512, **m512d, \_\_m512i

## Instruction Categories

### MOVE Instructions

- MOVDQA/MOVDQU: Aligned/unaligned 128-bit moves
- MOVAPD/MOVUPD: Aligned/unaligned double-precision moves
- MOVAPS/MOVUPS: Aligned/unaligned single-precision moves
- VMOVDQA64/VMOVDQU64: AVX-512 64-bit aligned/unaligned moves
- VMOVDQA32/VMOVDQU32: AVX-512 32-bit aligned/unaligned moves

### Broadcast Instructions

- VPBROADCASTQ/D/W/B: Broadcast scalar to vector
- VBROADCASTSS/SD: Broadcast single/double scalar
- VBROADCASTI32X2/4/8: Broadcast 32-bit integers

### Extract/Insert Instructions

- PEXTRQ/D/W: Extract elements from vector
- PINSRQ/D/W: Insert elements into vector

## Performance Characteristics

### Instruction Latency

- Different instructions have different latencies
- AVX512 instructions generally have higher latency
- Fused multiply-add (FMA) has specific latency characteristics

### Instruction Throughput

- Port usage affects throughput
- Some instructions can execute on multiple ports
- Throughput limited by execution port availability

### Port Usage

- Different execution ports for different instruction types
- Load/store ports for memory operations
- ALU ports for arithmetic operations

## Shuffle Patterns

- Common shuffle operations for data rearrangement
- Permute operations for flexible data movement
- Blend operations for conditional data selection

### Gather/Scatter Penalties

- Gather operations have significant latency
- Scatter operations are expensive
- Prefer contiguous memory access when possible

## Debugging SIMD Code

### Dequant Mismatches

- Check alignment of quantized blocks
- Verify shuffle patterns match expected layout
- Validate block strides

### Slow Paths

- Profile instruction latency and throughput
- Identify scalar fallback paths
- Check for unnecessary conversions

### Misaligned Loads

- Use aligned loads when possible
- Handle unaligned loads correctly
- Consider padding for alignment

### Incorrect Block Strides

- Verify stride calculations
- Check block size alignment
- Validate offset computations
