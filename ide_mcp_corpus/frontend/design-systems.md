# Design Systems & Component Architecture

## Overview

This document covers Material Design, Fluent Design, Apple HIG, Carbon Design, Atlassian Design System, Chakra/Radix/MUI component patterns, and Atomic Design. These concepts enable MasterControl to design coherent, professional UI systems, not just screens.

## Material Design

### Core Principles

- **Material**: Material is the metaphor - surfaces that mimic physical reality
- **Bold, Graphic, Intentional**: Bold colors, graphic imagery, intentional whitespace
- **Motion**: Motion provides meaning and focuses attention
- **Adaptive**: Design adapts to different devices and contexts

### Components

#### Buttons

- **Contained**: High emphasis, primary actions
- **Outlined**: Medium emphasis, secondary actions
- **Text**: Low emphasis, tertiary actions
- **FAB**: Floating Action Button for primary action

#### Cards

- **Elevated**: Cards that lift on hover
- **Outlined**: Cards with borders
- **Filled**: Cards with background color
- **Content**: Title, subtitle, media, actions

#### Inputs

- **Text Fields**: Single-line and multi-line
- **Select**: Dropdown selection
- **Checkbox**: Multiple selection
- **Radio**: Single selection
- **Switch**: Toggle switches

### Elevation

- **0dp**: On ground level
- **1dp**: Elevated cards
- **2dp**: Menus, dialogs
- **3dp**: Bottom sheets
- **4dp**: FAB
- **6dp**: Navigation drawer
- **8dp**: Modal
- **12dp**: Snackbar
- **16dp**: Picker
- **24dp**: Side sheet

### Color System

- **Primary**: Primary brand color
- **Secondary**: Secondary brand color
- **Error**: Error states
- **Warning**: Warning states
- **Success**: Success states
- **Surface**: Background surfaces
- **On-surface**: Text on surfaces

### Typography

- **Roboto**: Default font
- **Styles**: Display, Headline, Title, Body, Label, Caption
- **Weights**: Light, Regular, Medium, Bold
- **Scales**: Responsive font sizes

## Fluent Design

### Core Principles

- **Light**: Light, depth, motion, material, scale
- **Depth**: Layered interface with depth
- **Motion**: Meaningful animation
- **Material**: Authentic materials
- **Scale**: Adaptable to any screen

### Acrylic Material

- **Blur**: Background blur effect
- **Translucency**: Semi-transparent
- **Noise**: Noise texture
- **Luminosity**: Luminosity blend mode

### Reveal Effect

- **Hover**: Reveal on hover
- **Border**: Glowing border
- **Background**: Background illumination
- **Light**: Light source

### Components

#### Command Bar

- **Primary**: Primary commands
- **Secondary**: Secondary commands
- **More**: More commands menu
- **Overflow**: Overflow menu

#### Navigation View

- **Pane**: Navigation pane
- **Items**: Navigation items
- **Icons**: Iconography
- **Selection**: Selected state

#### Dialogs

- **Content**: Dialog content
- **Title**: Dialog title
- **Actions**: Action buttons
- **Layout**: Dialog layout

### Typography

- **Segoe UI**: Default font
- **Variable**: Variable fonts
- **Styles**: Display, Header, Body, Caption
- **Weights**: Light, SemiLight, Normal, SemiBold, Bold

## Apple HIG (Human Interface Guidelines)

### Core Principles

- **Clarity**: Text is legible, icons are understandable
- **Deference**: UI defers to content
- **Depth**: Visual depth and hierarchy

### Design Themes

- **Light**: Light appearance
- **Dark**: Dark appearance
- **High Contrast**: High contrast accessibility
- **Automatic**: System automatic switching

### Components

#### Navigation Bars

- **Large**: Large title navigation
- **Inline**: Inline title navigation
- **Search**: Search bar
- **Toolbar**: Toolbar items

#### Tab Bars

- **Tabs**: Tab items
- **Icons**: Tab icons
- **Badges**: Notification badges
- **Selection**: Selected state

#### Lists

- **Inset**: Inset grouped lists
- **Plain**: Plain lists
- **Grouped**: Grouped lists
- **Cells**: List cells

