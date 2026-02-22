# Task 07: Content Generation API

**Phase:** 1 - Backend  
**Estimated Time:** 2-3 hours  
**Dependencies:** Task 06 (AI Integration) ✅, Task 05 (Completion Logic) ✅

---

## Objective

Create API endpoints that use the Claude AI service to generate content (X, LinkedIn, Blog posts) from completed tasks, integrating with the user's example posts for style matching.

---

## Prerequisites

- ✅ Claude AI service configured (Task 06)
- ✅ Task completion logic ready (Task 05)
- ✅ Example Posts API ready (Task 02)
- ✅ ANTHROPIC_API_KEY in environment

---

## API Endpoints to Create

### Overview

```
POST /api/content/generate              - Generate content from task completion
POST /api/content/generate-preview      - Preview without saving (optional)
GET  /api/content/generated/:taskId     - Get previously generated content
```

---

## Implementation

### 1. Generate Content Endpoint

**File:** `app/api/content/generate/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import ExamplePostModel from '@/app/api/models/ExamplePostModel';
import { generateContent } from '@/lib/claudeService';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { taskId } = await request.json();

        if (!taskId) {
            return NextResponse.json(
                { error: 'Missing required field: taskId' },
                { status: 400 }
            );
        }

        await dbConnect();

        // 1. Find the daily task
        const dailyTask = await DailyTaskModel.findById(taskId);

        if (!dailyTask) {
            return NextResponse.json(
                { error: 'Task not found' },
                { status: 404 }
            );
        }

        // 2. Verify ownership through weekly goal
        const weeklyGoal = await WeeklyGoalModel.findOne({
            _id: dailyTask.weeklyGoalId,
            clerk_id: userId
        });

        if (!weeklyGoal) {
            return NextResponse.json(
                { error: 'Unauthorized to generate content for this task' },
                { status: 403 }
            );
        }

        // 3. Check if task is completed
        if (dailyTask.status !== 'complete') {
            return NextResponse.json(
                { error: 'Can only generate content for completed tasks' },
                { status: 400 }
            );
        }

        // 4. Verify completion data exists
        if (!dailyTask.completionData || !dailyTask.completionData.code || !dailyTask.completionData.learningNotes) {
            return NextResponse.json(
                { error: 'Task completion data is missing' },
                { status: 400 }
            );
        }

        // 5. Fetch user's example posts for this goal type
        const examplePosts = await ExamplePostModel.find({
            clerk_id: userId,
            type: weeklyGoal.type
        });

        // Organize example posts by platform
        const examplesByPlatform = {
            x: examplePosts.find(p => p.platform === 'x')?.content,
            linkedin: examplePosts.find(p => p.platform === 'linkedin')?.content,
            blog: examplePosts.find(p => p.platform === 'blog')?.content
        };

        // 6. Generate content using AI
        console.log(`🤖 Generating content for task ${taskId} (${weeklyGoal.type} type)`);

        const generatedContent = await generateContent({
            code: dailyTask.completionData.code,
            learningNotes: dailyTask.completionData.learningNotes,
            goalType: weeklyGoal.type,
            examplePosts: examplesByPlatform
        });

        console.log('✅ Content generated successfully');

        // 7. Return generated content
        return NextResponse.json({
            success: true,
            data: {
                taskId: dailyTask._id,
                dayNumber: dailyTask.dayNumber,
                weekTitle: weeklyGoal.title,
                goalType: weeklyGoal.type,
                generatedContent: {
                    x_post: generatedContent.x_post,
                    linkedin_post: generatedContent.linkedin_post,
                    blog_post: generatedContent.blog_post
                },
                characterCounts: {
                    x: generatedContent.x_post.length,
                    linkedin: generatedContent.linkedin_post.length,
                    blog: generatedContent.blog_post.length
                }
            }
        });

    } catch (error) {
        console.error('Content generation error:', error);
        
        // Handle specific AI API errors
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
            { error: 'Failed to generate content. Please try again.' },
            { status: 500 }
        );
    }
}
```

---

### 2. Generate Preview (Optional - Without Saving)

**File:** `app/api/content/generate-preview/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/claudeService';

/**
 * Generate content preview without requiring a completed task
 * Useful for testing or previewing before submission
 */
export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { code, learningNotes, goalType, examplePosts } = await request.json();

        // Validate inputs
        if (!code || !learningNotes || !goalType) {
            return NextResponse.json(
                { error: 'Missing required fields: code, learningNotes, goalType' },
                { status: 400 }
            );
        }

        if (!['learning', 'product'].includes(goalType)) {
            return NextResponse.json(
                { error: 'Invalid goalType. Must be "learning" or "product"' },
                { status: 400 }
            );
        }

        // Generate content
        const generatedContent = await generateContent({
            code,
            learningNotes,
            goalType,
            examplePosts: examplePosts || {}
        });

        return NextResponse.json({
            success: true,
            data: {
                generatedContent,
                characterCounts: {
                    x: generatedContent.x_post.length,
                    linkedin: generatedContent.linkedin_post.length,
                    blog: generatedContent.blog_post.length
                }
            }
        });

    } catch (error) {
        console.error('Preview generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate preview' },
            { status: 500 }
        );
    }
}
```

