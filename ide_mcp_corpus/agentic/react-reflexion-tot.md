# Agentic System Design

## Overview

This document covers agentic system design patterns including ReAct, Reflexion, Tree-of-Thought, Graph-of-Thought, AutoGen, SWE-bench, and Toolformer. These frameworks enable LLMs to perform complex multi-step reasoning, self-correction, and tool orchestration.

## ReAct (Reasoning + Acting)

### How It Works

ReAct is a general paradigm that combines reasoning and acting with LLMs. It addresses the limitations of Chain-of-Thought (CoT) prompting, which lacks access to the external world and can lead to fact hallucination and error propagation.

ReAct prompts LLMs to generate:

1. **Verbal reasoning traces**: Thought processes
2. **Actions**: Interactions with external environments

This enables:

- Dynamic reasoning to create, maintain, and adjust plans
- Interaction with external environments (e.g., Wikipedia, APIs)
- Information retrieval to support reasoning
- Reasoning to target what to retrieve next

### Execution Pattern

```
Thought: [reasoning about current state]
Action: [tool call or API request]
Observation: [result from environment]
Thought: [reasoning based on observation]
Action: [next action]
...
```

### Use Cases

- Knowledge-intensive question answering (HotpotQA)
- Decision-making tasks
- Multi-step reasoning with external tools
- Web search and information retrieval

### Advantages

- Reduces hallucination by grounding in external data
- Enables dynamic plan adjustment
- Supports complex multi-step tasks
- Interleaves reasoning and acting

### Limitations

- Requires reliable external tools
- Can be slow due to tool calls
- Error propagation if tools fail
- Context window limitations for long trajectories

### Implementation Tips

- Provide in-context examples of Thought-Act-Observation patterns
- Use tool descriptions that guide action selection
- Implement error handling for tool failures
- Cache tool results when possible

## Reflexion

### Overview

Reflexion is a framework to reinforce language-based agents through linguistic feedback. It extends ReAct by introducing self-evaluation, self-reflection, and memory components.

### Architecture

Reflexion consists of three distinct models:

1. **Actor**: Generates text and actions based on state observations
   - Uses CoT or ReAct as base
   - Takes action in environment
   - Receives observation
   - Has memory component for context

2. **Evaluator**: Scores outputs produced by Actor
   - Takes trajectory as input
   - Outputs reward score
   - Uses LLMs or rule-based heuristics
   - Task-specific reward functions

3. **Self-Reflection**: Generates verbal reinforcement cues
   - LLM-based
   - Uses reward signal, trajectory, persistent memory
   - Provides feedback for future trials
   - Stores experiences in long-term memory

### Process

1. Define task
2. Generate trajectory (Actor)
3. Evaluate (Evaluator)
4. Perform reflection (Self-Reflection)
5. Generate next trajectory with reflection context

### Memory System

- **Short-term memory**: Current trajectory
- **Long-term memory**: Distilled, stored reflections
- Iterative refinement loop

### Results

- Dramatically outperforms non-reflective agents
- Solved 130/134 challenges in AlfWorld environment
- Effective on decision-making, programming, reasoning tasks

### When to Use

- Complex tasks requiring iterative improvement
- Environments with clear success/failure signals
- Tasks where self-reflection provides value
- Multi-episode learning scenarios

### Implementation Tips

- Design clear reward functions
- Store reflections with retrieval indices
- Use reflection context in subsequent attempts
- Balance reflection depth vs computation cost

## Tree-of-Thought (ToT)

### Overview

Tree-of-Thought is a framework that generalizes chain-of-thought prompting and encourages exploration over thoughts that serve as intermediate steps for problem solving.

### How It Works

ToT maintains a tree of thoughts where:

- Thoughts are coherent language sequences
- Thoughts serve as intermediate steps toward solving a problem
- LM self-evaluates progress through intermediate thoughts
- Search algorithms (BFS, DFS, beam search) enable systematic exploration

### Search Strategies

1. **Breadth-First Search (BFS)**: Explore all candidates at each depth
2. **Depth-First Search (DFS)**: Explore deep before wide
3. **Beam Search**: Keep top-k candidates at each step
4. **RL-based Controller**: Trained controller for backtracking decisions

### Thought Evaluation

LM prompted to evaluate thoughts as:

- "sure/maybe/impossible" for reaching goal
- Numerical scores
- Ranking by likelihood of success

### Example: Game of 24

- Decompose into 3 steps
- Each step: intermediate equation
- Keep best b=5 candidates at each step
- Sample values 3 times per thought
- Evaluate as "sure/maybe/impossible"

### Results

ToT substantially outperforms:

- Chain-of-Thought
- Self-consistency
- Other prompting methods

### Variants

1. **Yao et al. (2023)**: DFS/BFS/beam search
2. **Long (2023)**: RL-based ToT Controller
3. **Hulbert (2023)**: Single-prompt ToT ("three experts")
4. **Sun (2023)**: PanelGPT (panel discussions)

