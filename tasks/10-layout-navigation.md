# Task 10: Layout & Navigation

**Phase:** 2 - Frontend  
**Estimated Time:** 3-4 hours  
**Dependencies:** Backend APIs complete (Tasks 01-09) ✅

---

## Objective

Set up the frontend layout, navigation, and routing structure with a modern, polished design using shadcn/ui components and Tailwind CSS. Create a cohesive visual foundation for the learning system.

---

## Prerequisites

- ✅ Backend APIs working (Task 09 testing passed)
- ✅ Clerk authentication already configured
- ✅ Tailwind CSS installed
- ✅ Existing Navbar component
- shadcn/ui components to install

---

## Design Direction

### Aesthetic Vision: **Focused Simplicity with Purpose**

**Concept:** A clean, distraction-free interface that emphasizes progress and accomplishment. Think: productivity app meets learning journal.

**Key Design Principles:**
- **Typography:** Clear hierarchy with a distinctive display font for headers
- **Color:** Purposeful accent colors for status (active, locked, complete)
- **Motion:** Subtle transitions that guide attention
- **Space:** Generous padding to reduce cognitive load
- **Visual Cues:** Strong iconography for lock states and progress

**Tone:** Professional but encouraging, minimal but not stark, focused but friendly.

---

## Setup shadcn/ui

### Install Core Components

```bash
# Initialize shadcn/ui (if not already done)
npx shadcn-ui@latest init

# Install components we'll need
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add alert
```

These will be installed to `components/ui/` directory.

---

## Update Navigation

### Update Existing Navbar

**File:** `constants/navlinks.ts` (update existing)

Add new navigation items:

```typescript
export const navlinks = [
  { label: "Home", url: "/" },
  { label: "Goals", url: "/dashboard/goals" },
  { label: "Examples", url: "/dashboard/examples" },
  // ... other existing links
];
```

**Note:** Your existing `NavBar.tsx` component already handles:
- Mobile menu
- User authentication state
- Dynamic navigation items
- Sticky positioning

We'll keep using it as-is. Just update the `navlinks` constant to include the new routes.

---

## Create Dashboard Layout

**File:** `app/dashboard/layout.tsx`

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Container } from '@/components/Container';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">
      <Container className="py-8">
        {children}
      </Container>
    </div>
  );
}
```

---

## Create Route Files

### Dashboard Home (Goals Overview)

**File:** `app/dashboard/goals/page.tsx`

```tsx
import { Suspense } from 'react';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading as="h1" className="text-gray-900">
            Weekly Goals
          </Heading>
          <Paragraph variant="muted" className="mt-2">
            Track your learning journey, one week at a time
          </Paragraph>
        </div>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          New Week
        </Button>
      </div>

      {/* Goals List */}
      <Suspense fallback={<GoalsListSkeleton />}>
        <div className="grid gap-4">
          {/* Goals will be loaded here in Task 12 */}
          <Card className="p-8 text-center border-dashed">
            <Paragraph variant="muted">
              No weekly goals yet. Create your first one to get started!
            </Paragraph>
          </Card>
        </div>
      </Suspense>
    </div>
  );
}

function GoalsListSkeleton() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-2 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}
```

---

### Example Posts Page

**File:** `app/dashboard/examples/page.tsx`

```tsx
import { Suspense } from 'react';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';

export default function ExamplesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading as="h1" className="text-gray-900">
            Example Posts
          </Heading>
          <Paragraph variant="muted" className="mt-2">
            Save example posts to guide AI content generation
          </Paragraph>
        </div>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Example
        </Button>
      </div>

      {/* Info Alert */}
      <Card className="p-4 border-blue-200 bg-blue-50/50">
        <div className="flex gap-3">
          <div className="text-blue-600">ℹ️</div>
          <div className="text-sm">
            <p className="font-medium text-blue-900">How example posts work</p>
            <Paragraph variant="small" className="text-blue-700 mt-1">
              Save up to 2 example posts per platform (X, LinkedIn, Blog) for each goal type. 
              AI will match your style when generating content.
            </Paragraph>
          </div>
        </div>
      </Card>

      {/* Examples Grid */}
      <Suspense fallback={<ExamplesGridSkeleton />}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Examples will be loaded here in Task 11 */}
          <Card className="p-8 text-center border-dashed col-span-full">
            <Paragraph variant="muted">
              No example posts yet. Add some to improve AI content generation!
            </Paragraph>
          </Card>
        </div>
      </Suspense>
    </div>
  );
}

function ExamplesGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </Card>
      ))}
    </div>
  );
}
```

---

## Create Empty States Component

**File:** `components/EmptyState.tsx`

```tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <Card className="p-12 text-center border-dashed">
      <div className="mx-auto w-fit p-4 rounded-full bg-muted/50 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} size="lg">
          {action.label}
        </Button>
      )}
    </Card>
  );
}
```

---

## Create Loading States Component

**File:** `components/LoadingState.tsx`

```tsx
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  type: 'list' | 'grid' | 'detail';
  count?: number;
}

export default function LoadingState({ type, count = 3 }: LoadingStateProps) {
  if (type === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="p-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </Card>
  );
}
```

---

## Update Home Page

**File:** `app/page.tsx`

```tsx
import Link from 'next/link';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { Container } from '@/components/Container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Target, Lock, Sparkles, TrendingUp } from 'lucide-react';

