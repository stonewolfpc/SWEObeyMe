/**
 * Reference Validation System
 * Ensures that referenced files, classes, functions, and symbols exist before operations
 * Critical for preventing SWE from creating broken code with missing references
 */

import fs from 'fs/promises';
import path from 'path';
import { searchFiles } from './file-registry.js';

/**
 * Reference types
 */
const ReferenceType = {
  IMPORT: 'IMPORT',
  REQUIRE: 'REQUIRE',
  CLASS: 'CLASS',
  FUNCTION: 'FUNCTION',
  VARIABLE: 'VARIABLE',
  TYPE: 'TYPE',
  INTERFACE: 'INTERFACE',
  NAMESPACE: 'NAMESPACE',
  FILE: 'FILE',
};

/**
 * Reference validation result
 */
class ReferenceValidationResult {
  constructor() {
    this.valid = true;
    this.errors = [];
    this.warnings = [];
    this.references = [];
    this.missingReferences = [];
    this.foundReferences = [];
  }

  addError(message, reference) {
    this.valid = false;
    this.errors.push({ message, reference });
  }

  addWarning(message, reference) {
    this.warnings.push({ message, reference });
  }

  addReference(reference, found) {
    this.references.push({ ...reference, found });
    if (found) {
      this.foundReferences.push(reference);
    } else {
      this.missingReferences.push(reference);
      this.valid = false;
    }
  }
}

/**
 * Reference Validator
 */
