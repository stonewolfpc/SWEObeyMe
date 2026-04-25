# UI/UX Best Practices

## Overview

This document covers Nielsen Norman heuristics, Cognitive load theory, Fitts's Law, Hick's Law, Error recovery patterns, Progressive disclosure, Affordances, and Interaction design patterns. These concepts enable MasterControl to critique and improve UI like a UX designer.

## Nielsen Norman Heuristics

### 1. Visibility of System Status

- **Principle**: Always keep users informed about system status
- **Implementation**: Progress indicators, loading states, status messages
- **Example**: File upload progress bar

### 2. Match Between System and Real World

- **Principle**: Use language and concepts familiar to users
- **Implementation**: Real-world metaphors, familiar terminology
- **Example**: Trash icon for delete

### 3. User Control and Freedom

- **Principle**: Users often choose system functions by mistake
- **Implementation**: Undo, cancel, exit
- **Example**: Undo button in text editor

### 4. Consistency and Standards

- **Principle**: Consistent platform conventions
- **Implementation**: Follow platform guidelines
- **Example': Consistent button styles

### 5. Error Prevention

- **Principle**: Prevent errors before they occur
- **Implementation**: Validation, constraints, confirmations
- **Example**: Form validation before submit

### 6. Recognition Rather Than Recall

- **Principle**: Minimize user memory load
- **Implementation**: Visible options, clear labels
- **Example**: Navigation menu with icons

### 7. Flexibility and Efficiency of Use

- **Principle**: Accelerators for experienced users
- **Implementation**: Shortcuts, power user features
- **Example**: Keyboard shortcuts

### 8. Aesthetic and Minimalist Design

- **Principle**: Remove irrelevant information
- **Implementation**: Clean interface, focus on essentials
- **Example**: Minimalist dashboard

### 9. Help Users Recognize, Diagnose, and Recover from Errors

- **Principle**: Clear error messages, solutions
- **Implementation**: Helpful error messages, recovery options
- **Example**: Form error with fix suggestion

### 10. Help and Documentation

- **Principle**: Help and documentation should be easy to search
- **Implementation**: Searchable help, contextual help
- **Example': In-app help center

## Cognitive Load Theory

### Types of Cognitive Load

#### Intrinsic Cognitive Load

- **Definition**: Difficulty of the subject matter
- **Management**: Break into smaller chunks
- **Example**: Multi-step form broken into sections

#### Extraneous Cognitive Load

- **Definition**: How information is presented
- **Management**: Remove unnecessary information
- **Example**: Remove decorative elements

#### Germane Cognitive Load

- **Definition**: Effort to create schemas
- **Management**: Use examples, analogies
- **Example**: Tutorial with examples

### Reducing Cognitive Load

- **Simplify**: Simplify interface
- **Chunk**: Chunk information
- **Progressive**: Progressive disclosure
- **Consistent**: Consistent patterns
- **Feedback**: Provide feedback

## Fitts's Law

### Principle

- **Definition**: Time to acquire target is function of distance and size
- **Formula**: T = a + b * log2(D/W + 1)
- **Application**: Make important targets larger, closer

### Application

#### Button Size

- **Primary**: Larger buttons for primary actions
- **Secondary**: Smaller buttons for secondary actions
- **Touch**: Minimum 44x44 pixels for touch

#### Button Position

- **Primary**: Place primary actions in easy reach
- **Secondary**: Place secondary actions nearby
- **Danger**: Place destructive actions away from common actions

#### Navigation

- **Menu**: Place menu items in expected locations
- **Toolbar**: Place toolbar items logically
- **Footer**: Place footer items consistently

## Hick's Law

### Principle

- **Definition**: Time to make decision increases with number of choices
- **Application**: Limit choices, group related options

### Application

#### Menu Items

- **Limit**: Limit menu items to 7 ± 2
- **Group**: Group related items
- **Default**: Provide sensible defaults

#### Form Fields

- **Limit**: Limit form fields
- **Progressive**: Progressive disclosure
- **Smart**: Smart defaults

#### Options

- **Limit**: Limit options
- **Group**: Group related options
- **Search**: Provide search for many options

## Error Recovery Patterns

### Prevention

#### Validation

- **Real-time**: Validate in real-time
- **Clear**: Clear error messages
- **Helpful**: Helpful suggestions
- **Example**: Email validation with format hint

#### Constraints

