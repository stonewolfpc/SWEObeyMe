# Layout Systems & Responsive Design

## Overview

This document covers CSS Grid, Flexbox, Intrinsic design, Container queries, Responsive breakpoints, Mobile-first vs content-first, and Adaptive layouts. These concepts enable MasterControl to reason about layout like a senior frontend engineer.

## CSS Grid

### Grid Basics

#### Grid Container

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
```

#### Grid Items

```css
.item {
  grid-column: span 2;
  grid-row: span 1;
}
```

### Grid Template Columns

#### Fixed Columns

```css
.grid {
  grid-template-columns: 200px 200px 200px;
}
```

#### Fractional Units

```css
.grid {
  grid-template-columns: 1fr 2fr 1fr;
}
```

#### Repeat Function

```css
.grid {
  grid-template-columns: repeat(3, 1fr);
}
```

#### Auto-fit and Auto-fill

```css
.grid {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
```

### Grid Template Rows

#### Fixed Rows

```css
.grid {
  grid-template-rows: 100px auto 100px;
}
```

#### Auto Rows

```css
.grid {
  grid-template-rows: auto;
}
```

### Grid Gap

```css
.grid {
  gap: 20px;
  row-gap: 20px;
  column-gap: 20px;
}
```

### Grid Areas

#### Named Areas

```css
.grid {
  grid-template-areas:
    "header header header"
    "sidebar main main"
    "footer footer footer";
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }
```

### Grid Alignment

#### Justify Items

```css
.grid {
  justify-items: start; /* center, end, stretch */
}
```

#### Align Items

```css
.grid {
  align-items: start; /* center, end, stretch */
}
```

#### Justify Content

```css
.grid {
  justify-content: start; /* center, end, space-between, space-around, space-evenly */
}
```

#### Align Content

```css
.grid {
  align-content: start; /* center, end, space-between, space-around, space-evenly */
}
```

## Flexbox

### Flex Container

```css
.container {
  display: flex;
  flex-direction: row;
  gap: 20px;
}
```

### Flex Direction

```css
.container {
  flex-direction: row; /* column, row-reverse, column-reverse */
}
```

### Flex Wrap

```css
.container {
  flex-wrap: wrap; /* nowrap, wrap-reverse */
}
```

### Justify Content

```css
.container {
  justify-content: flex-start; /* flex-end, center, space-between, space-around, space-evenly */
}
```

### Align Items

```css
.container {
  align-items: stretch; /* flex-start, flex-end, center, baseline */
}
```

### Align Content

```css
.container {
  align-content: flex-start; /* flex-end, center, space-between, space-around, space-evenly */
}
```

### Flex Items

#### Flex Grow

```css
.item {
  flex-grow: 1;
}
```

#### Flex Shrink

```css
.item {
  flex-shrink: 0;
}
```

#### Flex Basis

```css
.item {
  flex-basis: auto; /* or specific value */
}
```

#### Flex Shorthand

```css
.item {
  flex: 1 0 auto; /* grow shrink basis */
}
```

### Gap

```css
.container {
  gap: 20px;
  row-gap: 20px;
  column-gap: 20px;
}
```

## Intrinsic Design

### Concept

- **Fluid**: Fluid layouts that adapt
- **Intrinsic**: Content-driven layouts
- **Responsive**: Responsive to viewport
- **Clamp**: Use clamp() for values

### Clamp Function

```css
.text {
  font-size: clamp(1rem, 2.5vw, 2rem);
}
```

### Fluid Typography

```css
html {
  font-size: clamp(16px, 2.5vw, 24px);
}
```

### Fluid Spacing

```css
.container {
  padding: clamp(1rem, 5vw, 3rem);
}
```

### Fluid Grid

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: clamp(1rem, 3vw, 2rem);
}
```

## Container Queries

### Container Query Basics

```css
.container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

### Container Names

```css
.container {
  container-type: inline-size;
  container-name: card-container;
}

@container card-container (min-width: 400px) {
  .card {
    /* styles */
  }
}
```

### Container Query Units

- **cqw**: Container query width
- **cqh**: Container query height
- **cqi**: Container query inline size
- **cqb**: Container query block size

```css
@container (min-width: 400px) {
  .text {
    font-size: 2cqw;
  }
}
```

### Use Cases

- **Cards**: Card layouts
- **Navigation**: Navigation components
- **Grids**: Grid layouts
- **Components**: Component-level responsiveness

## Responsive Breakpoints

### Common Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  /* styles */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* styles */
}

/* Desktop */
@media (min-width: 1025px) {
  /* styles */
}
```

### Tailwind Breakpoints

```css
/* sm: 640px */
@media (min-width: 640px) {
  /* styles */
}

/* md: 768px */
@media (min-width: 768px) {
  /* styles */
}

/* lg: 1024px */
@media (min-width: 1024px) {
  /* styles */
}

/* xl: 1280px */
@media (min-width: 1280px) {
  /* styles */
}

/* 2xl: 1536px */
@media (min-width: 1536px) {
  /* styles */
}
```

### Material Design Breakpoints

```css
/* xs: 0px */
@media (min-width: 0px) {
  /* styles */
}

/* sm: 600px */
@media (min-width: 600px) {
  /* styles */
}

/* md: 960px */
@media (min-width: 960px) {
  /* styles */
}

/* lg: 1280px */
@media (min-width: 1280px) {
  /* styles */
}

/* xl: 1920px */
@media (min-width: 1920px) {
  /* styles */
}
```

## Mobile-First vs Content-First

### Mobile-First

#### Concept

- **Start Mobile**: Design for mobile first
- **Progressive Enhancement**: Add features for larger screens
- **Performance**: Better performance on mobile
- **User Experience**: Focus on core content

#### Example

```css
/* Mobile first */
.container {
  padding: 1rem;
}

/* Tablet */
@media (min-width: 640px) {
  .container {
    padding: 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
}
```

### Content-First

#### Concept

- **Content First**: Design based on content
- **Intrinsic**: Intrinsic web design
- **Adaptive**: Adapt to content
- **Flexible**: Flexible layouts

#### Example

```css
.card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: clamp(1rem, 3vw, 2rem);
}
```

### Comparison

- **Mobile-First**: Progressive enhancement
- **Content-First**: Intrinsic design
- **Hybrid**: Combine both approaches
- **Best**: Use both when appropriate

## Adaptive Layouts

### Adaptive vs Responsive

- **Responsive**: Fluid layouts, media queries
- **Adaptive**: Fixed breakpoints, device detection
- **Hybrid**: Combine both approaches

### Adaptive Patterns

#### Layout Switching

```css
/* Mobile */
.layout {
  display: block;
}

/* Desktop */
@media (min-width: 1024px) {
  .layout {
    display: grid;
    grid-template-columns: 250px 1fr;
  }
}
```

#### Component Adaptation

```css
/* Mobile */
.card {
  flex-direction: column;
}

/* Desktop */
@media (min-width: 640px) {
  .card {
    flex-direction: row;
  }
}
```

### Device Detection

#### JavaScript Detection

```javascript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isTablet = /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent);
const isDesktop = !isMobile && !isTablet;
```

#### CSS Detection

```css
@supports (hover: hover) {
  /* Hover-capable device */
}

@supports not (hover: hover) {
  /* Touch device */
}
```

## Layout Patterns

### Holy Grail Layout

```css
.holy-grail {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 250px 1fr 250px;
  grid-template-areas:
    "header header header"
    "sidebar main ads"
    "footer footer footer";
  min-height: 100vh;
}
```

### Sidebar Layout

```css
.sidebar-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
  }
}
```

### Masonry Layout

```css
.masonry {
  column-count: 3;
  column-gap: 20px;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 20px;
}
```

### Card Grid

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
```

## Best Practices

### Responsive Design

- **Mobile-First**: Design mobile-first
- **Breakpoints**: Use meaningful breakpoints
- **Fluid**: Use fluid layouts
- **Test**: Test on real devices
- **Performance**: Optimize for performance

### Layout Systems

- **Grid**: Use Grid for 2D layouts
- **Flexbox**: Use Flexbox for 1D layouts
- **Combination**: Combine Grid and Flexbox
- **Fallback**: Provide fallbacks
- **Browser Support**: Check browser support

### Performance

- **Critical CSS**: Inline critical CSS
- **Lazy Load**: Lazy load images
- **Font Loading**: Optimize font loading
- **Images**: Optimize images
- **Code Splitting**: Split code by route

### Accessibility

- **Semantic**: Use semantic HTML
- **Keyboard**: Ensure keyboard navigation
- **Screen Reader**: Test with screen readers
- **Color**: Ensure color contrast
- **Focus**: Manage focus properly
