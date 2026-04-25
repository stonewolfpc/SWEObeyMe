# LM Studio Developer Documentation

**Source:** https://lmstudio.ai/docs/developer  
**License:** Proprietary

## Overview

LM Studio provides a comprehensive developer stack for building applications with local LLMs. It includes SDKs, REST APIs, and compatibility layers for popular AI service APIs.

## Available SDKs and APIs

### TypeScript SDK (lmstudio-js)

- Full TypeScript support
- Async/await API design
- Type-safe tool calling
- Streaming support
- Node.js and browser compatible

### Python SDK (lmstudio-python)

- Pythonic API design
- Async support with asyncio
- Type hints throughout
- Streaming support
- Compatible with Python 3.8+

### REST API

- HTTP/JSON based
- Standard HTTP methods
- Comprehensive endpoints
- Authentication support
- Rate limiting

### OpenAI-Compatible Endpoints

- Drop-in replacement for OpenAI API
- Compatible with existing OpenAI clients
- Supports chat completions
- Supports embeddings
- Streaming support

### Anthropic-Compatible Endpoints

- Compatible with Anthropic's Claude API
- Message-based interface
- Streaming support
- Tool calling support

## Key Capabilities

### Chat and Text Generation

- Streaming responses
- Temperature and top-p control
- Stop sequences
- System prompts
- Multi-turn conversations
- Token counting

### Tool Calling and Local Agents with MCP

- Function calling support
- Local agent execution
- MCP (Model Context Protocol) integration
- Tool definitions
- Parameter validation
- Tool result handling

### Structured Output Using JSON Schema

- JSON schema validation
- Structured data extraction
- Type-safe outputs
- Recursive schemas
- Enum support
- Pattern matching

### Embeddings and Tokenization

- Text embeddings
- Token counting
- Tokenization utilities
- Batch processing
- Multiple embedding models

### Model Management

- Load models dynamically
- Download models from registry
- List available models
- Model metadata
- GPU memory management
- Model unloading

## Quick Start Guides

### TypeScript/JavaScript

```javascript
import { LMStudioClient } from 'lmstudio-js';

const client = new LMStudioClient();
const model = await client.llm.load('meta-llama/Llama-2-7b-chat-hf');

const response = await model.respond({
  messages: [{ role: 'user', content: 'Hello, world!' }],
});
```

### Python

```python
import lmstudio

client = lmstudio.LMStudioClient()
model = await client.llm.load("meta-llama/Llama-2-7b-chat-hf")

response = await model.respond(
    messages=[{"role": "user", "content": "Hello, world!"}]
)
```

### REST API

```bash
curl -X POST http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-2-7b-chat-hf",
    "messages": [{"role": "user", "content": "Hello, world!"}]
  }'
```

## Building Local AI Applications

LM Studio enables building various types of local AI applications:

### Chat Applications

- Multi-turn conversations
- Context management
- Streaming responses
- Custom system prompts

### Code Generation

- Code completion
- Code explanation
- Code refactoring
- Multi-language support

### Document Analysis

- Document summarization
- Information extraction
- Question answering
- Semantic search

### Tool Integration

- Function calling
- API integration
- Local agent orchestration
- MCP server integration

## Integration with Existing Tools

### OpenAI Client Compatibility

Use existing OpenAI SDKs by changing the base URL:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:1234/v1",
    api_key="not-needed"
)
```

### LangChain Integration

LM Studio provides LangChain integrations for:

- Chat models
- Embeddings
- LLM chains
- Agents

### MCP Server Support

- Build MCP servers with local LLMs
- Expose tools to MCP clients
- Resource access
- Prompt templates

## Headless Deployments with llmster

`llmster` enables headless deployment of LM Studio:

- Server mode operation
- No GUI required
- Production-ready
- Docker support
- Configuration files

## Model Registry

LM Studio includes a model registry with:

- Popular open-source models
- Multiple quantization levels
- Model metadata
- Version management
- Community models

## Performance Considerations

### GPU Acceleration

- Automatic GPU detection
- CUDA support
- Metal support (macOS)
- Memory optimization

### Quantization

- Multiple quantization levels (Q4, Q5, Q8)
- Balance between quality and speed
- Smaller memory footprint
- Faster inference

### Caching

- Model caching
- Response caching
- Embedding caching
- Configurable cache size

## Configuration

### Server Configuration

- Port configuration
- CORS settings
- Authentication
- Rate limiting
- Logging

### Model Configuration

- Default model
- GPU memory limits
- Context window size
- Temperature defaults
- Sampling parameters

## Monitoring and Observability

### Metrics

- Request latency
- Token throughput
- GPU utilization
- Memory usage
- Error rates

### Logging

- Request logging
- Error logging
- Performance logging
- Configurable log levels
