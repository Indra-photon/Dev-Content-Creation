# Task 08: Weekly Wrap-up API

**Phase:** 1 - Backend  
**Estimated Time:** 2 hours  
**Dependencies:** Task 07 (Content Generation API) ✅, Task 06 (AI Integration) ✅

---

## Objective

Create API endpoint to generate weekly wrap-up content that synthesizes all 7 daily tasks into cohesive summary posts for X, LinkedIn, and Blog.

---

## Prerequisites

- ✅ Weekly wrap-up service created (Task 06)
- ✅ Content generation API completed (Task 07)
- ✅ Weekly goals with completion status (Task 03)
- ✅ Daily tasks with completion data (Task 04-05)

---

## API Endpoint to Create

### Overview

```
POST /api/content/weekly-wrapup    - Generate weekly summary content
```

---

## Implementation

### Weekly Wrap-up Generation Endpoint

**File:** `app/api/content/weekly-wrapup/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import ExamplePostModel from '@/app/api/models/ExamplePostModel';
import { generateWeeklyWrapup } from '@/lib/weeklyWrapupService';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { weeklyGoalId } = await request.json();

        if (!weeklyGoalId) {
            return NextResponse.json(
                { error: 'Missing required field: weeklyGoalId' },
                { status: 400 }
            );
        }

        await dbConnect();

        // 1. Find the weekly goal
        const weeklyGoal = await WeeklyGoalModel.findOne({
            _id: weeklyGoalId,
            clerk_id: userId
        });

        if (!weeklyGoal) {
            return NextResponse.json(
                { error: 'Weekly goal not found or unauthorized' },
                { status: 404 }
            );
        }

        // 2. Verify week is complete
        if (weeklyGoal.status !== 'complete') {
            // Count completed tasks to give helpful feedback
            const completedCount = await DailyTaskModel.countDocuments({
                weeklyGoalId,
                status: 'complete'
            });

            return NextResponse.json(
                { 
                    error: 'Weekly goal is not complete yet',
                    progress: {
                        completed: completedCount,
                        total: 7,
                        remaining: 7 - completedCount
                    }
                },
                { status: 400 }
            );
        }

        // 3. Fetch all 7 daily tasks with completion data
        const dailyTasks = await DailyTaskModel.find({
            weeklyGoalId,
            status: 'complete'
        }).sort({ dayNumber: 1 });

        // Verify all 7 tasks are complete
        if (dailyTasks.length !== 7) {
            return NextResponse.json(
                { 
                    error: `Expected 7 completed tasks, found ${dailyTasks.length}`,
                    completedTasks: dailyTasks.length
                },
                { status: 400 }
            );
        }

        // 4. Verify all tasks have completion data
        const tasksWithoutData = dailyTasks.filter(
            t => !t.completionData || !t.completionData.code || !t.completionData.learningNotes
        );

        if (tasksWithoutData.length > 0) {
            return NextResponse.json(
                { 
                    error: 'Some tasks are missing completion data',
                    tasksWithoutData: tasksWithoutData.map(t => t.dayNumber)
                },
                { status: 400 }
            );
        }

        // 5. Fetch user's example posts for this goal type
        const examplePosts = await ExamplePostModel.find({
            clerk_id: userId,
            type: weeklyGoal.type
        });

        // Organize by platform
        const examplesByPlatform = {
            x: examplePosts.find(p => p.platform === 'x')?.content,
            linkedin: examplePosts.find(p => p.platform === 'linkedin')?.content,
            blog: examplePosts.find(p => p.platform === 'blog')?.content
        };

        // 6. Prepare daily tasks data for AI
        const dailyTasksData = dailyTasks.map(task => ({
            dayNumber: task.dayNumber,
            description: task.description,
            code: task.completionData!.code,
            learningNotes: task.completionData!.learningNotes
        }));

        // 7. Generate weekly wrap-up content
        console.log(`📊 Generating weekly wrap-up for goal ${weeklyGoalId} (${weeklyGoal.type} type)`);

        const wrapupContent = await generateWeeklyWrapup({
            weekTitle: weeklyGoal.title,
            goalType: weeklyGoal.type,
            dailyTasks: dailyTasksData,
            examplePosts: examplesByPlatform
        });

        console.log('✅ Weekly wrap-up generated successfully');

        // 8. Calculate statistics
        const totalCodeLines = dailyTasks.reduce((sum, task) => {
            const lines = task.completionData!.code.split('\n').length;
            return sum + lines;
        }, 0);

        const totalNotesLength = dailyTasks.reduce((sum, task) => {
            return sum + task.completionData!.learningNotes.length;
        }, 0);

        // 9. Return generated content with metadata
        return NextResponse.json({
            success: true,
            data: {
                weeklyGoalId: weeklyGoal._id,
                weekTitle: weeklyGoal.title,
                goalType: weeklyGoal.type,
                completedAt: weeklyGoal.completedAt,
                generatedContent: {
                    x_post: wrapupContent.x_post,
                    linkedin_post: wrapupContent.linkedin_post,
                    blog_post: wrapupContent.blog_post
                },
                characterCounts: {
                    x: wrapupContent.x_post.length,
                    linkedin: wrapupContent.linkedin_post.length,
                    blog: wrapupContent.blog_post.length
                },
                weekStats: {
                    totalTasks: 7,
                    totalCodeLines,
                    totalNotesLength,
                    averageNotesPerDay: Math.round(totalNotesLength / 7),
                    startDate: weeklyGoal.startDate,
                    completedAt: weeklyGoal.completedAt,
                    daysToComplete: Math.ceil(
                        (new Date(weeklyGoal.completedAt!).getTime() - new Date(weeklyGoal.startDate).getTime()) 
                        / (1000 * 60 * 60 * 24)
                    )
                }
            }
        });

    } catch (error) {
        console.error('Weekly wrap-up generation error:', error);

        // Handle AI API errors
        if (error?.status === 429) {
            return NextResponse.json(
                { error: 'AI service rate limit exceeded. Please try again in a moment.' },
                { status: 429 }
            );
        }

        if (error?.status === 401) {
            return NextResponse.json(
                { error: 'AI service configuration error. Please contact support.' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to generate weekly wrap-up. Please try again.' },
            { status: 500 }
        );
    }
}
```