### Typography

- **SF Pro**: System font
- **Styles**: Large Title, Title, Headline, Body, Footnote, Caption
- **Weights**: Ultra Light, Thin, Light, Regular, Medium, Semibold, Bold, Heavy, Black

## Carbon Design System

### Core Principles

- **Expression**: Expressive brand
- **Precision**: Precise spacing
- **Consistency**: Consistent patterns

### Color Palette

- **Gray**: Gray scale
- **Blue**: Primary blue
- **Cool Gray**: Cool gray
- **Cool Blue**: Cool blue
- **Teal**: Teal accent
- **Green**: Green accent
- **Purple**: Purple accent
- **Magenta**: Magenta accent

### Components

#### Buttons

- **Primary**: Primary button
- **Secondary**: Secondary button
- **Tertiary**: Tertiary button
- **Ghost**: Ghost button
- **Danger**: Danger button

#### Data Tables

- **Sortable**: Sortable columns
- **Selectable**: Selectable rows
- **Expandable**: Expandable rows
- **Actions**: Row actions

#### Modals

- **Danger**: Danger modal
- **Info**: Info modal
- **Warning**: Warning modal
- **Success**: Success modal

### Typography

- **IBM Plex Sans**: Default font
- **Styles**: Display, Heading, Label, Body, Code
- **Weights**: Light, Regular, Medium, Semibold, Bold

## Atlassian Design System

### Core Principles

- **Purposeful**: Purposeful design
- **Collaborative**: Collaborative tools
- **Human**: Human-centered

### Components

#### Buttons

- **Primary**: Primary button
- **Secondary**: Secondary button
- **Link**: Link button
- **Subtle**: Subtle button

#### Form Fields

- **Text**: Text input
- **Textarea**: Textarea
- **Select**: Select dropdown
- **Checkbox**: Checkbox
- **Radio**: Radio button

#### Navigation

- **Tabs**: Tab navigation
- **Breadcrumbs**: Breadcrumb navigation
- **Pagination**: Pagination

### Color System

- **Brand**: Brand colors
- **Neutral**: Neutral colors
- **Discovery**: Discovery colors
- **Success**: Success colors
- **Warning**: Warning colors
- **Danger**: Danger colors

### Typography

- **Charlie Sans**: Default font
- **Styles**: Display, Heading, Subheading, Body, Monospace
- **Weights**: Regular, Medium, Semibold, Bold

## Component Library Patterns

### Chakra UI

#### Component Composition

```jsx
import { Box, Text, Button } from '@chakra-ui/react';

function MyComponent() {
  return (
    <Box p={4} bg="blue.500" borderRadius="md">
      <Text color="white">Hello, World!</Text>
      <Button mt={2} colorScheme="whiteAlpha">
        Click me
      </Button>
    </Box>
  );
}
```

#### Style Props

- **Margin**: m, mx, my, mt, mb, ml, mr
- **Padding**: p, px, py, pt, pb, pl, pr
- **Color**: color, bg, borderColor
- **Layout**: width, height, maxW, maxH
- **Flexbox**: display, flexDirection, alignItems, justifyContent
- **Grid**: grid, gridTemplateColumns, gap

#### Theming

```jsx
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#f0f9ff',
      500: '#3b82f6',
      900: '#1e3a8a',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
});
```

### Radix UI

#### Unstyled Components

```jsx
import * as Dialog from '@radix-ui/react-dialog';

function MyDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Title>My Dialog</Dialog.Title>
          <Dialog.Description>Description</Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

#### Compound Components

- **Dialog**: Dialog.Root, Dialog.Trigger, Dialog.Content
- **Dropdown**: Dropdown.Trigger, Dropdown.Content
- **Tabs**: Tabs.List, Tabs.Trigger, Tabs.Content
- **Tooltip**: Tooltip.Trigger, Tooltip.Content

### Material UI (MUI)

#### Component API

```jsx
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

