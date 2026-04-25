# Performance Profiling Tools

## Intel VTune Profiler

### Overview
Intel VTune Profiler optimizes application performance, system performance, and system configuration for AI, HPC, cloud, IoT, media, storage, and more.

### Features
- CPU, GPU, and NPU: Tune the entire application's performance—not just the accelerated portion
- Multilingual: Profile SYCL, C, C++, C#, Fortran, OpenCL code, Python, Google Go programming language, Java, .NET, Assembly, or any combination of languages
- System or Application: Get coarse-grained system data for an extended period or detailed results mapped to source code
- Power: Optimize performance while avoiding power- and thermal-related throttling

### Availability
- Included in Intel oneAPI Base Toolkit
- Stand-alone download available for binaries
- Repository downloads available

## perf (Linux)

### Overview
Linux perf tool for performance analysis and profiling.

### Usage
- `perf record`: Record performance data
- `perf report`: Analyze recorded data
- `perf stat`: Get performance statistics
- `perf top`: Real-time profiling

### Capabilities
- Per-instruction profiling
- Hardware event counting
- Call graph profiling
- Memory access profiling

## ETW (Windows)

### Overview
Event Tracing for Windows (ETW) is a high-performance tracing facility for Windows.

### Features
- System-wide event tracing
- Kernel and user-mode events
- Low overhead
- Real-time analysis

### Tools
- Windows Performance Analyzer (WPA)
- Xperf
- GPUView for GPU profiling

## Nsight (NVIDIA)

### Nsight Systems
- System-wide GPU and CPU profiling
- Timeline view of application execution
- CUDA kernel analysis

### Nsight Compute
- Detailed GPU kernel profiling
- Instruction-level analysis
- Memory access patterns
- Occupancy analysis

## AMD uProf

### Overview
AMD's profiling tool for AMD CPUs and GPUs.

### Features
- CPU performance monitoring
- GPU profiling
- Power and thermal analysis
- Memory bandwidth analysis

### Comparison with Intel VTune
- Similar capabilities to Intel VTune
- Free to use
- Hardware performance events may be less rich than Intel's

## Usage Recommendations

### For CPU Optimization
- Intel CPUs: Use VTune Profiler
- AMD CPUs: Use AMD uProf
- Linux: Use perf
- Windows: Use ETW

### For GPU Optimization
- NVIDIA GPUs: Use Nsight Systems and Nsight Compute
- AMD GPUs: Use AMD uProf or ROCprofiler

### For Memory Analysis
- Intel Memory Latency Checker (MLC)
- VTune memory access analysis
- Perf memory events

### For Inference Profiling
- Profile model loading time
- Measure KV cache growth
- Track memory bandwidth usage
- Analyze attention kernel performance
- Monitor quantization overhead
