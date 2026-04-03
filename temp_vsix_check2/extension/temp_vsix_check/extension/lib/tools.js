import path from 'path';

// Import tool handlers and registry
import { toolHandlers, setGetRandomQuote } from './tools/handlers.js';
import { getToolDefinitions } from './tools/registry.js';

// Set getRandomQuote after initialization
export async function initializeQuotes() {
  try {
    const { fileURLToPath } = await import('url');
    const quotesModule = await import(
      path.join(path.dirname(fileURLToPath(import.meta.url)), '../quotes.js')
    );
    const getRandomQuote = quotesModule.getRandomQuote;
    setGetRandomQuote(getRandomQuote);
  } catch (e) {
    // Fallback quotes if quotes.js not found
    const fallbackQuotes = {
      SUCCESS: ['Surgery complete.'],
      FAILURE: ['Non-compliance detected.'],
      RECOVERY: ['Recovery initiated.'],
    };
    setGetRandomQuote(category => fallbackQuotes[category][0]);
  }
}

// Re-export for convenience
export { toolHandlers, getToolDefinitions };
