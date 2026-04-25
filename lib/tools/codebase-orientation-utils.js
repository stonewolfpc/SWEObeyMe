/**
 * Codebase Orientation Utility Functions
 * Shared utilities for codebase orientation handlers
 */

import { getProjectMemoryManager } from '../project-memory-system.js';

/**
 * Timeout wrapper for async operations
 */
export async function withTimeout(promise, timeoutMs, operationName) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout: ${operationName} exceeded ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Helper: Record context annotations for non-standard modules
 */
export async function recordModuleAnnotations(orientation, projectRoot) {
  try {
    const manager = await getProjectMemoryManager('default');
    if (!manager) return;

    // Record annotations for non-standard module types
    if (orientation.modules) {
      orientation.modules.forEach((mod) => {
        const nonStandardTypes = ['custom', 'legacy', 'experimental', 'internal'];
        if (nonStandardTypes.includes(mod.type)) {
          manager.recordContextAnnotation(
            mod.path,
            'NON-STANDARD',
            `Module type: ${mod.type}. ${mod.inferredResponsibility || ''}`
          );
        }
      });
    }
  } catch (error) {
    // Silently fail - annotation recording is not critical
  }
}

/**
 * Helper: Record dependency impact for hub files
 */
export async function recordDependencyImpact(hubFiles, projectRoot) {
  try {
    const manager = await getProjectMemoryManager('default');
    if (!manager) return;

    // Record impact for top hub files
    hubFiles.slice(0, 5).forEach((hub) => {
      manager.recordDependencyImpact(
        hub.file,
        [], // Affected files would need deeper analysis
        `Hub file imported by ${hub.importCount} modules`,
        'Check dependent modules before modifying'
      );
    });
  } catch (error) {
    // Silently fail - impact recording is not critical
  }
}