function MyForm() {
  return (
    <form>
      <TextField label="Name" variant="outlined" />
      <Button variant="contained" color="primary">
        Submit
      </Button>
    </form>
  );
}
```

#### Theming

```jsx
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
});
```

## Atomic Design (Brad Frost)

### Atomic Design Methodology

- **Atoms**: Basic building blocks (buttons, inputs, labels)
- **Molecules**: Groups of atoms (form fields, cards)
- **Organisms**: Groups of molecules (headers, sections)
- **Templates**: Page structure without content
- **Pages**: Templates with real content

### Atoms

#### Button Atom

```jsx
function Button({ children, variant = 'primary', size = 'medium' }) {
  return <button className={`btn btn-${variant} btn-${size}`}>{children}</button>;
}
```

#### Input Atom

```jsx
function Input({ label, placeholder, value, onChange }) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <input placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  );
}
```

### Molecules

#### Search Bar Molecule

```jsx
function SearchBar({ onSearch }) {
  return (
    <div className="search-bar">
      <Input label="Search" placeholder="Search..." />
      <Button>Search</Button>
    </div>
  );
}
```

#### Card Molecule

```jsx
function Card({ title, description, image }) {
  return (
    <div className="card">
      <img src={image} alt={title} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
```

### Organisms

#### Header Organism

```jsx
function Header({ logo, navigation, user }) {
  return (
    <header className="header">
      <Logo src={logo} />
      <Navigation items={navigation} />
      <UserMenu user={user} />
    </header>
  );
}
```

#### Product List Organism

```jsx
function ProductList({ products }) {
  return (
    <div className="product-list">
      {products.map((product) => (
        <Card key={product.id} {...product} />
      ))}
    </div>
  );
}
```

### Templates

#### Page Template

```jsx
function PageTemplate({ header, main, footer }) {
  return (
    <div className="page">
      <Header {...header} />
      <main>{main}</main>
      <Footer {...footer} />
    </div>
  );
}
```

### Pages

#### Home Page

```jsx
function HomePage() {
  return (
    <PageTemplate
      header={{ logo: '/logo.png', navigation: [...] }}
      main={<ProductList products={products} />}
      footer={{ links: [...] }}
    />
  );
}
```

## Design System Best Practices

### Component Design

- **Reusable**: Components should be reusable
- **Composable**: Components should be composable
- **Consistent**: Consistent naming and API
- **Documented**: Well-documented components
- **Tested**: Comprehensive testing

### Style Guide

- **Colors**: Color palette
- **Typography**: Typography scale
- **Spacing**: Spacing system
- **Shadows**: Shadow scale
- **Borders**: Border radius scale

### Documentation

- **Storybook**: Component documentation
- **Examples**: Usage examples
- **API**: API documentation
- **Guidelines**: Design guidelines
- **Best Practices**: Best practices

### Versioning

- **Semantic**: Semantic versioning
- **Breaking**: Breaking changes
- **Deprecation**: Deprecation policy
- **Migration**: Migration guides
- **Changelog**: Changelog maintenance

## Design Tokens

### Token Categories

- **Color**: Color tokens
- **Typography**: Typography tokens
- **Spacing**: Spacing tokens
- **Border**: Border tokens
- **Shadow**: Shadow tokens
- **Motion**: Motion tokens

### Token Format

```json
{
  "color": {
    "primary": {
      "500": {
        "value": "#3b82f6",
        "type": "color"
      }
    }
  },
  "spacing": {
    "4": {
      "value": "1rem",
      "type": "dimension"
    }
  }
}
```

### Token Usage

```css
.button {
  background-color: var(--color-primary-500);
  padding: var(--spacing-4);
}
```

## Best Practices

### Component Architecture

- **Atomic**: Use atomic design
- **Composable**: Compose components
- **Reusable**: Make components reusable
- **Documented**: Document components
- **Tested**: Test components

### Design System

- **Consistent**: Consistent design
- **Scalable**: Scalable system
- **Maintainable**: Maintainable code
- **Accessible**: Accessible components
- **Performant**: Performant components

### Collaboration

- **Designers**: Involve designers
- **Developers**: Involve developers
- **Process**: Clear process
- **Tools**: Right tools
- **Communication**: Good communication
