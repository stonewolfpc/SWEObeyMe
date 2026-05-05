/**
 * Unified documentation handlers
 * Consolidates all corpus lookup functionality into a single, unified interface
 */

import { godot_lookup_handler } from './godot-handlers.js';
import { search_llama_docs, list_llama_docs } from './code-search-handlers.js';
import { readFileWithSizeLimit } from '../shared/async-utils.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve corpus root - use user-accessible directory for extensibility
// Priority: 1) User corpus directory, 2) Built-in corpus, 3) Embedded fallback
const _dir = path.dirname(fileURLToPath(import.meta.url));
const USER_CORPUS_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.sweobeyme-corpus');
const BUILT_IN_CORPUS = path.resolve(_dir, '..', '..', 'ide_mcp_corpus');

// Essential embedded corpus as fallback (C#, C++, Python, JS, UI development)
const EMBEDDED_CORPUS = {
  version: '1.0.0-embedded',
  lastUpdated: '2026-05-05T00:00:00.000Z',
  categories: [
    {
      name: 'frontend',
      path: 'embedded/frontend',
      description:
        'Frontend/UI engineering including design systems, layout systems, framework architecture, UI/UX best practices, accessibility, and performance optimization',
      documents: [
        {
          name: 'design_systems',
          path: 'embedded/frontend/design-systems.md',
          description:
            'Material Design, Fluent Design, Apple HIG, Carbon Design, Atlassian Design System, Chakra/Radix/MUI component patterns, and Atomic Design for coherent, professional UI systems',
          source:
            'material.io, fluent.microsoft.com, developer.apple.com, carbondesignsystem.com, atlassian.design',
          license: 'MIT',
        },
        {
          name: 'layout_systems',
          path: 'embedded/frontend/layout-systems.md',
          description:
            'CSS Grid, Flexbox, Intrinsic design, Container queries, Responsive breakpoints, Mobile-first vs content-first, and Adaptive layouts for senior frontend engineering',
          source: 'css-tricks.com, web.dev, developer.mozilla.org',
          license: 'MIT',
        },
        {
          name: 'framework_architecture',
          path: 'embedded/frontend/framework-architecture.md',
          description:
            'React component patterns, Vue composition patterns, Svelte reactivity, SolidJS fine-grained reactivity, Angular architecture, State management (Redux, Zustand, MobX, Pinia), and Routing patterns for framework-agnostic UI architecture',
          source: 'react.dev, vuejs.org, svelte.dev, solidjs.com, angular.io',
          license: 'MIT',
        },
        {
          name: 'ui_ux_best_practices',
          path: 'embedded/frontend/ui-ux-best-practices.md',
          description:
            "Nielsen Norman heuristics, Cognitive load theory, Fitts's Law, Hick's Law, Error recovery patterns, Progressive disclosure, Affordances, and Interaction design patterns for UX design",
          source: 'nngroup.com, lawsux.com, smashingmagazine.com',
          license: 'MIT',
        },
        {
          name: 'accessibility',
          path: 'embedded/frontend/accessibility.md',
          description:
            'WCAG 2.2, ARIA roles, Keyboard navigation, Color contrast, Screen reader patterns, and Focus management for accessible UI by default',
          source: 'w3.org, webaim.org, developer.mozilla.org',
          license: 'MIT',
        },
        {
          name: 'performance_optimization',
          path: 'embedded/frontend/performance-optimization.md',
          description:
            'Reconciliation & diffing, Virtual DOM vs signals, Render batching, Memoization, Lazy loading, Code splitting, Image optimization, and Web vitals for performance coaching',
          source: 'web.dev, developer.mozilla.org',
          license: 'MIT',
        },
      ],
    },
    {
      name: 'testing',
      path: 'embedded/testing',
      description:
        'Testing and verification theory including property-based testing, invariant testing, and formal verification',
      documents: [
        {
          name: 'verification_theory',
          path: 'embedded/testing/verification-theory.md',
          description:
            'Property-based testing, invariant testing, metamorphic testing, concurrency testing, symbolic execution, formal verification, and fuzzing for unbreakable tools and runtimes',
          source: 'jsverify.github.io, typeable.io, wikipedia.org',
          license: 'MIT',
        },
      ],
    },
    {
      name: 'architecture',
      path: 'embedded/architecture',
      description:
        'Software architecture patterns including hexagonal architecture, event-driven systems, DDD, and state machines',
      documents: [
        {
          name: 'software_patterns',
          path: 'embedded/architecture/software-patterns.md',
          description:
            'Hexagonal architecture, event-driven systems, domain-driven design, state machine patterns, plugin architectures, and dependency inversion for clean separation of concerns',
          source: 'sandro-keil.de, github.com, cloudthat.com',
          license: 'MIT',
        },
      ],
    },
    {
      name: 'debugging',
      path: 'embedded/debugging',
      description:
        'Debugging theory including logging patterns, tracing, profiling, breakpoint strategies, post-mortem debugging, memory leak detection, and race condition debugging',
      documents: [
        {
          name: 'debugging_theory',
          path: 'embedded/debugging/debugging-theory.md',
          description:
            'Logging patterns, distributed tracing (OpenTelemetry, Jaeger), profiling strategies, breakpoint techniques, post-mortem debugging, memory leak detection, and race condition debugging',
          source: 'opentelemetry.io, jaegertracing.io, valgrind.org',
          license: 'MIT',
        },
      ],
    },
    {
      name: 'build',
      path: 'embedded/build',
      description:
        'Build systems and toolchains including CMake, Gradle, Cargo, npm/yarn/pnpm, build caching, and incremental builds',
      documents: [
        {
          name: 'toolchains',
          path: 'embedded/build/toolchains.md',
          description:
            'CMake, Gradle, Cargo, npm/yarn/pnpm, build caching strategies, incremental builds, and monorepo tools (Nx, Turborepo) for build engineering',
          source: 'cmake.org, gradle.org, rust-lang.org, npmjs.com',
          license: 'MIT',
        },
      ],
    },
    {
      name: 'security',
      path: 'embedded/security',
      description:
        'Security and sandboxing patterns including capability-based security, syscall filtering, and resource limits',
      documents: [
        {
          name: 'sandboxing',
          path: 'embedded/security/sandboxing.md',
          description:
            'Capability-based security, sandboxing patterns, syscall filtering (seccomp, Landlock), resource limits, and safe execution patterns for MCP tools and code execution',
          source: 'mozilla.org, shayon.dev, starlog.is',
          license: 'MIT',
        },
      ],
    },
  ],
};