class ReferenceValidator {
  constructor() {
    this.patterns = {
      // JavaScript/TypeScript import patterns
      jsImport: /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g,
      jsRequire: /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,

      // C# using patterns
      csharpUsing: /using\s+(?:static\s+)?([^;]+);/g,
      csharpNamespace: /namespace\s+([^;{]+)/g,

      // Python import patterns
      pythonImport: /(?:from\s+([^\s]+)\s+)?import\s+([^\n]+)/g,

      // Generic file references
      fileReference: /['"]([^.]+\.[a-zA-Z0-9]+)['"]/g,

      // Function/class references
      functionCall: /(\w+)\s*\(/g,
      classInstantiation: /new\s+(\w+)/g,

      // Type references
      typeAnnotation: /:\s*(\w+)/g,
      typeDeclaration: /:\s*(\w+)/g,
    };
  }

  /**
   * Validate imports in code
   */
  async validateImports(code, filePath, language) {
    const result = new ReferenceValidationResult();
    const dir = path.dirname(filePath);

    if (language === 'javascript' || language === 'typescript') {
      // Validate ES6 imports
      let match;
      const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
      while ((match = importRegex.exec(code)) !== null) {
        const importPath = match[1];
        const reference = {
          type: ReferenceType.IMPORT,
          name: importPath,
          line: this.getLineNumber(code, match.index),
        };

        // Check if it's a relative import
        if (importPath.startsWith('.')) {
          const resolvedPath = path.resolve(dir, importPath);
          const exists = await this.checkFileExists(resolvedPath, ['.js', '.ts', '.json']);
          result.addReference(reference, exists);
          if (!exists) {
            result.addError(`Import not found: ${importPath}`, reference);
          }
        } else {
          // Node module - check if it exists
          const nodeModulesPath = path.join(process.cwd(), 'node_modules', importPath);
          const exists = await this.checkFileExists(nodeModulesPath);
          result.addReference(reference, exists);
          if (!exists) {
            result.addWarning(
              `Node module not found: ${importPath} (may need to be installed)`,
              reference
            );
          }
        }
      }

      // Validate require statements
      const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = requireRegex.exec(code)) !== null) {
        const requirePath = match[1];
        const reference = {
          type: ReferenceType.REQUIRE,
          name: requirePath,
          line: this.getLineNumber(code, match.index),
        };

        if (requirePath.startsWith('.')) {
          const resolvedPath = path.resolve(dir, requirePath);
          const exists = await this.checkFileExists(resolvedPath, ['.js', '.json']);
          result.addReference(reference, exists);
          if (!exists) {
            result.addError(`Require not found: ${requirePath}`, reference);
          }
        } else {
          const nodeModulesPath = path.join(process.cwd(), 'node_modules', requirePath);
          const exists = await this.checkFileExists(nodeModulesPath);
          result.addReference(reference, exists);
          if (!exists) {
            result.addWarning(
              `Node module not found: ${requirePath} (may need to be installed)`,
              reference
            );
          }
        }
      }
    } else if (language === 'csharp') {
      // Validate C# using statements
      let match;
      const usingRegex = /using\s+(?:static\s+)?([^;]+);/g;
      while ((match = usingRegex.exec(code)) !== null) {
        const usingStatement = match[1];
        const reference = {
          type: ReferenceType.IMPORT,
          name: usingStatement,
          line: this.getLineNumber(code, match.index),
        };

        // Check if it's a project reference or system namespace
        if (usingStatement.startsWith('System') || usingStatement.startsWith('Microsoft')) {
          // System namespace - assume it exists
          result.addReference(reference, true);
        } else {
          // Project reference - check if file exists
          const exists = await this.checkCSharpReference(usingStatement, dir);
          result.addReference(reference, exists);
          if (!exists) {
            result.addError(`C# using not found: ${usingStatement}`, reference);
          }
        }
      }
    }

    return result;
  }

  /**
   * Validate function and class references
   */
  async validateReferences(code, filePath, language) {
    const result = new ReferenceValidationResult();

    // Extract defined symbols
    const definedSymbols = this.extractDefinedSymbols(code, language);

    // Extract used references
    const usedReferences = this.extractUsedReferences(code, language);

    // Check if all used references are defined
    for (const ref of usedReferences) {
      const reference = {
        type: ref.type,
        name: ref.name,
        line: ref.line,
      };

      const isDefined = definedSymbols.has(ref.name) || this.isBuiltInSymbol(ref.name, language);
      result.addReference(reference, isDefined);

      if (!isDefined) {
        result.addError(`${ref.type} '${ref.name}' is not defined`, reference);
      }
    }

    return result;
  }

  /**
   * Validate file references in code
   */
  async validateFileReferences(code, filePath) {
    const result = new ReferenceValidationResult();
    const dir = path.dirname(filePath);

    // Find file references (e.g., in comments, strings, etc.)
    const filePattern = /['"]([^'"]*\.[a-zA-Z0-9]+)['"]/g;
    let match;

    while ((match = filePattern.exec(code)) !== null) {
      const filePathRef = match[1];
      const reference = {
        type: ReferenceType.FILE,
        name: filePathRef,
        line: this.getLineNumber(code, match.index),
      };

      // Skip if it's a URL or data URI
      if (
        filePathRef.startsWith('http://') ||
        filePathRef.startsWith('https://') ||
        filePathRef.startsWith('data:')
      ) {
        continue;
      }

      // Check if it's a relative path
      if (filePathRef.startsWith('.') || filePathRef.startsWith('/')) {
        const resolvedPath = path.resolve(dir, filePathRef);
        const exists = await fs
          .access(resolvedPath)
          .then(() => true)
          .catch(() => false);
        result.addReference(reference, exists);

        if (!exists) {
          result.addWarning(`File reference not found: ${filePathRef}`, reference);
        }
      }
    }

    return result;
  }

  /**
   * Extract defined symbols from code
   */
  extractDefinedSymbols(code, language) {
    const symbols = new Set();

    if (language === 'javascript' || language === 'typescript') {
      // Extract function definitions
      const funcRegex =
        /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function|(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>|class\s+(\w+))/g;
      let match;
      while ((match = funcRegex.exec(code)) !== null) {
        const symbol = match[1] || match[2] || match[3] || match[4];
        if (symbol) symbols.add(symbol);
      }

      // Extract exports
      const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g;
      while ((match = exportRegex.exec(code)) !== null) {
        symbols.add(match[1]);
      }
    } else if (language === 'csharp') {
      // Extract class definitions
      const classRegex = /class\s+(\w+)/g;
      let match;
      while ((match = classRegex.exec(code)) !== null) {
        symbols.add(match[1]);
      }

      // Extract method definitions
      const methodRegex =
        /(?:public|private|protected|internal)\s+(?:static\s+)?(?:async\s+)?(?:void|\w+)\s+(\w+)/g;
      while ((match = methodRegex.exec(code)) !== null) {
        symbols.add(match[1]);
      }
    }

    return symbols;
  }

  /**
   * Extract used references from code
   */
  extractUsedReferences(code, language) {
    const references = [];

    if (language === 'javascript' || language === 'typescript') {
      // Extract function calls
      const callRegex = /(\w+)\s*\(/g;
      let match;
      while ((match = callRegex.exec(code)) !== null) {
        const name = match[1];
        // Skip built-in methods and keywords
        if (!this.isBuiltInSymbol(name, language)) {
          references.push({
            type: ReferenceType.FUNCTION,
            name,
            line: this.getLineNumber(code, match.index),
          });
        }
      }

      // Extract class instantiations
      const newRegex = /new\s+(\w+)/g;
      while ((match = newRegex.exec(code)) !== null) {
        const name = match[1];
        if (!this.isBuiltInSymbol(name, language)) {
          references.push({
            type: ReferenceType.CLASS,
            name,
            line: this.getLineNumber(code, match.index),
          });
        }
      }
    } else if (language === 'csharp') {
      // Extract method calls
      const callRegex = /(\w+)\s*\(/g;
      let match;
      while ((match = callRegex.exec(code)) !== null) {
        const name = match[1];
        if (!this.isBuiltInSymbol(name, language)) {
          references.push({
            type: ReferenceType.FUNCTION,
            name,
            line: this.getLineNumber(code, match.index),
          });
        }
      }

      // Extract type references
      const typeRegex = /:\s*(\w+)/g;
      while ((match = typeRegex.exec(code)) !== null) {
        const name = match[1];
        if (!this.isBuiltInSymbol(name, language)) {
          references.push({
            type: ReferenceType.TYPE,
            name,
            line: this.getLineNumber(code, match.index),
          });
        }
      }
    }

    return references;
  }

  /**
   * Check if symbol is built-in
   */
  isBuiltInSymbol(symbol, language) {
    const builtIns = {
      javascript: [
        'console',
        'document',
        'window',
        'Math',
        'Array',
        'Object',
        'String',
        'Number',
        'Boolean',
        'Date',
        'Promise',
        'setTimeout',
        'setInterval',
        'fetch',
        'JSON',
        'parseInt',
        'parseFloat',
        'isNaN',
        'isFinite',
      ],
      typescript: [
        'console',
        'document',
        'window',
        'Math',
        'Array',
        'Object',
        'String',
        'Number',
        'Boolean',
        'Date',
        'Promise',
        'setTimeout',
        'setInterval',
        'fetch',
        'JSON',
        'parseInt',
        'parseFloat',
        'isNaN',
        'isFinite',
        'interface',
        'type',
        'enum',
      ],
      csharp: [
        'Console',
        'String',
        'int',
        'double',
        'float',
        'bool',
        'void',
        'Task',
        'List',
        'Dictionary',
        'Array',
        'IEnumerable',
        'string',
        'var',
        'async',
        'await',
        'return',
        'if',
        'else',
        'for',
        'foreach',
        'while',
        'try',
        'catch',
        'finally',
        'throw',
        'new',
        'this',
        'base',
        'typeof',
        'as',
        'is',
      ],
    };

    return builtIns[language]?.includes(symbol) || false;
  }

  /**
   * Check if file exists with possible extensions
   */
  async checkFileExists(filePath, extensions = ['', '.js', '.ts', '.json', '.cs', '.py']) {
    for (const ext of extensions) {
      const fullPath = filePath + ext;
      try {
        await fs.access(fullPath);
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }

  /**
   * Check if C# reference exists
   */
  async checkCSharpReference(usingStatement, _dir) {
    // This is a simplified check - in real implementation, you'd need to parse the project structure
    // For now, we'll check if there's a matching file in the project
    const parts = usingStatement.split('.');

    // Try to find a file matching the namespace
    const searchResults = searchFiles(parts[parts.length - 1], { extension: '.cs' });

    return searchResults.length > 0;
  }

  /**
   * Get line number from character index
   */
  getLineNumber(code, index) {
    const lines = code.substring(0, index).split('\n');
    return lines.length;
  }

  /**
   * Validate all references in code
   */
  async validateAllReferences(code, filePath, language) {
    const results = {
      imports: await this.validateImports(code, filePath, language),
      references: await this.validateReferences(code, filePath, language),
      fileReferences: await this.validateFileReferences(code, filePath),
    };

    const combined = new ReferenceValidationResult();
    combined.valid = results.imports.valid && results.references.valid;
    combined.errors = [...results.imports.errors, ...results.references.errors];
    combined.warnings = [
      ...results.imports.warnings,
      ...results.references.warnings,
      ...results.fileReferences.warnings,
    ];
    combined.references = [
      ...results.imports.references,
      ...results.references.references,
      ...results.fileReferences.references,
    ];
    combined.missingReferences = [
      ...results.imports.missingReferences,
      ...results.references.missingReferences,
    ];
    combined.foundReferences = [
      ...results.imports.foundReferences,
      ...results.references.foundReferences,
    ];

    return combined;
  }
}

// Global validator instance
const referenceValidator = new ReferenceValidator();

/**
 * Validate imports in code
 */
export async function validateImports(code, filePath, language) {
  return await referenceValidator.validateImports(code, filePath, language);
}

/**
 * Validate references in code
 */
export async function validateReferences(code, filePath, language) {
  return await referenceValidator.validateReferences(code, filePath, language);
}

/**
 * Validate file references
 */
export async function validateFileReferences(code, filePath) {
  return await referenceValidator.validateFileReferences(code, filePath);
}

/**
 * Validate all references
 */
export async function validateAllReferences(code, filePath, language) {
  return await referenceValidator.validateAllReferences(code, filePath, language);
}

// Export constants
export { ReferenceType, ReferenceValidationResult };
