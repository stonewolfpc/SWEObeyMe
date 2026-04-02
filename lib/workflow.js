// PHASE 8: Workflow Orchestration Engine
export const activeWorkflows = new Map();

class SurgicalWorkflow {
  constructor(id, goal, steps) {
    this.id = id;
    this.goal = goal;
    this.steps = steps.map(s => ({ ...s, status: "pending" }));
    this.startTime = Date.now();
  }

  updateStep(stepName, status) {
    const step = this.steps.find(s => s.name === stepName);
    if (step) step.status = status;
  }

  isComplete() {
    return this.steps.every(s => s.status === "completed");
  }
}

export { SurgicalWorkflow };
