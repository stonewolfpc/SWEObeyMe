/**
 * Project-Specific Rule Sets
 * Extracted from project-awareness.js for SoC compliance.
 * Keys use string literals to avoid circular dependency with project-awareness.js.
 */

export const PROJECT_RULE_SETS = {
  godot: {
    name: 'Godot Project Rules',
    constraints: [
      'Do NOT reorganize folders',
      'Do NOT rename nodes',
      'Do NOT move scripts',
      'Do NOT break scene trees',
      'Follow Godot best practices tool',
      'Maintain autoload integrity',
      'Preserve resource linking',
    ],
    workflows: ['godot-detection', 'godot-practices', 'godot-workflow'],
    tools: ['detect_godot_project', 'check_godot_practices', 'godot_lookup'],
    socBoundaries: {
      allowed: ['scenes/', 'scripts/', 'resources/', 'autoloads/'],
      protected: ['project.godot', '.godot/'],
    },
  },
  node: {
    name: 'Node/JavaScript Project Rules',
    constraints: [
      'Enforce dependency checks',
      'Enforce SoC (Separation of Concerns)',
      'Enforce module boundaries',
      'Follow npm/package.json conventions',
    ],
    workflows: ['node-dependency-check', 'module-boundaries'],
    tools: ['npm-audit', 'dependency-check'],
    socBoundaries: {
      allowed: ['src/', 'lib/', 'test/', 'node_modules/'],
      protected: ['package.json', 'package-lock.json'],
    },
  },
  python: {
    name: 'Python Project Rules',
    constraints: [
      'Enforce PEP8',
      'Enforce module structure',
      'Enforce dependency checks',
      'Follow pyproject.toml conventions',
    ],
    workflows: ['python-pep8', 'python-module-structure'],
    tools: ['pylint', 'flake8', 'mypy'],
    socBoundaries: {
      allowed: ['src/', 'tests/', 'venv/', '.venv/'],
      protected: ['pyproject.toml', 'requirements.txt', 'setup.py'],
    },
  },
  csharp: {
    name: 'C#/.NET Project Rules',
    constraints: [
      'Enforce namespace structure',
      'Enforce file-per-class',
      'Enforce SoC',
      'Follow .csproj conventions',
    ],
    workflows: ['csharp-namespace', 'csharp-structure'],
    tools: ['csharp-bridge', 'roslyn-analyzer'],
    socBoundaries: {
      allowed: ['src/', 'Models/', 'Views/', 'Controllers/', 'Services/'],
      protected: ['*.csproj', 'Solution.sln'],
    },
  },
  cpp: {
    name: 'C++ Project Rules',
    constraints: [
      'Enforce header/source separation',
      'Enforce CMake conventions',
      'Follow C++ best practices',
    ],
    workflows: ['cpp-structure', 'cmake-build'],
    tools: ['clang-tidy', 'cppcheck'],
    socBoundaries: {
      allowed: ['include/', 'src/', 'tests/', 'build/'],
      protected: ['CMakeLists.txt', 'Makefile'],
    },
  },
  rust: {
    name: 'Rust Project Rules',
    constraints: [
      'Enforce Cargo conventions',
      'Follow Rust ownership rules',
      'Enforce module structure',
    ],
    workflows: ['rust-cargo', 'rust-ownership'],
    tools: ['cargo-clippy', 'cargo-fmt'],
    socBoundaries: {
      allowed: ['src/', 'tests/', 'benches/', 'examples/'],
      protected: ['Cargo.toml', 'Cargo.lock'],
    },
  },
  go: {
    name: 'Go Project Rules',
    constraints: [
      'Enforce go.mod conventions',
      'Follow Go module structure',
      'Enforce package boundaries',
    ],
    workflows: ['go-modules', 'go-structure'],
    tools: ['go vet', 'golint'],
    socBoundaries: {
      allowed: ['cmd/', 'pkg/', 'internal/', 'api/'],
      protected: ['go.mod', 'go.sum'],
    },
  },
  unity: {
    name: 'Unity Project Rules',
    constraints: [
      'Do NOT reorganize Assets folder',
      'Follow Unity naming conventions',
      'Maintain prefab references',
      'Preserve scene hierarchy',
    ],
    workflows: ['unity-assets', 'unity-prefabs'],
    tools: ['unity-analyzer'],
    socBoundaries: {
      allowed: ['Assets/Scripts/', 'Assets/Models/', 'Assets/Materials/'],
      protected: ['Assets/', 'ProjectSettings/', 'Library/'],
    },
  },
  unreal: {
    name: 'Unreal Project Rules',
    constraints: [
      'Do NOT reorganize Content folder',
      'Follow Unreal naming conventions',
      'Maintain blueprint references',
      'Preserve asset registry',
    ],
    workflows: ['unreal-content', 'unreal-blueprints'],
    tools: ['unreal-analyzer'],
    socBoundaries: {
      allowed: ['Content/Blueprints/', 'Content/Materials/', 'Source/'],
      protected: ['Content/', 'Config/', 'Intermediate/'],
    },
  },
};
