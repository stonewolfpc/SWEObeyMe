import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corpora = [
  { name: 'csharp_dotnet', path: 'csharp_dotnet_corpus', displayName: 'C#/.NET' },
  { name: 'cpp', path: 'cpp_corpus', displayName: 'C++' },
  { name: 'git', path: 'git_corpus', displayName: 'Git' },
  { name: 'enterprise_security', path: 'enterprise_security_corpus', displayName: 'Enterprise/Security' },
  { name: 'typescript_javascript', path: 'typescript_javascript_corpus', displayName: 'TypeScript/JavaScript' },
  { name: 'vscode_extension', path: 'vscode_extension_corpus', displayName: 'VS Code Extension API' },
  { name: 'security_csp', path: 'security_csp_corpus', displayName: 'Security/CSP' },
  { name: 'build_deployment', path: 'build_deployment_corpus', displayName: 'Build/Deployment' },
  { name: 'testing_qa', path: 'testing_qa_corpus', displayName: 'Testing/QA' },
  { name: 'mcp_implementation', path: 'mcp_implementation_corpus', displayName: 'MCP Implementation' },
  { name: 'performance_profiling', path: 'performance_profiling_corpus', displayName: 'Performance/Profiling' },
  { name: 'nodejs_runtime', path: 'nodejs_runtime_corpus', displayName: 'Node.js Runtime' },
  { name: 'web_development', path: 'web_development_corpus', displayName: 'Web Development' }
];

async function getIndex(corpusPath) {
  const indexPath = path.join(__dirname, '..', '..', corpusPath, 'index.json');
  try {
    const data = await fs.readFile(indexPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading index for ${corpusPath}:`, error);
    return null;
  }
}

async function searchCorpus(corpus, query, category, tags) {
  const index = await getIndex(corpus.path);
  if (!index) return [];

  const results = [];
  const lowerQuery = query ? query.toLowerCase() : '';
  const lowerCategory = category ? category.toLowerCase() : '';
  const lowerTags = tags ? tags.map(t => t.toLowerCase()) : [];

  if (!index.categories) return results;

  for (const cat of index.categories) {
    if (lowerCategory && !cat.name.toLowerCase().includes(lowerCategory)) {
      continue;
    }

    if (!cat.documents) continue;

    for (const doc of cat.documents) {
      const titleMatch = !lowerQuery || (doc.title && doc.title.toLowerCase().includes(lowerQuery));
      const descMatch = !lowerQuery || (doc.description && doc.description.toLowerCase().includes(lowerQuery));
      const topicMatch = !lowerQuery || (doc.topics && doc.topics.some(t => t.toLowerCase().includes(lowerQuery)));
      const tagMatch = lowerTags.length === 0 || (doc.topics && doc.topics.some(t => lowerTags.some(lt => t.toLowerCase().includes(lt))));

      if ((titleMatch || descMatch || topicMatch) && tagMatch) {
        results.push({
          corpus: corpus.displayName,
          corpusName: corpus.name,
          category: cat.name,
          filename: doc.filename,
          title: doc.title,
          author: doc.author,
          description: doc.description,
          license: doc.license,
          topics: doc.topics,
          relevance: doc.relevance,
          filePath: path.join(corpus.path, cat.path, doc.filename)
        });
      }
    }
  }

  return results;
}

export const unifiedHandlers = {
  unified_lookup: async (args) => {
    const { query, corpus, category, tags } = args;
    
    if (corpus) {
      const targetCorpus = corpora.find(c => c.name === corpus);
      if (!targetCorpus) {
        return {
          success: false,
          error: `Corpus '${corpus}' not found. Available corpora: ${corpora.map(c => c.name).join(', ')}`
        };
      }
      
      const results = await searchCorpus(targetCorpus, query, category, tags);
      return {
        success: true,
        corpus: targetCorpus.displayName,
        results,
        count: results.length
      };
    }

    const allResults = [];
    for (const corp of corpora) {
      const results = await searchCorpus(corp, query, category, tags);
      allResults.push(...results);
    }

    return {
      success: true,
      results: allResults,
      count: allResults.length
    };
  },

  unified_list_categories: async (args) => {
    const { corpus } = args;
    
    if (corpus) {
      const targetCorpus = corpora.find(c => c.name === corpus);
      if (!targetCorpus) {
        return {
          success: false,
          error: `Corpus '${corpus}' not found. Available corpora: ${corpora.map(c => c.name).join(', ')}`
        };
      }
      
      const index = getIndex(targetCorpus.path);
      if (!index) {
        return {
          success: false,
          error: `Failed to read index for ${targetCorpus.displayName}`
        };
      }

      return {
        success: true,
        corpus: targetCorpus.displayName,
        categories: index.categories.map(cat => ({
          name: cat.name,
          path: cat.path,
          description: cat.description,
          documentCount: cat.documents.length
        }))
      };
    }

    const allCategories = [];
    for (const corp of corpora) {
      const index = getIndex(corp.path);
      if (index && index.categories) {
        allCategories.push({
          corpus: corp.displayName,
          corpusName: corp.name,
          categories: index.categories.map(cat => ({
            name: cat.name,
            path: cat.path,
            description: cat.description,
            documentCount: cat.documents ? cat.documents.length : 0
          }))
        });
      }
    }

    return {
      success: true,
      corpora: allCategories
    };
  },

  unified_list_corpora: async () => {
    return {
      success: true,
      corpora: corpora.map(c => ({
        name: c.name,
        displayName: c.displayName,
        path: c.path
      }))
    };
  }
};
