# VSCode Webview API: Persistence and retainContextWhenHidden

**Source:** https://code.visualstudio.com/api/extension-guides/webview

## Visibility and Moving

When a webview panel is moved into a background tab, it becomes hidden. It is not destroyed however. VS Code will automatically restore the webview's content from `webview.html` when the panel is brought to the foreground again.

The `.visible` property tells you if the webview panel is currently visible or not.

Extensions can programmatically bring a webview panel to the foreground by calling `reveal()`.

### onDidChangeViewState Event

Whenever a webview's visibility changes, or when a webview is moved into a new column, the `onDidChangeViewState` event is fired. Extensions can use this event to change content based on which column the webview is showing in.

## Persistence

### getState and setState

Webviews can save and restore state using `webview.getState()` and `webview.setState()`. This state is persisted across sessions and can be used to restore the webview's previous state.

### Serialization

State must be serializable (JSON.stringify). Complex objects need to be serialized properly.

### retainContextWhenHidden

For webviews with very complex UI or state that cannot be quickly saved and restored, you can use the `retainContextWhenHidden` option. This option makes a webview keep its content around but in a hidden state, even when the webview itself is no longer in the foreground.

#### Behavior

With `retainContextWhenHidden`:
- The webview acts similarly to a background tab in a web browser
- Scripts and other dynamic content keep running even when the tab is not active or visible
- You can send messages to a hidden webview when `retainContextWhenHidden` is enabled
- The counter does not reset when the webview is hidden and then restored

#### Important Warning

Although `retainContextWhenHidden` may be appealing, keep in mind that this has **high memory overhead** and should only be used when other persistence techniques will not work.

## Known Bugs

Based on GitHub issues research:

1. **Issue #106693**: Webview refreshes to previous state after clicking another open editor
   - With `retainContextWhenHidden: true`, webview refreshes to initial state when Settings UI opens and user clicks back
   - This is a VSCode bug, not an extension bug

2. **Issue #113188**: Switching back and forth in WebView View with retainContextWhenHidden causes ghost renders
   - Previous render remains (only render, not HTML/DOM) and overlaps with new render
   - Does not occur if `retainContextWhenHidden=false`

## Recommended Approach

For SWEObeyMe cockpit:

1. **Disable retainContextWhenHidden** - use proper state persistence instead
2. **Use getState/setState** for webview-specific state
3. **Use extension context globalState** for persistent state (already implemented in state-persistence.js)
4. **Listen to onDidChangeViewState** to detect visibility changes
5. **Restore state manually** when webview becomes visible again

## Implementation Plan

1. Remove `retainContextWhenHidden: true` from the webview view provider registration
2. Add `onDidChangeViewState` listener to the webview
3. When webview becomes visible, restore state from globalState
4. Ensure all state changes are persisted to globalState
5. Test that cockpit state persists correctly when Settings UI opens
