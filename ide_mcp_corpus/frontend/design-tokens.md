# Design Tokens & Theming

## Overview

This document covers Design token standards (W3C), Color systems, Typography scales, Spacing systems, Shadow systems, and Theme switching. These concepts enable MasterControl to generate consistent, theme-ready UI.

## Design Token Standards (W3C)

### Token Format

```json
{
  "color": {
    "primary": {
      "500": {
        "value": "#3b82f6",
        "type": "color",
        "description": "Primary brand color"
      }
    }
  },
  "spacing": {
    "4": {
      "value": "1rem",
      "type": "dimension",
      "description": "Base spacing unit"
    }
  }
}
```

### Token Categories

- **Color**: Color tokens
- **Typography**: Typography tokens
- **Spacing**: Spacing tokens
- **Border**: Border tokens
- **Shadow**: Shadow tokens
- **Motion**: Motion tokens
- **Radius**: Border radius tokens
- **Z-index**: Z-index tokens

### Token Groups

- **Global**: Global tokens
- **Semantic**: Semantic tokens
- **Component**: Component-specific tokens
- **Mode**: Mode-specific tokens (light/dark)

## Color Systems

### Color Palettes

#### Primary Palette

```json
{
  "color": {
    "primary": {
      "50": "#eff6ff",
      "100": "#dbeafe",
      "200": "#bfdbfe",
      "300": "#93c5fd",
      "400": "#60a5fa",
      "500": "#3b82f6",
      "600": "#2563eb",
      "700": "#1d4ed8",
      "800": "#1e40af",
      "900": "#1e3a8a"
    }
  }
}
```

#### Semantic Colors

```json
{
  "color": {
    "text": {
      "primary": "#0f172a",
      "secondary": "#475569",
      "tertiary": "#94a3b8"
    },
    "background": {
      "primary": "#ffffff",
      "secondary": "#f8fafc",
      "tertiary": "#f1f5f9"
    },
    "border": {
      "primary": "#e2e8f0",
      "secondary": "#cbd5e1"
    }
  }
}
```

#### Functional Colors

```json
{
  "color": {
    "success": {
      "500": "#22c55e"
    },
    "warning": {
      "500": "#f59e0b"
    },
    "error": {
      "500": "#ef4444"
    },
    "info": {
      "500": "#3b82f6"
    }
  }
}
```

### Color Usage

```css
.button {
  background-color: var(--color-primary-500);
  color: var(--color-text-primary);
}
```

### Dark Mode

```json
{
  "color": {
    "text": {
      "primary": "#f8fafc",
      "secondary": "#cbd5e1",
      "tertiary": "#94a3b8"
    },
    "background": {
      "primary": "#0f172a",
      "secondary": "#1e293b",
      "tertiary": "#334155"
    }
  }
}
```

## Typography Scales

### Font Families

```json
{
  "font": {
    "family": {
      "sans": "Inter, system-ui, sans-serif",
      "mono": "Fira Code, monospace",
      "serif": "Merriweather, serif"
    }
  }
}
```

### Font Sizes

```json
{
  "font": {
    "size": {
      "xs": {
        "value": "0.75rem",
        "type": "dimension"
      },
      "sm": {
        "value": "0.875rem",
        "type": "dimension"
      },
      "base": {
        "value": "1rem",
        "type": "dimension"
      },
      "lg": {
        "value": "1.125rem",
        "type": "dimension"
      },
      "xl": {
        "value": "1.25rem",
        "type": "dimension"
      },
      "2xl": {
        "value": "1.5rem",
        "type": "dimension"
      },
      "3xl": {
        "value": "1.875rem",
        "type": "dimension"
      },
      "4xl": {
        "value": "2.25rem",
        "type": "dimension"
      }
    }
  }
}
```

### Font Weights

```json
{
  "font": {
    "weight": {
      "light": {
        "value": "300",
        "type": "fontWeight"
      },
      "normal": {
        "value": "400",
        "type": "fontWeight"
      },
      "medium": {
        "value": "500",
        "type": "fontWeight"
      },
      "semibold": {
        "value": "600",
        "type": "fontWeight"
      },
      "bold": {
        "value": "700",
        "type": "fontWeight"
      }
    }
  }
}
```

### Line Heights

```json
{
  "font": {
    "lineHeight": {
      "tight": {
        "value": "1.25",
        "type": "dimension"
      },
      "normal": {
        "value": "1.5",
        "type": "dimension"
      },
      "relaxed": {
        "value": "1.75",
        "type": "dimension"
      }
    }
  }
}
```

## Spacing Systems

### Spacing Scale

```json
{
  "spacing": {
    "0": {
      "value": "0",
      "type": "dimension"
    },
    "1": {
      "value": "0.25rem",
      "type": "dimension"
    },
    "2": {
      "value": "0.5rem",
      "type": "dimension"
    },
    "3": {
      "value": "0.75rem",
      "type": "dimension"
    },
    "4": {
      "value": "1rem",
      "type": "dimension"
    },
    "5": {
      "value": "1.25rem",
      "type": "dimension"
    },
    "6": {
      "value": "1.5rem",
      "type": "dimension"
    },
    "8": {
      "value": "2rem",
      "type": "dimension"
    },
    "10": {
      "value": "2.5rem",
      "type": "dimension"
    },
    "12": {
      "value": "3rem",
      "type": "dimension"
    },
    "16": {
      "value": "4rem",
      "type": "dimension"
    },
    "20": {
      "value": "5rem",
      "type": "dimension"
    },
    "24": {
      "value": "6rem",
      "type": "dimension"
    }
  }
}
```

### Spacing Usage

```css
.container {
  padding: var(--spacing-4);
  margin: var(--spacing-8) 0;
  gap: var(--spacing-2);
}
```

## Shadow Systems

### Shadow Scale

```json
{
  "shadow": {
    "sm": {
      "value": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      "type": "shadow"
    },
    "base": {
      "value": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      "type": "shadow"
    },
    "md": {
      "value": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      "type": "shadow"
    },
    "lg": {
      "value": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      "type": "shadow"
    },
    "xl": {
      "value": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      "type": "shadow"
    },
    "2xl": {
      "value": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      "type": "shadow"
    }
  }
}
```

### Shadow Usage

```css
.card {
  box-shadow: var(--shadow-md);
}

.modal {
  box-shadow: var(--shadow-2xl);
}
```

## Theme Switching

### CSS Variables

```css
:root {
  --color-primary: #3b82f6;
  --color-background: #ffffff;
  --color-text: #0f172a;
}

[data-theme='dark'] {
  --color-primary: #60a5fa;
  --color-background: #0f172a;
  --color-text: #f8fafc;
}
```

### JavaScript Theme Switcher

```javascript
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);
```

### React Theme Provider

```jsx
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div data-theme={theme}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

### System Preference

```javascript
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  setTheme(e.matches ? 'dark' : 'light');
});
```

## Best Practices

### Design Tokens

- **Structured**: Use structured tokens
- **Semantic**: Use semantic tokens
- **Documented**: Document tokens
- **Versioned**: Version tokens
- **Consistent**: Keep tokens consistent

### Color Systems

- **Accessible**: Ensure color contrast
- **Semantic**: Use semantic colors
- **Flexible**: Make colors flexible
- **Tested**: Test color combinations
- **Documented**: Document color usage

### Theming

- **Variables**: Use CSS variables
- **Fallback**: Provide fallbacks
- **Performance**: Optimize performance
- **Transition**: Smooth transitions
- **Preference**: Respect system preference