---

## Testing the Weekly Wrap-up API

### Test Workflow

**Prerequisites:**
1. Complete an entire weekly goal (all 7 tasks done)
2. Verify weekly goal status is 'complete'
3. Optionally add example posts for style matching

---

**1. Generate Weekly Wrap-up**

```http
POST http://localhost:3000/api/content/weekly-wrapup
Content-Type: application/json

{
  "weeklyGoalId": "YOUR_COMPLETED_WEEKLY_GOAL_ID"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "weeklyGoalId": "...",
    "weekTitle": "Master React Hooks",
    "goalType": "learning",
    "completedAt": "2024-02-20T10:30:00.000Z",
    "generatedContent": {
      "x_post": "🎉 Week complete! Spent 7 days mastering React Hooks:\n\nDay 1: useState basics\nDay 2: useEffect & cleanup\nDay 3: Custom hooks\n...\n\n#100DaysOfCode #ReactJS",
      "linkedin_post": "📚 Weekly Recap: Mastering React Hooks\n\nJust wrapped up an intensive week diving deep into React Hooks...\n\n[Full LinkedIn post]",
      "blog_post": "# Week 1: Mastering React Hooks - A Journey\n\n## Overview\n\nThis week I completed a comprehensive study of React Hooks...\n\n[Full blog post]"
    },
    "characterCounts": {
      "x": 245,
      "linkedin": 2100,
      "blog": 3200
    },
    "weekStats": {
      "totalTasks": 7,
      "totalCodeLines": 342,
      "totalNotesLength": 2450,
      "averageNotesPerDay": 350,
      "startDate": "2024-02-13T10:00:00.000Z",
      "completedAt": "2024-02-20T10:30:00.000Z",
      "daysToComplete": 7
    }
  }
}
```

---

**2. Try to Generate for Incomplete Week (Should Fail)**

```http
POST http://localhost:3000/api/content/weekly-wrapup
Content-Type: application/json

{
  "weeklyGoalId": "INCOMPLETE_WEEKLY_GOAL_ID"
}
```

**Expected Response (400):**
```json
{
  "error": "Weekly goal is not complete yet",
  "progress": {
    "completed": 5,
    "total": 7,
    "remaining": 2
  }
}
```

---

**3. Try with Non-Existent Weekly Goal**

```http
POST http://localhost:3000/api/content/weekly-wrapup
Content-Type: application/json

{
  "weeklyGoalId": "invalid_id_123"
}
```

**Expected Response (404):**
```json
{
  "error": "Weekly goal not found or unauthorized"
}
```

---

## Example Generated Weekly Wrap-ups

### Learning Goal Type

**Week:** "Master React Hooks"  
**Days:**
- Day 1: useState basics
- Day 2: useEffect & cleanup
- Day 3: useContext
- Day 4: useReducer
- Day 5: Custom hooks
- Day 6: Performance hooks (useMemo, useCallback)
- Day 7: Advanced patterns

**X Post (Thread):**
```
🎉 Week complete! Spent 7 days mastering React Hooks.

Here's what I learned:

Day 1-2: useState & useEffect fundamentals
Day 3-4: Context & Reducer for state management  
Day 5: Building custom hooks
Day 6-7: Performance optimization

The journey from basics to advanced patterns! 🚀

#100DaysOfCode #ReactJS #WebDev
---
Key insight: Custom hooks are game-changers for code reusability. 

Started the week not knowing hooks, ending it building my own! 💪

What should I learn next? 👇
```

