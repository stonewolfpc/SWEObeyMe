import { readFileSync, existsSync } from 'fs';
import path from 'path';
/**
 * Prompt Enforcer Utility
 *
 * Enforces mandatory pre-flight injection of global rules, project context,
 * and memory into every SWE prompt to ensure deterministic behavior.
 *
 * Features:
 * - Automatic rule injection before every tool call
 * - Global context and memory integration
 * - Task-specific instruction assembly
 * - Enforced prompt structure and formatting
 * - Rule prioritization and conflict resolution
 */
export class PromptEnforcer {
    contextMemory;
    projectMapper;
    globalRules;
    projectContext = null;
    lastContext = null;
    masterContract = null;
    constructor(contextMemory, projectMapper) {
        this.contextMemory = contextMemory;
        this.projectMapper = projectMapper;
        this.globalRules = this.initializeGlobalRules();
        // Load master contract asynchronously
        this.loadMasterContract().catch(error => {
            console.error('Failed to load master contract during initialization:', error);
        });
    }
    /**
     * Enforce prompt with mandatory pre-flight injection
     *
     * @param taskInstructions - Original task instructions from user
     * @param toolName - Tool being called
     * @param args - Tool arguments
     * @returns Enforced prompt with all rules and context injected
     */
    async enforcePrompt(taskInstructions, toolName, args = {}) {
        // Load current context
        await this.loadCurrentContext();
        // Assemble enforced prompt
        const enforcedPrompt = this.assembleEnforcedPrompt(taskInstructions, toolName, args);
        return enforcedPrompt;
    }
    /**
     * Load current project and last context
     */
    async loadCurrentContext() {
        try {
            // Load project context
            this.projectContext = await this.projectMapper.getProjectContext(process.cwd(), { cacheKey: 'default' });
            // Load last context
            this.lastContext = await this.contextMemory.getLastContext();
        }
        catch (error) {
            console.warn('Failed to load current context:', error);
        }
    }
    /**
     * Assemble complete enforced prompt
     */
    assembleEnforcedPrompt(taskInstructions, toolName, args) {
        const sections = [
            this.buildHeader(),
            this.buildGlobalRules(),
            this.buildProjectContext(),
            this.buildLastContext(),
            this.buildTaskSpecificRules(toolName),
            this.buildTaskInstructions(taskInstructions, toolName, args),
            this.buildFooter(),
        ];
        return sections.filter(Boolean).join('\n\n');
    }
    /**
     * Build prompt header
     */
    buildHeader() {
        return `# SWE ENFORCED PROMPT
# This prompt contains mandatory rules and context that cannot be ignored
# Generated: ${new Date().toISOString()}
# Session: ${this.lastContext?.currentSession?.id || 'unknown'}
# Priority: CRITICAL - All rules must be followed exactly`;
    }
    /**
     * Build global rules section
     */
    buildGlobalRules() {
        let rulesText = '';
        // Add master contract if available
        if (this.masterContract) {
            rulesText += `# SWEObeyMe MASTER PROMPT CONTRACT
${this.masterContract}

`;
        }
        // Add existing global rules
        const rules = this.globalRules
            .filter(rule => rule.active)
            .sort((a, b) => b.priority - a.priority);
        if (rules.length > 0) {
            const existingRulesText = rules
                .map(rule => `## ${rule.category.toUpperCase()}: ${rule.name}\n${rule.description}\nPriority: ${rule.priority}`)
                .join('\n\n');
            rulesText += `# ADDITIONAL GLOBAL RULES (MANDATORY)
${existingRulesText}

# RULE ENFORCEMENT
- ALL GLOBAL RULES MUST BE FOLLOWED EXACTLY
- NO EXCEPTIONS OR WORKAROUNDS ALLOWED
- VIOLATIONS WILL RESULT IN AUTOMATIC REJECTION`;
        }
        return rulesText;
    }
    /**
     * Build project context section
     */
    buildProjectContext() {
        if (!this.projectContext)
            return '';
        const context = this.projectContext;
        const sections = [
            `Project Type: ${context.metadata.type}`,
            `Language: ${context.metadata.language}`,
            `Package Manager: ${context.metadata.packageManager}`,
            `Total Files: ${context.metadata.totalFiles}`,
            `Total Lines: ${context.metadata.totalLines}`,
        ];
        // Add namespace information
        if (context.namespaces.size > 0) {
            sections.push(`Namespaces: ${Array.from(context.namespaces.keys()).join(', ')}`);
        }
        // Add class information
        if (context.classes.size > 0) {
            const classList = Array.from(context.classes.values())
                .map(c => `${c.name} (${c.type})`)
                .join(', ');
            sections.push(`Classes: ${classList}`);
        }
        // Add architectural patterns
        if (context.patterns.length > 0) {
            sections.push(`Patterns: ${context.patterns.map(p => p.name).join(', ')}`);
        }
        // Add coding conventions
        if (context.conventions.length > 0) {
            sections.push(`Conventions: ${context.conventions.map(c => c.name).join(', ')}`);
        }
        return `# PROJECT CONTEXT (MANDATORY)
${sections.join('\n')}

# PROJECT CONSTRAINTS
- MUST respect detected architectural patterns
- MUST follow established coding conventions
- MUST use existing namespaces and classes
- MUST NOT duplicate existing functionality
- MUST maintain dependency integrity`;
    }
    /**
     * Build last context section
     */
    buildLastContext() {
        if (!this.lastContext)
            return '';
        const sections = [];
        // Last patch
        if (this.lastContext.lastPatch) {
            const patch = this.lastContext.lastPatch;
            sections.push(`Last Patch: ${patch.type} on ${patch.file} (${patch.success ? 'SUCCESS' : 'FAILED'})`);
        }
        // Last validation
        if (this.lastContext.lastValidation) {
            const validation = this.lastContext.lastValidation;
            sections.push(`Last Validation: ${validation.result.valid ? 'PASSED' : 'FAILED'} (Score: ${validation.result.score}/100)`);
        }
        // Last command
        if (this.lastContext.lastCommand) {
            const command = this.lastContext.lastCommand;
            sections.push(`Last Command: ${command.tool} (${command.success ? 'SUCCESS' : 'FAILED'})`);
        }
        // Active rules
        if (this.lastContext.activeRules && this.lastContext.activeRules.length > 0) {
            const ruleNames = this.lastContext.activeRules.map(r => r.name).join(', ');
            sections.push(`Active Rules: ${ruleNames}`);
        }
        if (sections.length === 0)
            return '';
        return `# LAST CONTEXT (MANDATORY)
${sections.join('\n')}

# CONTINUITY REQUIREMENTS
- MUST maintain consistency with previous actions
- MUST learn from previous validation failures
- MUST avoid repeating mistakes
- MUST build upon established patterns`;
    }
    /**
     * Build task-specific rules
     */
    buildTaskSpecificRules(toolName) {
        const taskRules = this.getTaskSpecificRules(toolName);
        if (taskRules.length === 0)
            return '';
        const rulesText = taskRules
            .map(rule => `- ${rule}`)
            .join('\n');
        return `# TASK-SPECIFIC RULES (MANDATORY)
${rulesText}`;
    }
    /**
     * Build task instructions section
     */
    buildTaskInstructions(taskInstructions, toolName, args) {
        const argsText = Object.keys(args).length > 0
            ? `Arguments: ${JSON.stringify(args, null, 2)}`
            : '';
        return `# TASK INSTRUCTIONS (EXECUTE EXACTLY AS WRITTEN)
Tool: ${toolName}
${argsText}

Instructions:
${taskInstructions}

# EXECUTION REQUIREMENTS
- MUST follow instructions exactly
- MUST respect all rules above
- MUST validate output before returning
- MUST report any rule conflicts immediately`;
    }
    /**
     * Build prompt footer
     */
    buildFooter() {
        return `# ENFORCEMENT DECLARATION
I acknowledge and will follow ALL mandatory rules and context above.
I understand that violations will result in automatic rejection.
I will validate my output against all constraints before returning.

# END ENFORCED PROMPT`;
    }
    /**
     * Get task-specific rules for tool
     */
    getTaskSpecificRules(toolName) {
        const ruleMap = {
            'get_project_context': [
                'MUST return complete and accurate project context',
                'MUST include all files, classes, and relationships',
                'MUST detect and report architectural patterns',
                'MUST validate context completeness',
            ],
            'analyze_current_file': [
                'MUST analyze the exact file specified',
                'MUST extract all imports, classes, and methods',
                'MUST return structured JSON output',
                'MUST include line numbers for all elements',
            ],
            'smart_file_operations': [
                'MUST create backup before any destructive operation',
                'MUST validate file paths and permissions',
                'MUST respect existing file structure',
                'MUST report all operations with success status',
            ],
            'automated_testing': [
                'MUST run tests in appropriate environment',
                'MUST include coverage reports when requested',
                'MUST validate test results before reporting',
                'MUST handle test failures gracefully',
            ],
            'code_quality_analysis': [
                'MUST analyze code against quality standards',
                'MUST provide actionable improvement suggestions',
                'MUST include specific metrics and scores',
                'MUST identify code smells and anti-patterns',
            ],
        };
        return ruleMap[toolName] || [];
    }
    /**
     * Initialize global rules
     */
    initializeGlobalRules() {
        return [
            {
                name: 'No Code Duplication',
                category: 'Architecture',
                description: 'Never duplicate existing code. Always reuse existing classes, methods, and functions.',
                priority: 100,
                active: true,
            },
            {
                name: 'Namespace Integrity',
                category: 'Structure',
                description: 'Always respect existing namespace hierarchy. Do not create new namespaces unnecessarily.',
                priority: 95,
                active: true,
            },
            {
                name: 'Import Consistency',
                category: 'Dependencies',
                description: 'Maintain import consistency. Use existing imports and avoid circular dependencies.',
                priority: 90,
                active: true,
            },
            {
                name: 'Naming Convention Compliance',
                category: 'Standards',
                description: 'Follow detected naming conventions exactly. Do not introduce inconsistent naming.',
                priority: 85,
                active: true,
            },
            {
                name: 'Architectural Pattern Alignment',
                category: 'Architecture',
                description: 'Align with detected architectural patterns. Do not break established patterns.',
                priority: 80,
                active: true,
            },
            {
                name: 'File Structure Respect',
                category: 'Structure',
                description: 'Respect existing file structure. Place files in appropriate directories.',
                priority: 75,
                active: true,
            },
            {
                name: 'Complete Code Only',
                category: 'Quality',
                description: 'Never generate partial or incomplete code. All code must be syntactically correct and complete.',
                priority: 70,
                active: true,
            },
            {
                name: 'Dependency Validation',
                category: 'Dependencies',
                description: 'Validate all dependencies before use. Ensure all required imports are available.',
                priority: 65,
                active: true,
            },
            {
                name: 'Error Handling',
                category: 'Quality',
                description: 'Always include proper error handling. Never ignore potential error conditions.',
                priority: 60,
                active: true,
            },
            {
                name: 'Documentation Standards',
                category: 'Standards',
                description: 'Follow project documentation standards. Include appropriate comments and documentation.',
                priority: 55,
                active: true,
            },
        ];
    }
    /**
     * Add or update global rule
     */
    addGlobalRule(rule) {
        const existingIndex = this.globalRules.findIndex(r => r.name === rule.name);
        if (existingIndex >= 0) {
            this.globalRules[existingIndex] = rule;
        }
        else {
            this.globalRules.push(rule);
        }
        // Sort by priority
        this.globalRules.sort((a, b) => b.priority - a.priority);
    }
    /**
     * Remove global rule
     */
    removeGlobalRule(name) {
        const index = this.globalRules.findIndex(r => r.name === name);
        if (index >= 0) {
            this.globalRules.splice(index, 1);
            return true;
        }
        return false;
    }
    /**
     * Get current global rules
     */
    getGlobalRules() {
        return [...this.globalRules];
    }
    /**
     * Load the SWEObeyMe Master Prompt Contract
     */
    async loadMasterContract() {
        try {
            // Try multiple possible paths for the master contract
            const possiblePaths = [
                path.join(__dirname, '..', 'prompts', 'master-contract.md'),
                path.join(process.cwd(), 'src', 'prompts', 'master-contract.md'),
                path.join(process.cwd(), 'prompts', 'master-contract.md'),
            ];
            for (const contractPath of possiblePaths) {
                if (existsSync(contractPath)) {
                    this.masterContract = readFileSync(contractPath, 'utf8');
                    console.log('✅ Master contract loaded successfully from:', contractPath);
                    return;
                }
            }
            console.warn('⚠️ Master contract not found in any of these paths:', possiblePaths);
            this.masterContract = null;
        }
        catch (error) {
            console.error('❌ Failed to load master contract:', error);
            this.masterContract = null;
        }
    }
    /**
     * Reload the master contract (useful for updates)
     */
    async reloadMasterContract() {
        await this.loadMasterContract();
    }
    /**
     * Clear context cache
     */
    async clearCache() {
        this.projectContext = null;
        this.lastContext = null;
    }
}
//# sourceMappingURL=prompt-enforcer.js.map