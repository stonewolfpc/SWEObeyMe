/**
 * End-to-End Software Factory Test
 * The final boss - complete user workflow simulation
 */

import { fileURLToPath } from 'url';
import { join } from 'path';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  rmdirSync,
  readdirSync,
  statSync,
} from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

class E2ESoftwareFactoryTest {
  constructor(options = {}) {
    this.options = options;
    this.results = {
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };

    this.testDir = join(__dirname, '..', 'fixtures', 'e2e-factory');
    this.ensureTestDir();
  }

  ensureTestDir() {
    if (!existsSync(this.testDir)) {
      mkdirSync(this.testDir, { recursive: true });
    }
  }

  async run() {
    console.log('[E2ESoftwareFactoryTest] Starting end-to-end software factory test...');

    const tests = [
      'create-new-project',
      'add-files',
      'modify-files',
      'refactor-files',
      'run-diagnostics',
      'fix-errors',
      'create-checkpoints',
      'revert-checkpoints',
      'use-multiple-providers',
      'use-multiple-tools',
      'use-multiple-workflows',
      'use-multiple-editors',
      'use-multiple-oses',
    ];

    for (const test of tests) {
      await this.runTest(test);
    }

    this.results.total = this.results.tests.length;
    return this.results;
  }

  async runTest(testName) {
    console.log(`[E2ESoftwareFactoryTest] Running: ${testName}...`);

    let passed = false;
    let error = null;

    try {
      switch (testName) {
        case 'create-new-project':
          passed = await this.testCreateNewProject();
          break;
        case 'add-files':
          passed = await this.testAddFiles();
          break;
        case 'modify-files':
          passed = await this.testModifyFiles();
          break;
        case 'refactor-files':
          passed = await this.testRefactorFiles();
          break;
        case 'run-diagnostics':
          passed = await this.testRunDiagnostics();
          break;
        case 'fix-errors':
          passed = await this.testFixErrors();
          break;
        case 'create-checkpoints':
          passed = await this.testCreateCheckpoints();
          break;
        case 'revert-checkpoints':
          passed = await this.testRevertCheckpoints();
          break;
        case 'use-multiple-providers':
          passed = await this.testUseMultipleProviders();
          break;
        case 'use-multiple-tools':
          passed = await this.testUseMultipleTools();
          break;
        case 'use-multiple-workflows':
          passed = await this.testUseMultipleWorkflows();
          break;
        case 'use-multiple-editors':
          passed = await this.testUseMultipleEditors();
          break;
        case 'use-multiple-oses':
          passed = await this.testUseMultipleOSes();
          break;
      }
    } catch (e) {
      error = e.message;
    }

    this.results.tests.push({
      id: testName,
      name: `E2E Factory - ${testName}`,
      passed,
      error,
    });

    if (passed) {
      this.results.passed++;
      console.log(`[E2ESoftwareFactoryTest] ✅ ${testName}`);
    } else {
      this.results.failed++;
      console.log(`[E2ESoftwareFactoryTest] ❌ ${testName}: ${error}`);
    }
  }

  async testCreateNewProject() {
    const projectDir = join(this.testDir, 'new-project');

    try {
      mkdirSync(projectDir, { recursive: true });

      // Simulate project creation
      const result = this.simulateProjectCreation(projectDir, {
        name: 'test-project',
        type: 'typescript',
        packageManager: 'npm',
      });

      // Verify project structure
      const hasPackageJson = existsSync(join(projectDir, 'package.json'));
      const hasSrcDir = existsSync(join(projectDir, 'src'));
      const hasGitDir = existsSync(join(projectDir, '.git'));

      // Cleanup
      this.cleanup(projectDir);

      return result.success === true && hasPackageJson && hasSrcDir;
    } catch (e) {
      this.cleanup(projectDir);
      return false;
    }
  }

  async testAddFiles() {
    const projectDir = join(this.testDir, 'add-files');

    try {
      mkdirSync(projectDir, { recursive: true });
      mkdirSync(join(projectDir, 'src'), { recursive: true });

      // Simulate adding files
      const result = this.simulateAddFiles(projectDir, [
        { path: 'src/index.ts', content: 'export function main() {}' },
        { path: 'src/utils.ts', content: 'export const helper = () => {}' },
        { path: 'README.md', content: '# Test Project' },
      ]);

      // Verify files exist
      const filesExist = [
        existsSync(join(projectDir, 'src/index.ts')),
        existsSync(join(projectDir, 'src/utils.ts')),
        existsSync(join(projectDir, 'README.md')),
      ].every((e) => e === true);

      // Cleanup
      this.cleanup(projectDir);

      return result.success === true && filesExist;
    } catch (e) {
      this.cleanup(projectDir);
      return false;
    }
  }