let _corpusIndex = null;
let _activeCorpusPath = null;
async function loadCorpusIndex() {
  if (_corpusIndex) return _corpusIndex;

  // Priority: 1) User corpus directory, 2) Built-in corpus, 3) Embedded fallback
  const corpusPaths = [USER_CORPUS_DIR, BUILT_IN_CORPUS];

  for (const corpusPath of corpusPaths) {
    try {
      const indexPath = path.join(corpusPath, 'index.json');
      const raw = await Promise.race([
        fs.readFile(indexPath, 'utf-8'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('fs.readFile timeout')), 2000)
        ),
      ]);
      _corpusIndex = JSON.parse(raw);
      if (_corpusIndex.categories && _corpusIndex.categories.length > 0) {
        _activeCorpusPath = corpusPath;
        return _corpusIndex;
      }
    } catch {
      continue;
    }
  }

  // Fall back to embedded essential corpus
  _corpusIndex = EMBEDDED_CORPUS;
  _activeCorpusPath = 'embedded';
  return _corpusIndex;
}

async function ide_corpus_search(args) {
  const { query, category, maxResults = 10 } = args;
  if (!query) return { content: [{ type: 'text', text: 'query is required' }], isError: true };

  const index = await loadCorpusIndex();
  const q = query.toLowerCase();
  const results = [];

  const categoriesToSearch = category
    ? index.categories.filter((c) => c.name === category || c.path.includes(category))
    : index.categories;

  for (const cat of categoriesToSearch) {
    if (!cat.documents) continue;
    for (const doc of cat.documents) {
      const score =
        (doc.name?.toLowerCase().includes(q) ? 3 : 0) +
        (doc.description?.toLowerCase().includes(q) ? 2 : 0) +
        (cat.name?.toLowerCase().includes(q) ? 1 : 0);
      if (score > 0) results.push({ score, cat: cat.name, doc });
    }
  }

  results.sort((a, b) => b.score - a.score);
  const top = results.slice(0, maxResults);

  if (top.length === 0) {
    return { content: [{ type: 'text', text: `No results found in IDE corpus for "${query}".` }] };
  }

  // Read top doc content
  let text = `IDE Corpus results for "${query}":\n\n`;
  for (const { cat, doc } of top) {
    text += `### [${cat}] ${doc.name}\n`;
    text += `${doc.description || ''}\n`;
    if (doc.source) text += `Source: ${doc.source}\n`;
    try {
      const docPath =
        _activeCorpusPath === 'embedded' ? null : path.resolve(_activeCorpusPath, doc.path);
      const content = await readFileWithSizeLimit(docPath);
      text += `\n${content.slice(0, 2000)}${content.length > 2000 ? '\n...[truncated]' : ''}\n`;
    } catch {
      text += `(content not available at ${doc.path})\n`;
    }
    text += '\n---\n\n';
  }

  return { content: [{ type: 'text', text }] };
}

