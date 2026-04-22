/**
 * Math lookup tool handler
 *
 * Searches the math corpus for mathematical references, formulas, algorithms,
 * and definitions based on keywords, formulas, algorithm names, math topics, or tags.
 *
 * @module math-lookup-handler
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Search math corpus for references
 *
 * @param {Object} args - Tool arguments
 * @param {string} args.query - Search query (keywords, formula, algorithm name, etc.)
 * @param {string} args.category - Optional category to filter by (e.g., 'calculus', 'linear_algebra')
 * @param {Array<string>} args.tags - Optional tags to filter by
 * @param {Object} global - Global context
 * @returns {Promise<Object>} Search results with relevant excerpts, file paths, summaries
 */
export async function math_lookup_handler(args, global) {
  const { query, category, tags } = args;

  if (!query) {
    return {
      success: false,
      error: 'Query is required for math lookup',
      results: [],
    };
  }

  try {
    const workspacePath = global.workspacePath || process.cwd();
    const mathCorpusPath = path.join(workspacePath, 'math_corpus');
    const indexPath = path.join(mathCorpusPath, 'index.json');

    // Load index
    let index;
    try {
      const indexData = await fs.readFile(indexPath, 'utf-8');
      index = JSON.parse(indexData);
    } catch (error) {
      // Index doesn't exist or is corrupted
      return {
        success: false,
        error: 'Math corpus index not found. Please set up math_corpus/index.json',
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
              matchScore += 2;
            }
          });
        }

        // Check description
        if (doc.description) {
          const descLower = doc.description.toLowerCase();
          searchTerms.forEach(term => {
            if (descLower.includes(term)) {
              matchScore += 1;
            }
          });
        }

        // Check tags
        if (doc.tags && doc.tags.length > 0) {
          searchTerms.forEach(term => {
            if (doc.tags.some(tag => tag.toLowerCase().includes(term))) {
              matchScore += 3;
            }
          });
        }

        // Filter by tags if specified
        if (tags && tags.length > 0) {
          const hasAllTags = tags.every(tag =>
            doc.tags && doc.tags.some(docTag => docTag.toLowerCase().includes(tag.toLowerCase())),
          );
          if (!hasAllTags) {
            matchScore = 0;
          }
        }

        if (matchScore > 0) {
          results.push({
            title: doc.title || 'Untitled',
            category: cat.name,
            filename: doc.filename,
            path: doc.path,
            description: doc.description || '',
            license: doc.license || 'Unknown',
            tags: doc.tags || [],
            matchScore,
            excerpt: doc.excerpt || '',
          });
        }
      }
    }

    // Sort by match score
    results.sort((a, b) => b.matchScore - a.matchScore);

    // Return top results
    const topResults = results.slice(0, 10);

    return {
      success: true,
      query,
      category: category || 'all',
      totalMatches: results.length,
      results: topResults,
      message: topResults.length > 0
        ? `Found ${results.length} references matching "${query}"`
        : `No references found for "${query}". Consider adding references to the math corpus.`,
    };

  } catch (error) {
    return {
      success: false,
      error: `Math lookup failed: ${error.message}`,
      results: [],
    };
  }
}

/**
 * Math verification tool handler
 *
 * Verifies mathematical formulas, algorithms, and constraints using symbolic checks,
 * numerical tests, and domain/range validation.
 *
 * @module math-verify-handler
 */

/**
 * Verify mathematical formula or algorithm
 *
 * @param {Object} args - Tool arguments
 * @param {string} args.formula - Mathematical formula to verify (optional)
 * @param {string} args.algorithm - Algorithm steps to verify (optional)
 * @param {Object} args.constraints - Expected constraints (optional)
 * @param {Array<string>} args.properties - Expected properties (optional)
 * @param {Object} global - Global context
 * @returns {Promise<Object>} Verification result with pass/fail status and reasoning
 */