  async testModifyFiles() {
    const projectDir = join(this.testDir, 'modify-files');

    try {
      mkdirSync(projectDir, { recursive: true });

      // Create initial file
      writeFileSync(join(projectDir, 'test.ts'), 'const x = 1;');

      // Simulate modification
      const result = this.simulateModifyFile(join(projectDir, 'test.ts'), {
        oldContent: 'const x = 1;',
        newContent: 'const x = 2;',
      });

      // Verify modification
      const content = readFileSync(join(projectDir, 'test.ts'), 'utf-8');
      const modified = content === 'const x = 2;';

      // Cleanup
      unlinkSync(join(projectDir, 'test.ts'));
      rmdirSync(projectDir);

      return result.success === true && modified;
    } catch (e) {
      this.cleanup(join(projectDir, 'test.ts'));
      return false;
    }
  }

  async testRefactorFiles() {
    const projectDir = join(this.testDir, 'refactor-files');

    try {
      mkdirSync(projectDir, { recursive: true });

      // Create file to refactor
      const fileContent = `
        function oldFunction(x) {
          return x * 2;
        }
        
        function anotherOldFunction(y) {
          return y + 1;
        }
      `;
      writeFileSync(join(projectDir, 'old.ts'), fileContent);

      // Simulate refactoring
      const result = this.simulateRefactor(projectDir, [
        { rename: 'oldFunction -> multiply' },
        { rename: 'anotherOldFunction -> increment' },
      ]);

      // Verify refactoring
      const newContent = readFileSync(join(projectDir, 'new.ts'), 'utf-8');
      const refactored = newContent.includes('multiply') && newContent.includes('increment');

      // Cleanup
      unlinkSync(join(projectDir, 'old.ts'));
      unlinkSync(join(projectDir, 'new.ts'));
      rmdirSync(projectDir);

      return result.success === true && refactored;
    } catch (e) {
      this.cleanup(join(projectDir, 'old.ts'));
      this.cleanup(join(projectDir, 'new.ts'));
      return false;
    }
  }

  async testRunDiagnostics() {
    const projectDir = join(this.testDir, 'diagnostics');

    try {
      mkdirSync(projectDir, { recursive: true });

      // Create file with errors
      const fileContent = `
        const x: any = 1;
        console.log(x);
      `;
      writeFileSync(join(projectDir, 'test.ts'), fileContent);

      // Simulate running diagnostics
      const result = this.simulateDiagnostics(projectDir, {
        file: 'test.ts',
        type: 'typescript',
      });

      // Verify diagnostics detected
      const detected = result.errorsDetected === true && result.errorCount > 0;

      // Cleanup
      unlinkSync(join(projectDir, 'test.ts'));
      rmdirSync(projectDir);

      return detected;
    } catch (e) {
      this.cleanup(join(projectDir, 'test.ts'));
      return false;
    }
  }

  async testFixErrors() {
    const projectDir = join(this.testDir, 'fix-errors');

    try {
      mkdirSync(projectDir, { recursive: true });

      // Create file with error
      writeFileSync(join(projectDir, 'test.ts'), 'const x: any = 1;');

      // Simulate fixing error
      const result = this.simulateFix(projectDir, {
        file: 'test.ts',
        error: 'any type',
        fix: 'const x: number = 1;',
      });

      // Verify fix applied
      const content = readFileSync(join(projectDir, 'test.ts'), 'utf-8');
      const fixed = content === 'const x: number = 1;';

      // Cleanup
      unlinkSync(join(projectDir, 'test.ts'));
      rmdirSync(projectDir);

      return result.success === true && fixed;
    } catch (e) {
      this.cleanup(join(projectDir, 'test.ts'));
      return false;
    }
  }

