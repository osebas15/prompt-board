# Plan 2: PromptList Implementation

## Overview
The PromptList component will be the main interface for viewing, searching, and managing prompts. It follows React's component thinking pattern with clear separation of concerns.

## Component Structure

### Main Container (PromptList.tsx)
```typescript
interface PromptListProps {
  initialFilters?: PromptFilters;
  viewMode?: 'grid' | 'list';
  enableBulkActions?: boolean;
  onPromptSelect?: (prompt: Prompt) => void;
}
```

**Responsibilities:**
- Manage overall state (filters, view mode, selected items)
- Coordinate between header, content, and action components
- Handle bulk operations
- Provide loading and error boundaries

### Features to Implement

#### 1. Search & Filtering (PromptListHeader.tsx)
- **Search Input**: Debounced text search across title/content
- **Category Filter**: Dropdown with user's categories
- **Tag Filter**: Multi-select with autocomplete
- **Sort Options**: Date, usage, alphabetical, rating
- **View Toggle**: Grid vs list view
- **Filter Chips**: Show active filters with clear options

#### 2. Content Display (PromptListContent.tsx)
- **Grid View**: Card layout with previews
- **List View**: Compact table layout
- **Virtual Scrolling**: Handle large datasets efficiently
- **Infinite Scroll**: Load more prompts automatically
- **Selection**: Checkbox selection for bulk operations

#### 3. Bulk Operations
- **Select All/None**: Toggle all items on current page
- **Bulk Delete**: Delete multiple prompts with confirmation
- **Bulk Tag**: Add/remove tags from multiple prompts
- **Bulk Categorize**: Move prompts to different category
- **Bulk Export**: Export selected prompts

#### 4. State Management
- **Local State**: View mode, selected items, expanded filters
- **URL State**: Filters and pagination for bookmarkable URLs
- **React Query**: Data fetching and caching
- **Optimistic Updates**: Immediate UI feedback

## Integration with Existing Hooks

### Data Fetching
```typescript
const {
  data: promptsData,
  isLoading,
  error,
  fetchNextPage,
  hasNextPage
} = useInfinitePrompts(filters);
```

### Mutations
```typescript
const deletePrompt = useDeletePrompt();
const updatePrompts = useUpdatePrompt();
const bulkUpdate = useBulkUpdatePrompts(); // To be created
```

## Responsive Design

### Mobile (< 768px)
- Stack filters vertically
- Hide bulk actions by default
- Simplified card layout
- Swipe gestures for actions

### Tablet (768px - 1024px)
- Two-column grid
- Collapsible filter sidebar
- Touch-friendly controls

### Desktop (> 1024px)
- Three+ column grid
- Persistent filter sidebar
- Keyboard shortcuts
- Bulk selection toolbar

## Performance Optimizations

### Virtual Scrolling
- Only render visible items
- Use @tanstack/react-virtual
- Maintain scroll position

### Image Loading
- Lazy load prompt previews
- Use intersection observer
- Placeholder while loading

### Search Optimization
- Debounce input (300ms)
- Cancel previous requests
- Show search suggestions

## Accessibility

### Keyboard Navigation
- Tab through all interactive elements
- Arrow keys for grid navigation
- Enter/Space for selection
- Escape to close filters

### Screen Readers
- Announce filter changes
- Describe bulk selection state
- Provide context for actions

### Focus Management
- Maintain focus when filtering
- Restore focus after actions
- Skip links for power users

## Error Handling

### Network Errors
- Retry button with exponential backoff
- Offline indicator
- Cached results when possible

### Validation Errors
- Clear error messages
- Field-level validation
- Prevent invalid states

### Empty States
- No prompts found
- No search results
- No prompts in category
- Different messages for each scenario
