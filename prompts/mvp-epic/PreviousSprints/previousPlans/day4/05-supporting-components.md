# Plan 5: Supporting Components Implementation

## Overview
This plan covers the supporting components and utilities needed for the main prompt management features.

## Shared Components

### 1. PromptCard Component

#### Basic Card (PromptCard.tsx)
```typescript
interface PromptCardProps {
  prompt: Prompt;
  variant?: 'grid' | 'list' | 'compact';
  showActions?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: (prompt: Prompt) => void;
  onEdit?: (prompt: Prompt) => void;
  onDuplicate?: (prompt: Prompt) => void;
  onDelete?: (promptId: string) => void;
}
```

**Features:**
- Multiple display variants (grid, list, compact)
- Selection checkbox for bulk operations
- Quick actions (edit, duplicate, delete)
- Hover states and interactions
- Loading states for optimistic updates

#### Card Actions (PromptCardActions.tsx)
- **Dropdown Menu**: More actions in compact menu
- **Quick Actions**: Edit, favorite, duplicate buttons
- **Keyboard Support**: Space/Enter for selection
- **Context Menu**: Right-click actions

#### Card Stats (PromptCardStats.tsx)
- **Usage Count**: Times used with icon
- **Rating**: Star rating display
- **Last Used**: Relative time (e.g., "2 days ago")
- **Public Indicator**: Icon for public prompts

### 2. Search and Filter Components

#### Search Input (PromptSearch.tsx)
```typescript
interface PromptSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  showSuggestions?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}
```

**Features:**
- Debounced input with configurable delay
- Search suggestions dropdown
- Clear button when input has value
- Keyboard navigation (arrows, enter, escape)
- Loading indicator during search

#### Tag Filter (TagFilter.tsx)
- **Multi-select**: Select multiple tags
- **Autocomplete**: Suggest existing tags as you type
- **Tag Pills**: Visual representation of selected tags
- **Clear All**: Remove all selected tags
- **Popular Tags**: Show most used tags

#### Category Filter (CategoryFilter.tsx)
- **Dropdown**: Select single category
- **All Categories**: Option to show all
- **Create New**: Quick add new category
- **Category Colors**: Visual category indicators

### 3. Form Components

#### Tag Input (TagInput.tsx)
```typescript
interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  maxTags?: number;
  placeholder?: string;
  allowCreate?: boolean;
  validation?: (tag: string) => string | null;
}
```

**Features:**
- Add tags by typing and pressing Enter
- Remove tags with backspace or X button
- Tag validation (duplicates, format, length)
- Autocomplete suggestions
- Maximum tag limits

#### Category Select (CategorySelect.tsx)
- **Searchable Dropdown**: Type to filter categories
- **Create Option**: Add new category inline
- **Color Indicators**: Show category colors
- **Recent Categories**: Quick access to recent selections

### 4. Layout Components

#### Empty States (EmptyState.tsx)
```typescript
interface EmptyStateProps {
  type: 'no-prompts' | 'no-search-results' | 'no-category' | 'error';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: React.ReactNode;
}
```

**Variants:**
- No prompts created yet
- No search results found
- Empty category
- Network error
- Permission denied

#### Loading Skeletons
- **Card Skeleton**: Placeholder for prompt cards
- **List Skeleton**: Placeholder for list items
- **Detail Skeleton**: Placeholder for prompt detail
- **Text Skeleton**: For various text content

### 5. Modal and Dialog Components

#### Confirmation Dialog (ConfirmDialog.tsx)
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}
```

**Use Cases:**
- Delete prompt confirmation
- Bulk delete confirmation
- Unsaved changes warning
- Data loss prevention

#### Share Dialog (ShareDialog.tsx)
- **Public Link**: Generate shareable URL
- **Copy Button**: Copy link to clipboard
- **QR Code**: Generate QR for mobile sharing
- **Social Sharing**: Share to social platforms
- **Embed Code**: Generate iframe embed

## Utility Components

### 1. Error Boundaries

#### Prompt Error Boundary
```typescript
class PromptErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('Prompt component error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 2. Toast Notifications

#### Toast System
- **Success Messages**: Prompt saved, deleted, etc.
- **Error Messages**: Network errors, validation failures
- **Info Messages**: Auto-save status, sharing links
- **Progress Toasts**: Upload progress, bulk operations

### 3. Keyboard Shortcuts

#### Shortcut Handler
```typescript
const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            // Create new prompt
            break;
          case 'f':
            e.preventDefault();
            // Focus search
            break;
          case 'a':
            e.preventDefault();
            // Select all
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);
};
```

## Responsive Design System

### Breakpoints
```css
/* Mobile: 0-767px */
.mobile { display: block; }
.tablet { display: none; }
.desktop { display: none; }

/* Tablet: 768-1023px */
@media (min-width: 768px) {
  .mobile { display: none; }
  .tablet { display: block; }
  .desktop { display: none; }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .mobile { display: none; }
  .tablet { display: none; }
  .desktop { display: block; }
}
```

### Component Adaptations
- **PromptCard**: Stack elements vertically on mobile
- **Filters**: Collapse into drawer on mobile
- **Actions**: Replace text with icons on small screens
- **Navigation**: Hamburger menu for mobile

## Performance Optimizations

### Virtual Scrolling
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualPromptList = ({ prompts }: { prompts: Prompt[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: prompts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated item height
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <PromptCard prompt={prompts[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Image Optimization
- **Lazy Loading**: Load images when they enter viewport
- **Placeholder Images**: Show placeholder while loading
- **Progressive Loading**: Load low-res first, then high-res
- **Compression**: Optimize image sizes

### Bundle Optimization
- **Code Splitting**: Split components into separate chunks
- **Tree Shaking**: Remove unused code
- **Dynamic Imports**: Load components on demand
- **Preloading**: Prefetch likely-needed components

## Accessibility Features

### ARIA Labels and Roles
```typescript
// Search input
<input
  type="text"
  role="searchbox"
  aria-label="Search prompts"
  aria-describedby="search-help"
/>

// Filter button
<button
  aria-expanded={isFilterOpen}
  aria-controls="filter-menu"
  aria-label="Filter prompts"
>
  Filter
</button>

// Prompt card
<article
  role="article"
  aria-labelledby={`prompt-title-${prompt.id}`}
  aria-describedby={`prompt-description-${prompt.id}`}
>
```

### Keyboard Navigation
- **Tab Order**: Logical tab sequence
- **Skip Links**: Jump to main content
- **Focus Indicators**: Clear focus states
- **Arrow Navigation**: Navigate grids with arrows

### Screen Reader Support
- **Live Regions**: Announce dynamic changes
- **Status Messages**: Announce actions and results
- **Context Information**: Provide context for complex interactions
- **Alternative Text**: Descriptive text for images and icons