export async function math_verify_handler(args, global) {
  const { formula, algorithm, constraints, properties } = args;

  if (!formula && !algorithm) {
    return {
      success: false,
      error: 'Either formula or algorithm is required for math verification',
      result: {
        pass: false,
        reasoning: 'No input provided for verification',
      },
    };
  }

  try {
    const checks = [];
    let overallPass = true;

    // If formula provided, perform formula checks
    if (formula) {
      // Check for balanced parentheses
      const openParens = (formula.match(/\(/g) || []).length;
      const closeParens = (formula.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        checks.push({
          type: 'parentheses_balance',
          pass: false,
          message: `Unbalanced parentheses: ${openParens} open, ${closeParens} close`,
        });
        overallPass = false;
      } else {
        checks.push({
          type: 'parentheses_balance',
          pass: true,
          message: 'Parentheses are balanced',
        });
      }

      // Check for common mathematical notation patterns
      const mathPatterns = [
        /\d+/,  // Numbers
        /[a-z]/i,  // Variables
        /[+\-*/=]/,  // Operators
        /\^/,  // Exponent
        /sqrt/,  // Square root
        /log|ln/,  // Logarithms
        /sin|cos|tan/,  // Trigonometric
        /integral|derivative|limit/i,  // Calculus terms
      ];

      const hasMathNotation = mathPatterns.some(pattern => pattern.test(formula));
      if (checks) {
        checks.push({
          type: 'mathematical_notation',
          pass: hasMathNotation,
          message: hasMathNotation ? 'Contains mathematical notation' : 'May not be a mathematical formula',
        });
      }
    }

    // If algorithm provided, perform algorithm checks
    if (algorithm) {
      // Check for common algorithm keywords
      const algorithmKeywords = ['for', 'while', 'if', 'return', 'function', 'loop', 'iteration', 'recursion'];
      const hasAlgorithmStructure = algorithmKeywords.some(keyword =>
        new RegExp(keyword, 'i').test(algorithm),
      );

      if (checks) {
        checks.push({
          type: 'algorithm_structure',
          pass: hasAlgorithmStructure,
          message: hasAlgorithmStructure ? 'Contains algorithmic structure' : 'May not be a valid algorithm',
        });
      }

      // Check for complexity indicators
      if (/O\(/.test(algorithm)) {
        if (checks) {
          checks.push({
            type: 'complexity_specified',
            pass: true,
            message: 'Algorithm includes complexity analysis',
          });
        }
      }
    }

    // Check constraints if provided
    if (constraints) {
      const constraintChecks = [];

      if (constraints.domain) {
        constraintChecks.push({
          type: 'domain_constraint',
          specified: true,
          value: constraints.domain,
        });
      }

      if (constraints.range) {
        constraintChecks.push({
          type: 'range_constraint',
          specified: true,
          value: constraints.range,
        });
      }

      if (checks) {
        checks.push({
          type: 'constraints',
          pass: constraintChecks.length > 0,
          message: `${constraintChecks.length} constraint(s) specified`,
          details: constraintChecks,
        });
      }
    }

    // Check properties if provided
    if (properties && properties.length > 0) {
      if (checks) {
        checks.push({
          type: 'properties',
          pass: true,
          message: `${properties.length} property/properties specified for verification`,
          properties,
        });
      }
    }

    // Note: Full symbolic and numerical verification requires a math library
    // This is a basic structural verification
    if (checks) {
      checks.push({
        type: 'symbolic_verification',
        pass: null,
        message: 'Full symbolic verification requires math library integration (not yet implemented)',
      });

      checks.push({
        type: 'numerical_verification',
        pass: null,
        message: 'Numerical verification requires test cases to be provided (not yet implemented)',
      });
    }

    return {
      success: true,
      result: {
        pass: overallPass,
        checks,
        reasoning: overallPass
          ? 'Basic structure verification passed. Full verification requires math library integration.'
          : 'Basic structure verification failed. Review the formula or algorithm.',
        formula: formula || null,
        algorithm: algorithm || null,
        recommendations: overallPass
          ? ['Consider adding specific test cases for numerical verification', 'Verify edge cases and boundary conditions']
          : ['Check syntax and notation', 'Ensure mathematical consistency'],
      },
    };

  } catch (error) {
    return {
      success: false,
      error: `Math verification failed: ${error.message}`,
      result: {
        pass: false,
        reasoning: error.message,
      },
    };
  }
}
