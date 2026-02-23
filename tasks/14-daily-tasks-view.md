# Task 14: Add Daily Task Flow

**Phase:** 2 - Frontend  
**Estimated Time:** 1-2 hours  
**Dependencies:** Task 13 (Weekly Goal Detail) ✅

---

## Objective

Refine the add daily task flow with better UX, validation, and sequential enforcement. This task focuses on polish and edge case handling since the core functionality was implemented in Task 13.

---

## Prerequisites

- ✅ Weekly Goal Detail page complete (Task 13)
- ✅ AddDailyTaskModal created (Task 13)
- ✅ Daily Tasks API working (Task 04)

---

## Enhancements to AddDailyTaskModal

**File:** `components/AddDailyTaskModal.tsx` (update existing)

Add these improvements to the existing modal:

### 1. URL Validation

```tsx
// Add after the state declarations
const validateUrl = (url: string): boolean => {
  if (!url) return true; // Optional field
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Update handleSubmit to validate URLs
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!description.trim()) {
    toast.error('Please enter a task description');
    return;
  }

  // Validate URLs
  const invalidUrls = resources.filter(r => r.url && !validateUrl(r.url));
  if (invalidUrls.length > 0) {
    toast.error('Please enter valid URLs (must start with http:// or https://)');
    return;
  }

  // Filter out empty resources
  const validResources = resources.filter(r => r.url.trim());

  setIsSubmitting(true);

  try {
    const response = await fetch('/api/daily-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weeklyGoalId,
        description,
        resources: validResources,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error || 'Failed to create task');
      return;
    }

    toast.success(`Day ${dayNumber} task created!`);
    setDescription('');
    setResources([{ url: '', title: '' }]);
    onOpenChange(false);
    onSuccess();
  } catch (error) {
    console.error('Error creating task:', error);
    toast.error('Something went wrong. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

### 2. Character Counter for Description

Add this to the description textarea section:

```tsx
{/* Description */}
<div className="space-y-2">
  <Label htmlFor="description">Task Description *</Label>
  <Textarea
    id="description"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    placeholder="e.g., Learn useState and useEffect hooks"
    rows={3}
    className="resize-none"
  />
  <div className="flex justify-between items-center">
    <Paragraph variant="small" className="text-gray-500">
      What will you learn or build today?
    </Paragraph>
    <Paragraph variant="small" className={
      description.length < 10 ? 'text-red-500' : 'text-gray-500'
    }>
      {description.length} characters
    </Paragraph>
  </div>
</div>
```

---

### 3. Better Resource UI with Validation Feedback

Update the resources section:

```tsx
{/* Resources */}
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <Label>Resources (Optional)</Label>
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleAddResource}
      className="gap-2"
      disabled={resources.length >= 5}
    >
      <Plus className="h-3 w-3" />
      Add Resource
    </Button>
  </div>

  {resources.length >= 5 && (
    <Paragraph variant="small" className="text-amber-600">
      Maximum 5 resources per task
    </Paragraph>
  )}

  <div className="space-y-3">
    {resources.map((resource, index) => (
      <div key={index} className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Input
            placeholder="URL (e.g., https://react.dev/...)"
            value={resource.url}
            onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
            className={
              resource.url && !validateUrl(resource.url)
                ? 'border-red-500 focus-visible:ring-red-500'
                : ''
            }
          />
          {resource.url && !validateUrl(resource.url) && (
            <Paragraph variant="small" className="text-red-500">
              Invalid URL format
            </Paragraph>
          )}
          <Input
            placeholder="Title (optional)"
            value={resource.title || ''}
            onChange={(e) => handleResourceChange(index, 'title', e.target.value)}
          />
        </div>
        {resources.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveResource(index)}
            className="mt-1"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    ))}
  </div>
</div>
```

---

### 4. Help Text for Each Day

Add contextual help based on day number:

```tsx
// Add before the form
const dayGuidance = {
  1: "Start with fundamentals. What's the core concept you need to understand?",
  2: "Build on Day 1. What's the next logical step?",
  3: "Time to practice. What hands-on exercise can you do?",
  4: "Go deeper. What advanced aspect should you explore?",
  5: "Apply your knowledge. What can you build with what you've learned?",
  6: "Optimize and refine. How can you improve your approach?",
  7: "Wrap it up. What final piece completes your week?",
};

// Add after DialogDescription
<div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
  <Paragraph variant="small" className="text-blue-700">
    💡 {dayGuidance[dayNumber as keyof typeof dayGuidance]}
  </Paragraph>
