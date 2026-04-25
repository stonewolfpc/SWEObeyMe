# Frontend Performance Optimization

## Overview

This document covers Reconciliation & diffing, Virtual DOM vs signals, Render batching, Memoization, Lazy loading, Code splitting, Image optimization, and Web vitals. These concepts enable MasterControl to become a performance coach.

## Reconciliation & Diffing

### Virtual DOM

- **Concept**: Virtual representation of DOM
- **Diffing**: Compare virtual DOM trees
- **Patching**: Apply minimal changes
- **Efficiency**: Efficient updates

### React Reconciliation

#### Diffing Algorithm

- **Element Type**: Different type = replace
- **Same Type**: Update attributes
- **Children**: Recursively diff children
- **Keys**: Use keys for stable identity

```jsx
// Without keys
<ul>
  {items.map(item => <li>{item.name}</li>)}
</ul>

// With keys
<ul>
  {items.map(item => <li key={item.id}>{item.name}</li>)}
</ul>
```

#### Key Best Practices

- \*\*Stable': Use stable keys
- \*\*Unique': Use unique keys
- \*\*Index': Don't use index as key
- \*\*ID': Use IDs when available

## Virtual DOM vs Signals

### Virtual DOM

- **Pros**: Declarative, simple
- **Cons**: Overhead, batch updates
- \*\*Use Case': React, Vue

### Signals

- **Pros**: Fine-grained, no overhead
- \*\*Cons': Manual tracking
- \*\*Use Case': SolidJS, Preact, Angular

### Comparison

```javascript
// Virtual DOM (React)
const [count, setCount] = useState(0);
return <div>{count}</div>;

// Signals (SolidJS)
const [count, setCount] = createSignal(0);
return <div>{count()}</div>;
```

## Render Batching

### React Automatic Batching

```jsx
function handleClick() {
  setCount((c) => c + 1);
  setName('John');
  // Only one re-render
}
```

### Manual Batching

```jsx
import { unstable_batchedUpdates } from 'react-dom';

function handleClick() {
  unstable_batchedUpdates(() => {
    setCount((c) => c + 1);
    setName('John');
  });
}
```

### Concurrent Rendering

```jsx
import { startTransition } from 'react';

function handleClick() {
  startTransition(() => {
    setSearchQuery(query);
  });
}
```

## Memoization

### useMemo

```jsx
function ExpensiveComponent({ data }) {
  const sortedData = useMemo(() => {
    return data.sort((a, b) => a.id - b.id);
  }, [data]);

  return (
    <ul>
      {sortedData.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### useCallback

```jsx
function Parent() {
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);

  return <Child onClick={handleClick} />;
}
```

### React.memo

```jsx
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  // expensive computation
  return <div>{data}</div>;
});
```

## Lazy Loading

### React.lazy

```jsx
import React, { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Dynamic Import

```javascript
async function loadComponent() {
  const module = await import('./HeavyComponent');
  return module.default;
}
```

### Intersection Observer

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // Load lazy content
      observer.unobserve(entry.target);
    }
  });
});
```

## Code Splitting

### Route-Based Splitting

```jsx
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./Home'));
const About = lazy(() => import('./About'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Suspense>
  );
}
```

### Component-Based Splitting

```jsx
const Chart = lazy(() => import('./Chart'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && (
        <Suspense fallback={<div>Loading...</div>}>
          <Chart />
        </Suspense>
      )}
    </div>
  );
}
```

### Webpack SplitChunks

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};
```

## Image Optimization

### Responsive Images

```html
<img
  srcset="image-320w.jpg 320w, image-640w.jpg 640w, image-1280w.jpg 1280w"
  sizes="(max-width: 640px) 320px,
         (max-width: 1280px) 640px,
         1280px"
  src="image-1280w.jpg"
  alt="Description"
/>
```

### Lazy Loading Images

```html
<img loading="lazy" src="image.jpg" alt="Description" />
```

### Image Formats

- **WebP**: Modern format, good compression
- **AVIF**: Next-gen format, better compression
- **JPEG**: Good for photos
- **PNG**: Good for graphics with transparency
- **SVG**: Good for icons, logos

### Image CDNs

- **Cloudinary**: Image optimization CDN
- **Imgix**: Image processing CDN
- **Cloudflare**: Image CDN with optimization

## Web Vitals

### Core Web Vitals

#### LCP (Largest Contentful Paint)

- **Target**: < 2.5s
- **Measure**: Largest image or text block
- **Optimize**: Optimize images, lazy load, CDN

#### FID (First Input Delay)

- **Target**: < 100ms
- **Measure**: Time to first interaction
- **Optimize**: Reduce JavaScript, main thread work

#### CLS (Cumulative Layout Shift)

- **Target**: < 0.1
- **Measure**: Layout shifts
- **Optimize**: Reserve space for images, fonts

### Other Web Vitals

#### FCP (First Contentful Paint)

- **Target**: < 1.8s
- **Measure**: First content painted
- **Optimize**: Reduce render-blocking resources

#### TTFB (Time to First Byte)

- **Target**: < 600ms
- **Measure**: Time to first byte
- **Optimize**: Optimize server, CDN

#### TTI (Time to Interactive)

- \*\*Target': < 3.8s
- \*\*Measure': Time to interactive
- \*\*Optimize': Reduce JavaScript, optimize critical path

### Measuring Web Vitals

```javascript
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getLCP(console.log);
```

## Best Practices

### Rendering

- \*\*Memoize': Memoize expensive computations
- \*\*Batch': Batch updates
- \*\*Debounce': Debounce events
- \*\*Throttle': Throttle events

### Loading

- \*\*Lazy Load': Lazy load components
- \*\*Code Split': Split code by route
- \*\*Priority': Load critical resources first
- \*\*Preload': Preload important resources

### Images

- \*\*Optimize': Optimize images
- \*\*Lazy Load': Lazy load images
- \*\*Responsive': Use responsive images
- \*\*Modern': Use modern formats

### Performance Monitoring

- \*\*Measure': Measure performance
- \*\*Monitor': Monitor Web Vitals
- \*\*Analyze': Analyze performance
- \*\*Optimize': Optimize based on data
