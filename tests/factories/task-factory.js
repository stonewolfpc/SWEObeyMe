/**
 * Task factory for generating test data
 */

import crypto from 'crypto';

export function createTask(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    description: 'Test task',
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createTaskList(count, overrides = {}) {
  return Array.from({ length: count }, (_, i) =>
    createTask({
      description: `Task ${i + 1}`,
      ...overrides,
    })
  );
}

export function createCompletedTask(overrides = {}) {
  return createTask({
    status: 'completed',
    completedAt: new Date().toISOString(),
    ...overrides,
  });
}

export function createInProgressTask(overrides = {}) {
  return createTask({
    status: 'in_progress',
    isCurrent: true,
    ...overrides,
  });
}

export function createBlockedTask(overrides = {}) {
  return createTask({
    status: 'blocked',
    ...overrides,
  });
}
