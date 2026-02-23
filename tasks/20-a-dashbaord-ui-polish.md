# Task: Daily Tasks UI Redesign

**Objective:** Redesign the Daily Tasks page and components to match the wireframe design with stone/neutral colors, motion animations, keyboard navigation, and proper accessibility.

---

## CHANGE #1: Update Task Card Layout (Side-by-Side Stacking)

### File: `app/dashboard/goals/[id]/page.tsx`

**Find this section** (around line 150-160):
```tsx
<div className="grid gap-4">
  {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
    // ... card rendering logic
  })}
</div>
```

**Change to:**
```tsx
<div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
  {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
    // ... card rendering logic (keep same)
  })}
</div>
```

**Also wrap each DailyTaskCard:**
Find where `<DailyTaskCard` is rendered and wrap it:
```tsx
<div className="min-w-[320px] snap-start">
  <DailyTaskCard
    // ... existing props
  />
</div>
```

---

## CHANGE #2: Update DailyTaskCard Color Scheme (Stone/Neutral Palette)

### File: `components/DailyTaskCard.tsx`

**Find statusConfig object** (around line 30-55):
```tsx
const statusConfig = {
  locked: {
    icon: Lock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    badge: 'Locked',
    badgeClass: 'bg-gray-100 text-gray-600',
  },
  active: {
    icon: Circle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    badge: 'Active',
    badgeClass: 'bg-blue-100 text-blue-600',
  },
  complete: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    badge: 'Complete',
    badgeClass: 'bg-green-100 text-green-600',
  },
};
```

**Replace with:**
```tsx
const statusConfig = {
  locked: {
    icon: Lock,
    color: 'text-stone-400',
    bgColor: 'bg-stone-100',
    borderColor: 'border-stone-200',
    badge: 'Locked',
    badgeClass: 'bg-stone-100 text-stone-600',
  },
  active: {
    icon: Circle,
    color: 'text-neutral-700',
    bgColor: 'bg-neutral-100',
    borderColor: 'border-neutral-300',
    badge: 'Active',
    badgeClass: 'bg-neutral-100 text-neutral-700',
  },
  complete: {
    icon: CheckCircle2,
    color: 'text-stone-700',
    bgColor: 'bg-stone-100',
    borderColor: 'border-stone-300',
    badge: 'Complete',
    badgeClass: 'bg-stone-100 text-stone-700',
  },
};
```

**Find empty card className** (around line 50):
```tsx
<Card className={`p-6 ${canAdd ? 'border-dashed bg-gray-50/50 hover:bg-gray-100/50 transition-colors' : 'border-2 border-gray-200 bg-gray-50'}`}>
```

**Replace with:**
```tsx
<Card className={`p-6 ${canAdd ? 'border-dashed bg-stone-50/50 hover:bg-stone-100/50 transition-colors' : 'border-2 border-stone-200 bg-stone-50'}`}>
```

**Find other color references:**

Search for `text-gray-` and replace:
- `text-gray-400` → `text-stone-400`
- `text-gray-500` → `text-stone-500`
- `text-gray-600` → `text-stone-600`
- `text-gray-700` → `text-stone-700`
- `text-gray-900` → `text-stone-900`

Search for `bg-red-` and replace:
- `bg-red-100` → `bg-stone-100`
- `bg-red-50` → `bg-stone-50`
- `text-red-400` → `text-stone-400`
- `text-red-600` → `text-stone-600`
- `border-red-200` → `border-stone-200`

---

## CHANGE #3: Add Motion Animations to DailyTaskCard

### File: `components/DailyTaskCard.tsx`

**Add import at the top:**
```tsx
import { motion } from 'motion/react';
```

**Find the Card wrapper** (around line 95):
```tsx
return (
  <Card className={`p-6 border-2 ${config.borderColor} transition-all`}>
```

**Replace with:**
```tsx
return (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1], // cubic-bezier ease-out
    }}
  >
    <Card className={`p-6 border-2 ${config.borderColor} transition-all`}>
```

**At the end of the component, close the motion.div:**
```tsx
    </Card>
  </motion.div>
);
```

**For the empty task card, wrap it too** (around line 50):
```tsx
return (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    }}
  >
    <Card className={`p-6 ${canAdd ? 'border-dashed bg-stone-50/50 hover:bg-stone-100/50 transition-colors' : 'border-2 border-stone-200 bg-stone-50'}`}>
      {/* ... existing content ... */}
    </Card>
  </motion.div>
);
```

---

## CHANGE #4: Simplify Card Border Design

### File: `components/DailyTaskCard.tsx`

**Find the main Card element** (around line 99):
```tsx
<Card className={`p-6 border-2 ${config.borderColor} transition-all`}>
```

