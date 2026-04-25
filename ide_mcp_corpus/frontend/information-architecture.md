# Information Architecture

## Overview

This document covers Navigation patterns, Hierarchy, Card sorting, Content grouping, User flows, and Wireframing patterns. These concepts enable MasterControl to design apps that make sense.

## Navigation Patterns

### Navigation Types

- **Global**: Site-wide navigation
- **Local**: Section-specific navigation
- **Contextual**: Context-dependent navigation
- **Utility**: Utility navigation (search, settings)
- **Footer**: Footer navigation

### Navigation Patterns

#### Top Navigation

```html
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

#### Sidebar Navigation

```html
<nav>
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
    <li><a href="/settings">Settings</a></li>
    <li><a href="/profile">Profile</a></li>
  </ul>
</nav>
```

#### Breadcrumb Navigation

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li><a href="/products/category">Category</a></li>
    <li>Product</li>
  </ol>
</nav>
```

#### Tab Navigation

```html
<nav>
  <button class="tab active">Overview</button>
  <button class="tab">Details</button>
  <button class="tab">Reviews</button>
</nav>
```

#### Pagination

```html
<nav>
  <button>Previous</button>
  <button>1</button>
  <button>2</button>
  <button>3</button>
  <button>Next</button>
</nav>
```

## Hierarchy

### Visual Hierarchy

- **Size**: Larger elements are more important
- **Color**: Bright colors draw attention
- **Contrast**: High contrast stands out
- **Position**: Top-left is most important
- **Whitespace**: More whitespace = more importance

### Content Hierarchy

- **H1**: Page title
- **H2**: Section headings
- **H3**: Subsection headings
- **H4**: Sub-subsection headings
- **H5-H6**: Lower-level headings

### Hierarchy Best Practices

- **Logical**: Logical hierarchy
- **Consistent**: Consistent hierarchy
- **Clear**: Clear hierarchy
- **Accessible**: Accessible hierarchy
- **Semantic**: Semantic HTML

## Card Sorting

### Open Card Sorting

- **Unstructured**: Participants group items
- **Flexible**: Flexible grouping
- **Insight**: Gain insights
- **Discovery**: Discover patterns

### Closed Card Sorting

- **Structured**: Predefined categories
- **Controlled**: Controlled grouping
- **Validation**: Validate assumptions
- **Testing**: Test categories

### Card Sorting Process

1. **Define**: Define items to sort
2. **Recruit**: Recruit participants
3. **Conduct**: Conduct sorting sessions
4. **Analyze**: Analyze results
5. **Apply**: Apply findings

## Content Grouping

### Grouping Principles

- **Similarity**: Group similar items
- **Proximity**: Group nearby items
- **Continuity**: Group continuous items
- **Closure**: Group enclosed items
- **Connection**: Group connected items

### Grouping Patterns

- **Categories**: Group by category
- **Function**: Group by function
- **User**: Group by user type
- **Task**: Group by task
- **Context**: Group by context

### Content Audit

- **Inventory**: Inventory all content
- **Categorize**: Categorize content
- **Analyze**: Analyze content
- **Organize**: Organize content
- **Maintain**: Maintain content

## User Flows

### User Flow Types

- **Task Flow**: Complete a task
- **Navigation Flow**: Navigate through app
- **Happy Path**: Ideal user journey
- **Error Path**: Error handling
- **Alternative Path**: Alternative journeys

### User Flow Diagrams

```
Start → Login → Dashboard → Select Item → View Details → Add to Cart → Checkout → End
```

### User Flow Best Practices

- **Simple**: Keep flows simple
- **Short**: Keep flows short
- **Clear**: Make flows clear
- **Consistent**: Keep flows consistent
- **Test**: Test flows with users

## Wireframing Patterns

### Wireframe Types

- **Low-Fidelity**: Sketch wireframes
- **Mid-Fidelity**: Detailed wireframes
- **High-Fidelity**: Interactive wireframes

### Wireframe Elements

- **Layout**: Page layout
- **Content**: Content placeholders
- **Navigation**: Navigation elements
- **Interactions**: Interaction indicators
- **Annotations**: Design notes

### Wireframe Tools

- **Figma**: Design tool
- **Sketch**: Design tool
- **Balsamiq**: Wireframing tool
- **Miro**: Collaborative whiteboard
- **Adobe XD**: Design tool

### Wireframing Process

1. **Research**: Research user needs
2. **Sketch**: Sketch initial ideas
3. **Wireframe**: Create wireframes
4. **Test**: Test wireframes
5. **Iterate**: Iterate based on feedback

## Best Practices

### Navigation

- **Consistent**: Consistent navigation
- **Clear**: Clear navigation
- **Accessible**: Accessible navigation
- **Responsive**: Responsive navigation
- **Tested**: Tested navigation

### Hierarchy

- **Visual**: Visual hierarchy
- **Content**: Content hierarchy
- **Semantic**: Semantic hierarchy
- **Consistent**: Consistent hierarchy
- **Accessible**: Accessible hierarchy

### Content

- **Organized**: Organized content
- **Grouped**: Grouped content
- **Labeled**: Labeled content
- **Audited**: Audited content
- **Maintained**: Maintained content

### User Flows

- **Simple**: Simple flows
- **Short**: Short flows
- **Clear**: Clear flows
- **Tested**: Tested flows
- **Optimized**: Optimized flows
