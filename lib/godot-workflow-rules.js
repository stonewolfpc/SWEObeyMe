/**
 * Godot Workflow Rules for SWEObeyMe
 * Enforces strict Godot project structure integrity and prevents AI from breaking Godot projects
 *
 * CRITICAL: Godot projects have strict structure requirements. Breaking scene trees, renaming nodes,
 * moving scripts, deleting autoloads, or reorganizing folders will break the project.
 *
 * When project.godot is detected, the AI enters "Godot Mode" with strict enforcement of:
 * - Scene tree stability
 * - Script-to-node name matching
 * - Autoload integrity
 * - Resource path validity
 * - Signal connection preservation
 * - Folder structure immutability
 */

export const GODOT_WORKFLOW_RULES = [
  {
    id: 'godot_detect_before_any_action',
    priority: 100,
    title: 'Detect Godot Projects Before ANY Action',
    description:
      'MUST use detect_godot_project tool before making ANY changes. This is the ONLY way to identify Godot projects. When project.godot is detected, the AI enters strict "Godot Mode" to prevent project breakage.',
    enforcement: 'critical',
    appliesWhen: (context) => {
      return context.projectPath && !context.godotDetected;
    },
    action: 'Call detect_godot_project(projectPath) before proceeding with ANY modification',
    failureMessage:
      'CRITICAL: Attempted to modify project without detecting if it is a Godot project. Godot projects have strict structure requirements. Call detect_godot_project first. This is a project-breaking risk.',
  },
  {
    id: 'godot_scene_tree_immutable',
    priority: 99,
    title: 'Never Modify Scene Tree Structure',
    description:
      'MUST NOT modify scene tree hierarchy, rename nodes, or change parent-child relationships. Godot scene trees are fragile and breaking them destroys the project. Scene structure is sacred in Godot.',
    enforcement: 'critical',
    appliesWhen: (context) => {
      return (
        context.godotDetected &&
        (context.modifyingSceneTree || context.renamingNode || context.changingParent)
      );
    },
    action: 'ABORT: Do not modify scene tree structure. Scene hierarchy is immutable.',
    failureMessage:
      'CRITICAL: Attempted to modify scene tree structure. This WILL break the Godot project. Scene trees are immutable. Node renaming, parent changes, or hierarchy modifications are forbidden in Godot Mode.',
  },
  {
    id: 'godot_script_node_name_matching',
    priority: 98,
    title: 'Script Names Must Match Node Names',
    description:
      'MUST ensure script filenames match their attached node names exactly. In Godot, scripts are tightly coupled to nodes by name. Mismatched names break the attachment and the project.',
    enforcement: 'critical',
    appliesWhen: (context) => {
      return context.godotDetected && context.creatingScript && !context.scriptMatchesNodeName;
    },
    action:
      'Ensure script filename matches the node name it will be attached to (e.g., Player.gd for Player node)',
    failureMessage:
      'CRITICAL: Script name does not match node name. In Godot, scripts are coupled to nodes by name. This will break the attachment. Script must be named exactly like the node it attaches to.',
  },
  {
    id: 'godot_never_move_scripts',
    priority: 97,
    title: 'Never Move or Rename Existing Scripts',
    description:
      'MUST NOT move or rename existing script files. Godot stores script references by path. Moving or renaming breaks all references and destroys the project.',
    enforcement: 'critical',
    appliesWhen: (context) => {
      return context.godotDetected && (context.movingScript || context.renamingExistingScript);
    },
    action: 'ABORT: Do not move or rename existing scripts. Script paths are immutable.',
    failureMessage:
      'CRITICAL: Attempted to move or rename an existing script. Godot stores script references by absolute path. This will break all references to the script and destroy the project. Script paths are immutable.',
  },
  {
    id: 'godot_autoload_immutable',
    priority: 96,
    title: 'Never Modify Autoload Configuration',
    description:
      'MUST NOT add, remove, or modify autoloads. Autoloads are singletons loaded at project startup. Modifying them breaks global state and can crash the project.',
    enforcement: 'critical',
    appliesWhen: (context) => {
      return (
        context.godotDetected &&
        (context.modifyingAutoload || context.addingAutoload || context.removingAutoload)
      );
    },
    action: 'ABORT: Do not modify autoload configuration. Autoloads are immutable.',
    failureMessage:
      'CRITICAL: Attempted to modify autoload configuration. Autoloads are global singletons loaded at startup. Modifying them breaks global state and can crash the project. Autoload configuration is immutable.',
  },
  {
    id: 'godot_never_reorganize_folders',
    priority: 95,
    title: 'Never Reorganize Project Folder Structure',
    description:
      'MUST NOT reorganize, rename, or move project folders. Godot uses relative paths extensively. Folder reorganization breaks all resource references and destroys the project.',
    enforcement: 'critical',
    appliesWhen: (context) => {
      return (
        context.godotDetected &&
        (context.reorganizingFolders || context.movingFolder || context.renamingFolder)
      );
    },
    action: 'ABORT: Do not reorganize project folder structure. Folder structure is immutable.',
    failureMessage:
      'CRITICAL: Attempted to reorganize project folder structure. Godot uses relative paths throughout. Folder reorganization breaks all resource references and destroys the project. Folder structure is immutable.',
  },
  {
    id: 'godot_resource_path_validation',
    priority: 94,
    title: 'Validate All Resource References Before Use',
    description:
      'MUST validate all resource references (res:// paths) before using them. Invalid resource paths cause load errors and break the project.',
    enforcement: 'critical',
    appliesWhen: (context) => {
      return context.godotDetected && context.usingResourcePath && !context.resourcePathValidated;
    },
    action: 'Validate resource path exists and is accessible before using it',
    failureMessage:
      'CRITICAL: Using unvalidated resource path. Invalid resource paths cause load errors and break the project. Always validate res:// paths before use.',
  },
  {
    id: 'godot_signal_connection_immutable',
    priority: 93,
    title: 'Never Break Signal Connections',
    description:
      'MUST NOT modify or delete signal connections. Signals are how nodes communicate. Breaking them destroys node communication and breaks the project.',
    enforcement: 'critical',
    appliesWhen: (context) => {
      return (
        context.godotDetected && (context.modifyingSignals || context.deletingSignalConnection)
      );
    },
    action: 'ABORT: Do not modify signal connections. Signal connections are immutable.',
    failureMessage:
      'CRITICAL: Attempted to modify signal connections. Signals are the primary communication mechanism in Godot. Breaking them destroys node communication and breaks the project. Signal connections are immutable.',
  },
  {
    id: 'godot_scene_file_immutable',
    priority: 92,
    title: 'Never Modify .tscn Scene Files Directly',
    description:
      'MUST NOT directly edit .tscn scene files. Scene files are complex JSON-like structures. Direct editing corrupts scenes and breaks the project. Use Godot editor for scene changes.',
    enforcement: 'critical',
    appliesWhen: (context) => {
      return context.godotDetected && context.modifyingSceneFile;
    },
    action:
      'ABORT: Do not directly edit .tscn scene files. Use Godot editor for scene modifications.',
    failureMessage:
      'CRITICAL: Attempted to directly edit .tscn scene file. Scene files have complex structure and direct editing corrupts scenes. Use the Godot editor for all scene modifications. Scene files are immutable to direct editing.',
  },
  {
    id: 'godot_lookup_before_any_change',
    priority: 91,
    title: 'Consult Godot Documentation Before Any Change',
    description:
      'MUST use godot_lookup tool to consult official documentation before making any change. Godot has specific patterns and conventions. Following them prevents project breakage.',
    enforcement: 'strict',
    appliesWhen: (context) => {
      return context.godotDetected && context.makingChange && !context.godotLookupPerformed;
    },
    action: 'Call godot_lookup(query) to find relevant best practices before making any change',
    failureMessage:
      'FAILED: Attempted to make changes in Godot project without consulting official documentation. Godot has specific patterns. Consult godot_lookup first to prevent project breakage.',
  },
  {
    id: 'godot_check_practices_before_commit',
    priority: 90,
    title: 'Verify Practices Before Finalizing Changes',
    description:
      'MUST use check_godot_practices tool to verify all changes comply with Godot standards before finalizing. This is the final safety check.',
    enforcement: 'strict',
    appliesWhen: (context) => {
      return context.godotDetected && context.finalizingChanges && !context.godotPracticesChecked;
    },
    action:
      'Call check_godot_practices(projectPath, filePath?) to verify compliance before finalizing',
    failureMessage:
      'FAILED: Attempted to finalize changes without verifying Godot practices compliance. This is a project-breaking risk. Call check_godot_practices first.',
  },
  {
    id: 'godot_naming_conventions_strict',
    priority: 89,
    title: 'Strict Godot Naming Conventions',
    description:
      'MUST follow Godot naming conventions strictly: snake_case for files (.gd), PascalCase for classes (class_name), snake_case for functions, UPPER_SNAKE_CASE for constants. Deviations break tooling and project structure.',
    enforcement: 'strict',
    appliesWhen: (context) => {
      return context.godotDetected && context.creatingFile && !context.followsNamingConvention;
    },
    action:
      'Use snake_case for .gd files, PascalCase for class_name declarations, snake_case for functions, UPPER_SNAKE_CASE for constants',
    failureMessage:
      'FAILED: File does not follow Godot naming conventions. Godot tooling depends on correct naming. Use snake_case for .gd files, PascalCase for classes, snake_case for functions, UPPER_SNAKE_CASE for constants.',
  },
  {
    id: 'godot_single_responsibility',
    priority: 88,
    title: 'Enforce Single Responsibility Principle',
    description:
      'Each scene/script should have a single, well-defined responsibility. Monolithic scripts are hard to maintain and break Godot scene composition patterns.',
    enforcement: 'warning',
    appliesWhen: (context) => {
      return context.godotDetected && context.creatingScript && context.scriptLines > 500;
    },
    action:
      'Split the script into multiple focused scripts following single responsibility principle',
    failureMessage:
      'WARNING: Script exceeds 500 lines. Godot favors composition. Split into multiple focused scripts for better scene composition and maintainability.',
  },
  {
    id: 'godot_encapsulation',
    priority: 87,
    title: 'Enforce Encapsulation',
    description:
      'Keep internal state private with underscore prefix (_variable). Expose only necessary methods. Direct external access breaks encapsulation and scene reusability.',
    enforcement: 'warning',
    appliesWhen: (context) => {
      return context.godotDetected && context.creatingScript && context.hasPublicInternalState;
    },
    action:
      'Use private variables with underscore prefix (_variable) and expose only necessary methods',
    failureMessage:
      'WARNING: Script exposes internal state directly. Use encapsulation with underscore-prefixed private variables (_variable) and public methods for scene reusability.',
  },
  {
    id: 'godot_composition_over_inheritance',
    priority: 86,
    title: 'Prefer Scene Composition Over Inheritance',
    description:
      'Prefer composition (scenes and child nodes) over deep inheritance. Godot scenes provide better reusability and flexibility than inheritance chains.',
    enforcement: 'warning',
    appliesWhen: (context) => {
      return context.godotDetected && context.inheritanceDepth > 3;
    },
    action: 'Use scene composition instead of deep inheritance for better reusability',
    failureMessage:
      'WARNING: Inheritance depth exceeds 3 levels. Godot favors scene composition over inheritance. Use scenes and child nodes for better reusability and flexibility.',
  },
  {
    id: 'godot_signal_usage',
    priority: 85,
    title: 'Use Signals for Decoupled Communication',
    description:
      'Use signals for communication between nodes instead of direct references. Signals promote loose coupling and scene reusability. Direct references create tight coupling.',
    enforcement: 'warning',
    appliesWhen: (context) => {
      return context.godotDetected && context.couplingTight && !context.usingSignals;
    },
    action: 'Use signals for communication instead of direct node references for decoupling',
    failureMessage:
      'WARNING: Direct node references create tight coupling. Use Godot signals for decoupled communication and better scene reusability.',
  },
  {
    id: 'godot_resource_management',
    priority: 84,
    title: 'Use Resource Types for Data',
    description:
      "Use Godot Resource types for data that doesn't need node functionality. Resources are more efficient than Nodes for data-only structures.",
    enforcement: 'suggestion',
    appliesWhen: (context) => {
      return context.godotDetected && context.storingDataInNode && !dataNeedsNodeFunctionality;
    },
    action: 'Consider using Resource types instead of Nodes for data-only structures',
    failureMessage:
      'SUGGESTION: Data stored in Node when Resource type would be more efficient. Use Resource types for data-only structures for better performance and organization.',
  },
  {
    id: 'godot_node_path_validation',
    priority: 83,
    title: 'Validate Node Paths Before Use',
    description:
      'MUST validate NodePath references before use. Invalid node paths cause runtime errors and break scene functionality.',
    enforcement: 'strict',
    appliesWhen: (context) => {
      return context.godotDetected && context.usingNodePath && !context.nodePathValidated;
    },
    action: 'Validate NodePath references before using them in code',
    failureMessage:
      'FAILED: Using unvalidated NodePath reference. Invalid node paths cause runtime errors. Always validate NodePath references before use.',
  },
  {
    id: 'godot_export_variable_validation',
    priority: 82,
    title: 'Validate Exported Variables',
    description:
      'MUST validate exported variables (@export) have proper types and default values. Invalid exports cause editor errors and break scene configuration.',
    enforcement: 'strict',
    appliesWhen: (context) => {
      return context.godotDetected && context.addingExport && !context.exportValidated;
    },
    action: 'Ensure exported variables have proper types and valid default values',
    failureMessage:
      'FAILED: Added unvalidated exported variable. Invalid exports cause editor errors. Ensure @export variables have proper types and valid default values.',
  },
  {
    id: 'godot_ready_function_usage',
    priority: 81,
    title: 'Use _ready() for Initialization',
    description:
      'MUST use _ready() function for node initialization instead of _init(). _ready() is called when node enters scene tree and has access to other nodes.',
    enforcement: 'warning',
    appliesWhen: (context) => {
      return context.godotDetected && context.usingInitForNodeSetup;
    },
    action: 'Use _ready() for node initialization instead of _init()',
    failureMessage:
      'WARNING: Using _init() for node setup. _init() runs before node enters scene tree. Use _ready() for initialization when node has access to scene tree.',
  },
];

