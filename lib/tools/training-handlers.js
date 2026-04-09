/**
 * Training Data & Math lookup tool handler
 *
 * Searches the training corpus for resources related to how LLMs are trained,
 * training data effects, gradient behavior, representation learning, and training dynamics.
 *
 * @module training-lookup-handler
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Search training corpus for resources
 *
 * @param {Object} args - Tool arguments
 * @param {string} args.query - Search query (keywords, topic, method name, etc.)
 * @param {string} args.category - Optional category to filter by (e.g., 'training_data_theory', 'training_math')
 * @param {Array<string>} args.topics - Optional topics to filter by
 * @param {Object} global - Global context
 * @returns {Promise<Object>} Search results with relevant documents, file paths, descriptions
 */
export async function training_lookup_handler(args, global) {
  const { query, category, topics } = args;

  if (!query) {
    return {
      success: false,
      error: 'Query is required for training lookup',
      results: [],
    };
  }

  try {
    const workspacePath = global.workspacePath || process.cwd();
    const trainingCorpusPath = path.join(workspacePath, 'training_corpus');
    const indexPath = path.join(trainingCorpusPath, 'index.json');

    // Load index
    let index;
    try {
      const indexData = await fs.readFile(indexPath, 'utf-8');
      index = JSON.parse(indexData);
    } catch (error) {
      // Index doesn't exist or is corrupted
      return {
        success: false,
        error: 'Training corpus index not found. Please set up training_corpus/index.json',
        results: [],
      };
    }

    const results = [];
    const searchTerms = query.toLowerCase().split(/\s+/);

    // Search through categories
    for (const cat of index.categories) {
      // Filter by category if specified
      if (category && cat.name !== category) {
        continue;
      }

      // Search documents in this category
      for (const doc of cat.documents) {
        let matchScore = 0;

        // Check title
        if (doc.title) {
          const titleLower = doc.title.toLowerCase();
          searchTerms.forEach(term => {
            if (titleLower.includes(term)) {
              matchScore += 3;
            }
          });
        }

        // Check description
        if (doc.description) {
          const descLower = doc.description.toLowerCase();
          searchTerms.forEach(term => {
            if (descLower.includes(term)) {
              matchScore += 2;
            }
          });
        }

        // Check topics
        if (doc.topics && doc.topics.length > 0) {
          searchTerms.forEach(term => {
            if (doc.topics.some(topic => topic.toLowerCase().includes(term))) {
              matchScore += 4;
            }
          });
        }

        // Check author
        if (doc.author) {
          const authorLower = doc.author.toLowerCase();
          searchTerms.forEach(term => {
            if (authorLower.includes(term)) {
              matchScore += 1;
            }
          });
        }

        // Check relevance
        if (doc.relevance) {
          const relLower = doc.relevance.toLowerCase();
          searchTerms.forEach(term => {
            if (relLower.includes(term)) {
              matchScore += 2;
            }
          });
        }

        // Filter by topics if specified
        if (topics && topics.length > 0) {
          const hasAllTopics = topics.every(topic =>
            doc.topics && doc.topics.some(docTopic => docTopic.toLowerCase().includes(topic.toLowerCase())),
          );
          if (!hasAllTopics) {
            matchScore = 0;
          }
        }

        if (matchScore > 0) {
          results.push({
            title: doc.title || 'Untitled',
            category: cat.name,
            filename: doc.filename,
            path: path.join(cat.path, doc.filename),
            description: doc.description || '',
            author: doc.author || 'Unknown',
            license: doc.license || 'Unknown',
            topics: doc.topics || [],
            relevance: doc.relevance || '',
            matchScore,
          });
        }
      }
    }

    // Sort by match score
    results.sort((a, b) => b.matchScore - a.matchScore);

    // Return top results
    const topResults = results.slice(0, 15);

    return {
      success: true,
      query,
      category: category || 'all',
      totalMatches: results.length,
      results: topResults,
      corpusPurpose: index.purpose || 'Training Data & Math Resource Corpus',
      message: topResults.length > 0
        ? `Found ${results.length} training resources matching "${query}"`
        : `No training resources found for "${query}". Consider adding resources to the training corpus.`,
    };

  } catch (error) {
    return {
      success: false,
      error: `Training lookup failed: ${error.message}`,
      results: [],
    };
  }
}

/**
 * List training corpus categories
 *
 * @param {Object} args - Tool arguments
 * @param {Object} global - Global context
 * @returns {Promise<Object>} List of categories with document counts
 */
export async function training_list_categories_handler(args, global) {
  try {
    const workspacePath = global.workspacePath || process.cwd();
    const trainingCorpusPath = path.join(workspacePath, 'training_corpus');
    const indexPath = path.join(trainingCorpusPath, 'index.json');

    // Load index
    let index;
    try {
      const indexData = await fs.readFile(indexPath, 'utf-8');
      index = JSON.parse(indexData);
    } catch (error) {
      return {
        success: false,
        error: 'Training corpus index not found. Please set up training_corpus/index.json',
        categories: [],
      };
    }

    const categories = index.categories.map(cat => ({
      name: cat.name,
      path: cat.path,
      description: cat.description,
      documentCount: cat.documents.length,
      documents: cat.documents.map(doc => ({
        title: doc.title,
        filename: doc.filename,
        author: doc.author,
        topics: doc.topics,
      })),
    }));

    return {
      success: true,
      categories,
      totalCategories: categories.length,
      totalDocuments: index.metadata.totalDocuments,
      lastUpdated: index.lastUpdated,
    };

  } catch (error) {
    return {
      success: false,
      error: `Training category listing failed: ${error.message}`,
      categories: [],
    };
  }
}