- **Input**: Constrain input
- **Selection**: Provide selection options
- **Defaults**: Sensible defaults
- **Example**: Date picker with min/max dates

### Recovery

#### Undo

- **Action**: Provide undo for destructive actions
- **Time**: Allow undo for reasonable time
- **Clear**: Clear undo indication
- **Example**: Undo after delete

#### Retry

- **Retry**: Allow retry on failure
- **Context**: Preserve context
- **Feedback**: Clear feedback
- **Example**: Retry failed form submission

#### Recovery

- **Recover**: Recover from errors
- **State**: Preserve state
- **Resume**: Allow resume
- **Example**: Auto-save draft

## Progressive Disclosure

### Principle

- **Definition**: Show information progressively
- **Application**: Show only what's needed, reveal more on demand

### Patterns

#### Accordion

- **Summary**: Show summary, expand for details
- **Use**: Large content sections
- **Example': FAQ accordion

#### Tabs

- **Categories**: Organize by category
- **Use**: Multiple related sections
- **Example': Settings tabs

#### Tooltips

- **Hover**: Show on hover
- **Use**: Additional information
- **Example': Icon with tooltip

#### Modals

- **Focus**: Focus on specific task
- **Use**: Complex interactions
- **Example': Edit modal

#### Progressive Enhancement

- **Basic**: Show basic first
- **Advanced**: Reveal advanced options
- **Example': Simple search with advanced filters

## Affordances

### Visual Affordances

- **Buttons**: Look clickable
- **Links**: Look like links
- **Inputs**: Look like inputs
- **Example': Button with shadow and hover effect

### Functional Affordances

- **Drag**: Indicate draggable
- **Resize**: Indicate resizable
- **Sortable**: Indicate sortable
- **Example': Handle for drag

### Perceived Affordances

- **Convention**: Follow conventions
- **Consistency**: Be consistent
- **Familiar**: Use familiar patterns
- **Example': Underlined text for links

## Interaction Design Patterns

### Navigation Patterns

#### Breadcrumbs

- **Hierarchy**: Show hierarchy
- **Clickable**: Clickable to navigate
- **Example': Home > Products > Category > Product

#### Pagination

- **Controls**: Previous/Next controls
- **Info**: Show page info
- **Example': Previous 1 2 3 Next

#### Tabs

- **Categories**: Organize by category
- **Active**: Show active tab
- **Example': Profile, Settings, Account tabs

### Form Patterns

#### Inline Validation

- **Real-time**: Validate as user types
- **Clear**: Clear error messages
- **Example': Email validation on blur

#### Multi-step Forms

- **Progress**: Show progress
- **Save**: Save between steps
- **Example': Wizard with progress indicator

#### Smart Defaults

- **Sensible**: Sensible defaults
- **Context**: Context-aware defaults
- **Example': Default country based on location

### Feedback Patterns

#### Loading States

- **Indicators**: Show loading indicators
- **Skeleton**: Use skeleton screens
- **Example': Skeleton loader for content

#### Success States

- **Clear**: Clear success message
- **Action**: Next action available
- **Example': Success message with continue button

#### Error States

- **Clear**: Clear error message
- **Solution**: Provide solution
- **Example': Error message with fix suggestion

### Data Display Patterns

#### Tables

- **Sortable**: Sortable columns
- **Filterable**: Filterable rows
- **Paginated**: Paginated results
- **Example': Data table with sort and filter

#### Cards

- **Grouped**: Group related items
- **Actions': Card-specific actions
- **Example': Product cards

#### Lists

- **Grouped': Group related items
- **Actions': List item actions
- **Example': Task list with actions

## Best Practices

### Design Principles

- **User-Centered**: Design for users
- **Consistent': Be consistent
- **Simple': Keep it simple
- **Accessible': Make it accessible
- **Performant': Make it fast

### Interaction Design

- **Intuitive': Make it intuitive
- **Efficient': Make it efficient
- **Forgiving': Be forgiving
- **Responsive': Be responsive
- **Delightful': Make it delightful

### Visual Design

- **Clear': Clear visual hierarchy
- **Consistent': Consistent styling
- **Readable': Readable text
- **Accessible': Accessible colors
- **Beautiful': Beautiful design

### Testing

- **User Testing': Test with users
- **A/B Testing': A/B test variations
- **Analytics': Use analytics
- **Feedback': Collect feedback
- **Iterate': Iterate based on feedback
