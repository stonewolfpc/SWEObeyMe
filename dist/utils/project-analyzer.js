import * as fs from 'fs-extra';
import * as path from 'path';
/**
 * Project Analyzer Utility
 *
 * Analyzes project structure, dependencies, architecture, and metrics
 * to provide comprehensive insights for SWE automation tasks.
 */
export class ProjectAnalyzer {
    cache = new Map();
    /**
     * Analyze project structure
     */
    async analyzeStructure(projectPath, depth = 3) {
        const cacheKey = `${projectPath}:${depth}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        const absolutePath = path.resolve(projectPath);
        if (!await fs.pathExists(absolutePath)) {
            throw new Error(`Project path does not exist: ${projectPath}`);
        }
        const structure = await this.analyzeProjectStructure(absolutePath, depth);
        const dependencies = await this.analyzeDependencies(absolutePath);
        const architecture = await this.analyzeArchitecture(absolutePath);
        const metrics = await this.calculateMetrics(absolutePath);
        const result = {
            structure,
            dependencies,
            architecture,
            metrics,
            recommendations: this.generateRecommendations(structure, dependencies, architecture, metrics),
        };
        this.cache.set(cacheKey, result);
        return result;
    }
    /**
     * Analyze code quality
     */
    async analyzeQuality(targetPath, metrics, threshold = 0.8) {
        const absolutePath = path.resolve(targetPath);
        if (!await fs.pathExists(absolutePath)) {
            throw new Error(`Target path does not exist: ${targetPath}`);
        }
        // This is a simplified implementation
        // In practice, you'd integrate with tools like ESLint, SonarQube, etc.
        return {
            overall: 0.85,
            metrics: [
                {
                    name: 'complexity',
                    value: 0.7,
                    threshold,
                    status: 'warning',
                },
                {
                    name: 'maintainability',
                    value: 0.9,
                    threshold,
                    status: 'good',
                },
                {
                    name: 'test_coverage',
                    value: 0.8,
                    threshold,
                    status: 'good',
                },
            ],
            smells: [],
            suggestions: [],
        };
    }
    /**
     * Analyze project structure
     */
    async analyzeProjectStructure(projectPath, depth) {
        const structure = await this.scanDirectory(projectPath, depth);
        const type = this.detectProjectType(structure);
        const pattern = this.detectArchitecturalPattern(structure);
        return {
            type,
            pattern,
            directories: structure.directories,
            files: structure.files,
            depth,
        };
    }
    /**
     * Scan directory structure
     */
    async scanDirectory(dirPath, maxDepth, currentDepth = 0) {
        if (currentDepth >= maxDepth) {
            return { directories: [], files: [] };
        }
        const result = { directories: [], files: [] };
        try {
            const items = await fs.readdir(dirPath);
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const relativePath = path.relative(process.cwd(), itemPath);
                const stats = await fs.stat(itemPath);
                if (stats.isDirectory()) {
                    // Skip common ignore directories
                    if (!this.shouldIgnoreDirectory(item)) {
                        result.directories.push(relativePath);
                        const subResult = await this.scanDirectory(itemPath, maxDepth, currentDepth + 1);
                        result.directories.push(...subResult.directories);
                        result.files.push(...subResult.files);
                    }
                }
                else {
                    // Only include source files
                    if (this.isSourceFile(item)) {
                        result.files.push(relativePath);
                    }
                }
            }
        }
        catch (error) {
            console.error(`Error scanning directory ${dirPath}:`, error);
        }
        return result;
    }
    /**
     * Check if directory should be ignored
     */
    shouldIgnoreDirectory(dirName) {
        const ignoreDirs = [
            'node_modules',
            '.git',
            '.vscode',
            '.idea',
            'dist',
            'build',
            'target',
            'bin',
            'obj',
            '__pycache__',
            '.pytest_cache',
            'coverage',
            '.nyc_output',
        ];
        return ignoreDirs.includes(dirName) || dirName.startsWith('.');
    }
    /**
     * Check if file is a source file
     */
    isSourceFile(fileName) {
        const sourceExtensions = [
            '.js', '.ts', '.jsx', '.tsx',
            '.py', '.java', '.cpp', '.c', '.h',
            '.cs', '.go', '.rs', '.php',
            '.rb', '.swift', '.kt', '.scala',
            '.vue', '.svelte', '.html', '.css',
            '.scss', '.less', '.md', '.json',
            '.yaml', '.yml', '.xml', '.sql',
        ];
        const ext = path.extname(fileName);
        return sourceExtensions.includes(ext);
    }
    /**
     * Detect project type
     */
    detectProjectType(structure) {
        // Simplified detection logic
        if (structure.files.some((file) => file.includes('package.json'))) {
            if (structure.directories.some((dir) => dir.includes('src') || dir.includes('lib'))) {
                return 'monolith';
            }
        }
        if (structure.directories.some((dir) => dir.includes('bin') || dir.includes('cli'))) {
            return 'cli';
        }
        return 'other';
    }
    /**
     * Detect architectural pattern
     */
    detectArchitecturalPattern(structure) {
        // Simplified pattern detection
        if (structure.directories.some((dir) => dir.includes('components'))) {
            return 'component-based';
        }
        if (structure.directories.some((dir) => dir.includes('controllers'))) {
            return 'mvc';
        }
        return 'layered';
    }
    /**
     * Analyze dependencies
     */
    async analyzeDependencies(projectPath) {
        const packageFiles = [
            'package.json',
            'requirements.txt',
            'pom.xml',
            'Cargo.toml',
            'composer.json',
            'Gemfile',
        ];
        let packageManager = 'unknown';
        let dependencies = [];
        let vulnerabilities = [];
        let outdated = [];
        for (const file of packageFiles) {
            const filePath = path.join(projectPath, file);
            if (await fs.pathExists(filePath)) {
                packageManager = this.detectPackageManager(file);
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    dependencies = this.parseDependencies(file, content);
                    // In practice, you'd run security audits and check for outdated packages
                    vulnerabilities = [];
                    outdated = [];
                }
                catch (error) {
                    console.error(`Error parsing ${file}:`, error);
                }
                break;
            }
        }
        return {
            packageManager,
            dependencies,
            vulnerabilities,
            outdated,
        };
    }
    /**
     * Detect package manager
     */
    detectPackageManager(fileName) {
        const managers = {
            'package.json': 'npm',
            'requirements.txt': 'pip',
            'pom.xml': 'maven',
            'Cargo.toml': 'cargo',
            'composer.json': 'composer',
            'Gemfile': 'bundler',
        };
        return managers[fileName] || 'unknown';
    }
    /**
     * Parse dependencies from package file
     */
    parseDependencies(fileName, content) {
        try {
            switch (fileName) {
                case 'package.json':
                    const pkg = JSON.parse(content);
                    return [
                        ...Object.entries(pkg.dependencies || {}).map(([name, version]) => ({
                            name,
                            version: version,
                            type: 'production',
                            optional: false,
                        })),
                        ...Object.entries(pkg.devDependencies || {}).map(([name, version]) => ({
                            name,
                            version: version,
                            type: 'development',
                            optional: false,
                        })),
                    ];
                case 'requirements.txt':
                    return content
                        .split('\n')
                        .filter(line => line.trim() && !line.startsWith('#'))
                        .map(line => {
                        const [name, version] = line.split(/[>=<==]/);
                        return {
                            name: name.trim(),
                            version: version?.trim() || 'latest',
                            type: 'production',
                            optional: false,
                        };
                    });
                default:
                    return [];
            }
        }
        catch (error) {
            console.error(`Error parsing dependencies from ${fileName}:`, error);
            return [];
        }
    }
    /**
     * Analyze architecture
     */
    async analyzeArchitecture(projectPath) {
        // Simplified architecture analysis
        return {
            patterns: ['layered'],
            layers: ['presentation', 'business', 'data'],
            components: [],
            dataFlow: [],
        };
    }
    /**
     * Calculate project metrics
     */
    async calculateMetrics(projectPath) {
        const files = await this.scanDirectory(projectPath, 10);
        let linesOfCode = 0;
        let complexity = 0;
        for (const file of files.files) {
            try {
                const content = await fs.readFile(file, 'utf8');
                linesOfCode += content.split('\n').length;
                // Simplified complexity calculation
                complexity += (content.match(/\b(if|else|for|while|switch|case)\b/g) || []).length;
            }
            catch (error) {
                // Skip files that can't be read
            }
        }
        return {
            linesOfCode,
            complexity,
            testCoverage: 0.8, // Placeholder
            maintainability: 0.85, // Placeholder
            duplicates: 0, // Placeholder
            technicalDebt: 0.1, // Placeholder
        };
    }
    /**
     * Generate recommendations based on analysis
     */
    generateRecommendations(structure, dependencies, architecture, metrics) {
        const recommendations = [];
        if (metrics.complexity > 100) {
            recommendations.push('Consider refactoring complex components to reduce cyclomatic complexity');
        }
        if (metrics.testCoverage < 0.8) {
            recommendations.push('Increase test coverage to improve code reliability');
        }
        if (dependencies.vulnerabilities.length > 0) {
            recommendations.push('Update dependencies to fix security vulnerabilities');
        }
        if (metrics.technicalDebt > 0.2) {
            recommendations.push('Address technical debt to improve maintainability');
        }
        return recommendations;
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}
//# sourceMappingURL=project-analyzer.js.map