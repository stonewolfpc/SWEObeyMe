# Animation & Motion Design

## Overview

This document covers CSS transitions, CSS animations, FLIP technique, Framer Motion, Easing curves, Micro-interactions, and Motion guidelines. These concepts enable MasterControl to design delightful UI, not static UI.

## CSS Transitions

### Basic Transitions

```css
.button {
  background-color: blue;
  transition: background-color 0.3s ease;
}

.button:hover {
  background-color: darkblue;
}
```

### Transition Properties

- **transition-property**: Property to animate
- **transition-duration**: Animation duration
- **transition-timing-function**: Easing function
- **transition-delay**: Delay before animation

### Transition Shorthand

```css
.button {
  transition: background-color 0.3s ease, transform 0.3s ease;
}
```

### Multiple Transitions

```css
.button {
  transition:
    background-color 0.3s ease,
    transform 0.3s ease,
    box-shadow 0.3s ease;
}
```

## CSS Animations

### Keyframe Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 0.3s ease;
}
```

### Animation Properties

- **animation-name**: Animation name
- **animation-duration**: Animation duration
- **animation-timing-function**: Easing function
- **animation-delay**: Delay before animation
- **animation-iteration-count**: Number of iterations
- **animation-direction**: Animation direction
- **animation-fill-mode**: Fill mode
- **animation-play-state**: Play/pause state

### Animation Shorthand

```css
.fade-in {
  animation: fadeIn 0.3s ease forwards;
}
```

### Complex Animations

```css
@keyframes slideIn {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(0);
  }
}

.slide-in {
  animation: slideIn 0.5s ease-out;
}
```

## FLIP Technique

### Concept

- **First**: Record initial position
- **Last**: Record final position
- **Invert**: Calculate delta
- **Play**: Animate from inverted to final

### Implementation

```javascript
function flip(element) {
  const first = element.getBoundingClientRect();
  
  // Make changes
  element.classList.add('active');
  
  const last = element.getBoundingClientRect();
  
  const delta = {
    x: first.left - last.left,
    y: first.top - last.top,
  };
  
  element.style.transform = `translate(${delta.x}px, ${delta.y}px)`;
  
  element.style.transition = 'transform 0.3s ease';
  
  requestAnimationFrame(() => {
    element.style.transform = '';
  });
}
```

### Use Cases

- **Layout Changes**: Animate layout changes
- **Reordering**: Animate item reordering
- **Expanding**: Animate expanding elements

## Framer Motion

### Basic Animation

```jsx
import { motion } from 'framer-motion';

function AnimatedBox() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    />
  );
}
```

### Variants

```jsx
const variants = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0 },
};

function AnimatedList() {
  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      variants={variants}
    >
      <motion.li variants={variants}>Item 1</motion.li>
      <motion.li variants={variants}>Item 2</motion.li>
    </motion.ul>
  );
}
```

### Gestures

```jsx
function DraggableBox() {
  return (
    <motion.div
      drag
      dragConstraints={{ left: -100, right: 100 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    />
  );
}
```

### Animate Presence

```jsx
import { AnimatePresence } from 'framer-motion';

function Modal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}
    </AnimatePresence>
  );
}
```

## Easing Curves

### Common Easing Functions

- **linear**: Constant speed
- **ease**: Slow start and end
- **ease-in**: Slow start
- **ease-out**: Slow end
- **ease-in-out**: Slow start and end
- **cubic-bezier**: Custom bezier curve

### Custom Easing

```css
.custom-ease {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Easing Libraries

- **easings.net**: Easing visualization
- **cubic-bezier.com**: Bezier curve generator
- **Material Design**: Material easing curves

### Material Easing Curves

- **Standard**: cubic-bezier(0.4, 0.0, 0.2, 1)
- **Decelerated**: cubic-bezier(0.0, 0.0, 0.2, 1)
- **Accelerated**: cubic-bezier(0.4, 0.0, 1, 1)
- **Sharp**: cubic-bezier(0.4, 0.0, 0.6, 1)

## Micro-interactions

### Button Interactions

```css
.button {
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
```

### Input Interactions

```css
.input {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input:focus {
  border-color: blue;
  box-shadow: 0 0 0 3px rgba(0, 0, 255, 0.2);
}
```

### Card Interactions

```css
.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}
```

## Motion Guidelines

### Material Motion

- **Duration**: Use appropriate durations
- **Easing**: Use Material easing curves
- **Choreography**: Coordinate animations
- **Meaningful**: Animations should have meaning

### Duration Guidelines

- **Micro-interactions**: 100-200ms
- **Element entry**: 200-500ms
- **Layout changes**: 300-500ms
- **Page transitions**: 300-500ms

### Performance

- **GPU**: Use GPU-accelerated properties
- **Will-change**: Use will-change sparingly
- **Reduce**: Reduce animation complexity
- **Test**: Test performance

### Accessibility

- **Respect**: Respect prefers-reduced-motion
- **Disable**: Disable animations when requested
- **Provide**: Provide alternatives

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Best Practices

### Animation

- **Purposeful': Make animations purposeful
- **Performant': Keep animations performant
- **Accessible': Respect accessibility preferences
- **Consistent': Keep animations consistent

### Performance

- **GPU': Use GPU-accelerated properties
- **Transform': Use transform instead of layout properties
- **Opacity': Use opacity instead of display
- **Will-change': Use will-change sparingly

### Accessibility

- **Respect': Respect prefers-reduced-motion
- **Focus': Don't move focus during animation
- **Skip': Allow users to skip animations
- **Alternative': Provide non-animated alternative