**Replace with:**
```tsx
<Card className={`p-6 border ${config.borderColor} transition-all hover:shadow-sm`}>
```

This changes from `border-2` (thick) to `border` (thin) for a more minimal look.

---

## CHANGE #5: Update AddDailyTaskModal Color Scheme

### File: `components/AddDailyTaskModal.tsx`

**Find all color classes and replace:**

Search and replace:
- `text-gray-500` → `text-stone-500`
- `text-gray-600` → `text-stone-600`
- `text-gray-700` → `text-stone-700`
- `text-gray-900` → `text-stone-900`
- `bg-gray-50` → `bg-stone-50`
- `border-gray-200` → `border-stone-200`
- `border-gray-300` → `border-stone-300`

---

## CHANGE #6: Add Motion Animations to AddDailyTaskModal

### File: `components/AddDailyTaskModal.tsx`

**Add import at the top:**
```tsx
import { motion, AnimatePresence } from 'motion/react';
```

**Find the Dialog return statement** (around line 120):
```tsx
return (
  <Dialog open={open} onOpenChange={handleClose}>
```

**Wrap DialogContent with AnimatePresence:**
```tsx
return (
  <Dialog open={open} onOpenChange={handleClose}>
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            {/* ... existing content ... */}
          </DialogContent>
        </motion.div>
      )}
    </AnimatePresence>
  </Dialog>
);
```

**Add animation to resource inputs:**

Find where resources are mapped (around line 180):
```tsx
{resources.map((resource, index) => (
  <div key={index} className="flex gap-2">
```

**Replace with:**
```tsx
{resources.map((resource, index) => (
  <motion.div
    key={index}
    layout
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    }}
    className="flex gap-2"
  >
```

And close with `</motion.div>` instead of `</div>`.

---

## CHANGE #7: Add Keyboard Navigation to AddDailyTaskModal

### File: `components/AddDailyTaskModal.tsx`

**The keyboard shortcuts are already implemented in the useEffect** (around line 100).

**Add visual indicator in DialogFooter** (around line 240):

Find:
```tsx
<DialogFooter>
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
</DialogFooter>
```

**Replace with:**
```tsx
<DialogFooter>
  <div className="flex items-center justify-between w-full">
    <Paragraph variant="small" className="text-stone-500">
      Press <kbd className="px-2 py-1 text-xs font-semibold text-stone-800 bg-stone-100 border border-stone-200 rounded">Cmd</kbd> + <kbd className="px-2 py-1 text-xs font-semibold text-stone-800 bg-stone-100 border border-stone-200 rounded">Enter</kbd> to submit
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

## CHANGE #8: Add Proper ARIA Attributes

### File: `components/AddDailyTaskModal.tsx`

**Update DialogTitle** (around line 130):
```tsx
<DialogTitle>
  <Heading as="h2" className="text-gray-900 text-2xl">
    Add Day {dayNumber} Task
  </Heading>
</DialogTitle>
```

**Replace with:**
```tsx
<DialogTitle>
  <Heading as="h2" className="text-stone-900 text-2xl" aria-level={2}>
    Add Day {dayNumber} Task
  </Heading>
</DialogTitle>
```

**Update form labels** (around line 145):
```tsx
<Label htmlFor="description" className="text-base font-medium">
  Task Description
</Label>
```

**Replace with:**
```tsx
<Label htmlFor="description" className="text-base font-medium text-stone-900">
  Task Description
  <span className="text-stone-500 ml-1" aria-label="required">*</span>
</Label>
```

**Update Textarea** (around line 150):
```tsx
<Textarea
  id="description"
  value={description}
  onChange={(e) => handleDescriptionChange(e.target.value)}
  placeholder="Describe what you'll work on today..."
  className="min-h-[100px]"
  maxLength={500}
/>
```

**Replace with:**
```tsx
<Textarea
  id="description"
  value={description}
  onChange={(e) => handleDescriptionChange(e.target.value)}
  placeholder="Describe what you'll work on today..."
  className="min-h-[100px]"
  maxLength={500}
  aria-required="true"
  aria-describedby="description-hint"
/>
<Paragraph id="description-hint" variant="small" className="text-stone-500 mt-1">
  {dayGuidance[dayNumber as keyof typeof dayGuidance]}
</Paragraph>
```

**Update Resource URL inputs** (around line 165):
```tsx
<Input
  type="url"
  value={resource.url}
  onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
  placeholder="https://example.com"
/>
```

**Replace with:**
```tsx
<Input
  type="url"
  value={resource.url}
  onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
  placeholder="https://example.com"
  aria-label={`Resource URL ${index + 1}`}
  aria-describedby={`resource-hint-${index}`}
/>
```

---

## CHANGE #9: Add Transform Origin to Animations

### File: `components/DailyTaskCard.tsx`

**Update the motion.div animations:**

For the main card (around line 95):
```tsx
<motion.div
  layout
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  }}
  style={{ transformOrigin: 'top center' }}
