# UI Debugging & Troubleshooting

## Overview

This document covers CSS debugging, Layout debugging, React devtools, Performance profiling, Accessibility debugging, and Event flow debugging. These concepts enable MasterControl to become a UI debugger.

## CSS Debugging

### CSS Debugging Tools

- **Browser DevTools**: Chrome DevTools
- **Firefox DevTools**: Firefox Developer Tools
- **Safari Web Inspector**: Safari Web Inspector
- **Edge DevTools**: Edge DevTools

### CSS Debugging Techniques

#### Computed Styles

```javascript
const element = document.querySelector('.element');
const computed = window.getComputedStyle(element);
console.log(computed.color);
```

#### CSS Specificity

```javascript
function getSpecificity(selector) {
  const specificity = [0, 0, 0];
  const idRegex = /#/g;
  const classRegex = /\./g;
  const elementRegex = /[a-z]/gi;
  
  specificity[0] = (selector.match(idRegex) || []).length;
  specificity[1] = (selector.match(classRegex) || []).length;
  specificity[2] = (selector.match(elementRegex) || []).length;
  
  return specificity;
}
```

#### CSS Inheritance

```javascript
function isInherited(property, element) {
  const computed = window.getComputedStyle(element);
  return computed.getPropertyValue(property) !== '';
}
```

### Common CSS Issues

- **Specificity**: Specificity conflicts
- **Cascade**: Cascade order
- **Box Model**: Box model issues
- **Z-Index**: Z-index stacking
- **Overflow**: Overflow issues

## Layout Debugging

### Layout Debugging Tools

- **Chrome DevTools**: Layout panel
- **Firefox Layout Inspector**: Layout inspector
- **Edge DevTools**: Layout tools

### Layout Debugging Techniques

#### Box Model

```javascript
const element = document.querySelector('.element');
const rect = element.getBoundingClientRect();
console.log({
  width: rect.width,
  height: rect.height,
  top: rect.top,
  left: rect.left,
});
```

#### Flexbox Debugging

```javascript
const element = document.querySelector('.flex-container');
const computed = window.getComputedStyle(element);
console.log({
  display: computed.display,
  flexDirection: computed.flexDirection,
  alignItems: computed.alignItems,
  justifyContent: computed.justifyContent,
});
```

#### Grid Debugging

```javascript
const element = document.querySelector('.grid-container');
const computed = window.getComputedStyle(element);
console.log({
  display: computed.display,
  gridTemplateColumns: computed.gridTemplateColumns,
  gridTemplateRows: computed.gridTemplateRows,
  gap: computed.gap,
});
```

### Common Layout Issues

- **Flexbox**: Flexbox alignment
- **Grid**: Grid placement
- **Positioning**: Positioning context
- **Overflow**: Overflow behavior
- **Responsive**: Responsive breakpoints

## React DevTools

### React DevTools Features

- **Components**: Component tree
- **Props**: Component props
- **State**: Component state
- **Hooks**: Hooks debugging
- **Profiler**: Performance profiling

### React Debugging Techniques

#### Component Props

```jsx
function Component({ data }) {
  console.log('Component props:', data);
  return <div>{data}</div>;
}
```

#### Component State

```jsx
function Component() {
  const [count, setCount] = useState(0);
  console.log('Component state:', count);
  return <div>{count}</div>;
}
```

#### Hooks Debugging

```jsx
function Component() {
  const [data, setData] = useState(null);
  const fetchData = useCallback(async () => {
    const result = await fetch('/api');
    setData(result);
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return <div>{JSON.stringify(data)}</div>;
}
```

### Common React Issues

- **Re-renders**: Unnecessary re-renders
- **State**: State management
- **Props**: Props drilling
- **Effects**: Effect dependencies
- **Performance**: Performance issues

## Performance Profiling

### Performance Profiling Tools

- **Chrome DevTools**: Performance panel
- **React Profiler**: React Profiler
- **Lighthouse**: Lighthouse
- **WebPageTest**: WebPageTest

### Performance Profiling Techniques

#### Performance API

```javascript
const performance = window.performance;
const navigation = performance.getEntriesByType('navigation')[0];
console.log({
  domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
  loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
});
```

#### React Profiler

```jsx
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  console.log({ id, phase, actualDuration });
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <Component />
    </Profiler>
  );
}
```

#### Web Vitals

```javascript
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getLCP(console.log);
```

### Common Performance Issues

- **Large Bundle**: Large bundle size
- **Slow Render**: Slow render time
- **Memory Leak**: Memory leaks
- **Layout Thrashing**: Layout thrashing
- **Network**: Network issues

## Accessibility Debugging

### Accessibility Debugging Tools

- **axe DevTools**: axe DevTools
- **Lighthouse**: Lighthouse
- **WAVE**: WAVE
- **Screen Reader**: Screen readers

### Accessibility Debugging Techniques

#### ARIA Attributes

```javascript
const element = document.querySelector('[aria-label]');
console.log(element.getAttribute('aria-label'));
```

#### Focus Management

```javascript
const focusableElements = document.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
console.log(focusableElements);
```

#### Keyboard Navigation

```javascript
document.addEventListener('keydown', (e) => {
  console.log('Key pressed:', e.key);
});
```

### Common Accessibility Issues

- **Contrast**: Poor contrast
- **Labels**: Missing labels
- **Focus**: Focus management
- **ARIA**: ARIA misuse
- **Keyboard**: Keyboard navigation

## Event Flow Debugging

### Event Flow Debugging Tools

- **Chrome DevTools**: Event listeners panel
- **React DevTools**: Event debugging
- **Console**: Console logging

### Event Flow Debugging Techniques

#### Event Logging

```javascript
element.addEventListener('click', (e) => {
  console.log('Event:', e);
  console.log('Target:', e.target);
  console.log('Current Target:', e.currentTarget);
});
```

#### Event Propagation

```javascript
element.addEventListener('click', (e) => {
  console.log('Capture phase');
}, true);

element.addEventListener('click', (e) => {
  console.log('Bubble phase');
});
```

#### React Events

```jsx
function Component() {
  const handleClick = (e) => {
    console.log('React event:', e);
    console.log('Native event:', e.nativeEvent);
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

### Common Event Issues

- **Propagation**: Event propagation
- **Delegation**: Event delegation
- **Memory**: Memory leaks
- **Timing**: Event timing
- **State**: Event state

## Best Practices

### Debugging

- **Systematic': Systematic debugging
- **Tools': Use debugging tools
- **Logging': Use logging
- **Testing': Test fixes
- **Document': Document findings

### Performance

- **Profile': Profile performance
- **Optimize': Optimize bottlenecks
- **Monitor': Monitor performance
- **Test': Test performance
- **Iterate': Iterate improvements

### Accessibility

- **Test': Test accessibility
- **Tools': Use accessibility tools
- **Guidelines': Follow guidelines
- **Fix': Fix issues
- **Monitor': Monitor accessibility