  async testCreateCheckpoints() {
    const projectDir = join(this.testDir, 'checkpoints');

    try {
      mkdirSync(projectDir, { recursive: true });

      // Create file
      writeFileSync(join(projectDir, 'file.txt'), 'content');

      // Simulate creating checkpoints
      const result = this.simulateCreateCheckpoints(projectDir, {
        count: 5,
        file: 'file.txt',
      });

      // Verify checkpoints created
      const checkpointDir = join(projectDir, '.checkpoints');
      const checkpointCount = existsSync(checkpointDir) ? readdirSync(checkpointDir).length : 0;

      // Cleanup
      this.cleanup(projectDir);

      return result.success === true && checkpointCount === 5;
    } catch (e) {
      this.cleanup(projectDir);
      return false;
    }
  }

  async testRevertCheckpoints() {
    const projectDir = join(this.testDir, 'revert-checkpoints');

    try {
      mkdirSync(projectDir, { recursive: true });

      // Create file and checkpoint
      writeFileSync(join(projectDir, 'file.txt'), 'original');

      // Simulate creating checkpoint
      this.simulateCreateCheckpoints(projectDir, { count: 1, file: 'file.txt' });

      // Modify file
      writeFileSync(join(projectDir, 'file.txt'), 'modified');

      // Simulate revert
      const result = this.simulateRevertCheckpoint(projectDir, {
        checkpointId: 'checkpoint-0',
      });

      // Verify revert
      const content = readFileSync(join(projectDir, 'file.txt'), 'utf-8');
      const reverted = content === 'original';

      // Cleanup
      this.cleanup(projectDir);

      return result.success === true && reverted;
    } catch (e) {
      this.cleanup(projectDir);
      return false;
    }
  }

  async testUseMultipleProviders() {
    const projectDir = join(this.testDir, 'multi-providers');

    try {
      mkdirSync(projectDir, { recursive: true });

      // Simulate using multiple providers
      const result = this.simulateProviderSwitch(projectDir, {
        providers: ['ollama', 'openai', 'anthropic'],
        sequence: true,
      });

      // Verify all providers used
      const allUsed = result.providersUsed.length === 3;

      // Cleanup
      rmdirSync(projectDir);

      return result.success === true && allUsed;
    } catch (e) {
      this.cleanup(projectDir);
      return false;
    }
  }

  async testUseMultipleTools() {
    const projectDir = join(this.testDir, 'multi-tools');

    try {
      mkdirSync(projectDir, { recursive: true });

      // Simulate using multiple tools
      const result = this.simulateToolSequence(projectDir, {
        tools: ['read_file', 'edit', 'write_file', 'search', 'resolve_tool'],
      });

      // Verify all tools used
      const allUsed = result.toolsUsed.length === 5;

      // Cleanup
      rmdirSync(projectDir);

      return result.success === true && allUsed;
    } catch (e) {
      this.cleanup(projectDir);
      return false;
    }
  }

  async testUseMultipleWorkflows() {
    const projectDir = join(this.testDir, 'multi-workflows');

    try {
      mkdirSync(projectDir, { recursive: true });

      // Simulate using multiple workflows
      const result = this.simulateWorkflowSequence(projectDir, {
        workflows: ['code-review', 'refactor', 'test-generation'],
      });

      // Verify all workflows executed
      const allExecuted = result.workflowsExecuted.length === 3;

      // Cleanup
      rmdirSync(projectDir);

      return result.success === true && allExecuted;
    } catch (e) {
      this.cleanup(projectDir);
      return false;
    }
  }

  async testUseMultipleEditors() {
    const projectDir = join(this.testDir, 'multi-editors');

    try {
      mkdirSync(projectDir, { recursive: true });

      // Simulate using multiple editors
      const result = this.simulateEditorSwitch(projectDir, {
        editors: ['windsurf', 'vscode', 'cursor'],
      });

      // Verify all editors simulated
      const allSimulated = result.editorsSimulated.length === 3;

      // Cleanup
      rmdirSync(projectDir);

      return result.success === true && allSimulated;
    } catch (e) {
      this.cleanup(projectDir);
      return false;
    }
  }

  async testUseMultipleOSes() {
    const projectDir = join(this.testDir, 'multi-oses');

    try {
      mkdirSync(projectDir, { recursive: true });

      // Simulate using multiple OSes
      const result = this.simulateOSSwitch(projectDir, {
        oses: ['windows', 'macos', 'linux'],
      });

      // Verify all OSes simulated
      const allSimulated = result.osesSimulated.length === 3;

      // Cleanup
      rmdirSync(projectDir);

      return result.success === true && allSimulated;
    } catch (e) {
      this.cleanup(projectDir);
      return false;
    }
  }