---

### 3. Get Previously Generated Content

**File:** `app/api/content/generated/[taskId]/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';

/**
 * Retrieve generated content for a task if it was saved
 * This endpoint would be used if you add a feature to save generated content
 */
export async function GET(
    request: Request,
    { params }: { params: { taskId: string } }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { taskId } = params;

        await dbConnect();

        // Find task
        const dailyTask = await DailyTaskModel.findById(taskId);

        if (!dailyTask) {
            return NextResponse.json(
                { error: 'Task not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        const weeklyGoal = await WeeklyGoalModel.findOne({
            _id: dailyTask.weeklyGoalId,
            clerk_id: userId
        });

        if (!weeklyGoal) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Check if task has completion data
        if (dailyTask.status !== 'complete' || !dailyTask.completionData) {
            return NextResponse.json(
                { error: 'No completion data available for this task' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                taskId: dailyTask._id,
                dayNumber: dailyTask.dayNumber,
                description: dailyTask.description,
                completionData: dailyTask.completionData,
                weekTitle: weeklyGoal.title,
                goalType: weeklyGoal.type
            }
        });

    } catch (error) {
        console.error('Error fetching generated content:', error);
        return NextResponse.json(
            { error: 'Failed to fetch generated content' },
            { status: 500 }
        );
    }
}
```

---

## Testing the Content Generation API

### Test Workflow

**Prerequisites:**
1. Create a weekly goal
2. Create and complete a daily task
3. Optionally add example posts for better style matching

---

**1. Generate Content for Completed Task**

```http
POST http://localhost:3000/api/content/generate
Content-Type: application/json

{
  "taskId": "YOUR_COMPLETED_TASK_ID"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "taskId": "...",
    "dayNumber": 1,
    "weekTitle": "Master React Hooks",
    "goalType": "learning",
    "generatedContent": {
      "x_post": "Today I learned about useState and useEffect hooks! 🚀 The way they work together is amazing. #100DaysOfCode #ReactJS",
      "linkedin_post": "Excited to share my learning journey with React Hooks...\n\n[Full LinkedIn post here]",
      "blog_post": "# Learning React Hooks\n\n## Introduction\n\nToday I dove deep into React Hooks...\n\n[Full blog post here]"
    },
    "characterCounts": {
      "x": 125,
      "linkedin": 1850,
      "blog": 2340
    }
  }
}
```

---

**2. Try to Generate for Incomplete Task (Should Fail)**

```http
POST http://localhost:3000/api/content/generate
Content-Type: application/json

{
  "taskId": "INCOMPLETE_TASK_ID"
}
```

**Expected Response (400):**
```json
{
  "error": "Can only generate content for completed tasks"
}
```

---

**3. Generate Preview (Without Task)**

```http
POST http://localhost:3000/api/content/generate-preview
Content-Type: application/json

{
  "code": "const [count, setCount] = useState(0);",
  "learningNotes": "Learned how to manage state in React using the useState hook. It's simple and powerful!",
  "goalType": "learning",
  "examplePosts": {
    "x": "Just learned about React! 🔥 #100DaysOfCode"
  }
}
```

---

**4. Get Task Completion Data**

```http
GET http://localhost:3000/api/content/generated/[TASK_ID]
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "taskId": "...",
    "dayNumber": 1,
    "description": "Learn useState hook",
    "completionData": {
      "code": "...",
      "learningNotes": "...",
      "completedAt": "..."
    },
    "weekTitle": "Master React Hooks",
    "goalType": "learning"
  }
}
```

---

## Example Generated Content

### Learning Goal Type

**Input:**
```javascript
Code: const [user, setUser] = useState(null);
Notes: Learned how useState manages component state. The setter function triggers re-renders.
```

**X Post:**
```
Today I learned how useState manages state in React! 🎯 
The setter function triggers re-renders automatically. 
Simple but powerful. #100DaysOfCode #ReactJS
```

**LinkedIn Post:**
```
📚 Day 1: Understanding React's useState Hook

Today I dove into React Hooks, specifically useState. 
Here's what clicked for me:

The useState hook lets you add state to functional components. 
When you call the setter function, React re-renders the component 
with the new state value.

Key insight: State updates are asynchronous, so you can't 
immediately read the new value after setting it.

This foundation is crucial for building interactive UIs. 
Excited to explore useEffect next! 💪

#WebDevelopment #ReactJS #JavaScript #LearnInPublic
```

**Blog Post:**
```markdown
# Understanding React's useState Hook

## Introduction

Today I learned about React's useState hook, one of the most 
fundamental hooks for managing component state...

## What I Built

```javascript
const [user, setUser] = useState(null);
```

## Key Learnings

1. **State Management**: useState provides a simple way to add 
   state to functional components
2. **Re-rendering**: Calling the setter triggers a component re-render
3. **Asynchronous Updates**: State updates don't happen immediately

## Conclusion

Understanding useState is essential for React development. 
Tomorrow I'll explore useEffect and how it works with useState.
```

---

### Product Goal Type

