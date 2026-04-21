/**
 * Proactive Voice System
 * Gives SWEObeyMe the voice to take charge from the start without manual invocation
 * Automatically detects when intervention is needed and recommends prompts
 */

import { getPromptRegistry } from './prompts/registry.js';
import { TriggerDetectionSystem } from './prompts/trigger-detection.js';

/**
 * Governance constitution that establishes SWEObeyMe's authority
 */
export const GOVERNANCE_CONSTITUTION = `
# SWEObeyMe Governance Constitution

You are working with SWEObeyMe, a surgical governance system that enforces architectural quality and prevents code rot.

## Core Principles

1. **ALWAYS use SWEObeyMe tools first** - Before any file operation, check with SWEObeyMe
2. **MUST obey surgical limits** - Files cannot exceed 700 lines. Split when needed.
3. **MUST use preflight validation** - Run preflight_change before any file modification
4. **MUST use project awareness** - Detect project type before making changes
5. **MUST respect separation of concerns** - Each file has a single responsibility

## Required Workflow

For ANY file modification:
1. detect_project_type (if not already done)
2. get_file_context (to understand dependencies)
3. preflight_change (to validate the change)
4. obey_surgical_plan (to check line count)
5. write_file (only after all checks pass)

## Automatic Intervention

SWEObeyMe will automatically:
- Detect when you're violating architectural rules
- Recommend prompts to guide you back on track
- Trigger constitution reading after 3 consecutive errors
- Enforce surgical compliance through integrity scoring

## Authority

SWEObeyMe tools are not optional suggestions - they are REQUIRED governance mechanisms.
Skipping them will result in rejected changes and lowered integrity scores.

## Current Session Status

- Surgical Integrity Score: 100/100 (starts at maximum)
- Consecutive Errors: 0 (triggers constitution at 3)
- Active Project: Not yet detected (run detect_project_type)

## Immediate Action

Before proceeding with any work, run: detect_project_type
`;

/**
 * Proactive voice system that takes charge automatically
 */
export class ProactiveVoiceSystem {
  constructor() {
    this.triggerDetection = new TriggerDetectionSystem();
    this.consecutiveErrors = 0;
    this.integrityScore = 100;
    this.lastToolCall = null;
    this.projectDetected = false;
  }

  /**
   * Get the governance constitution for initialization
   */
  getGovernanceConstitution() {
    return {
      role: 'system',
      content: GOVERNANCE_CONSTITUTION,
    };
  }

  /**
   * Analyze tool call result and recommend proactive actions
   */
  async analyzeToolCall(toolName, result, context = {}) {
    const recommendations = [];
    
    // Track errors
    if (result.isError) {
      this.consecutiveErrors++;
      this.integrityScore = Math.max(0, this.integrityScore - 10);
      
      // Trigger constitution after 3 errors
      if (this.consecutiveErrors >= 3) {
        recommendations.push({
          type: 'constitution_read',
          priority: 'critical',
          message: 'Consecutive errors detected. Reading constitution to reset.',
          prompt: 'governor-constitution',
        });
        this.consecutiveErrors = 0; // Reset after triggering
      }
    } else {
      this.consecutiveErrors = 0;
      this.integrityScore = Math.min(100, this.integrityScore + 5);
    }

    // First tool call - recommend governance constitution
    if (!this.lastToolCall && toolName !== 'get_governance_constitution') {
      recommendations.push({
        type: 'governance_constitution',
        priority: 'critical',
        message: 'FIRST ACTION REQUIRED: Call get_governance_constitution to establish SWEObeyMe governance before proceeding.',
        prompt: null,
        tool: 'get_governance_constitution',
      });
    }

    // Detect project type if not yet done
    if (!this.projectDetected && toolName !== 'detect_project_type' && toolName !== 'get_governance_constitution') {
      recommendations.push({
        type: 'project_detection',
        priority: 'high',
        message: 'Project type not yet detected. Run detect_project_type before proceeding.',
        prompt: 'detect_project_type',
      });
    }

    // Run trigger detection for prompt recommendations
    try {
      const registry = await getPromptRegistry();
      const triggers = this.triggerDetection.analyze({
        toolName,
        result,
        context,
        integrityScore: this.integrityScore,
      });

      if (triggers.length > 0) {
        triggers.forEach(trigger => {
          recommendations.push({
            type: 'prompt_recommendation',
            priority: trigger.confidence > 0.7 ? 'high' : 'medium',
            message: `Trigger detected: ${trigger.triggerName}. Confidence: ${Math.round(trigger.confidence * 100)}%`,
            prompt: trigger.promptName,
            trigger: trigger.triggerName,
            confidence: trigger.confidence,
          });
        });
      }
    } catch (error) {
      // Silently fail if prompt system not initialized
    }

    // Specific proactive recommendations based on tool
    if (toolName === 'write_file' && !result.isError) {
      recommendations.push({
        type: 'post_write_validation',
        priority: 'medium',
        message: 'File written successfully. Run run_related_tests to verify changes.',
        prompt: null,
      });
    }

    if (toolName === 'detect_project_type' && !result.isError) {
      this.projectDetected = true;
      recommendations.push({
        type: 'project_awareness',
        priority: 'high',
        message: 'Project detected. Run get_project_rules to understand project-specific constraints.',
        prompt: null,
      });
    }

    this.lastToolCall = {
      toolName,
      result,
      timestamp: Date.now(),
    };

    return {
      recommendations,
      integrityScore: this.integrityScore,
      consecutiveErrors: this.consecutiveErrors,
      projectDetected: this.projectDetected,
    };
  }

  /**
   * Get current session status
   */
  getSessionStatus() {
    return {
      integrityScore: this.integrityScore,
      consecutiveErrors: this.consecutiveErrors,
      projectDetected: this.projectDetected,
      lastToolCall: this.lastToolCall,
    };
  }

  /**
   * Reset session state
   */
  resetSession() {
    this.consecutiveErrors = 0;
    this.integrityScore = 100;
    this.projectDetected = false;
    this.lastToolCall = null;
  }
}

// Singleton instance
let proactiveVoiceInstance = null;

export function getProactiveVoice() {
  if (!proactiveVoiceInstance) {
    proactiveVoiceInstance = new ProactiveVoiceSystem();
  }
  return proactiveVoiceInstance;
}
