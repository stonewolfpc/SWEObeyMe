# KoboldCpp Performance Guide

## Command Line Usage

### I don't want to use the GUI launcher. How to use the command line terminal with extra parameters to launch koboldcpp?

Here are some easy ways to start koboldcpp from the command line. Pick one that suits you best.

- Windows: Go to Start > Run (or WinKey+R) and input the full path of your koboldcpp.exe followed by the launch flags. e.g. C:\mystuff\koboldcpp.exe --usecuda --gpulayers 10. Alternatively, you can also create a desktop shortcut to the koboldcpp.exe file, and set the desired values in the Properties > Target box. Lastly, you can also start command prompt in your koboldcpp.exe directory (with cmd), and pass the desired flags to it from the terminal window.

- Linux/OSX: Navigate to the koboldcpp directory, and build koboldcpp with make (as described in 'How do I compile KoboldCpp'). Then run the command python3 koboldcpp.py --model (path to your model), plus whatever flags you need e.g. --usevulkan

### How do I see the available commands and how to use them?

You can launch KoboldCpp from the command line with the --help parameter to view the available command list.

### How much RAM/VRAM do I need to run Koboldcpp? What about my GPU?

The amount of RAM required depends on multiple factors such as the context size, quantization type, and parameter count of the model. In general, assuming a 2048 context with a Q4_0 quantization:

- LLAMA 3B needs at least 4GB RAM
- LLAMA 7B needs at least 8GB RAM
- LLAMA 13B needs at least 16GB RAM
- LLAMA 30B needs at least 32GB RAM
- LLAMA 65B needs at least 64GB RAM

Offloading layers to the GPU VRAM can help reduce RAM requirements, while a larger context size or larger quantization can increase RAM requirements. For number of layers to offload, see the section on GPU layer offloading.

### What does GPU layer offloading do? How many layers can I offload?

Just running with --usecuda or --usevulkan will perform prompt processing on the GPU, but combined with GPU offloading via --gpulayers takes it one step further by offloading individual layers to run on the GPU, for per-token inference as well, greatly speeding up inference. The number of layers you can offload to GPU vram depends on many factors, some of which are already mentioned above, and can also change depending on which backend (CUDA/CL/Metal) that you are using. For reference, at 2048 context in Q4_0, a 6GB Nvidia RTX 2060 can comfortably offload:

- 32 layers with LLAMA 7B
- 18 layers with LLAMA 13B
- 8 layers with LLAMA 30B

You can specify --gpulayers -1 and allow KoboldCpp to guess how many layers it should offload, though this is often not the most accurate, and doesn't work accurately for multi-gpu setups. You are recommended to determine the optimal layer fit through trial and error for best results. In new versions, the autofit will be triggered with -1 layers which automatically handles all layer estimations.

### What does --autofit do?

Using --autofit makes KoboldCpp automatically try to give the a good fit for a specified text model on your GPU. It will set the appropriate layers, MoE tensor overrides and tensor splits to try and use an optimal amount of memory. It's also enabled if you set --gpulayers to -1 and do not set any incompatible flags (Autofit is not compatible with manual tensor overrides, tensor splits or --moecpu).