### Simple ToT Prompt

```
Imagine three different experts are answering this question. All experts will write down 1 step of their thinking, then share it with the group. Then all experts will go on to the next step, etc. If any expert realises they're wrong at any point then they leave. The question is...
```

### When to Use

- Complex tasks requiring exploration
- Strategic lookahead needed
- Multiple solution paths possible
- Tasks decomposable into steps

### Implementation Tips

- Define number of candidates and steps per task
- Design thought evaluation prompts carefully
- Choose search strategy based on task characteristics
- Balance exploration depth vs computation cost

## Graph-of-Thought (GoT)

### Overview

Graph-of-Thought extends Tree-of-Thought by allowing more complex relationships between thoughts, including cycles and arbitrary graph structures.

### Key Differences from ToT

- Thoughts can connect in arbitrary graph patterns
- Supports cycles and revisiting thoughts
- More flexible reasoning structures
- Can model dependencies and constraints

### Use Cases

- Tasks with cyclic dependencies
- Constraint satisfaction problems
- Planning with backtracking
- Multi-step reasoning with revisiting

## AutoGen

### Overview

AutoGen is a framework for building multi-agent conversations where agents can work together to solve tasks.

### Architecture

- Multiple conversable agents
- Human-in-the-loop support
- Tool execution capabilities
- Code generation and execution

### Agent Types

- Assistant agents (LLM-based)
- User proxy agents (human or code executor)
- Specialized tool agents

### Conversation Patterns

- Sequential conversations
- Group chats
- Hierarchical agent structures
- Dynamic agent selection

### Use Cases

- Code generation and debugging
- Multi-agent problem solving
- Human-AI collaboration
- Complex task decomposition

## SWE-bench

### Overview

SWE-bench is a benchmark for evaluating LLMs on real-world software engineering tasks from GitHub repositories.

### Task Types

- Bug fixing
- Feature implementation
- Code refactoring
- Documentation updates

### Evaluation

- Automated test suite execution
- Code correctness verification
- Repository-level context understanding

### Relevance to Agentic Design

- Demonstrates need for multi-step reasoning
- Requires tool orchestration (file editing, testing)
- Highlights importance of self-correction
- Shows need for repository-aware agents

## Toolformer

### Overview

Toolformer enables LLMs to decide when and how to call external APIs by learning from self-supervised training.

### Key Innovation

- LLM learns to insert API calls into text
- Self-supervised training on text corpora
- Decides when to use tools
- Generates tool arguments

### Training Process

1. Identify potential API call positions
2. Execute APIs and get results
3. Filter calls that improve prediction
4. Fine-tune model to use beneficial calls

### Use Cases

- Calculator usage
- Wikipedia search
- Calendar operations
- Question answering with external knowledge

## Integration Patterns

### Combining Frameworks

- **ReAct + Reflexion**: Add self-reflection to ReAct
- **ToT + ReAct**: Tree search over ReAct trajectories
- **AutoGen + Reflexion**: Multi-agent with self-reflection
- **Toolformer + ReAct**: Learned tool usage in ReAct

### Planning Patterns

- **Hierarchical planning**: High-level goals → low-level actions
- **Replanning**: Adjust plan based on feedback
- **Parallel planning**: Explore multiple paths simultaneously
- **Incremental planning**: Build plan iteratively

### Self-Correction Patterns

- **Reflection-based**: Learn from past mistakes
- **Verification-based**: Check intermediate results
- **Consistency-based**: Ensure coherence
- **Feedback-based**: Use environment feedback

## Tool Orchestration

### Tool Selection

- Relevance scoring
- Capability matching
- Cost-benefit analysis
- Dependency resolution

### Tool Execution

- Parallel execution when possible
- Error handling and retry
- Result caching
- Execution monitoring

### Tool Composition

- Sequential composition
- Parallel composition
- Conditional composition
- Iterative composition

## Chain-of-Thought Patterns

### Standard CoT

```
Let's think step by step:
1. First, ...
2. Then, ...
3. Finally, ...
```

### Self-Consistency

- Generate multiple CoT traces
- Aggregate results (majority vote)
- Improves reliability

### Zero-Shot CoT

- Add "Let's think step by step" to prompt
- No examples needed
- Simple but effective

### Few-Shot CoT

- Provide examples of reasoning
- More effective than zero-shot
- Requires prompt space

## Best Practices

### Prompt Design

- Clear task descriptions
- Explicit reasoning format
- Tool descriptions with examples
- Error handling instructions

### Memory Management

- Short-term: Current trajectory
- Long-term: Learned patterns
- Episodic: Task-specific experiences
- Semantic: General knowledge

### Evaluation

- Define clear success metrics
- Use intermediate checkpoints
- Log reasoning traces
- Analyze failure modes

### Safety

- Tool access controls
- Input validation
- Output sanitization
- Human oversight for critical actions
