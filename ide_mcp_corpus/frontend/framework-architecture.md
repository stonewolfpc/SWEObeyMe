# Frontend Framework Architecture

## Overview

This document covers React component patterns, Vue composition patterns, Svelte reactivity, SolidJS fine-grained reactivity, Angular architecture, state management (Redux, Zustand, MobX, Pinia), and routing patterns. These concepts enable MasterControl to become a framework-agnostic UI architect.

## React Component Patterns

### Component Types

#### Functional Components

```jsx
function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}
```

#### Class Components

```jsx
class Button extends React.Component {
  render() {
    return <button onClick={this.props.onClick}>{this.props.children}</button>;
  }
}
```

### Component Patterns

#### Compound Components

```jsx
function Tabs({ children }) {
  return <div className="tabs">{children}</div>;
}

function TabList({ children }) {
  return <div className="tab-list">{children}</div>;
}

function Tab({ children }) {
  return <div className="tab">{children}</div>;
}

function TabPanel({ children }) {
  return <div className="tab-panel">{children}</div>;
}

// Usage
<Tabs>
  <TabList>
    <Tab>Tab 1</Tab>
    <Tab>Tab 2</Tab>
  </TabList>
  <TabPanel>Panel 1</TabPanel>
  <TabPanel>Panel 2</TabPanel>
</Tabs>;
```

#### Render Props

```jsx
function Mouse({ render }) {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  return (
    <div onMouseMove={(e) => setPosition({ x: e.clientX, y: e.clientY })}>{render(position)}</div>
  );
}

// Usage
<Mouse
  render={({ x, y }) => (
    <p>
      Position: {x}, {y}
    </p>
  )}
/>;
```

#### Higher-Order Components

```jsx
function withLoading(Component) {
  return function WithLoading({ isLoading, ...props }) {
    if (isLoading) {
      return <div>Loading...</div>;
    }
    return <Component {...props} />;
  };
}

// Usage
const ButtonWithLoading = withLoading(Button);
```

#### Custom Hooks

```jsx
function useCounter(initialValue = 0) {
  const [count, setCount] = React.useState(initialValue);

  const increment = () => setCount((c) => c + 1);
  const decrement = () => setCount((c) => c - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}

// Usage
function Counter() {
  const { count, increment, decrement, reset } = useCounter();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### State Management Patterns

#### Local State

```jsx
function Counter() {
  const [count, setCount] = React.useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

#### Context API

```jsx
const ThemeContext = React.createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = React.useState('light');

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

// Usage
function App() {
  return (
    <ThemeProvider>
      <Child />
    </ThemeProvider>
  );
}
```

#### Redux

```jsx
import { createStore } from 'redux';
import { Provider, useSelector, useDispatch } from 'react-redux';

// Action
const increment = () => ({ type: 'INCREMENT' });

// Reducer
function counterReducer(state = 0, action) {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    default:
      return state;
  }
}

// Store
const store = createStore(counterReducer);

// Component
function Counter() {
  const count = useSelector((state) => state);
  const dispatch = useDispatch();

  return <button onClick={() => dispatch(increment())}>{count}</button>;
}
```

#### Zustand

```jsx
import create from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// Usage
function Counter() {
  const { count, increment, decrement } = useStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  );
}
```

### Performance Patterns

#### Memoization

```jsx
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  // expensive computation
  return <div>{data}</div>;
});
```

#### useMemo

```jsx
function Component({ items }) {
  const sortedItems = React.useMemo(() => {
    return items.sort((a, b) => a.id - b.id);
  }, [items]);

  return (
    <ul>
      {sortedItems.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

#### useCallback

```jsx
function Component() {
  const handleClick = React.useCallback(() => {
    console.log('Clicked');
  }, []);

  return <button onClick={handleClick}>Click me</button>;
}
```

#### Code Splitting

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

## Vue Composition Patterns

### Composition API

#### Setup Function

```vue
<script setup>
import { ref, computed } from 'vue';

const count = ref(0);
const doubleCount = computed(() => count.value * 2);

function increment() {
  count.value++;
}
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>
```

#### Composables

```javascript
// useCounter.js
import { ref } from 'vue';

export function useCounter(initialValue = 0) {
  const count = ref(initialValue);

  const increment = () => count.value++;
  const decrement = () => count.value--;
  const reset = () => (count.value = initialValue);

  return { count, increment, decrement, reset };
}

// Usage
import { useCounter } from './useCounter';

const { count, increment, decrement, reset } = useCounter();
```

#### Provide/Inject

```javascript
// Parent
import { provide, ref } from 'vue';

const theme = ref('light');
provide('theme', theme);

// Child
import { inject } from 'vue';

const theme = inject('theme');
```

### State Management

#### Pinia

```javascript
// store.js
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
  }),
  actions: {
    increment() {
      this.count++;
    },
    decrement() {
      this.count--;
    },
  },
});

// Usage
import { useCounterStore } from './store';

const counter = useCounterStore();
counter.increment();
```

## Svelte Reactivity

### Reactive Variables

```svelte
<script>
let count = 0;

function increment() {
  count += 1;
}
</script>

<button on:click={increment}>
  Count: {count}
