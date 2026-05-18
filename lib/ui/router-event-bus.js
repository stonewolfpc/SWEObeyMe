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

/** @type {Array} Event queue for events that arrive before listener registers */
const _eventQueue = [];

/** Maximum events to queue before dropping old ones */
const MAX_QUEUE_SIZE = 100;

/**
 * Register the cockpit listener
 * Replays any queued events to the new listener.
 * @param {Function} listener - (event: object) => void
 */
export function registerRouterEventListener(listener) {
  _listener = listener;

  // Replay queued events to the new listener
  while (_eventQueue.length > 0) {
    const event = _eventQueue.shift();
    try {
      _listener(event);
    } catch {
      // Event bus must never throw
    }
  }
}

/**
 * Unregister the cockpit listener
 */
export function unregisterRouterEventListener() {
  _listener = null;
}

/**
 * Emit a router event to any registered listener (non-blocking, never throws)
 * If no listener is registered, queues the event for later replay.
 * @param {object} event
 */
export function pushRouterEvent(event) {
  if (_listener) {
    try {
      _listener(event);
    } catch {
      // Event bus must never throw
    }
  } else {
    // Queue event for when listener registers
    _eventQueue.push(event);
    // Prevent unbounded growth
    if (_eventQueue.length > MAX_QUEUE_SIZE) {
      _eventQueue.shift();
    }
  }
}