>
```

For the empty card (around line 50):
```tsx
<motion.div
  layout
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  }}
  style={{ transformOrigin: 'center center' }}
>
```

---

## CHANGE #10: Add Layout ID for Shared Layout Animations

### File: `components/DailyTaskCard.tsx`

**Add layoutId prop to motion.div:**

For the main task card:
```tsx
<motion.div
  layoutId={`task-card-${task._id}`}
  layout
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  }}
  style={{ transformOrigin: 'top center' }}
>
```

For the empty card:
```tsx
<motion.div
  layoutId={`task-slot-${dayNumber}`}
  layout
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  }}
  style={{ transformOrigin: 'center center' }}
>
```

---

## CHANGE #11: Add Focus Visible Styles

### File: `app/globals.css`

**Add these styles to the end of the file:**

```css
/* Keyboard focus styles for accessibility */
.focus-visible:focus {
  outline: 2px solid hsl(var(--stone-400));
  outline-offset: 2px;
}

button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid hsl(var(--stone-400));
  outline-offset: 2px;
  border-color: hsl(var(--stone-500));
}

/* Keyboard shortcut styling */
kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
```

---

## CHANGE #12: Update Button Focus States

### File: `components/DailyTaskCard.tsx`

**Find all Button components and add focus classes:**

Example (around line 70):
```tsx
<Button onClick={onAddTask} variant="outline" className="gap-2">
  <Plus className="h-4 w-4" />
  Add Task
</Button>
```

**Replace with:**
```tsx
<Button 
  onClick={onAddTask} 
  variant="outline" 
  className="gap-2 focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
  aria-label={`Add task for day ${dayNumber}`}
>
  <Plus className="h-4 w-4" aria-hidden="true" />
  Add Task
</Button>
```

Apply similar changes to:
- "Mark Complete" button
- "Generate Content" button
- Any other interactive buttons

---

## CHANGE #13: Add Proper Key Props for Lists

### File: `app/dashboard/goals/[id]/page.tsx`

**Find the tasks mapping** (around line 155):
```tsx
{[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
  const task = tasks.find(t => t.dayNumber === dayNum);
  // ...
```

**Ensure proper key usage:**
```tsx
{[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
  const task = tasks.find(t => t.dayNumber === dayNum);
  return (
    <div 
      key={task?._id || `day-${dayNum}`} 
      className="min-w-[320px] snap-start"
    >
      <DailyTaskCard
        // ... props
      />
    </div>
  );
})}
```

---

## CHANGE #14: Add AnimatePresence to Resource List

### File: `components/AddDailyTaskModal.tsx`

**Find the resources section** (around line 175):
```tsx
<div className="space-y-3">
  {resources.map((resource, index) => (
```

**Wrap with AnimatePresence:**
```tsx
<AnimatePresence mode="popLayout">
  <div className="space-y-3">
    {resources.map((resource, index) => (
      <motion.div
        key={`resource-${index}`}
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{
          duration: 0.2,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="flex gap-2"
      >
        {/* ... resource inputs ... */}
      </motion.div>
    ))}
  </div>
</AnimatePresence>
```

---

## CHANGE #15: Update Page Container for Horizontal Scroll

### File: `app/dashboard/goals/[id]/page.tsx`

**Find the main container** (around line 50):
```tsx
<div className="space-y-6">
```

**Add proper overflow handling:**
```tsx
<div className="space-y-6 pb-8">
```

**And for the cards container** (already modified in CHANGE #1):
```tsx
<div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
  {/* ... cards ... */}
</div>
```

**Add to globals.css for hiding scrollbar while keeping functionality:**
```css
/* Hide scrollbar but keep functionality */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

---

## Testing Checklist

After implementing all changes:

- [ ] Cards display horizontally side-by-side
- [ ] Cards scroll smoothly with snap points
- [ ] All colors use stone/neutral palette
- [ ] Animations are smooth with ease-out timing
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus states are visible
- [ ] Modal animations work smoothly
- [ ] Resource add/remove animations work
- [ ] ARIA attributes are present
- [ ] No console errors
- [ ] Responsive on mobile (cards scroll horizontally)
- [ ] All interactive elements have proper focus states

---

## Summary of Files Modified

1. ✅ `app/dashboard/goals/[id]/page.tsx` - Layout changes
2. ✅ `components/DailyTaskCard.tsx` - Colors, animations, accessibility
3. ✅ `components/AddDailyTaskModal.tsx` - Colors, animations, keyboard nav, ARIA
4. ✅ `app/globals.css` - Focus styles, scrollbar hiding

---

**Total Changes:** 15 discrete changes across 4 files