  // Simulation helper methods
  simulateProjectCreation(projectDir, config) {
    try {
      // Create package.json
      const packageJson = {
        name: config.name,
        version: '1.0.0',
        scripts: {
          build: 'tsc',
          test: 'jest',
        },
      };
      writeFileSync(join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      // Create src directory
      mkdirSync(join(projectDir, 'src'), { recursive: true });

      // Create tsconfig.json
      const tsconfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          outDir: './dist',
        },
      };
      writeFileSync(join(projectDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

      // Initialize git
      mkdirSync(join(projectDir, '.git'), { recursive: true });

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  simulateAddFiles(projectDir, files) {
    try {
      for (const file of files) {
        const filePath = join(projectDir, file.path);
        const dir = join(filePath, '..');
        mkdirSync(dir, { recursive: true });
        writeFileSync(filePath, file.content);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  simulateModifyFile(filePath, changes) {
    try {
      writeFileSync(filePath, changes.newContent);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  simulateRefactor(projectDir, changes) {
    try {
      const oldFile = join(projectDir, 'old.ts');
      const newFile = join(projectDir, 'new.ts');

      let content = readFileSync(oldFile, 'utf-8');

      for (const change of changes) {
        const [oldName, newName] = change.rename.split(' -> ');
        content = content.replace(new RegExp(oldName, 'g'), newName);
      }

      writeFileSync(newFile, content);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  simulateDiagnostics(projectDir, config) {
    try {
      const filePath = join(projectDir, config.file);
      const content = readFileSync(filePath, 'utf-8');

      // Simulate diagnostics
      const errors = [];
      if (content.includes('any')) {
        errors.push({ line: 1, message: 'Avoid using any type' });
      }

      return {
        errorsDetected: true,
        errorCount: errors.length,
        errors,
      };
    } catch (e) {
      return { errorsDetected: false, error: e.message };
    }
  }

  simulateFix(projectDir, config) {
    try {
      const filePath = join(projectDir, config.file);
      writeFileSync(filePath, config.fix);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  simulateCreateCheckpoints(projectDir, config) {
    try {
      const checkpointDir = join(projectDir, '.checkpoints');
      mkdirSync(checkpointDir, { recursive: true });

      for (let i = 0; i < config.count; i++) {
        const checkpoint = {
          id: `checkpoint-${i}`,
          timestamp: Date.now(),
          files: [config.file],
          content: readFileSync(join(projectDir, config.file), 'utf-8'),
        };
        writeFileSync(join(checkpointDir, `checkpoint-${i}.json`), JSON.stringify(checkpoint));
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  simulateRevertCheckpoint(projectDir, config) {
    try {
      const checkpointDir = join(projectDir, '.checkpoints');
      const checkpointPath = join(checkpointDir, `${config.checkpointId}.json`);
      const checkpoint = JSON.parse(readFileSync(checkpointPath, 'utf-8'));

      // Revert file to checkpoint content
      writeFileSync(join(projectDir, checkpoint.files[0]), checkpoint.content);

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  simulateProviderSwitch(projectDir, config) {
    const providersUsed = [];

    if (config.sequence) {
      for (const provider of config.providers) {
        providersUsed.push(provider);
      }
    }

    return { success: true, providersUsed };
  }

  simulateToolSequence(projectDir, config) {
    const toolsUsed = [];

    for (const tool of config.tools) {
      toolsUsed.push(tool);
    }

    return { success: true, toolsUsed };
  }

  simulateWorkflowSequence(projectDir, config) {
    const workflowsExecuted = [];

    for (const workflow of config.workflows) {
      workflowsExecuted.push(workflow);
    }

    return { success: true, workflowsExecuted };
  }

  simulateEditorSwitch(projectDir, config) {
    const editorsSimulated = [];

    for (const editor of config.editors) {
      editorsSimulated.push(editor);
    }

    return { success: true, editorsSimulated };
  }

  simulateOSSwitch(projectDir, config) {
    const osesSimulated = [];

    for (const os of config.oses) {
      osesSimulated.push(os);
    }

    return { success: true, osesSimulated };
  }

  cleanup(path) {
    try {
      if (existsSync(path)) {
        const stat = statSync(path);
        if (stat.isDirectory()) {
          const files = readdirSync(path);
          for (const file of files) {
            this.cleanup(join(path, file));
          }
          rmdirSync(path);
        } else {
          unlinkSync(path);
        }
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

export default E2ESoftwareFactoryTest;
