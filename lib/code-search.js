import fs from 'fs/promises';
import path from 'path';

// Language file extensions mapping
const LANGUAGE_EXTENSIONS = {
  cpp: ['.cpp', '.cc', '.cxx', '.h', '.hpp', '.hxx'],
  csharp: ['.cs'],
  python: ['.py', '.pyw'],
  java: ['.java'],
  rust: ['.rs'],
  go: ['.go'],
  typescript: ['.ts', '.tsx'],
  javascript: ['.js', '.jsx', '.mjs'],
  ruby: ['.rb'],
  php: ['.php'],
  swift: ['.swift'],
  kotlin: ['.kt', '.kts'],
  scala: ['.scala'],
  lua: ['.lua'],
  r: ['.r', '.R'],
  matlab: ['.m'],
  shell: ['.sh', '.bash', '.zsh'],
  markdown: ['.md', '.markdown'],
};

// Language importance weights (higher = more important)
const LANGUAGE_IMPORTANCE = {
  cpp: 1.0,
  csharp: 1.0,
  python: 1.0,
  java: 0.9,
  rust: 0.95,
  go: 0.9,
  typescript: 0.85,
  javascript: 0.85,
  ruby: 0.7,
  php: 0.65,
  swift: 0.8,
  kotlin: 0.75,
  scala: 0.7,
  lua: 0.6,
  r: 0.6,
  matlab: 0.5,
  shell: 0.5,
  markdown: 0.4,
};

// Language-specific patterns for better search
const LANGUAGE_PATTERNS = {
  cpp: {
    keywords: ['class', 'struct', 'namespace', 'template', 'include', 'public', 'private', 'protected'],
    operators: ['->', '::', '<<', '>>'],
  },
  csharp: {
    keywords: ['class', 'namespace', 'using', 'public', 'private', 'protected', 'async', 'await'],
    operators: ['->', '::', '=>'],
  },
  python: {
    keywords: ['def', 'class', 'import', 'from', 'async', 'await', 'with', 'lambda'],
    operators: ['->', '**', '//'],
  },
  java: {
    keywords: ['class', 'interface', 'package', 'import', 'public', 'private', 'protected'],
    operators: ['->', '::'],
  },
  rust: {
    keywords: ['fn', 'struct', 'enum', 'impl', 'use', 'mod', 'pub', 'async', 'await'],
    operators: ['->', '::', '=>'],
  },
  go: {
    keywords: ['func', 'struct', 'interface', 'package', 'import', 'go', 'chan'],
    operators: ['->', ':='],
  },
  typescript: {
    keywords: ['interface', 'type', 'class', 'import', 'export', 'async', 'await'],
    operators: ['->', '=>', '??'],
  },
  javascript: {
    keywords: ['function', 'class', 'const', 'let', 'var', 'async', 'await'],
    operators: ['=>', '??'],
  },
  markdown: {
    keywords: ['#', '##', '###', '```', '**', '__', '*', '_', '[', ']'],
    operators: [],
  },
};

/**
 * Detect language from file extension
 */
export function detectLanguage(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  for (const [lang, extensions] of Object.entries(LANGUAGE_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return lang;
    }
  }
  return null;
}

/**
 * Recursively find files in a directory
 */
