# UI Anti-Patterns

## Overview

This document covers Over-nesting, Uncontrolled re-renders, Layout thrashing, Poor contrast, Hidden interactions, and Confusing affordances. These concepts enable MasterControl to prevent bad UI before it happens.

## Over-nesting

### Problem

- **Deep Nesting**: Deeply nested components
- **Complexity**: Increased complexity
- **Performance**: Performance issues
- **Maintainability**: Hard to maintain

### Examples

#### Bad: Deep Nesting

```jsx
function App() {
  return (
    <div>
      <div>
        <div>
          <div>
            <div>
              <Content />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Good: Flat Structure

```jsx
function App() {
  return <Content />;
}
```

### Solutions

- **Flatten**: Flatten component structure
- **Extract**: Extract components
- **Compose**: Compose components
- **Simplify**: Simplify structure

## Uncontrolled Re-renders

### Problem

- **Unnecessary**: Unnecessary re-renders
- **Performance**: Performance issues
- **Battery**: Battery drain
- **UX**: Poor UX

### Examples

#### Bad: Unnecessary Re-renders

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  return (
    <div>
      <Child />
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <input onChange={e => setName(e.target.value)} />
    </div>
  );
}

function Child() {
  console.log('Child re-rendered');
  return <div>Child</div>;
}
```

#### Good: Memoized

```jsx
const Child = React.memo(function Child() {
  console.log('Child re-rendered');
  return <div>Child</div>;
});
```

### Solutions

- **Memoize**: Use React.memo
- **UseMemo**: Use useMemo
- **UseCallback**: Use useCallback
- **State**: Lift state appropriately

## Layout Thrashing

### Problem

- **Reflows**: Forced reflows
- **Performance**: Performance issues
- **Jank**: Janky animations
- **Battery**: Battery drain

### Examples

#### Bad: Layout Thrashing

```javascript
function animate() {
  for (let i = 0; i < 100; i++) {
    element.style.width = i + 'px';
    const height = element.offsetHeight; // Forces reflow
  }
}
```

#### Good: Batched

```javascript
function animate() {
  const styles = [];
  for (let i = 0; i < 100; i++) {
    styles.push(i + 'px');
  }
  element.style.width = styles.join(',');
}
```

### Solutions

- **Batch**: Batch DOM reads/writes
- **RequestAnimationFrame**: Use requestAnimationFrame
- **Transform**: Use transform instead of layout properties
- **Will-change**: Use will-change sparingly

## Poor Contrast

### Problem

- **Readability**: Poor readability
- **Accessibility**: Accessibility issues
- **UX**: Poor UX
- **Legal**: Legal issues

### Examples

#### Bad: Poor Contrast

```css
.text {
  color: #cccccc;
  background-color: #ffffff;
}
```

#### Good: Good Contrast

```css
.text {
  color: #000000;
  background-color: #ffffff;
}
```

### Solutions

- **Test**: Test contrast ratios
- **Tools**: Use contrast tools
- **Guidelines**: Follow WCAG guidelines
- **Default**: Use high contrast defaults

## Hidden Interactions

### Problem

- **Discoverability**: Poor discoverability
- **Usability**: Poor usability
- **Frustration**: User frustration
- **Support**: Increased support

### Examples

#### Bad: Hidden Interactions

```jsx
function Card({ onEdit }) {
  return (
    <div onDoubleClick={onEdit}>
      Double click to edit
    </div>
  );
}
```

#### Good: Visible Interactions

```jsx
function Card({ onEdit }) {
  return (
    <div>
      <Content />
      <button onClick={onEdit}>Edit</button>
    </div>
  );
}
```

### Solutions

- **Visible**: Make interactions visible
- **Affordances**: Use affordances
- **Labels**: Label interactions
- **Feedback**: Provide feedback

## Confusing Affordances

### Problem

- **Usability**: Poor usability
- **Errors**: User errors
- **Frustration**: User frustration
- **Support**: Increased support

### Examples

#### Bad: Confusing Affordances

```jsx
function Button({ onClick }) {
  return <div onClick={onClick}>Click me</div>;
}
```

#### Good: Clear Affordances

```jsx
function Button({ onClick }) {
  return <button onClick={onClick}>Click me</button>;
}
```

### Solutions

- **Standard**: Use standard elements
- **Affordances**: Use affordances
- **Consistent**: Be consistent
- **Test**: Test with users

## Other Anti-Patterns

### Magic Numbers

```css
/* Bad */
.button {
  padding: 12px 24px;
}

/* Good */
.button {
  padding: var(--spacing-3) var(--spacing-6);
}
```

### Inline Styles

```jsx
/* Bad */
<div style={{ color: 'red' }}>Error</div>

/* Good */
<div className="error">Error</div>
```

### Div Soup

```jsx
/* Bad */
<div>
  <div>
    <div>
      <div>Content</div>
    </div>
  </div>
</div>

/* Good */
<section>Content</section>
```

## Best Practices

### Performance

- **Optimize**: Optimize re-renders
- **Memoize**: Memoize components
- **Batch**: Batch operations
- **Profile**: Profile performance

### Accessibility

- **Contrast**: Ensure contrast
- **Semantic**: Use semantic HTML
- **Keyboard**: Support keyboard
- **Test**: Test accessibility

### UX

- **Visible': Make interactions visible
- **Affordances': Use affordances
- **Feedback': Provide feedback
- **Test': Test with users

### Code Quality

- **Structure**: Good structure
- **Naming': Good naming
- **Consistent': Be consistent
- **Documented': Document code
