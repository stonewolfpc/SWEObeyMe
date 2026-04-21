/**
 * Loading State Manager
 * Manages loading states, progress tracking, and status for async operations
 */

/**
 * Loading State Types
 */
export const LoadingState = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled',
};

/**
 * Loading State Manager
 */
export class LoadingStateManager {
  constructor(options = {}) {
    this.states = new Map();
    this.progress = new Map();
    this.maxStates = options.maxStates || 100;
    this.stateTimeout = options.stateTimeout || 300000; // 5 minutes
    this.cleanupInterval = options.cleanupInterval || 60000; // 1 minute
    this.listeners = new Map();

    // Start cleanup interval
    this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Create a new loading state
   */
  createState(id, metadata = {}) {
    if (this.states.size >= this.maxStates) {
      this.cleanup();
    }

    const state = {
      id,
      state: LoadingState.IDLE,
      startTime: Date.now(),
      endTime: null,
      metadata,
      error: null,
      progress: 0,
    };

    this.states.set(id, state);
    this.notifyListeners(id, state);

    return state;
  }

  /**
   * Update loading state
   */
  updateState(id, newState, error = null) {
    const state = this.states.get(id);
    if (!state) {
      throw new Error(`State ${id} not found`);
    }

    state.state = newState;
    state.error = error;

    if (newState === LoadingState.SUCCESS || newState === LoadingState.ERROR || newState === LoadingState.CANCELLED) {
      state.endTime = Date.now();
    }

    this.notifyListeners(id, state);
    return state;
  }

  /**
   * Get loading state
   */
  getState(id) {
    return this.states.get(id);
  }

  /**
   * Get all loading states
   */
  getAllStates() {
    return Array.from(this.states.values());
  }

  /**
   * Get states by status
   */
  getStatesByStatus(status) {
    return Array.from(this.states.values()).filter(s => s.state === status);
  }

  /**
   * Update progress for a state
   */
  updateProgress(id, progress, message = null) {
    const state = this.states.get(id);
    if (!state) {
      throw new Error(`State ${id} not found`);
    }

    state.progress = Math.max(0, Math.min(100, progress));
    if (message) {
      state.metadata.message = message;
    }

    this.progress.set(id, {
      progress: state.progress,
      message: state.metadata.message,
      timestamp: Date.now(),
    });

    this.notifyListeners(id, state);
    return state;
  }

  /**
   * Get progress for a state
   */
  getProgress(id) {
    return this.progress.get(id);
  }

  /**
   * Delete a loading state
   */
  deleteState(id) {
    const deleted = this.states.delete(id);
    this.progress.delete(id);
    return deleted;
  }

  /**
   * Add state change listener
   */
  addListener(id, callback) {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, []);
    }
    this.listeners.get(id).push(callback);
  }

  /**
   * Remove state change listener
   */
  removeListener(id, callback) {
    const callbacks = this.listeners.get(id);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify listeners of state change
   */
  notifyListeners(id, state) {
    const callbacks = this.listeners.get(id) || [];
    for (const callback of callbacks) {
      try {
        callback(state);
      } catch (error) {
        console.error(`[Loading State] Listener error for ${id}:`, error);
      }
    }
  }

  /**
   * Cleanup expired states
   */
  cleanup() {
    const now = Date.now();
    const toDelete = [];

    for (const [id, state] of this.states) {
      // Delete states that are completed and older than timeout
      if (
        (state.state === LoadingState.SUCCESS ||
         state.state === LoadingState.ERROR ||
         state.state === LoadingState.CANCELLED) &&
        state.endTime &&
        now - state.endTime > this.stateTimeout
      ) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.deleteState(id);
    }

    if (toDelete.length > 0) {
      console.log(`[Loading State] Cleaned up ${toDelete.length} expired states`);
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const states = this.getAllStates();
    const byStatus = {};

    for (const status of Object.values(LoadingState)) {
      byStatus[status] = states.filter(s => s.state === status).length;
    }

    const avgDuration = states
      .filter(s => s.endTime)
      .reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / (states.filter(s => s.endTime).length || 1);

    return {
      totalStates: states.length,
      byStatus,
      averageDuration: Math.round(avgDuration),
      maxStates: this.maxStates,
    };
  }

  /**
   * Destroy the manager
   */
  destroy() {
    clearInterval(this.cleanupTimer);
    this.states.clear();
    this.progress.clear();
    this.listeners.clear();
  }
}

/**
 * Async Operation Tracker
 * Wraps async operations with loading state tracking
 */
export class AsyncOperationTracker {
  constructor(loadingStateManager) {
    this.manager = loadingStateManager;
  }

  /**
   * Track an async operation
   */
  async track(id, operation, options = {}) {
    const { metadata = {}, progressCallback = null } = options;

    // Create state
    this.manager.createState(id, metadata);

    try {
      // Update to loading
      this.manager.updateState(id, LoadingState.LOADING);

      // Execute operation with progress tracking
      const result = await operation((progress, message) => {
        this.manager.updateProgress(id, progress, message);
        if (progressCallback) {
          progressCallback(progress, message);
        }
      });

      // Update to success
      this.manager.updateState(id, LoadingState.SUCCESS);
      return result;
    } catch (error) {
      // Update to error
      this.manager.updateState(id, LoadingState.ERROR, error.message);
      throw error;
    }
  }

  /**
   * Cancel an operation
   */
  cancel(id) {
    this.manager.updateState(id, LoadingState.CANCELLED);
  }
}

// Global instance
let loadingStateManager = null;
let asyncOperationTracker = null;

/**
 * Initialize loading state manager
 */
export function initializeLoadingStateManager(options = {}) {
  loadingStateManager = new LoadingStateManager(options);
  asyncOperationTracker = new AsyncOperationTracker(loadingStateManager);

  console.log('[SWEObeyMe] Loading state manager initialized');
  return {
    loadingStateManager,
    asyncOperationTracker,
  };
}

/**
 * Get loading state manager
 */
export function getLoadingStateManager() {
  if (!loadingStateManager || !asyncOperationTracker) {
    throw new Error('Loading state manager not initialized. Call initializeLoadingStateManager first.');
  }

  return {
    loadingStateManager,
    asyncOperationTracker,
  };
}