**Input:**
```javascript
Code: async function handleSubmit() { await createUser(formData); }
Notes: Built user registration flow with form validation and error handling.
```

**X Post:**
```
Shipped user registration today! ✅
Added form validation and error handling.
One step closer to launch 🚀
#BuildInPublic #SaaS
```

**LinkedIn Post:**
```
🚀 Shipped: User Registration Flow

Just completed the user registration feature for our app:

✅ Form validation (client & server-side)
✅ Error handling with user-friendly messages
✅ Email verification workflow
✅ Password strength requirements

Technical highlights:
- Used React Hook Form for clean form management
- Implemented proper error boundaries
- Added loading states for better UX

The little details matter when building great products.

Next up: User dashboard! 💪

#ProductDevelopment #WebDev #BuildInPublic
```

---

## Response Time Expectations

**Typical Response Times:**
- X Post: 2-4 seconds
- LinkedIn Post: 4-6 seconds
- Blog Post: 6-10 seconds
- Total for all three: **10-15 seconds**

This is acceptable for an async operation. Consider adding loading states in the UI.

---

## Character Count Guidelines

| Platform | Recommended Range | Hard Limit |
|----------|------------------|------------|
| X/Twitter | 200-280 chars | 280 chars |
| LinkedIn | 1300-2000 chars | 3000 chars |
| Blog | 500-800 words | No hard limit |

The AI prompts are configured to stay within these ranges.

---

## Error Handling

### Common Errors:

**1. Rate Limit (429)**
```json
{
  "error": "AI service rate limit exceeded. Please try again in a moment."
}
```
**Solution:** Implement retry with exponential backoff in frontend

---

**2. Invalid API Key (401)**
```json
{
  "error": "AI service configuration error. Please contact support."
}
```
**Solution:** Check ANTHROPIC_API_KEY in environment

---

**3. Task Not Completed (400)**
```json
{
  "error": "Can only generate content for completed tasks"
}
```
**Solution:** Frontend should only show "Generate Content" button for completed tasks

---

**4. Missing Completion Data (400)**
```json
{
  "error": "Task completion data is missing"
}
```
**Solution:** This should never happen if Task 05 is implemented correctly

---

## Optimization Opportunities

### 1. Caching Generated Content

You could optionally save generated content to the database:

```typescript
// Add to DailyTask model
interface IDailyTask extends Document {
  // ... existing fields
  generatedContent?: {
    x_post: string;
    linkedin_post: string;
    blog_post: string;
    generatedAt: Date;
  };
}
```

**Benefits:**
- Avoid regenerating same content
- Show previously generated content
- User can regenerate if they want

---

### 2. Parallel Generation

Already implemented! All three platforms generate in parallel:

```typescript
const [xPost, linkedinPost, blogPost] = await Promise.all([
  generateXPost(...),
  generateLinkedInPost(...),
  generateBlogPost(...)
]);
```

---

### 3. Streaming Responses (Advanced)

For future enhancement, you could stream AI responses:

```typescript
// Stream each platform's content as it's generated
// Requires WebSocket or Server-Sent Events
```

---

## Security Considerations

✅ **Authentication:** All endpoints require Clerk auth  
✅ **Authorization:** Verify task ownership through weekly goal  
✅ **Input Validation:** Task must be completed  
✅ **Rate Limiting:** Handled by Anthropic API  
✅ **API Key Security:** Never exposed to client  
✅ **Data Sanitization:** Already done in Task 05  

---

## Checklist

- [ ] Create `app/api/content/generate/route.ts`
- [ ] Create `app/api/content/generate-preview/route.ts` (optional)
- [ ] Create `app/api/content/generated/[taskId]/route.ts`
- [ ] Test generate endpoint with completed task
- [ ] Test generate endpoint with incomplete task (should fail)
- [ ] Test generate endpoint without example posts
- [ ] Test generate endpoint with example posts
- [ ] Test both learning and product goal types
- [ ] Verify character counts are within limits
- [ ] Test error handling (rate limits, invalid API key)
- [ ] Test preview endpoint (optional)
- [ ] Measure response times

---

## Next Steps

After completing this task:
1. Move to Task 08: Weekly Wrap-up API
2. That will integrate the weekly wrap-up service
3. Then move to frontend implementation (Task 10+)

---

## Git Commit

After successfully completing and testing this task:

```bash
# Stage the files
git add app/api/content/generate/route.ts
git add app/api/content/generate-preview/route.ts
git add app/api/content/generated/[taskId]/route.ts

# Commit with descriptive message
git commit -m "feat: add content generation API endpoints

- Add POST /api/content/generate for task-based generation
- Add POST /api/content/generate-preview for testing
- Add GET /api/content/generated/:taskId for retrieval
- Integrate with Claude AI service
- Fetch and use example posts for style matching
- Support both learning and product goal types
- Add character count tracking
- Implement error handling for AI service
- Add ownership verification and auth checks
- Include detailed logging for debugging"

# Push to your branch
git push origin your-branch-name
```

---

**Status:** Ready to implement  
**Previous Task:** `06-ai-integration-setup.md` ✅  
**Next Task:** `08-weekly-wrapup-api.md`