</div>
```

---

## Update Daily Task Card for Better Empty State

**File:** `components/DailyTaskCard.tsx` (update existing)

Enhance the empty state (when task doesn't exist):

```tsx
// Replace the existing empty state return with this
if (!task) {
  const canAdd = onAddTask !== undefined;
  
  return (
    <Card className={`p-6 ${canAdd ? 'border-dashed bg-gray-50/50 hover:bg-gray-100/50 transition-colors' : 'border-2 border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${canAdd ? 'bg-gray-200' : 'bg-red-100'}`}>
            {canAdd ? (
              <Circle className="h-5 w-5 text-gray-400" />
            ) : (
              <Lock className="h-5 w-5 text-red-400" />
            )}
          </div>
          <div>
            <Paragraph className="font-semibold text-gray-900">
              Day {dayNumber}
            </Paragraph>
            <Paragraph variant="small" className="text-gray-500">
              {canAdd ? 'Ready to create' : `Create Day ${dayNumber - 1} first`}
            </Paragraph>
          </div>
        </div>
        {canAdd ? (
          <Button onClick={onAddTask} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        ) : (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            Blocked
          </Badge>
        )}
      </div>
    </Card>
  );
}
```

---

## Add Keyboard Shortcuts

**File:** `components/AddDailyTaskModal.tsx`

Add keyboard shortcut support:

```tsx
// Add useEffect for keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e as any);
    }
    
    // Escape to close (already handled by Dialog, but we can reset form)
    if (e.key === 'Escape') {
      setDescription('');
      setResources([{ url: '', title: '' }]);
    }
  };

  if (open) {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }
}, [open, description, resources]);

// Update DialogFooter to show hint
<DialogFooter>
  <div className="flex items-center justify-between w-full">
    <Paragraph variant="small" className="text-gray-500">
      Press Cmd/Ctrl + Enter to submit
    </Paragraph>
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
      >
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Task'}
      </Button>
    </div>
  </div>
</DialogFooter>
```

---

## Create Confirmation Before Leaving

Add unsaved changes warning:

```tsx
// Add state for tracking changes
const [hasChanges, setHasChanges] = useState(false);

// Update onChange handlers
const handleDescriptionChange = (value: string) => {
  setDescription(value);
  setHasChanges(true);
};

const handleResourceChangeWithTracking = (index: number, field: 'url' | 'title', value: string) => {
  handleResourceChange(index, field, value);
  setHasChanges(true);
};

// Add confirmation on close
const handleClose = (open: boolean) => {
  if (!open && hasChanges) {
    const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
    if (!confirmed) return;
  }
  
  if (!open) {
    setDescription('');
    setResources([{ url: '', title: '' }]);
    setHasChanges(false);
  }
  
  onOpenChange(open);
};
```

---

## Testing Checklist

### URL Validation
- [ ] Enter invalid URL "not-a-url"
- [ ] Should see red border and error message
- [ ] Try to submit - should show toast error
- [ ] Enter valid URL "https://react.dev"
- [ ] Border should be normal
- [ ] Should submit successfully

### Character Counter
- [ ] Type in description field
- [ ] See character count update in real-time
- [ ] Count turns red when <10 characters
- [ ] Count gray when >=10 characters

### Resource Limits
- [ ] Add 5 resources
- [ ] "Add Resource" button should be disabled
- [ ] See warning message about max 5 resources

### Day Guidance
- [ ] Open modal for Day 1
- [ ] See guidance "Start with fundamentals..."
- [ ] Open for Day 7
- [ ] See guidance "Wrap it up..."

### Empty State Enhancement
- [ ] Day 1 (can add) - shows "Ready to create"
- [ ] Day 3 (can't add yet) - shows "Create Day 2 first"
- [ ] Day 3 shows "Blocked" badge in red

### Keyboard Shortcuts
- [ ] Open modal
- [ ] Type description
- [ ] Press Cmd/Ctrl + Enter
- [ ] Should submit form
- [ ] See hint text in footer

### Unsaved Changes Warning
- [ ] Open modal
- [ ] Type some text
- [ ] Click outside to close
- [ ] Should see confirmation dialog
- [ ] Click "Cancel" - modal stays open
- [ ] Click "OK" - modal closes

---

## Enhancements Summary

✅ **URL Validation** - Real-time validation with visual feedback  
✅ **Character Counter** - Shows count with color coding  
✅ **Resource Limits** - Max 5 resources enforced  
✅ **Day-Specific Guidance** - Contextual help for each day  
✅ **Better Empty States** - Shows why tasks are blocked  
✅ **Keyboard Shortcuts** - Cmd/Ctrl + Enter to submit  
✅ **Unsaved Changes** - Warns before closing  
✅ **Visual Feedback** - Red borders for invalid input  

---

## UX Improvements

### Before:
- Basic modal with minimal validation
- No feedback on URL format
- Could lose data by accident
- No guidance on what to enter

### After:
- Real-time validation feedback
- URL format checking
- Unsaved changes warning
- Contextual guidance per day
- Keyboard shortcuts
- Character counting
- Resource limits

---

## Next Steps

After completing this task:
1. Move to Task 15: Task Completion Flow
2. That will be more complex (code + notes input)
3. Similar polish and validation approach

---

## Git Commit

```bash
# Stage the files
git add components/AddDailyTaskModal.tsx
git add components/DailyTaskCard.tsx

# Commit
git commit -m "feat: enhance Add Daily Task flow with UX improvements

- Add URL validation with visual feedback
- Add character counter for description
- Enforce max 5 resources per task
- Add day-specific guidance messages
- Improve empty state for blocked tasks
- Add keyboard shortcuts (Cmd/Ctrl + Enter)
- Add unsaved changes warning
- Show validation errors inline
- Add loading states
- Improve accessibility with labels"

git push origin your-branch-name
```

---

**Status:** Ready to implement  
**Previous Task:** `13-weekly-goal-detail.md` ✅  
**Next Task:** `15-task-completion-flow.md`