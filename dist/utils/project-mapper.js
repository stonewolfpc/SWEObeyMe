import * as fs from 'fs-extra';
import * as path from 'path';
import { FileAnalyzer } from './file-analyzer.js';
/**
 * Project Mapper Utility
 *
 * Creates comprehensive project context maps that provide SWE with
 * complete global awareness of codebase structure, dependencies,
 * and architectural patterns.
 *
 * Features:
 * - Complete file structure analysis
 * - Namespace hierarchy mapping
 * - Class and method relationship tracking
 * - Dependency graph construction
 * - Pattern detection and convention analysis
 * - Cross-file relationship mapping
 */
export class ProjectMapper {
    fileAnalyzer;
    cache = new Map();
    constructor() {
        this.fileAnalyzer = new FileAnalyzer();
    }
    /**
     * Generate complete project context for SWE global awareness
     *
     * @param projectPath - Root path of the project to analyze
     * @param options - Analysis options
     * @returns Comprehensive project context map
     */
    async getProjectContext(projectPath, options = {}) {
        const { includeTests = false, maxDepth = 10, cacheKey } = options;
        // Check cache first
        if (cacheKey && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        const absolutePath = path.resolve(projectPath);
        if (!await fs.pathExists(absolutePath)) {
            throw new Error(`Project path does not exist: ${projectPath}`);
        }
        // Build project context step by step
        const metadata = await this.buildMetadata(absolutePath);
        const files = await this.mapFiles(absolutePath, includeTests, maxDepth);
        const namespaces = await this.buildNamespaces(files);
        const classes = await this.buildClasses(files);
        const methods = await this.buildMethods(files);
        const dependencies = await this.buildDependencyGraph(files);
        const patterns = await this.detectPatterns(files, classes);
        const conventions = await this.detectConventions(files);
        const imports = await this.mapImports(files);
        const exports = await this.mapExports(files);
        const context = {
            metadata,
            files,
            namespaces,
            classes,
            methods,
            dependencies,
            patterns,
            conventions,
            imports,
            exports,
        };
        // Cache result
        if (cacheKey) {
            this.cache.set(cacheKey, context);
        }
        return context;
    }
    /**
     * Build project metadata
     */
    async buildMetadata(projectPath) {
        const packageFiles = ['package.json', 'requirements.txt', 'pom.xml', 'Cargo.toml'];
        let packageManager = 'unknown';
        let frameworks = [];
        // Detect package manager and frameworks
        for (const file of packageFiles) {
            const filePath = path.join(projectPath, file);
            if (await fs.pathExists(filePath)) {
                packageManager = this.detectPackageManager(file);
                frameworks = await this.detectFrameworks(filePath, file);
                break;
            }
        }
        // Count source files and lines
        const sourceFiles = await this.findSourceFiles(projectPath);
        let totalLines = 0;
        for (const file of sourceFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');
                totalLines += content.split('\n').length;
            }
            catch {
                // Skip unreadable files
            }
        }
        return {
            rootPath: projectPath,
            type: await this.detectProjectType(projectPath),
            language: this.detectPrimaryLanguage(sourceFiles),
            packageManager,
            frameworks,
            totalFiles: sourceFiles.length,
            totalLines,
            analyzedAt: new Date(),
        };
    }
    /**
     * Map all files with context
     */
    async mapFiles(projectPath, includeTests, maxDepth) {
        const files = new Map();
        const sourceFiles = await this.findSourceFiles(projectPath, includeTests, maxDepth);
        for (const filePath of sourceFiles) {
            const relativePath = path.relative(projectPath, filePath);
            try {
                const analysis = await this.fileAnalyzer.analyzeFile(filePath);
                const context = {
                    path: relativePath,
                    language: analysis.language,
                    type: this.classifyFileType(relativePath),
                    classes: analysis.classes.map(c => c.name),
                    functions: analysis.functions.map(f => f.name),
                    imports: analysis.imports.map(i => i.source),
                    exports: analysis.exports.map(e => e.names?.[0] || 'default').filter(Boolean),
                    dependencies: analysis.imports.map(i => i.source).filter(s => !s.startsWith('.')),
                    dependents: [], // Will be populated later
                    metrics: {
                        lines: analysis.metadata.lines,
                        codeLines: analysis.metadata.codeLines,
                        commentLines: analysis.metadata.commentLines,
                        size: analysis.metadata.size,
                        complexity: this.calculateComplexity(analysis),
                    },
                };
                files.set(relativePath, context);
            }
            catch (error) {
                // Skip files that can't be analyzed
                console.warn(`Failed to analyze file ${filePath}:`, error);
            }
        }
        // Populate dependents
        for (const [file, context] of files) {
            for (const dep of context.dependencies) {
                const depFile = this.findFileForDependency(dep, files);
                if (depFile && files.has(depFile)) {
                    const depContext = files.get(depFile);
                    depContext.dependents.push(file);
                }
            }
        }
        return files;
    }
    /**
     * Build namespace hierarchy
     */
    async buildNamespaces(files) {
        const namespaces = new Map();
        for (const [filePath, fileContext] of files) {
            // Extract namespaces from file path and analysis
            const pathParts = filePath.split(path.sep);
            const namespace = pathParts.slice(0, -1).join('/'); // Exclude filename
            if (namespace && !namespaces.has(namespace)) {
                namespaces.set(namespace, {
                    name: namespace,
                    parent: this.getParentNamespace(namespace),
                    children: [],
                    files: [],
                    classes: [],
                    functions: [],
                    depth: namespace.split('/').length,
                });
            }
            if (namespace) {
                const ns = namespaces.get(namespace);
                ns.files.push(filePath);
                ns.classes.push(...fileContext.classes);
                ns.functions.push(...fileContext.functions);
            }
        }
        // Build parent-child relationships
        for (const [name, ns] of namespaces) {
            if (ns.parent && namespaces.has(ns.parent)) {
                namespaces.get(ns.parent).children.push(name);
            }
        }
        return namespaces;
    }
    /**
     * Build class context map
     */
    async buildClasses(files) {
        const classes = new Map();
        for (const [filePath, fileContext] of files) {
            // Analyze file again to get detailed class information
            try {
                const analysis = await this.fileAnalyzer.analyzeFile(filePath);
                for (const classInfo of analysis.classes) {
                    const context = {
                        name: classInfo.name,
                        file: filePath,
                        namespace: this.extractNamespaceFromPath(filePath),
                        type: classInfo.type,
                        extends: classInfo.extends,
                        implements: classInfo.implements || [],
                        visibility: classInfo.visibility,
                        methods: classInfo.methods.map(m => m.name),
                        properties: classInfo.properties.map(p => p.name),
                        inheritors: [], // Will be populated later
                        dependencies: this.extractClassDependencies(classInfo),
                        line: classInfo.line,
                    };
                    classes.set(classInfo.name, context);
                }
            }
            catch (error) {
                console.warn(`Failed to extract classes from ${filePath}:`, error);
            }
        }
        // Populate inheritance relationships
        for (const [className, classContext] of classes) {
            if (classContext.extends && classes.has(classContext.extends)) {
                classes.get(classContext.extends).inheritors.push(className);
            }
        }
        return classes;
    }
    /**
     * Build method context map
     */
    async buildMethods(files) {
        const methods = new Map();
        for (const [filePath, fileContext] of files) {
            try {
                const analysis = await this.fileAnalyzer.analyzeFile(filePath);
                // Add class methods
                for (const classInfo of analysis.classes) {
                    for (const method of classInfo.methods) {
                        const key = `${classInfo.name}.${method.name}`;
                        const context = {
                            name: method.name,
                            file: filePath,
                            class: classInfo.name,
                            namespace: this.extractNamespaceFromPath(filePath),
                            type: 'method',
                            parameters: method.parameters.map(p => ({
                                name: p.name,
                                type: p.type,
                                isOptional: p.isOptional,
                                defaultValue: p.defaultValue,
                                isRest: p.isRest,
                            })),
                            returnType: method.returnType,
                            visibility: method.visibility,
                            isStatic: method.isStatic,
                            isAsync: method.isAsync,
                            calls: [], // Will be populated with advanced analysis
                            callers: [], // Will be populated later
                            line: method.line,
                        };
                        methods.set(key, context);
                    }
                }
                // Add standalone functions
                for (const func of analysis.functions) {
                    const key = func.name;
                    const context = {
                        name: func.name,
                        file: filePath,
                        namespace: this.extractNamespaceFromPath(filePath),
                        type: 'function',
                        parameters: func.parameters.map(p => ({
                            name: p.name,
                            type: p.type,
                            isOptional: p.isOptional,
                            defaultValue: p.defaultValue,
                            isRest: p.isRest,
                        })),
                        returnType: func.returnType,
                        visibility: 'public',
                        isStatic: false,
                        isAsync: func.isAsync,
                        calls: [],
                        callers: [],
                        line: func.line,
                    };
                    methods.set(key, context);
                }
            }
            catch (error) {
                console.warn(`Failed to extract methods from ${filePath}:`, error);
            }
        }
        return methods;
    }
    /**
     * Build dependency graph
     */
    async buildDependencyGraph(files) {
        const bySource = new Map();
        const byTarget = new Map();
        const external = new Map();
        const internal = new Map();
        const circular = [];
        for (const [filePath, fileContext] of files) {
            const deps = fileContext.dependencies;
            bySource.set(filePath, deps);
            for (const dep of deps) {
                if (!byTarget.has(dep)) {
                    byTarget.set(dep, []);
                }
                byTarget.get(dep).push(filePath);
                // Classify as internal or external
                if (dep.startsWith('.') || files.has(dep)) {
                    const targetFile = dep.startsWith('.') ? this.resolveRelativePath(filePath, dep) : dep;
                    if (targetFile && files.has(targetFile)) {
                        internal.set(`${filePath}->${targetFile}`, {
                            source: filePath,
                            target: targetFile,
                            type: 'named',
                            strength: 1,
                        });
                    }
                }
                else {
                    if (!external.has(dep)) {
                        external.set(dep, {
                            name: dep,
                            version: 'unknown',
                            type: 'production',
                            importers: [],
                        });
                    }
                    external.get(dep).importers.push(filePath);
                }
            }
        }
        // Detect circular dependencies (simplified)
        const visited = new Set();
        const recursionStack = new Set();
        for (const file of files.keys()) {
            if (this.detectCircular(file, bySource, visited, recursionStack)) {
                circular.push({
                    files: [file],
                    length: 2,
                    severity: 'medium',
                });
            }
        }
        return {
            bySource,
            byTarget,
            external,
            internal,
            circular,
        };
    }
    /**
     * Map imports with context
     */
    async mapImports(files) {
        const imports = new Map();
        for (const [filePath, fileContext] of files) {
            try {
                const analysis = await this.fileAnalyzer.analyzeFile(filePath);
                for (const [index, importInfo] of analysis.imports.entries()) {
                    const key = `${filePath}:${index}`;
                    const context = {
                        file: filePath,
                        statement: importInfo.raw,
                        type: importInfo.type,
                        source: importInfo.source,
                        names: importInfo.names,
                        alias: importInfo.alias,
                        line: importInfo.line,
                    };
                    imports.set(key, context);
                }
            }
            catch (error) {
                console.warn(`Failed to map imports for ${filePath}:`, error);
            }
        }
        return imports;
    }
    /**
     * Map exports with context
     */
    async mapExports(files) {
        const exports = new Map();
        for (const [filePath, fileContext] of files) {
            try {
                const analysis = await this.fileAnalyzer.analyzeFile(filePath);
                for (const [index, exportInfo] of analysis.exports.entries()) {
                    const key = `${filePath}:${index}`;
                    const context = {
                        file: filePath,
                        type: exportInfo.type,
                        names: exportInfo.names,
                        source: exportInfo.source,
                        line: exportInfo.line,
                    };
                    exports.set(key, context);
                }
            }
            catch (error) {
                console.warn(`Failed to map exports for ${filePath}:`, error);
            }
        }
        return exports;
    }
    /**
     * Detect architectural patterns
     */
    async detectPatterns(files, classes) {
        const patterns = [];
        // Detect MVC pattern
        if (this.hasMVCPattern(files)) {
            patterns.push({
                name: 'Model-View-Controller',
                type: 'architectural',
                confidence: 0.8,
                files: Array.from(files.keys()).filter(f => f.includes('/controller/') || f.includes('/model/') || f.includes('/view/')),
                description: 'MVC architectural pattern detected',
            });
        }
        // Detect component-based pattern
        if (this.hasComponentPattern(files)) {
            patterns.push({
                name: 'Component-Based',
                type: 'architectural',
                confidence: 0.9,
                files: Array.from(files.keys()).filter(f => f.includes('/components/')),
                description: 'Component-based architecture detected',
            });
        }
        return patterns;
    }
    /**
     * Detect coding conventions
     */
    async detectConventions(files) {
        const conventions = [];
        // Detect naming conventions from file contexts
        const allClasses = Array.from(files.values())
            .flatMap(fc => fc.classes);
        if (allClasses.length > 0) {
            const pascalCase = allClasses.filter(name => /^[A-Z][a-zA-Z0-9]*$/.test(name));
            if (pascalCase.length / allClasses.length > 0.8) {
                conventions.push({
                    name: 'PascalCase Classes',
                    type: 'naming',
                    pattern: '^[A-Z][a-zA-Z0-9]*$',
                    confidence: 0.9,
                    files: Array.from(files.keys()),
                    description: 'Classes follow PascalCase naming convention',
                });
            }
        }
        return conventions;
    }
    // Helper methods (simplified implementations)
    async findSourceFiles(projectPath, includeTests = false, maxDepth = 10) {
        const sourceFiles = [];
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs'];
        const scan = async (dir, depth) => {
            if (depth <= 0)
                return;
            try {
                const items = await fs.readdir(dir);
                for (const item of items) {
                    const itemPath = path.join(dir, item);
                    const stat = await fs.stat(itemPath);
                    if (stat.isDirectory()) {
                        if (!this.shouldIgnoreDirectory(item)) {
                            await scan(itemPath, depth - 1);
                        }
                    }
                    else if (extensions.some(ext => item.endsWith(ext))) {
                        if (includeTests || !item.includes('.test.') && !item.includes('.spec.')) {
                            sourceFiles.push(itemPath);
                        }
                    }
                }
            }
            catch {
                // Skip directories that can't be read
            }
        };
        await scan(projectPath, maxDepth);
        return sourceFiles;
    }
    shouldIgnoreDirectory(dirName) {
        const ignore = ['node_modules', '.git', '.vscode', 'dist', 'build', 'target', '__pycache__'];
        return ignore.includes(dirName) || dirName.startsWith('.');
    }
    detectPackageManager(fileName) {
        const managers = {
            'package.json': 'npm',
            'requirements.txt': 'pip',
            'pom.xml': 'maven',
            'Cargo.toml': 'cargo',
        };
        return managers[fileName] || 'unknown';
    }
    async detectFrameworks(filePath, packageFile) {
        const frameworks = [];
        try {
            const content = await fs.readFile(filePath, 'utf8');
            if (packageFile === 'package.json') {
                const pkg = JSON.parse(content);
                if (pkg.dependencies?.react)
                    frameworks.push('React');
                if (pkg.dependencies?.vue)
                    frameworks.push('Vue');
                if (pkg.dependencies?.express)
                    frameworks.push('Express');
                if (pkg.dependencies?.['@angular/core'])
                    frameworks.push('Angular');
            }
        }
        catch {
            // Skip files that can't be parsed
        }
        return frameworks;
    }
    async detectProjectType(projectPath) {
        // Simplified detection
        if (await fs.pathExists(path.join(projectPath, 'src/index.ts')))
            return 'library';
        if (await fs.pathExists(path.join(projectPath, 'package.json')))
            return 'monolith';
        return 'other';
    }
    detectPrimaryLanguage(sourceFiles) {
        const extCounts = new Map();
        for (const file of sourceFiles) {
            const ext = path.extname(file);
            extCounts.set(ext, (extCounts.get(ext) || 0) + 1);
        }
        const maxExt = Array.from(extCounts.entries()).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
        const langMap = {
            '.ts': 'typescript',
            '.js': 'javascript',
            '.py': 'python',
            '.java': 'java',
        };
        return langMap[maxExt[0]] || 'unknown';
    }
    classifyFileType(filePath) {
        if (filePath.includes('/test/') || filePath.includes('.test.') || filePath.includes('.spec.')) {
            return 'test';
        }
        if (filePath.includes('/config/') || filePath.endsWith('.config.js')) {
            return 'config';
        }
        if (filePath.endsWith('.md')) {
            return 'docs';
        }
        if (filePath.includes('/build/') || filePath.includes('/dist/')) {
            return 'build';
        }
        return 'source';
    }
    calculateComplexity(analysis) {
        // Simplified complexity calculation
        return analysis.classes.length * 2 + analysis.functions.length;
    }
    findFileForDependency(dep, files) {
        // Simplified dependency resolution
        for (const [filePath] of files) {
            if (filePath.includes(dep) || path.basename(filePath, path.extname(filePath)) === dep) {
                return filePath;
            }
        }
        return null;
    }
    getParentNamespace(namespace) {
        const parts = namespace.split('/');
        return parts.length > 1 ? parts.slice(0, -1).join('/') : undefined;
    }
    extractNamespaceFromPath(filePath) {
        const parts = filePath.split(path.sep);
        return parts.length > 1 ? parts.slice(0, -1).join('/') : undefined;
    }
    extractClassDependencies(classInfo) {
        // Simplified dependency extraction
        return [];
    }
    resolveRelativePath(from, to) {
        return path.resolve(path.dirname(from), to);
    }
    detectCircular(file, bySource, visited, recursionStack) {
        if (recursionStack.has(file))
            return true;
        if (visited.has(file))
            return false;
        visited.add(file);
        recursionStack.add(file);
        const deps = bySource.get(file) || [];
        for (const dep of deps) {
            if (this.detectCircular(dep, bySource, visited, recursionStack)) {
                return true;
            }
        }
        recursionStack.delete(file);
        return false;
    }
    hasMVCPattern(files) {
        const filePaths = Array.from(files.keys());
        return filePaths.some(f => f.includes('/controller/')) &&
            filePaths.some(f => f.includes('/model/')) &&
            filePaths.some(f => f.includes('/view/'));
    }
    hasComponentPattern(files) {
        const filePaths = Array.from(files.keys());
        return filePaths.some(f => f.includes('/components/'));
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}
//# sourceMappingURL=project-mapper.js.map