**LinkedIn Post:**
```
📚 Weekly Learning Recap: Mastering React Hooks

I just wrapped up an intensive week diving deep into React Hooks, 
and I wanted to share my journey and key learnings.

🎯 Week Overview:
Started with the fundamentals (useState, useEffect) and progressed 
to advanced patterns (custom hooks, performance optimization).

💡 Key Learnings:

1. useState & useEffect are the foundation - understanding these 
   deeply makes everything else click

2. useContext + useReducer can replace Redux in many cases - 
   game-changer for state management

3. Custom hooks are incredibly powerful for code reusability - 
   I built 5 custom hooks this week

4. Performance matters - useMemo and useCallback prevent 
   unnecessary re-renders

🚀 What Clicked:
The "aha moment" was Day 5 when I realized hooks are just 
JavaScript functions with special powers. Once that clicked, 
building custom hooks became natural.

📊 Stats:
- 7 days of focused learning
- 342 lines of code written
- 5 custom hooks created
- Countless "aha!" moments

🎓 What's Next:
Taking these learnings into a real project - building a task 
management app using everything I learned this week.

To anyone learning React: Hooks might seem complex at first, 
but they're actually simpler than class components once you 
get the mental model right.

#WebDevelopment #ReactJS #JavaScript #LearnInPublic #TechCareer
```

**Blog Post:**
```markdown
# Week 1: Mastering React Hooks - A Learning Journey

## Overview

This week, I embarked on an intensive journey to master React Hooks. 
What started as basic state management ended with building custom 
hooks and understanding performance optimization. Here's how it went.

## The Week Breakdown

### Days 1-2: Foundation (useState & useEffect)

The first two days were all about understanding the core hooks.

```javascript
const [count, setCount] = useState(0);

useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);
```

**Key Learning:** State updates are asynchronous, and the dependency 
array in useEffect is crucial for preventing infinite loops.

### Days 3-4: State Management (useContext & useReducer)

Mid-week, I explored more advanced state management patterns.

```javascript
const [state, dispatch] = useReducer(reducer, initialState);
```

**Key Learning:** For complex state logic, useReducer is cleaner 
than multiple useState calls.

### Day 5: Custom Hooks

This was the breakthrough day. I realized I could extract common 
logic into reusable custom hooks.

```javascript
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue];
}
```

**Key Learning:** Custom hooks follow the same rules as built-in 
hooks and can use other hooks internally.

### Days 6-7: Performance Optimization

The final days focused on performance with useMemo and useCallback.

```javascript
const memoizedValue = useMemo(() => computeExpensive(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);
```

**Key Learning:** These are optimization tools, not default choices. 
Premature optimization is still the root of all evil.

## Challenges Overcome

1. **Stale Closures:** Understanding why useEffect sometimes had 
   stale values took time, but the dependency array solved it.

2. **Rules of Hooks:** Initially tried to use hooks conditionally 
   (which breaks things). The linter helped enforce the rules.

3. **Re-render Loops:** Created a few infinite loops before 
   understanding dependency arrays properly.

## What I Built

Throughout the week, I built several mini-projects:
- Todo app with local storage (custom hook)
- Form with validation (multiple hooks)
- Data fetching component (useEffect + useState)
- Theme switcher (useContext)

## Key Takeaways

1. **Hooks are just functions** - This mental model makes everything 
   easier to understand

2. **Composition over inheritance** - Hooks encourage composing 
   behavior rather than extending classes

3. **The dependency array is your friend** - Most bugs come from 
   incorrect dependencies

4. **Custom hooks are powerful** - Extract common logic early

## Stats

- 📝 7 days of focused learning
- 💻 342 lines of code
- 🎣 5 custom hooks created
- ⏱️ Estimated 25 hours of learning

## What's Next

Next week, I'm building a real-world project using all these hooks. 
A task management application that leverages:
- useState for local component state
- useContext for global theme/auth
- Custom hooks for API calls
- useReducer for complex task state

The best way to solidify knowledge is to build something real.

## Resources

If you're learning React Hooks, here are my top resources:
- React official docs (start here)
- Kent C. Dodds' blog (deep dives)
- Building small projects (nothing beats practice)

---

Thanks for reading! If you're on a similar learning journey, 
I'd love to hear about it. What challenges did you face with hooks?
```

---

### Product Goal Type

**Week:** "Build User Dashboard"

**X Post:**
```
Week 1 of building our user dashboard ✅

Shipped:
✓ User profile page
✓ Analytics charts
✓ Real-time notifications
✓ Settings panel
✓ Data export
✓ Dark mode
✓ Mobile responsive

7 days, 7 features. Momentum! 🚀

#BuildInPublic #SaaS
```

**LinkedIn Post:**
```
🚀 Shipped: Complete User Dashboard (Week 1)

Exciting milestone this week - we shipped the core user dashboard 
for our product. Here's how it went down:

📊 What We Built:
Over 7 days, we implemented 7 major features:

Day 1-2: User profile management with avatar upload
Day 3: Analytics dashboard with Chart.js integration
Day 4: Real-time notification system (WebSockets)
Day 5: Comprehensive settings panel
Day 6: Data export functionality (CSV/JSON)
Day 7: Polish - dark mode + mobile responsiveness

🎯 Technical Highlights:

The notification system was the most challenging. We went with 
WebSockets for real-time updates and implemented proper reconnection 
logic for reliability.

The analytics dashboard required optimization - we're using React.memo 
and useMemo to prevent unnecessary re-renders when dealing with 
large datasets.

📈 Impact:

Early user testing shows 85% of beta users are actively using the 
dashboard daily. The real-time notifications are a hit.

🔧 Tech Stack:
React + TypeScript, Chart.js, Socket.io, TailwindCSS

⏭️ What's Next:
Week 2 focuses on team collaboration features - shared dashboards, 
commenting, and role-based access control.

Building in public is both terrifying and exciting. Grateful for 
the feedback from our early users! 🙏

#ProductDevelopment #BuildInPublic #SaaS #WebDevelopment #TypeScript
```

---

## Response Time Expectations

**Typical Response Times:**
- Weekly wrap-up generation: **15-25 seconds**

This is longer than single-task generation because:
- Processing 7 tasks of data
- Generating longer, more comprehensive content
- Synthesizing multiple days into cohesive narrative

**Recommendation:** Show a progress indicator in the UI with a message like "Generating your weekly recap... This may take 15-20 seconds"

---

## Validation Rules

### Weekly Wrap-up Generation Requirements:
- ✅ Weekly goal must exist and belong to user
- ✅ Weekly goal status must be 'complete'
- ✅ All 7 tasks must be completed
- ✅ All 7 tasks must have completion data (code + notes)
- ✅ User must be authenticated

---

## Error Handling

### Common Errors:

**1. Week Not Complete**
```json
{
  "error": "Weekly goal is not complete yet",
  "progress": {
    "completed": 5,
    "total": 7,
    "remaining": 2
  }
}
```

**2. Missing Completion Data**
```json
{
  "error": "Some tasks are missing completion data",
  "tasksWithoutData": [3, 5]
}
```

**3. Insufficient Tasks**
```json
{
  "error": "Expected 7 completed tasks, found 6",
  "completedTasks": 6
}
```

---

## Additional Features (Optional)

### 1. Save Generated Wrap-up

You could save the generated wrap-up to the WeeklyGoal model:

```typescript
// Add to WeeklyGoal interface
interface IWeeklyGoal extends Document {
  // ... existing fields
  wrapupContent?: {
    x_post: string;
    linkedin_post: string;
    blog_post: string;
    generatedAt: Date;
  };
}
```

### 2. Regenerate Wrap-up

Allow users to regenerate if they're not satisfied:

```typescript
// Check if wrap-up already exists
if (weeklyGoal.wrapupContent) {
  // Optionally prompt: "Wrap-up already exists. Regenerate?"
}
```

---

## Checklist

- [ ] Create `app/api/content/weekly-wrapup/route.ts`
- [ ] Test with completed weekly goal (7/7 tasks)
- [ ] Test with incomplete weekly goal (should fail)
- [ ] Test with missing completion data (should fail)
- [ ] Test both learning and product goal types
- [ ] Test with and without example posts
- [ ] Verify character counts are appropriate
- [ ] Verify week stats calculations
- [ ] Test error handling
- [ ] Measure response time (should be 15-25 seconds)

---

## Next Steps

After completing this task:
1. Backend is now complete! 🎉
2. Move to Task 09: Backend Testing (comprehensive testing)
3. Then start frontend development (Task 10+)

---

## Git Commit

After successfully completing and testing this task:

```bash
# Stage the file
git add app/api/content/weekly-wrapup/route.ts

# Commit with descriptive message
git commit -m "feat: add weekly wrap-up generation API

- Add POST /api/content/weekly-wrapup endpoint
- Integrate with weekly wrap-up AI service
- Validate all 7 tasks are completed with data
- Fetch and use example posts for style matching
- Calculate week statistics (code lines, days to complete)
- Support both learning and product goal types
- Add comprehensive error handling and validation
- Include detailed progress feedback for incomplete weeks
- Return character counts and metadata"

# Push to your branch
git push origin your-branch-name
```

---

**Status:** Ready to implement  
**Previous Task:** `07-content-generation-api.md` ✅  
**Next Task:** `09-backend-testing.md`