async function findFilesRecursive(dir, extensions, excludeDirs) {
  const files = [];
  
  async function traverse(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      // Skip excluded directories
      if (entry.isDirectory()) {
        if (excludeDirs.includes(entry.name)) {
          continue;
        }
        await traverse(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  await traverse(dir);
  return files;
}

/**
 * Search for code files in a directory
 */
export async function findCodeFiles(
  rootDir,
  languages,
  excludeDirs = ['node_modules', '.git', 'dist', 'build']
) {
  const targetLangs = languages || Object.keys(LANGUAGE_EXTENSIONS);
  const extensions = [];
  
  for (const lang of targetLangs) {
    const langExtensions = LANGUAGE_EXTENSIONS[lang] || [];
    extensions.push(...langExtensions);
  }
  
  const files = await findFilesRecursive(rootDir, extensions, excludeDirs);
  return [...new Set(files)]; // Remove duplicates
}

/**
 * Read and parse a code file
 */
export async function readCodeFile(filepath) {
  const content = await fs.readFile(filepath, 'utf-8');
  const language = detectLanguage(filepath);
  const lines = content.split('\n');
  
  return { content, language, lines };
}

/**
 * Calculate relevance score for a search match
 */
function calculateRelevanceScore(
  query,
  content,
  language,
  matchPosition
) {
  let score = 0;
  
  // Base score for match
  score += 10;
  
  // Language importance weight
  if (language && LANGUAGE_IMPORTANCE[language]) {
    score *= LANGUAGE_IMPORTANCE[language];
  }
  
  // Query complexity (longer queries get higher scores)
  score += query.length * 0.5;
  
  // Match position (earlier matches get higher scores)
  score += Math.max(0, 10 - matchPosition.line * 0.1);
  
  // Context relevance (check for keywords)
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  if (lowerContent.includes(lowerQuery)) {
    score += 5;
  }
  
  // Check for language-specific patterns
  if (language && LANGUAGE_PATTERNS[language]) {
    const patterns = LANGUAGE_PATTERNS[language];
    for (const keyword of patterns.keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }
  }
  
  return score;
}

/**
 * Search for a pattern in code files
 */
export async function searchCode(
  rootDir,
  query,
  options = {}
) {
  const {
    languages,
    caseSensitive = false,
    maxResults = 50,
    excludeDirs = ['node_modules', '.git', 'dist', 'build'],
  } = options;
  
  const files = await findCodeFiles(rootDir, languages, excludeDirs);
  const results = [];
  
  const searchPattern = caseSensitive ? query : new RegExp(query, 'gi');
  
  for (const filepath of files) {
    try {
      const { content, language, lines } = await readCodeFile(filepath);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = caseSensitive 
          ? line.indexOf(query)
          : line.toLowerCase().indexOf(query.toLowerCase());
        
        if (match !== -1) {
          const score = calculateRelevanceScore(query, content, language, {
            line: i + 1,
            column: match + 1,
          });
          
          // Get context snippet
          const contextStart = Math.max(0, i - 2);
          const contextEnd = Math.min(lines.length - 1, i + 2);
          const snippet = lines.slice(contextStart, contextEnd + 1).join('\n');
          
          results.push({
            filepath,
            language,
            line: i + 1,
            column: match + 1,
            snippet,
            score,
          });
        }
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }
  
  // Sort by score (descending) and limit results
  results.sort((a, b) => b.score - a.score);
  
  return results.slice(0, maxResults);
}

/**
 * Get language statistics for a directory
 */
export async function getLanguageStats(
  rootDir,
  excludeDirs = ['node_modules', '.git', 'dist', 'build']
) {
  const files = await findCodeFiles(rootDir, undefined, excludeDirs);
  const stats = {};
  
  for (const filepath of files) {
    const language = detectLanguage(filepath);
    if (language) {
      if (!stats[language]) {
        stats[language] = { count: 0, files: [] };
      }
      stats[language].count++;
      stats[language].files.push(filepath);
    }
  }
  
  return stats;
}

/**
 * Search by language-specific patterns
 */
export async function searchByPattern(
  rootDir,
  pattern,
  language,
  options = {}
) {
  const { maxResults = 50, excludeDirs = ['node_modules', '.git', 'dist', 'build'] } = options;
  
  const files = await findCodeFiles(rootDir, [language], excludeDirs);
  const results = [];
  
  try {
    const regex = new RegExp(pattern, 'gi');
    
    for (const filepath of files) {
      const { lines } = await readCodeFile(filepath);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = regex.exec(line);
        
        if (match) {
          const contextStart = Math.max(0, i - 2);
          const contextEnd = Math.min(lines.length - 1, i + 2);
          const snippet = lines.slice(contextStart, contextEnd + 1).join('\n');
          
          results.push({
            filepath,
            line: i + 1,
            column: match.index + 1,
            snippet,
          });
        }
      }
    }
  } catch (error) {
    // Invalid regex pattern
    return [];
  }
  
  return results.slice(0, maxResults);
}