async function ide_corpus_list_categories() {
  const index = await loadCorpusIndex();
  let text = 'IDE Corpus categories:\n\n';
  for (const cat of index.categories) {
    text += `  ${cat.name} — ${cat.description || ''}\n`;
  }
  return { content: [{ type: 'text', text }] };
}

/**
 * Corpus registry - maps corpus IDs to their handlers and metadata
 */
const CORPUS_REGISTRY = {
  ide: {
    name: 'IDE / MCP Corpus',
    description:
      'Windsurf, MCP spec, VS Code API, OpenVSX, agentic patterns, quantization, LLM, testing, and 35+ technical categories from ide_mcp_corpus/',
    handler: ide_corpus_search,
    supportsCategories: true,
    listCategoriesHandler: ide_corpus_list_categories,
  },
  godot: {
    name: 'Godot Engine',
    description: 'Godot best practices, scene organization, autoloads, GDScript, project structure',
    handler: godot_lookup_handler,
    supportsCategories: false,
    listCategoriesHandler: async () => ({
      content: [
        {
          type: 'text',
          text: 'Godot corpus does not use categories. Use docs_lookup with godot corpus and query instead.',
        },
      ],
    }),
  },
  llama: {
    name: 'Llama.cpp / GGML',
    description: 'LlamaCpp.net, LlamaCppUnity, model loading, inference, quantization, GGUF format',
    handler: search_llama_docs,
    supportsCategories: false,
    listCategoriesHandler: list_llama_docs,
  },
};

/**
 * Unified documentation lookup - searches across all corpora or a specific one
 */
export async function docs_lookup_handler(args) {
  const { query, corpus, category, tags, topics, maxResults = 10 } = args;

  if (!query) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: query parameter is required.\n\nUsage: docs_lookup({\n  query: "search terms",\n  corpus: "optional_specific_corpus",\n  category: "optional_category",\n  maxResults: 10\n})',
        },
      ],
      isError: true,
    };
  }

  // If specific corpus requested, route to that handler with timeout protection
  const corpusId = corpus === 'unified' ? 'ide' : corpus;
  if (corpusId) {
    const corpusConfig = CORPUS_REGISTRY[corpusId];
    if (!corpusConfig) {
      const availableCorpora = Object.keys(CORPUS_REGISTRY).join(', ');
      return {
        content: [
          {
            type: 'text',
            text: `Error: Unknown corpus "${corpus}".\n\nAvailable corpora: ${availableCorpora}\n\nUse docs_list_corpora() to see all available documentation collections.`,
          },
        ],
        isError: true,
      };
    }

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Corpus search timeout')), 5000)
      );
      const result = await Promise.race([
        corpusConfig.handler({ query, category, tags, topics, maxResults }),
        timeoutPromise,
      ]);
      // Add corpus context to result
      if (result.content && result.content[0]) {
        result.content[0].text = `[CORPUS: ${corpusConfig.name}]\n\n${result.content[0].text}`;
      }
      return result;
    } catch (error) {
      // Handle directory not found errors gracefully
      if (
        error.message.includes('ENOENT') ||
        error.message.includes('no such file or directory') ||
        error.message.includes('not found')
      ) {
        return {
          content: [
            {
              type: 'text',
              text: `[CORPUS: ${corpusConfig.name}]\n\nCorpus directory not found. This corpus is not available in the current workspace.`,
            },
          ],
          isError: false, // Not a real error, just unavailable
        };
      }
      return {
        content: [{ type: 'text', text: `Error searching ${corpus} corpus: ${error.message}` }],
        isError: true,
      };
    }
  }

  // Search ALL corpora in parallel with timeout protection
  const searchPromises = Object.entries(CORPUS_REGISTRY).map(async ([corpusId, config]) => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Corpus search timeout')), 5000)
      );
      const result = await Promise.race([
        config.handler({ query, maxResults: Math.ceil(maxResults / 2) }),
        timeoutPromise,
      ]);
      return { corpus: corpusId, name: config.name, result, success: true };
    } catch (error) {
      return { corpus: corpusId, name: config.name, error: error.message, success: false };
    }
  });

  const results = await Promise.all(searchPromises);

  // Compile results from all corpora
  let combinedText = `=== Documentation Search Results for: "${query}" ===\n\n`;
  let hasAnyResults = false;

  for (const { corpus, name, result, success, error } of results) {
    if (!success) {
      combinedText += `\n--- ${name} ---\nError: ${error}\n`;
      continue;
    }

    if (result.content && result.content[0]) {
      const text = result.content[0].text;
      // Check if result actually has content (not just "No results found")
      if (!text.includes('No results') && !text.includes('not found') && text.trim().length > 50) {
        hasAnyResults = true;
        combinedText += `\n--- ${name} ---\n${text}\n`;
      }
    }
  }

  if (!hasAnyResults) {
    combinedText += `\nNo results found in any corpus for "${query}".\n\nTry:\n- Using different keywords\n- Searching a specific corpus with the 'corpus' parameter\n- Using docs_list_corpora() to see what's available`;
  }

  combinedText += `\n\n---\nTip: To search a specific corpus only, use: docs_lookup({ query: "${query}", corpus: "CORPUS_NAME" })`;

  return {
    content: [{ type: 'text', text: combinedText }],
  };
}

