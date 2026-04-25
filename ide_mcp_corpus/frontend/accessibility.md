# Accessibility (A11y)

## Overview

This document covers WCAG 2.2, ARIA roles, Keyboard navigation, Color contrast, Screen reader patterns, and Focus management. These concepts enable MasterControl to generate accessible UI by default.

## WCAG 2.2

### Principles

#### Perceivable

- **Text Alternatives**: Provide text alternatives for non-text content
- **Time-Based Media**: Provide alternatives for time-based media
- **Adaptable**: Create content that can be presented in different ways
- **Distinguishable**: Make it easier to distinguish content

#### Operable

- **Keyboard Accessible**: Make all functionality available from keyboard
- **Enough Time**: Provide users enough time to read and use content
- **Seizures**: Do not design content that causes seizures
- **Navigable**: Help users navigate and find content

#### Understandable

- **Readable**: Make text content readable and understandable
- **Predictable**: Make web pages appear and operate in predictable ways
- **Input Assistance**: Help users avoid and correct mistakes

#### Robust

- **Compatible**: Maximize compatibility with current and future user agents

### Success Criteria

#### Level A

- **Alt Text**: Provide alt text for images
- **Captions**: Provide captions for videos
- **Keyboard**: All functionality available via keyboard
- **Focus**: Focus indicator visible
- **Language**: Language specified

#### Level AA

- **Contrast**: Color contrast ratio of at least 4.5:1
- **Resize**: Text resizable up to 200%
- **Images**: Images not used for text
- \*\*Headings': Logical heading structure
- \*\*Labels': Form fields have labels

#### Level AAA

- **Contrast**: Color contrast ratio of at least 7:1
- **Text**: Text spacing adjustable
- \*\*Images': High contrast images
- \*\*Audio': No background audio
- \*\*Target': Target size at least 44x44

## ARIA Roles

### Landmark Roles

- **banner**: Site header
- **navigation**: Navigation region
- **main**: Main content
- \*\*complementary': Complementary content
- \*\*contentinfo': Footer information
- \*\*search': Search region
- \*\*form': Form region

### Widget Roles

- **button**: Button
- **link**: Link
- **checkbox**: Checkbox
- **radio**: Radio button
- **textbox**: Text input
- \*\*combobox': Combo box
- \*\*listbox': List box
- \*\*menu': Menu
- \*\*menuitem': Menu item
- \*\*slider': Slider
- \*\*spinbutton': Spin button
- \*\*dialog': Dialog
- \*\*alertdialog': Alert dialog
- \*\*tooltip': Tooltip

### Document Structure Roles

- **article**: Article
- \*\*section': Section
- **heading**: Heading
- \*\*list': List
- \*\*listitem': List item
- \*\*definition': Definition
- \*\*term': Term

### Live Regions

- **status**: Status message
- \*\*alert': Alert message
- \*\*log': Log
- \*\*marquee': Marquee
- \*\*timer': Timer
- \*\*progressbar': Progress bar

### ARIA Attributes

#### Descriptive Attributes

- **aria-label**: Accessible name
- **aria-describedby**: Description
- \*\*aria-labelledby': Label reference
- \*\*aria-description': Description

#### State Attributes

- **aria-expanded**: Expanded state
- \*\*aria-checked': Checked state
- \*\*aria-selected': Selected state
- \*\*aria-disabled': Disabled state
- \*\*aria-hidden': Hidden state

#### Property Attributes

- \*\*aria-required': Required field
- \*\*aria-invalid': Invalid field
- \*\*aria-readonly': Read-only field
- \*\*aria-multiline': Multi-line input
- \*\*aria-orientation': Orientation

## Keyboard Navigation

### Focus Management

#### Tab Order

- **Logical**: Logical tab order
- \*\*Visible': Visible focus indicator
- \*\*Skip': Skip links for navigation
- \*\*Trap': Focus trap for modals

#### Focus Styles

```css
button:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

#### Skip Links

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### Keyboard Shortcuts

#### Common Shortcuts

- **Tab**: Navigate forward
- **Shift+Tab**: Navigate backward
- **Enter/Space**: Activate
- **Escape**: Cancel/close
- **Arrow Keys**: Navigate within components

#### Custom Shortcuts

```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    // Open search
  }
});
```

### Focus Traps

#### Modal Focus Trap

```javascript
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  });
}
```

## Color Contrast

### Contrast Ratios

- **Normal Text**: 4.5:1 (AA), 7:1 (AAA)
- **Large Text**: 3:1 (AA), 4.5:1 (AAA)
- **UI Components**: 3:1 (AA)
- **Graphical Objects**: 3:1 (AA)

### Contrast Tools

- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Colour Contrast Analyser**: https://www.paciellogroup.com/resources/contrastanalyser
- ** axe DevTools**: Browser extension

### Best Practices

- **Test**: Test with contrast checker
- **Avoid**: Avoid low contrast combinations
- \*\*Default': Use high contrast defaults
- \*\*Dark Mode': Support dark mode

## Screen Reader Patterns

### Semantic HTML

```html
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

### ARIA Labels

```html
<button aria-label="Close dialog">
  <span aria-hidden="true">&times;</span>
</button>
```

### Live Regions

```html
<div aria-live="polite" aria-atomic="true">Status message</div>
```

### Screen Reader Testing

- **NVDA**: Windows screen reader
- **JAWS**: Windows screen reader
- **VoiceOver**: macOS/iOS screen reader
- **TalkBack**: Android screen reader

## Focus Management

### Focus Styles

```css
:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

### Focus Indicators

- \*\*Visible': Visible focus indicator
- \*\*Contrast': High contrast focus
- \*\*Consistent': Consistent focus style
- \*\*Custom': Custom focus indicators

### Focus Management Patterns

#### Modal Focus

```javascript
function openModal() {
  const modal = document.getElementById('modal');
  modal.style.display = 'block';
  const closeButton = modal.querySelector('button');
  closeButton.focus();
}
```

#### Dialog Focus

```javascript
function openDialog() {
  const dialog = document.getElementById('dialog');
  dialog.showModal();
  dialog.querySelector('button').focus();
}
```

## Best Practices

### Semantic HTML

- **Use**: Use semantic HTML elements
- \*\*Headings': Use proper heading hierarchy
- \*\*Lists': Use lists for lists
- \*\*Labels': Use labels for form fields

### ARIA

- **Use**: Use ARIA when needed
- **Don't Overuse**: Don't overuse ARIA
- \*\*Test': Test with screen readers
- \*\*Update': Keep ARIA updated

### Keyboard

- \*\*Test': Test with keyboard
- \*\*Shortcuts': Provide keyboard shortcuts
- \*\*Focus': Manage focus properly
- \*\*Skip': Provide skip links

### Color

- \*\*Contrast': Ensure sufficient contrast
- \*\*Not Only': Don't rely on color alone
- \*\*Patterns': Use patterns for information
- \*\*Dark Mode': Support dark mode

### Testing

- \*\*Screen Readers': Test with screen readers
- \*\*Keyboard': Test with keyboard
- \*\*Tools': Use accessibility tools
- \*\*Users': Test with actual users
