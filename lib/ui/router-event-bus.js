/**
 * Router Event Bus
 *
 * Responsibility: Decoupled event bus for governance router events.
 * Breaks circular dependency between cockpit-provider and governance-router-handler.
 *
 * @module lib/ui/router-event-bus
 */

/** @type {Function|null} Registered listener from cockpit provider */
let _listener = null;

/**
 * Register the cockpit listener
 * @param {Function} listener - (event: object) => void
 */
export function registerRouterEventListener(listener) {
  _listener = listener;
}

/**
 * Unregister the cockpit listener
 */
export function unregisterRouterEventListener() {
  _listener = null;
}

/**
 * Emit a router event to any registered listener (non-blocking, never throws)
 * @param {object} event
 */
export function pushRouterEvent(event) {
  if (_listener) {
    try {
      _listener(event);
    } catch {
      // Event bus must never throw
    }
  }
}
