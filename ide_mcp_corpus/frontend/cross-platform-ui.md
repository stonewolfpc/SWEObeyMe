# Cross-Platform UI Patterns

## Overview

This document covers Desktop vs mobile patterns, Touch vs pointer, Native vs web differences, Electron vs Tauri vs native, and Windows vs macOS UI conventions. These concepts enable MasterControl to adapt designs to any platform.

## Desktop vs Mobile Patterns

### Desktop Patterns

- **Mouse**: Mouse interactions
- **Keyboard**: Keyboard shortcuts
- **Large Screen**: Large screen real estate
- **Multi-Window**: Multi-window support
- **Hover**: Hover states
- **Right-Click**: Context menus

### Mobile Patterns

- **Touch**: Touch interactions
- **Gestures**: Swipe, pinch, long press
- **Small Screen**: Limited screen real estate
- **Single-Window**: Single-window apps
- **No Hover**: No hover states
- **Long-Press**: Context menus

### Adaptive Patterns

#### Responsive Design

```css
/* Mobile first */
.container {
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}
```

#### Component Adaptation

```jsx
function Button({ isMobile }) {
  return (
    <button className={isMobile ? 'mobile-button' : 'desktop-button'} onClick={onClick}>
      {children}
    </button>
  );
}
```

## Touch vs Pointer

### Touch Interactions

- **Tap**: Tap to activate
- **Double Tap**: Double tap to zoom/activate
- **Long Press**: Long press for context menu
- **Swipe**: Swipe to navigate
- **Pinch**: Pinch to zoom
- **Scroll**: Scroll with momentum

### Pointer Interactions

- **Click**: Click to activate
- **Double Click**: Double click to activate
- **Right Click**: Right click for context menu
- **Hover**: Hover for feedback
- **Scroll**: Scroll with scrollbar
- **Drag**: Drag to move

### Hybrid Patterns

```javascript
function handleInteraction(event) {
  if (event.pointerType === 'touch') {
    // Touch handling
  } else if (event.pointerType === 'mouse') {
    // Mouse handling
  }
}
```

### Touch Targets

- **Minimum**: Minimum 44x44 pixels
- **Spacing**: Spacing between targets
- **Feedback**: Visual feedback on touch
- **Prevent**: Prevent accidental touches

## Native vs Web Differences

### Native Advantages

- **Performance**: Better performance
- **Access**: Full device access
- **Offline**: Better offline support
- **UI**: Native UI components
- **Integration**: Deep OS integration

### Web Advantages

- **Cross-Platform**: Cross-platform
- **Updates**: Easy updates
- **Development**: Faster development
- **Cost**: Lower cost
- **Reach**: Wider reach

### Progressive Web Apps

- **Installable**: Installable
- **Offline**: Offline support
- **Push**: Push notifications
- **Shareable**: Shareable
- **Linkable**: Linkable

### Hybrid Approaches

- **WebView**: WebView wrapper
- **React Native**: React Native
- **Flutter**: Flutter
- **Electron**: Desktop web wrapper
- **Tauri**: Lightweight desktop wrapper

## Electron vs Tauri vs Native

### Electron

- **Pros**: Cross-platform, web tech, large ecosystem
- **Cons**: Heavy, large bundle size
- **Use Case**: Complex desktop apps

### Tauri

- **Pros**: Lightweight, secure, Rust-based
- **Cons**: Smaller ecosystem
- **Use Case**: Lightweight desktop apps

### Native

- **Pros**: Best performance, native UI
- **Cons**: Platform-specific, expensive
- **Use Case**: Performance-critical apps

### Comparison

| Feature        | Electron | Tauri | Native |
| -------------- | -------- | ----- | ------ |
| Bundle Size    | Large    | Small | Small  |
| Performance    | Good     | Great | Best   |
| Security       | Moderate | High  | High   |
| Development    | Fast     | Fast  | Slow   |
| Cross-Platform | Yes      | Yes   | No     |

## Windows vs macOS UI Conventions

### Windows Conventions

- **Title Bar**: Title bar with window controls
- **Ribbon**: Ribbon interface
- **Menu**: Menu bar at top of window
- **Taskbar**: Taskbar at bottom
- **Start Menu**: Start menu
- **Dialogs**: Modal dialogs
- **Shortcuts**: Ctrl-based shortcuts

### macOS Conventions

- **Title Bar**: Title bar with window controls
- **Toolbar**: Toolbar at top of window
- **Menu Bar**: Menu bar at top of screen
- **Dock**: Dock at bottom
- **Spotlight**: Spotlight search
- **Sheets**: Sheet dialogs
- **Shortcuts**: Cmd-based shortcuts

### Platform Detection

```javascript
const isWindows = navigator.platform.indexOf('Win') > -1;
const isMac = navigator.platform.indexOf('Mac') > -1;
const isLinux = navigator.platform.indexOf('Linux') > -1;
```

### Platform-Specific UI

```jsx
function WindowControls() {
  const isMac = navigator.platform.indexOf('Mac') > -1;

  if (isMac) {
    return (
      <div className="window-controls-mac">
        <button className="close" />
        <button className="minimize" />
        <button className="maximize" />
      </div>
    );
  }

  return (
    <div className="window-controls-windows">
      <button className="minimize" />
      <button className="maximize" />
      <button className="close" />
    </div>
  );
}
```

## Best Practices

### Cross-Platform

- **Responsive**: Design responsive
- **Adaptive**: Adapt to platform
- **Consistent**: Consistent experience
- **Native**: Respect platform conventions
- **Test**: Test on all platforms

### Touch

- **Targets**: Large touch targets
- **Feedback**: Provide feedback
- **Gestures**: Support gestures
- **Prevent**: Prevent accidental touches

### Desktop

- **Keyboard**: Support keyboard
- **Shortcuts**: Provide shortcuts
- **Mouse**: Support mouse
- **Hover**: Use hover states

### Platform-Specific

- **Conventions**: Follow platform conventions
- **UI**: Use platform UI patterns
- **Shortcuts**: Use platform shortcuts
- **Icons**: Use platform icons
