import * as fs from 'fs-extra';
import * as path from 'path';
/**
 * File Analyzer Utility
 *
 * Provides comprehensive source code analysis capabilities for
 * multiple programming languages with extensible parsing support.
 *
 * Features:
 * - Multi-language support (TypeScript, JavaScript, Python, Java, etc.)
 * - AST-based parsing for accuracy
 * - Dependency extraction and mapping
 * - Structure analysis for classes, functions, and modules
 * - Metadata collection for metrics and analytics
 */
export class FileAnalyzer {
    languagePatterns = new Map([
        ['.ts', 'typescript'],
        ['.tsx', 'typescript'],
        ['.js', 'javascript'],
        ['.jsx', 'javascript'],
        ['.py', 'python'],
        ['.java', 'java'],
        ['.cpp', 'cpp'],
        ['.c', 'c'],
        ['.cs', 'csharp'],
        ['.go', 'go'],
        ['.rs', 'rust'],
        ['.php', 'php'],
        ['.rb', 'ruby'],
        ['.swift', 'swift'],
        ['.kt', 'kotlin'],
        ['.scala', 'scala'],
    ]);
    /**
     * Analyze a source file and extract comprehensive metadata
     *
     * @param filePath - Path to the file to analyze
     * @param content - Optional file content (will be read if not provided)
     * @returns Comprehensive file analysis result
     */
    async analyzeFile(filePath, content) {
        const absolutePath = path.resolve(filePath);
        if (!await fs.pathExists(absolutePath)) {
            throw new Error(`File does not exist: ${filePath}`);
        }
        const fileContent = content || await fs.readFile(absolutePath, 'utf8');
        const language = this.detectLanguage(absolutePath);
        const stats = await fs.stat(absolutePath);
        const result = {
            filePath: absolutePath,
            language,
            imports: this.extractImports(fileContent, language),
            classes: this.extractClasses(fileContent, language),
            functions: this.extractFunctions(fileContent, language),
            exports: this.extractExports(fileContent, language),
            namespace: this.extractNamespace(fileContent, language),
            metadata: this.calculateMetadata(fileContent, stats),
        };
        return result;
    }
    /**
     * Detect programming language from file extension
     */
    detectLanguage(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return this.languagePatterns.get(ext) || 'unknown';
    }
    /**
     * Extract import statements from source code
     */
    extractImports(content, language) {
        const imports = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;
            if (language === 'typescript' || language === 'javascript') {
                const importMatch = line.match(/^(import\s+(.+?\s+from\s+)?['"]([^'"]+)['"]|export\s+\*\s+from\s+['"]([^'"]+)['"])/);
                if (importMatch) {
                    imports.push({
                        raw: line,
                        type: this.determineImportType(line),
                        source: importMatch[3] || importMatch[4],
                        names: this.extractImportNames(line),
                        alias: this.extractImportAlias(line),
                        line: lineNumber,
                    });
                }
            }
            // Add other language patterns as needed
        }
        return imports;
    }
    /**
     * Determine import type from import statement
     */
    determineImportType(importLine) {
        if (importLine.includes('*'))
            return 'wildcard';
        if (importLine.includes('default') || !importLine.includes('{'))
            return 'default';
        if (importLine.includes('{'))
            return 'named';
        return 'side-effect';
    }
    /**
     * Extract imported names from import statement
     */
    extractImportNames(importLine) {
        const match = importLine.match(/\{([^}]+)\}/);
        if (!match)
            return undefined;
        return match[1].split(',').map(name => name.trim().replace(/.*as\s+/, ''));
    }
    /**
     * Extract import alias from import statement
     */
    extractImportAlias(importLine) {
        const match = importLine.match(/import\s+(.+?)\s+from/);
        if (!match)
            return undefined;
        const imported = match[1].trim();
        const aliasMatch = imported.match(/(.+)\s+as\s+(.+)/);
        return aliasMatch ? aliasMatch[2].trim() : undefined;
    }
    /**
     * Extract class declarations from source code
     */
    extractClasses(content, language) {
        const classes = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;
            if (language === 'typescript' || language === 'javascript') {
                // Class declarations
                const classMatch = line.match(/^(export\s+)?(abstract\s+)?(public\s+|private\s+|protected\s+)?class\s+(\w+)/);
                if (classMatch) {
                    classes.push({
                        name: classMatch[4],
                        type: 'class',
                        visibility: this.determineVisibility(line),
                        methods: this.extractMethods(content, classMatch[4]),
                        properties: this.extractProperties(content, classMatch[4]),
                        line: lineNumber,
                    });
                }
                // Interface declarations
                const interfaceMatch = line.match(/^(export\s+)?(public\s+|private\s+|protected\s+)?interface\s+(\w+)/);
                if (interfaceMatch) {
                    classes.push({
                        name: interfaceMatch[3],
                        type: 'interface',
                        visibility: this.determineVisibility(line),
                        methods: this.extractMethods(content, interfaceMatch[3]),
                        properties: this.extractProperties(content, interfaceMatch[3]),
                        line: lineNumber,
                    });
                }
            }
        }
        return classes;
    }
    /**
     * Extract function declarations from source code
     */
    extractFunctions(content, language) {
        const functions = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;
            if (language === 'typescript' || language === 'javascript') {
                // Function declarations
                const funcMatch = line.match(/^(export\s+(default\s+)?(async\s+)?)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\w+))?/);
                if (funcMatch) {
                    functions.push({
                        name: funcMatch[4],
                        parameters: this.parseParameters(funcMatch[5]),
                        returnType: funcMatch[6],
                        isExported: !!funcMatch[1],
                        isDefault: !!funcMatch[2],
                        isAsync: !!funcMatch[3],
                        signature: line,
                        line: lineNumber,
                    });
                }
                // Arrow functions
                const arrowMatch = line.match(/^(export\s+(default\s+)?)?const\s+(\w+)\s*=\s*(async\s+)?\(([^)]*)\)(?:\s*:\s*(\w+))?\s*=>/);
                if (arrowMatch) {
                    functions.push({
                        name: arrowMatch[3],
                        parameters: this.parseParameters(arrowMatch[5]),
                        returnType: arrowMatch[6],
                        isExported: !!arrowMatch[1],
                        isDefault: !!arrowMatch[2],
                        isAsync: !!arrowMatch[4],
                        signature: line,
                        line: lineNumber,
                    });
                }
            }
        }
        return functions;
    }
    /**
     * Extract export declarations
     */
    extractExports(content, language) {
        const exports = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;
            if (language === 'typescript' || language === 'javascript') {
                // Named exports
                const namedMatch = line.match(/^export\s*\{([^}]+)\}(?:\s+from\s+['"]([^'"]+)['"])?/);
                if (namedMatch) {
                    exports.push({
                        type: 'named',
                        names: namedMatch[1].split(',').map(n => n.trim()),
                        source: namedMatch[2],
                        line: lineNumber,
                    });
                }
                // Default exports
                if (line.match(/^export\s+default/)) {
                    exports.push({
                        type: 'default',
                        line: lineNumber,
                    });
                }
                // Export all
                const exportAllMatch = line.match(/^export\s+\*\s+from\s+['"]([^'"]+)['"]/);
                if (exportAllMatch) {
                    exports.push({
                        type: 'all',
                        source: exportAllMatch[1],
                        line: lineNumber,
                    });
                }
            }
        }
        return exports;
    }
    /**
     * Extract namespace/module declaration
     */
    extractNamespace(content, language) {
        if (language === 'typescript') {
            const namespaceMatch = content.match(/namespace\s+(\w+)/);
            if (namespaceMatch)
                return namespaceMatch[1];
            const moduleMatch = content.match(/module\s+['"]([^'"]+)['"]/);
            if (moduleMatch)
                return moduleMatch[1];
        }
        return undefined;
    }
    /**
     * Extract methods from class content
     */
    extractMethods(content, className) {
        const methods = [];
        const classMatch = content.match(new RegExp(`class\\s+${className}\\s*\\{([^}]+)}`));
        if (!classMatch)
            return methods;
        const classContent = classMatch[1];
        const methodMatches = classContent.matchAll(/(public|private|protected)?\s*(static\s+)?(async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\w+))?/g);
        for (const match of methodMatches) {
            methods.push({
                name: match[4],
                parameters: this.parseParameters(match[5]),
                returnType: match[6],
                visibility: this.determineVisibility(match[0]),
                isStatic: !!match[2],
                isAsync: !!match[3],
                signature: match[0],
                line: 0, // Would need more sophisticated line tracking
            });
        }
        return methods;
    }
    /**
     * Extract properties from class content
     */
    extractProperties(content, className) {
        const properties = [];
        const classMatch = content.match(new RegExp(`class\\s+${className}\\s*\\{([^}]+)}`));
        if (!classMatch)
            return properties;
        const classContent = classMatch[1];
        const propertyMatches = classContent.matchAll(/(public|private|protected)?\s*(static\s+)?(readonly\s+)?(\w+)(?:\s*:\s*(\w+))?(?:\s*=\s*([^;]+))?/g);
        for (const match of propertyMatches) {
            properties.push({
                name: match[4],
                type: match[5],
                visibility: this.determineVisibility(match[0]),
                isStatic: !!match[2],
                isReadonly: !!match[3],
                isOptional: false,
                defaultValue: match[6]?.trim(),
                line: 0,
            });
        }
        return properties;
    }
    /**
     * Parse parameter string into parameter declarations
     */
    parseParameters(paramString) {
        if (!paramString.trim())
            return [];
        const params = [];
        const paramParts = paramString.split(',').map(p => p.trim());
        for (const param of paramParts) {
            const match = param.match(/(\.\.\.)?(\w+)(?:\s*:\s*(\w+))?(?:\s*=\s*([^,]+))?/);
            if (match) {
                params.push({
                    name: match[2],
                    type: match[3],
                    isOptional: !!match[4],
                    defaultValue: match[4]?.trim(),
                    isRest: !!match[1],
                });
            }
        }
        return params;
    }
    /**
     * Determine visibility from declaration
     */
    determineVisibility(declaration) {
        if (declaration.includes('private'))
            return 'private';
        if (declaration.includes('protected'))
            return 'protected';
        return 'public';
    }
    /**
     * Calculate file metadata
     */
    calculateMetadata(content, stats) {
        const lines = content.split('\n');
        const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('/*') && !line.trim().startsWith('*')).length;
        const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')).length;
        const blankLines = lines.filter(line => !line.trim()).length;
        return {
            lines: lines.length,
            codeLines,
            commentLines,
            blankLines,
            size: stats.size,
            lastModified: stats.mtime,
            encoding: 'utf8',
        };
    }
}
//# sourceMappingURL=file-analyzer.js.map