export default async function HomePage() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect('/dashboard/goals');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">
      {/* Hero Section */}
      <Container className="py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Stay Focused. Build Consistency.
          </div>
          
          <Heading as="h1" className="text-gray-900">
            Master Skills with
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Focused Weekly Goals
            </span>
          </Heading>
          
          <Paragraph className="max-w-2xl mx-auto">
            A productivity system that enforces focus. Complete 7 daily tasks before moving to the next week. 
            No skipping, no distractions.
          </Paragraph>

          <div className="flex gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          <Card className="p-6 border-2 hover:border-blue-200 transition-colors">
            <div className="p-3 w-fit rounded-lg bg-blue-100 text-blue-600 mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <Heading as="h3" className="text-gray-900 text-lg mb-2">
              Sequential Lock System
            </Heading>
            <Paragraph variant="muted">
              Day 2 unlocks only after Day 1 is complete. Forces you to finish what you start.
            </Paragraph>
          </Card>

          <Card className="p-6 border-2 hover:border-violet-200 transition-colors">
            <div className="p-3 w-fit rounded-lg bg-violet-100 text-violet-600 mb-4">
              <Target className="h-6 w-6" />
            </div>
            <Heading as="h3" className="text-gray-900 text-lg mb-2">
              Weekly Focus
            </Heading>
            <Paragraph variant="muted">
              Can't create Week 2 until Week 1 is 100% done. One week at a time.
            </Paragraph>
          </Card>

          <Card className="p-6 border-2 hover:border-green-200 transition-colors">
            <div className="p-3 w-fit rounded-lg bg-green-100 text-green-600 mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <Heading as="h3" className="text-gray-900 text-lg mb-2">
              AI Content Generation
            </Heading>
            <Paragraph variant="muted">
              Auto-generate social posts from your work. Share your progress effortlessly.
            </Paragraph>
          </Card>
        </div>
      </Container>
    </div>
  );
}
```

---

## Styling & Theme Configuration

### Update Tailwind Config (if needed)

**File:** `tailwind.config.ts`

Ensure you have proper theme configuration:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other shadcn colors
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-in",
        "slide-up": "slide-up 0.3s ease-out",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## Visual Design Tokens

### Status Colors

```tsx
// Use these consistent colors throughout the app
const STATUS_COLORS = {
  locked: 'text-slate-400 bg-slate-100 border-slate-200',
  active: 'text-blue-600 bg-blue-50 border-blue-200',
  complete: 'text-green-600 bg-green-50 border-green-200',
};
```

---

## Responsive Design

All components use:
- Mobile-first approach
- `sm:`, `md:`, `lg:` breakpoints
- Proper spacing on small screens
- Touch-friendly tap targets (min 44px)

---

## Accessibility

Ensure all components have:
- ✅ Proper heading hierarchy (h1 → h2 → h3)
- ✅ ARIA labels where needed
- ✅ Keyboard navigation support
- ✅ Focus states visible
- ✅ Color contrast ratios meet WCAG AA

---

## Checklist

- [ ] Install shadcn/ui components
- [ ] Update `constants/navlinks.ts` with Goals and Examples routes
- [ ] Create dashboard layout with Container component
- [ ] Create `/dashboard/goals` page with Heading and Paragraph
- [ ] Create `/dashboard/examples` page with Heading and Paragraph
- [ ] Create EmptyState component (reusable)
- [ ] Create LoadingState component (reusable)
- [ ] Update home page with Heading, Paragraph, and Container
- [ ] Test navigation between pages
- [ ] Test responsive design on mobile
- [ ] Verify auth redirects work
- [ ] Verify existing NavBar shows new routes
- [ ] Check that CalSans font loads correctly in Heading

---

## Testing

### Visual Testing:
1. Navigate to home page (not logged in) → should see hero
2. Click "Get Started" → should redirect to sign-up
3. Sign in → should redirect to `/dashboard/goals`
4. Test navigation between Goals and Examples
5. Test responsive design (resize browser)
6. Verify loading skeletons appear correctly

---

## Next Steps

After completing this task:
1. Move to Task 11: Example Posts UI (full CRUD interface)
2. Then Task 12: Weekly Goals Dashboard
3. Build on this foundation with actual data

---

## Git Commit

```bash
# Stage the files
git add constants/navlinks.ts
git add components/EmptyState.tsx
git add components/LoadingState.tsx
git add app/dashboard/layout.tsx
git add app/dashboard/goals/page.tsx
git add app/dashboard/examples/page.tsx
git add app/page.tsx
git add components/ui/*  # shadcn components

# Commit
git commit -m "feat: add frontend layout and navigation

- Install and configure shadcn/ui components
- Update navlinks with Goals and Examples routes
- Add dashboard layout using Container component
- Create Goals and Examples pages using Heading/Paragraph
- Build EmptyState and LoadingState components
- Update home page with existing component system
- Implement responsive navigation
- Use CalSans font via Heading component
- Maintain consistency with existing design system"

git push origin your-branch-name
```

---

**Status:** Ready to implement  
**Previous Task:** `09-backend-testing.md` ✅  
**Next Task:** `11-example-posts-ui.md`