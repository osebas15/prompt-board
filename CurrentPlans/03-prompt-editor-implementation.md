# Plan 3: PromptEditor Implementation

## Overview
The PromptEditor component provides a rich interface for creating and editing prompts with real-time validation, auto-save, and template variables.

## Component Structure

### Main Container (PromptEditor.tsx)
```typescript
interface PromptEditorProps {
  promptId?: string;          // For editing existing prompt
  initialData?: Partial<CreatePrompt>;
  mode?: 'create' | 'edit' | 'template';
  onSave?: (prompt: Prompt) => void;
  onCancel?: () => void;
  autoSave?: boolean;
}
```

**Responsibilities:**
- Coordinate form state with react-hook-form
- Handle auto-save functionality
- Manage editor modes (create/edit/template)
- Provide real-time preview

### Features to Implement

#### 1. Form Management (PromptForm.tsx)
- **React Hook Form**: Validation and form state
- **Zod Schema**: Type-safe validation
- **Field Dependencies**: Dynamic validation based on other fields
- **Dirty State**: Track unsaved changes
- **Form Persistence**: Save draft to localStorage

#### 2. Content Editor (PromptContentEditor.tsx)
- **Rich Text Input**: Textarea with syntax highlighting
- **Character Count**: Real-time count with limits
- **Template Variables**: {{variable}} syntax support
- **Auto-formatting**: Smart indentation and cleanup
- **Markdown Preview**: Optional markdown rendering

#### 3. Metadata Management (PromptMetadata.tsx)
- **Title Field**: Required, character limit
- **Description**: Optional, multi-line
- **Category Selection**: Dropdown with create new option
- **Visibility Toggle**: Public/private radio buttons
- **Template Toggle**: Mark as template checkbox

#### 4. Tag Management (TagInput.tsx)
- **Tag Input**: Add/remove tags with keyboard
- **Autocomplete**: Suggest existing tags
- **Tag Validation**: Prevent duplicates, format validation
- **Popular Tags**: Show frequently used tags
- **Custom Colors**: Optional tag coloring

#### 5. Template Variables (TemplateVariables.tsx)
- **Variable Detection**: Parse {{variable}} from content
- **Variable List**: Show all detected variables
- **Default Values**: Set defaults for each variable
- **Type Hints**: String, number, boolean types
- **Variable Validation**: Required variables

#### 6. Live Preview (PromptPreview.tsx)
- **Split View**: Side-by-side with editor
- **Variable Substitution**: Replace {{vars}} with values
- **Rendered Output**: Show final prompt text
- **Character Count**: Preview length stats
- **Copy Button**: Copy rendered prompt

## Advanced Features

### Auto-Save System
```typescript
// Auto-save every 30 seconds or on significant changes
const useAutoSave = (formData: PromptFormData, promptId?: string) => {
  const [lastSaved, setLastSaved] = useState<Date>();
  const [isDirty, setIsDirty] = useState(false);
  
  // Debounced save function
  const debouncedSave = useDebouncedCallback(async (data) => {
    if (promptId) {
      await updatePrompt.mutateAsync({ id: promptId, updates: data });
    } else {
      // Save as draft to localStorage
      localStorage.setItem('prompt-draft', JSON.stringify(data));
    }
    setLastSaved(new Date());
    setIsDirty(false);
  }, 30000);
  
  return { lastSaved, isDirty, save: debouncedSave };
};
```

### Version History
- **Auto Versioning**: Create version on significant changes
- **Version Comparison**: Show diff between versions
- **Restore Version**: Revert to previous version
- **Version Comments**: Optional change descriptions

### Collaboration Features
- **Draft Sharing**: Share drafts via URL
- **Change Tracking**: Who changed what when
- **Comment System**: Inline comments and suggestions
- **Approval Workflow**: Review and approve changes

## Form Validation

### Real-time Validation
```typescript
const promptSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title too long'),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(5000, 'Content too long'),
  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags allowed'),
  category_id: z.string().uuid().optional(),
  is_public: z.boolean(),
  is_template: z.boolean(),
  template_variables: z.record(z.string()).optional()
});
```

### Validation States
- **Field-level**: Validate on blur/change
- **Form-level**: Validate before submit
- **Cross-field**: Dependencies between fields
- **Async Validation**: Check uniqueness, API validation

## Integration with Existing System

### React Query Hooks
```typescript
// For editing existing prompts
const { data: prompt, isLoading } = usePrompt(promptId);

// For mutations
const createPrompt = useCreatePrompt({
  onSuccess: (prompt) => {
    showToast('Prompt created successfully');
    onSave?.(prompt);
  }
});

const updatePrompt = useUpdatePrompt({
  onSuccess: (prompt) => {
    showToast('Prompt updated successfully');
    onSave?.(prompt);
  }
});
```

### Categories and Tags
```typescript
// Fetch user's categories for dropdown
const { data: categories } = useCategories();

// Fetch existing tags for autocomplete
const { data: tags } = useTags();
```

## User Experience

### Keyboard Shortcuts
- **Ctrl/Cmd + S**: Save prompt
- **Ctrl/Cmd + P**: Toggle preview
- **Ctrl/Cmd + Enter**: Submit form
- **Escape**: Cancel/close
- **Tab**: Navigate between fields

### Visual Feedback
- **Unsaved Changes**: Indicator when form is dirty
- **Save Status**: Show last saved time
- **Validation Errors**: Clear, helpful error messages
- **Loading States**: Spinners and disabled states

### Mobile Optimization
- **Responsive Layout**: Stack elements vertically
- **Touch Targets**: Larger buttons and inputs
- **Virtual Keyboard**: Optimize input types
- **Swipe Gestures**: Save/cancel actions

## Error Handling

### Network Errors
- **Retry Logic**: Automatic retry with backoff
- **Offline Support**: Save drafts locally
- **Conflict Resolution**: Handle concurrent edits

### Validation Errors
- **Field Highlighting**: Red borders for invalid fields
- **Error Messages**: Clear, actionable feedback
- **Scroll to Error**: Focus first invalid field

### Data Loss Prevention
- **Unsaved Changes Warning**: Prevent accidental navigation
- **Auto-recovery**: Restore from localStorage
- **Version Backup**: Keep previous versions