/**
 * List all available corpora
 */
export async function docs_list_corpora_handler() {
  let text = '=== Available Documentation Corpora ===\n\n';

  for (const [id, config] of Object.entries(CORPUS_REGISTRY)) {
    text += `[${id}] ${config.name}\n`;
    text += `  ${config.description}\n`;
    text += `  Categories: ${config.supportsCategories ? 'Yes' : 'No'}\n\n`;
  }

  text += '---\nUsage:\n';
  text += '- docs_lookup({ query: "search terms" }) - Search all corpora\n';
  text += '- docs_lookup({ query: "search", corpus: "math" }) - Search specific corpus\n';
  text += '- docs_list_categories({ corpus: "unified" }) - List categories in a corpus\n';

  return {
    content: [{ type: 'text', text }],
  };
}

/**
 * List categories in a specific corpus
 */
export async function docs_list_categories_handler(args) {
  const { corpus } = args;

  if (!corpus) {
    // List categories for ALL corpora that support them
    let text = '=== Categories Across All Corpora ===\n\n';

    for (const [corpusId, config] of Object.entries(CORPUS_REGISTRY)) {
      if (!config.supportsCategories) {
        text += `[${corpusId}] ${config.name}\n  (No categories - use direct lookup)\n\n`;
        continue;
      }

      try {
        const result = await config.listCategoriesHandler({ corpus: corpusId });
        if (result.content && result.content[0]) {
          text += `[${corpusId}] ${config.name}\n${result.content[0].text}\n\n`;
        }
      } catch (error) {
        text += `[${corpusId}] ${config.name}\n  Error listing categories: ${error.message}\n\n`;
      }
    }

    return { content: [{ type: 'text', text }] };
  }

  // Map 'unified' to the actual 'ide' corpus (the unified documentation collection)
  const corpusId = corpus === 'unified' ? 'ide' : corpus;

  // List categories for specific corpus
  const corpusConfig = CORPUS_REGISTRY[corpusId];
  if (!corpusConfig) {
    const available = Object.keys(CORPUS_REGISTRY).join(', ');
    return {
      content: [
        {
          type: 'text',
          text: `Error: Unknown corpus "${corpus}".\n\nAvailable: ${available}`,
        },
      ],
      isError: true,
    };
  }

  if (!corpusConfig.supportsCategories) {
    return {
      content: [
        {
          type: 'text',
          text: `The "${corpus}" corpus (${corpusConfig.name}) does not use categories.\n\nUse docs_lookup({ query: "...", corpus: "${corpus}" }) to search directly.`,
        },
      ],
    };
  }

  try {
    return await corpusConfig.listCategoriesHandler({ corpus });
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * Verify documentation claims (math, algorithms, formulas)
 * Note: Math verification handler removed - this returns a placeholder message
 */
export async function docs_verify_handler(args) {
  const { formula, algorithm, constraints, properties } = args;

  if (!formula && !algorithm) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Either formula or algorithm parameter is required.\n\nUsage:\n- docs_verify({ formula: "x^2 + 2x + 1" })\n- docs_verify({ algorithm: "sorting steps" })\n- docs_verify({ formula: "...", constraints: { domain: "x > 0" } })',
        },
      ],
      isError: true,
    };
  }

  // Math verification handler removed - return placeholder
  return {
    content: [
      {
        type: 'text',
        text: 'Math verification is currently unavailable. The dedicated math verification handler has been consolidated. Please verify mathematical claims manually or use the documentation lookup tools to find relevant references.',
      },
    ],
  };
}

// Handlers exported at function definitions above
