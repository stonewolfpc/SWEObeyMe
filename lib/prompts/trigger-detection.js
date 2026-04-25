/**
 * Trigger Detection System
 * Detects when prompts should intervene based on model behavior
 * Identifies ambiguity, hesitation, structural drift, tool forgetting, and other triggers
 */

import { getPromptRegistry } from './registry.js';

/**
 * Trigger detection result
 */
class TriggerDetectionResult {
  constructor() {
    this.detectedTriggers = [];
    this.recommendedPrompts = [];
    this.confidence = 0;
  }

  addTrigger(trigger, promptName, confidence = 0.8) {
    this.detectedTriggers.push({ trigger, promptName, confidence });
    if (!this.recommendedPrompts.includes(promptName)) {
      this.recommendedPrompts.push(promptName);
    }
  }

  getDetectedTriggers() {
    return this.detectedTriggers;
  }

  getRecommendedPrompts() {
    return this.recommendedPrompts;
  }

  hasTriggers() {
    return this.detectedTriggers.length > 0;
  }

  getConfidence() {
    if (this.detectedTriggers.length === 0) {
      return 0;
    }
    return (
      this.detectedTriggers.reduce((sum, t) => sum + t.confidence, 0) / this.detectedTriggers.length
    );
  }
}

/**
 * Trigger Detection System
 */
export class TriggerDetectionSystem {
  constructor() {
    this.registry = null;
    this.triggers = {
      ambiguity: this.detectAmbiguity.bind(this),
      hesitation: this.detectHesitation.bind(this),
      'structural-drift': this.detectStructuralDrift.bind(this),
      'tool-forgetting': this.detectToolForgetting.bind(this),
      'line-limit-violation': this.detectLineLimitViolation.bind(this),
      'monolithic-file-detection': this.detectMonolithicFile.bind(this),
      'preflight-violation': this.detectPreflightViolation.bind(this),
    };
  }

  /**
   * Initialize the system
   */
  async initialize() {
    this.registry = await getPromptRegistry();
  }

  /**
   * Analyze context and detect triggers
   */
  async analyze(context) {
    if (!this.registry) {
      await this.initialize();
    }

    const result = new TriggerDetectionResult();

    // Run all trigger detectors
    for (const [triggerName, detector] of Object.entries(this.triggers)) {
      try {
        const detected = await detector(context);
        if (detected) {
          // Find prompts that respond to this trigger
          const prompts = this.registry.getPromptsByTrigger(triggerName);
          for (const prompt of prompts) {
            result.addTrigger(triggerName, prompt.name, detected.confidence || 0.8);
          }
        }
      } catch (error) {
        console.error(`[Trigger Detection] Error in ${triggerName}:`, error.message);
      }
    }

    return result;
  }

  /**
   * Detect ambiguity in model behavior
   */
  detectAmbiguity(context) {
    const indicators = [
      context.lastMessage?.includes('I think'),
      context.lastMessage?.includes('maybe'),
      context.lastMessage?.includes('not sure'),
      context.lastMessage?.includes('could be'),
      context.lastMessage?.includes('?'),
    ];

    if (indicators.some((i) => i)) {
      return { confidence: 0.7 };
    }

    return null;
  }

  /**
   * Detect hesitation in model behavior
   */
  detectHesitation(context) {
    const indicators = [
      context.lastMessage?.includes('should I'),
      context.lastMessage?.includes('would you like'),
      context.lastMessage?.includes('how about'),
      context.toolCalls?.length === 0 && context.messageCount > 3,
    ];

    if (indicators.some((i) => i)) {
      return { confidence: 0.8 };
    }

    return null;
  }

  /**
   * Detect structural drift
   */
  detectStructuralDrift(context) {
    const indicators = [
      context.recentOperations?.includes('manual_edit'),
      context.recentOperations?.includes('direct_file_access'),
      context.violations?.some((v) => v.rule === 'SEPARATION_OF_CONCERNS'),
      context.fileOperations?.some((op) => op.linesAdded > 200),
    ];

    if (indicators.some((i) => i)) {
      return { confidence: 0.9 };
    }

    return null;
  }

  /**
   * Detect tool forgetting
   */
  detectToolForgetting(context) {
    const indicators = [
      context.lastMessage?.includes('I can'),
      context.lastMessage?.includes('let me just'),
      context.recentErrors?.some((e) => e.includes('not found')),
      context.toolCalls?.some((t) => t.name === 'unknown'),
    ];

    if (indicators.some((i) => i)) {
      return { confidence: 0.85 };
    }

    return null;
  }

  /**
   * Detect line limit violations
   */
  detectLineLimitViolation(context) {
    const indicators = [
      context.fileOperations?.some((op) => op.lineCount > 700),
      context.violations?.some((v) => v.rule === 'LINE_COUNT_LIMIT'),
      context.lastMessage?.includes('combine these'),
      context.lastMessage?.includes('merge files'),
    ];

    if (indicators.some((i) => i)) {
      return { confidence: 0.95 };
    }

    return null;
  }

  /**
   * Detect monolithic file creation
   */
  detectMonolithicFile(context) {
    const indicators = [
      context.fileOperations?.some((op) => op.linesAdded > 500 && op.linesDeleted === 0),
      context.lastMessage?.includes('put everything in'),
      context.lastMessage?.includes('single file'),
      context.violations?.some((v) => v.rule === 'MONOLITHIC_FILE'),
    ];

    if (indicators.some((i) => i)) {
      return { confidence: 0.9 };
    }

    return null;
  }

  /**
   * Detect preflight violations
   */
  detectPreflightViolation(context) {
    const indicators = [
      context.violations?.some((v) => v.category === 'preflight'),
      context.violations?.some((v) => v.rule === 'LINE_COUNT_LIMIT'),
      context.violations?.some((v) => v.rule === 'SEPARATION_OF_CONCERNS'),
      context.pendingChanges?.some((c) => c.lineCount > 700),
      context.validationFailed === true,
    ];

    if (indicators.some((i) => i)) {
      return { confidence: 0.95 };
    }

    return null;
  }

  /**
   * Get trigger statistics
   */
  getStatistics() {
    return {
      availableTriggers: Object.keys(this.triggers),
      triggerCount: Object.keys(this.triggers).length,
    };
  }
}

/**
 * Global trigger detection instance
 */
let globalTriggerDetection = null;

/**
 * Get global trigger detection system
 */
export async function getTriggerDetection() {
  if (!globalTriggerDetection) {
    globalTriggerDetection = new TriggerDetectionSystem();
    await globalTriggerDetection.initialize();
  }
  return globalTriggerDetection;
}
