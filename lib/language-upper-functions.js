/**
 * Language-Specific Upper Functions
 * Provides specialized guidance and tool recommendations for different programming languages
 */

/**
 * C++ specific upper function
 * Provides C++-specific guidance, tool recommendations, and best practices
 */
export function cppUpperFunction(context) {
  const guidance = {
    language: 'cpp',
    recommendedTools: [
      'read_file',
      'write_file',
      'preflight_change',
      'get_file_context',
      'analyze_change_impact',
    ],
    excludedTools: [
      'detect_godot_project',
      'check_godot_practices',
      'godot_lookup',
      'get_csharp_errors',
      'get_csharp_errors_for_file',
      'toggle_csharp_error_type',
      'set_csharp_ai_informed',
      'update_csharp_config',
    ],
    bestPractices: [
      'Use header guards (#pragma once or #ifndef)',
      'Follow RAII (Resource Acquisition Is Initialization)',
      'Use smart pointers (std::unique_ptr, std::shared_ptr)',
      'Avoid raw pointers when possible',
      'Use const correctness',
      'Follow naming conventions: snake_case for functions, PascalCase for classes',
      'Use include guards to prevent multiple inclusions',
      'Prefer references over pointers for parameters',
      'Use constexpr for compile-time constants',
    ],
    commonPatterns: [
      'Header/implementation file separation (.h/.cpp)',
      'Namespace organization',
      'Template usage',
      'STL container usage',
      'Memory management with smart pointers',
    ],
    validationChecks: [
      'Check for memory leaks',
      'Verify include guard usage',
      'Check for undefined behavior',
      'Validate template instantiation',
    ],
  };

  return guidance;
}

/**
 * C# specific upper function
 * Provides C#-specific guidance, tool recommendations, and best practices
 */
export function csharpUpperFunction(context) {
  const guidance = {
    language: 'csharp',
    recommendedTools: [
      'read_file',
      'write_file',
      'preflight_change',
      'get_file_context',
      'analyze_change_impact',
      'get_csharp_errors',
      'get_csharp_errors_for_file',
      'toggle_csharp_error_type',
      'set_csharp_ai_informed',
      'update_csharp_config',
    ],
    excludedTools: ['detect_godot_project', 'check_godot_practices', 'godot_lookup'],
    bestPractices: [
      'Use PascalCase for public members, camelCase for private',
      'Implement IDisposable for unmanaged resources',
      'Use async/await for I/O operations',
      'Follow SOLID principles',
      'Use dependency injection',
      'Prefer properties over public fields',
      'Use null-conditional operators (?.)',
      'Use string interpolation ($"")',
      'Use using statements for resource cleanup',
    ],
    commonPatterns: [
      'Namespace organization',
      'Class hierarchy',
      'Interface implementation',
      'LINQ queries',
      'Async/await patterns',
      'Dependency injection',
      'Event handling',
    ],
    validationChecks: [
      'Check for missing using statements',
      'Verify async/await correctness',
      'Check for empty catch blocks',
      'Validate null safety',
      'Check for resource leaks',
    ],
  };

  return guidance;
}

/**
 * Python specific upper function
 * Provides Python-specific guidance, tool recommendations, and best practices
 */
export function pythonUpperFunction(context) {
  const guidance = {
    language: 'python',
    recommendedTools: [
      'read_file',
      'write_file',
      'preflight_change',
      'get_file_context',
      'analyze_change_impact',
    ],
    excludedTools: [
      'detect_godot_project',
      'check_godot_practices',
      'godot_lookup',
      'get_csharp_errors',
      'get_csharp_errors_for_file',
      'toggle_csharp_error_type',
      'set_csharp_ai_informed',
      'update_csharp_config',
    ],
    bestPractices: [
      'Follow PEP 8 style guide',
      'Use snake_case for variables and functions',
      'Use PascalCase for classes',
      'Use docstrings for documentation',
      'Use type hints for function signatures',
      "Follow DRY (Don't Repeat Yourself)",
      'Use list comprehensions when appropriate',
      'Use context managers (with statements)',
      'Handle exceptions appropriately',
    ],
    commonPatterns: [
      'Module organization',
      'Class definition',
      'Function definition with type hints',
      'List/dict/set comprehensions',
      'Context managers',
      'Exception handling',
      'Decorator usage',
    ],
    validationChecks: [
      'Check for PEP 8 compliance',
      'Verify type hint usage',
      'Check for missing docstrings',
      'Validate exception handling',
      'Check for circular imports',
    ],
  };

  return guidance;
}

/**
 * Get language-specific upper function based on file extension
 */
export function getLanguageUpperFunction(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();

  switch (ext) {
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
    case 'h':
      return cppUpperFunction();
    case 'cs':
      return csharpUpperFunction();
    case 'py':
      return pythonUpperFunction();
    default:
      return null;
  }
}

/**
 * Get language-specific tool recommendations
 */
export function getLanguageSpecificTools(filePath) {
  const upperFunc = getLanguageUpperFunction(filePath);

  if (!upperFunc) {
    return {
      recommended: ['read_file', 'write_file', 'preflight_change'],
      excluded: [],
    };
  }

  return {
    recommended: upperFunc.recommendedTools,
    excluded: upperFunc.excludedTools,
  };
}