/**
 * Check if Godot workflow rules should be applied
 * @param {Object} context - Current context
 * @returns {boolean} - True if Godot rules should apply
 */
export function shouldApplyGodotRules(context) {
  return context.godotDetected === true;
}

/**
 * Get applicable Godot workflow rules for current context
 * @param {Object} context - Current context
 * @returns {Array} - Array of applicable rules
 */
export function getApplicableGodotRules(context) {
  if (!shouldApplyGodotRules(context)) {
    return [];
  }

  return GODOT_WORKFLOW_RULES.filter((rule) => {
    if (rule.appliesWhen) {
      return rule.appliesWhen(context);
    }
    return true;
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * Validate action against Godot workflow rules
 * @param {Object} context - Current context
 * @param {string} action - Action being taken
 * @returns {Object} - Validation result with violations
 */
export function validateGodotAction(context, action) {
  const applicableRules = getApplicableGodotRules(context);
  const violations = [];

  for (const rule of applicableRules) {
    if (action.includes(rule.action) || action === rule.action) {
      continue; // Action complies with rule
    }

    if (rule.enforcement === 'strict' || rule.enforcement === 'warning') {
      violations.push({
        ruleId: rule.id,
        priority: rule.priority,
        title: rule.title,
        message: rule.failureMessage,
        enforcement: rule.enforcement,
        requiredAction: rule.action,
      });
    }
  }

  return {
    compliant: violations.length === 0,
    violations: violations,
    ruleCount: applicableRules.length,
  };
}
