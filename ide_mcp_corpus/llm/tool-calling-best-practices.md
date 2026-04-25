# LLM Tool Calling Best Practices

## Getting Started with Function Calling

Function calling is the ability to reliably connect LLMs to external tools to enable effective tool usage and interaction with external APIs.

LLMs like GPT-4 and GPT-3.5 have been fine-tuned to detect when a function needs to be called and then output JSON containing arguments to call the function. The functions that are being called by function calling will act as tools in your AI application and you can define more than one in a single request.

## Function Calling Use Cases

Function calling enables developers to create:

- Conversational agents that can efficiently use external tools to answer questions
- LLM-powered solutions for extracting and tagging data
- Applications that can help convert natural language to API calls or valid database queries
- Conversational knowledge retrieval engines that interact with a knowledge base

## Prompt Setup Best Practices

### System Prompt Configuration

When specifying a list of tools in the parameters to the API request, it is generally not necessary to declare and describe the list of tools in the system prompt. The tool definitions are passed separately through the tools parameter.

### Tool Definition Format

Each tool should have:

- Clear name
- Concise description
- Well-defined parameters with types
- Required vs optional parameter specification

### Sampling Parameters

For function calling:

- Temperature: Lower values (0.0-0.3) for more deterministic function selection
- Top P: Use with temperature for nucleus sampling
- Max tokens: Sufficient for both reasoning and function output

### Sample Settings

For exact and factual answers, keep temperature low. For more diverse responses, increase to a higher value.

## Do's and Don'ts

### Do's

- Provide clear, specific tool descriptions
- Use JSON schema for parameter validation
- Include examples in tool descriptions when helpful
- Handle tool errors gracefully
- Validate function arguments before execution
- Use appropriate sampling parameters

### Don'ts

- Don't duplicate tool information in system prompt and tools parameter
- Don't use overly high temperatures for function selection
- Don't forget to handle tool failures
- Don't assume tools will always succeed
- Don't mix function calling with creative writing tasks
- Don't use ambiguous parameter names

## Open-Source LLM Considerations

When using open-source models for function calling:

- Verify the model has been fine-tuned for function calling
- Check supported function calling formats
- May require specific prompt templates
- Test thoroughly with your specific use case
- Consider model size vs function calling capability trade-offs