</button>
```

### Stores

#### Writable Store

```javascript
import { writable } from 'svelte/store';

export const count = writable(0);

export function increment() {
  count.update((n) => n + 1);
}

export function decrement() {
  count.update((n) => n - 1);
}
```

#### Readable Store

```javascript
import { readable, derived } from 'svelte/store';

const time = readable(new Date(), (set) => {
  const interval = setInterval(() => set(new Date()), 1000);
  return () => clearInterval(interval);
});

const doubledTime = derived(time, ($time) => $time * 2);
```

### Component Patterns

#### Slots

```svelte
<!-- Card.svelte -->
<div class="card">
  <slot name="header" />
  <slot />
  <slot name="footer" />
</div>

<!-- Usage -->
<Card>
  <div slot="header">Header</div>
  <div>Content</div>
  <div slot="footer">Footer</div>
</Card>
```

#### Context

```svelte
<script>
import { setContext } from 'svelte';

setContext('theme', 'dark');
</script>

<!-- Child -->
<script>
import { getContext } from 'svelte';

const theme = getContext('theme');
</script>
```

## SolidJS Fine-Grained Reactivity

### Signals

```javascript
import { createSignal } from 'solid-js';

const [count, setCount] = createSignal(0);

function increment() {
  setCount((c) => c + 1);
}
```

### Derived Signals

```javascript
import { createSignal, createMemo } from 'solid-js';

const [count, setCount] = createSignal(0);
const doubledCount = createMemo(() => count() * 2);
```

### Effects

```javascript
import { createSignal, createEffect } from 'solid-js';

const [count, setCount] = createSignal(0);

createEffect(() => {
  console.log('Count changed:', count());
});
```

### Component Patterns

#### Components

```javascript
import { createSignal } from 'solid-js';

function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}
```

#### Context

```javascript
import { createContext, useContext } from 'solid-js';

const ThemeContext = createContext('light');

function Provider(props) {
  return <ThemeContext.Provider value={props.theme}>{props.children}</ThemeContext.Provider>;
}

function Child() {
  const theme = useContext(ThemeContext);
  return <div>Theme: {theme}</div>;
}
```

## Angular Architecture

### Components

#### Component Structure

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <div>
      <p>Count: {{ count }}</p>
      <button (click)="increment()">Increment</button>
    </div>
  `,
})
export class CounterComponent {
  count = 0;

  increment() {
    this.count++;
  }
}
```

#### Input and Output

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  template: `<button (click)="onClick()">{{ label }}</button>`,
})
export class ButtonComponent {
  @Input() label = 'Click me';
  @Output() click = new EventEmitter<void>();

  onClick() {
    this.click.emit();
  }
}
```

### Services

#### Service

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CounterService {
  private count = 0;

  increment() {
    this.count++;
  }

  getCount() {
    return this.count;
  }
}
```

### Dependency Injection

```typescript
import { Component } from '@angular/core';
import { CounterService } from './counter.service';

@Component({
  selector: 'app-counter',
  template: `<button (click)="increment()">Count: {{ count }}</button>`,
})
export class CounterComponent {
  count = 0;

  constructor(private counterService: CounterService) {}

  increment() {
    this.counterService.increment();
    this.count = this.counterService.getCount();
  }
}
```

### State Management

#### RxJS

```typescript
import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-counter',
  template: `<button (click)="increment()">Count: {{ count$ | async }}</button>`,
})
export class CounterComponent {
  private countSubject = new BehaviorSubject(0);
  count$ = this.countSubject.asObservable();

  increment() {
    this.countSubject.next(this.countSubject.value + 1);
  }
}
```

#### NgRx

```typescript
// Action
export const increment = createAction('[Counter] Increment');

// Reducer
const counterReducer = createReducer(
  { count: 0 },
  on(increment, (state) => ({ count: state.count + 1 }))
);

// Selector
export const selectCount = createSelector((state: State) => state.counter.count);

// Component
@Component({
  selector: 'app-counter',
  template: `<button (click)="increment()">Count: {{ count$ | async }}</button>`,
})
export class CounterComponent {
  count$ = this.store.select(selectCount);

  constructor(private store: Store) {}

  increment() {
    this.store.dispatch(increment());
  }
}
```

## Routing Patterns

### React Router

```jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Vue Router

```javascript
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
```

### Angular Router

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
```

## Best Practices

### Component Design

- **Single Responsibility**: One responsibility per component
- **Reusable**: Make components reusable
- **Composable**: Compose components
- **Testable**: Make components testable
- **Documented**: Document components

### State Management

- **Local First**: Use local state first
- **Lift State**: Lift state when needed
- **Context**: Use context for shared state
- **Redux**: Use Redux for complex state
- **Zustand**: Use Zustand for simple state

### Performance

- **Memoize**: Memoize expensive computations
- **Code Split**: Split code by route
- **Lazy Load**: Lazy load components
- **Virtualize**: Virtualize long lists
- **Optimize**: Optimize renders

### Architecture

- **Folder Structure**: Organize by feature
- **Separation**: Separate concerns
- **Modular**: Make modules independent
- **Scalable**: Design for scale
- **Maintainable**: Make code maintainable
