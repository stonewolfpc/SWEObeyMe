# Choosing a GGUF Model: K-Quants, IQ Variants, and Legacy Formats

## What Is GGUF?

GGUF quantization for fast and memory-efficient inference on your CPU.

Most GGUF weight formats are blockwise.
A matrix is split into fixed-size blocks, each block is represented with compact integer parameters, and a small set of per-block parameters reconstructs approximate floating weights at inference.

The design space is defined by three choices:

- The number of bits used for the parameters
- The block size
- The dequantization rule (linear scale and zero-point, multi-scale hierarchies, or non-linear/LUT-assisted schemes)

The number of bits used for the parameters
The block size
The dequantization rule (linear scale and zero-point, multi-scale hierarchies, or non-linear/LUT-assisted schemes)

The more expressive the dequantization rule, the lower the error you can achieve for the same number of bits, at some decode cost.

In the next sections, "bits/weight" refers to the effective average once overheads like block scales are included. Values are approximate and vary a little by implementation and tensor shape, but they are useful for thinking about trade-offs.

## Legacy Formats: Q_0 and Q_1

The legacy family of GGUF formats, Q4_0, Q4_1, Q5_0, Q5_1, Q8_0, implements classic per-block linear quantization. A block stores n-bit weight codes and either one scale (the "\_0" variants, symmetric) or one scale plus one offset/zero-point (the "\_1" variants, asymmetric). Dequantization is a single affine transform per block.

These formats are simple to decode and therefore fast. Their weakness is representational: one affine map per block cannot model skewed or heavy-tailed weight distributions as well as newer schemes.

At 8-bit, the difference is negligible, and Q8_0 is effectively near-lossless for most LLMs. That's why we can still see a lot of Q8_0 models being published on the HF Hub. At 5- and especially 4-bit, legacy formats leave measurable accuracy on the table compared with modern alternatives. They remain relevant for maximum simplicity and compatibility, and on some older devices, their very cheap decoding can still be a speed win.

A concise way to think about the legacy set is that Q8_0 is a safe INT8 baseline, Q5_0/1 are decent mid-range choices if you must stick to legacy, and Q4_0/1 are largely superseded by K- and I-quants for quality per bit.

## K-quants: Modern Default for 3–6 Bits

K-quants (Q2_K, Q3_K, Q4_K, Q5_K, Q6_K, and their mixed variants like \_S, \_M, \_L) introduce structure beyond a single affine per block.

The most common pattern is a two-level scheme: small blocks with their own scale and zero-point grouped into a super-block with an additional scale/offset. In practice, this behaves like a piecewise-affine approximation that captures both local and global variation with little overhead.

This is an asymmetric quantization scheme (most variants map negatives and positives to different ranges), with the exceptions of Q3_K and Q5_K which are symmetric. They quantize weights in fixed-size groups (32-weight blocks packed into 256-weight "super-blocks") and apply double-quantization to the per-group scales, first computing a scale for each group, then quantizing those scales again, reducing metadata overhead and improving quality-per-bit compared to legacy formats.

The result is lower error at the same storage. For example, a typical Q4_K lands around the mid-4s bits/weight—slightly above Q4_0/1 once you count its extra parameters, but it achieves distinctly better fidelity. Q5_K and Q6_K cluster close to the original model in perplexity while remaining far smaller than FP16.

Decoding remains lightweight. The extra parameters are compact, and arithmetic is still simple integer unpacking plus a handful of multiplies and adds. On modern CPUs and GPUs, K-quants generally match or beat legacy formats in throughput because you move fewer bytes for the same quality.

The suffixes encode "mix levels" across tensors. Examples for Q4_K:

- Q4_K_S (small): Keeps almost everything at 4-bit
- Q4_K_M (medium): Selectively raises precision for more sensitive tensors (for example, attention value projections or final layers) using 5–6 bits
- Q4_K_L (larger): Even more relaxed than Q4_K_M.

Q4_K_S (small): Keeps almost everything at 4-bit
Q4_K_M (medium): Selectively raises precision for more sensitive tensors (for example, attention value projections or final layers) using 5–6 bits
Q4_K_L (larger): Even more relaxed than Q4_K_M.

The effective bits/weight rise accordingly, buying back quality where it matters. In practice, Q4_K_M is a widely useful default for 4-bit deployments (Q4_K is also OK for large models). Q5_K_M is a high-quality setting that is close to imperceptible degradation for many tasks. Q6_K is for cases where you want "almost lossless" behavior and still want memory savings.

Keep in mind that for most models, you won't see much difference in quality between S, M, and L variants, unless you are dealing with small models (let's say <8B models).
