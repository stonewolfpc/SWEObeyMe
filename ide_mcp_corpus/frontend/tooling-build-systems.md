# Frontend Tooling & Build Systems

## Overview

This document covers Vite, Webpack, SWC, Babel, TypeScript best practices, Linting + formatting, and Testing (Vitest, Jest, Cypress, Playwright). These concepts enable MasterControl to become a full frontend engineer.

## Vite

### Basics

- **Fast**: Fast dev server
- **HMR**: Hot module replacement
- **Build**: Optimized builds
- **ESM**: Native ES modules

### Configuration

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### Plugins

- **React**: @vitejs/plugin-react
- **Vue**: @vitejs/plugin-vue
- **TypeScript**: vite-plugin-checker
- **PWA**: vite-plugin-pwa
- **Components**: vite-plugin-components

### Dev Server

```javascript
export default defineConfig({
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

## Webpack

### Basics

- **Module Bundler**: Bundle JavaScript
- **Loaders**: Transform files
- **Plugins**: Extend functionality
- **Optimization**: Optimize output

### Configuration

```javascript
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
      },
    ],
  },
};
```

### Loaders

- **Babel**: babel-loader
- **CSS**: css-loader, style-loader
- **Sass**: sass-loader
- **Images**: file-loader, url-loader
- **TypeScript**: ts-loader

### Plugins

- **HTML**: html-webpack-plugin
- **Extract**: mini-css-extract-plugin
- **Clean**: clean-webpack-plugin
- **Define**: define-plugin
- **Copy**: copy-webpack-plugin

## SWC

### Basics

- **Fast**: Faster than Babel
- **Rust**: Written in Rust
- **Compatible**: Babel compatible
- **Modern**: Modern JavaScript

### Configuration

```javascript
module.exports = {
  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
    },
    transform: {
      react: {
        runtime: 'automatic',
      },
    },
  },
};
```

### Integration

- **Next.js**: Built-in SWC
- **Webpack**: swc-loader
- **Vite**: vite-plugin-swc
- **Rollup**: @rollup/plugin-swc

## Babel

### Basics

- **Transpiler**: Transpile JavaScript
- **Plugins**: Transform syntax
- **Presets**: Shareable configs
- **Polyfills**: Polyfill features

### Configuration

```javascript
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
  ],
};
```

### Presets

- **@babel/preset-env**: Modern JavaScript
- **@babel/preset-react**: React JSX
- **@babel/preset-typescript**: TypeScript
- **@babel/preset-flow**: Flow

### Plugins

- **@babel/plugin-transform-runtime**: Runtime helpers
- **@babel/plugin-proposal-class-properties**: Class properties
- **@babel/plugin-proposal-optional-chaining**: Optional chaining
- **@babel/plugin-proposal-nullish-coalescing**: Nullish coalescing

## TypeScript Best Practices

### Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Type Definitions

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User {
  return { id, name: '', email: '' };
}
```

### Generic Types

```typescript
function identity<T>(arg: T): T {
  return arg;
}

const result = identity<string>('hello');
```

### Utility Types

- **Partial**: Make all properties optional
- **Required**: Make all properties required
- **Readonly**: Make all properties readonly
- **Pick**: Pick specific properties
- **Omit**: Omit specific properties

## Linting + Formatting

### ESLint

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
  },
};
```

### Prettier

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### Integration

- **ESLint + Prettier**: eslint-config-prettier
- **Git Hooks**: husky, lint-staged
- **Pre-commit**: Run linters before commit

## Testing

### Vitest

```javascript
import { test, expect } from 'vitest';

test('adds 1 + 2 to equal 3', () => {
  expect(1 + 2).toBe(3);
});
```

### Jest

```javascript
test('adds 1 + 2 to equal 3', () => {
  expect(1 + 2).toBe(3);
});
```

### Cypress

```javascript
cy.visit('/');
cy.get('button').click();
cy.contains('Success').should('be.visible');
```

### Playwright

```javascript
test('basic test', async ({ page }) => {
  await page.goto('/');
  await page.click('button');
  await expect(page.locator('text=Success')).toBeVisible();
});
```

## Best Practices

### Build Systems

- **Modern**: Use modern build tools
- **Fast**: Optimize for speed
- **Config**: Keep config simple
- **Plugins**: Use plugins wisely
- **Performance**: Monitor build performance

### TypeScript

- **Strict**: Use strict mode
- **Types**: Use types properly
- **Avoid**: Avoid any
- **Document**: Document types
- **Test**: Test types

### Linting

- **Consistent**: Keep code consistent
- **Auto-fix**: Use auto-fix
- **Pre-commit**: Use pre-commit hooks
- **Customize**: Customize rules
- **Enforce**: Enforce rules

### Testing

- **Unit**: Write unit tests
- **Integration**: Write integration tests
- **E2E**: Write E2E tests
- **Coverage**: Monitor coverage
- **CI**: Run tests in CI
