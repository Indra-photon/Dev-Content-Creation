# Task 04: Daily Tasks API

**Phase:** 1 - Backend  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 01 (Models) ✅, Task 03 (Weekly Goals API) ✅

---

## Objective

Create API endpoints for managing daily tasks with the lock system that enforces sequential completion. Day N+1 is locked until Day N is complete.

---

## Prerequisites

- ✅ DailyTaskModel created (Task 01)
- ✅ WeeklyGoalModel created (Task 01)
- ✅ Weekly Goals API ready (Task 03)
- ✅ Clerk authentication configured

---

## API Endpoints to Create

### Overview

```
POST   /api/daily-tasks                  - Add new daily task
GET    /api/daily-tasks?weeklyGoalId=x   - Get all tasks for a week
GET    /api/daily-tasks/:id              - Get single task
PUT    /api/daily-tasks/:id              - Update task details
POST   /api/daily-tasks/:id/complete     - Mark task as complete
```

---

## Lock System Rules

### Critical Logic:
1. **Day 1 is ALWAYS active when created**
2. **Day 2-7 are ALWAYS locked when created**
3. **Day N+1 unlocks ONLY when Day N is marked complete**
4. **Cannot create tasks out of order (must create Day 1, then 2, then 3...)**
5. **Cannot skip days**
6. **Max 7 tasks per weekly goal**

---

## Implementation

### 1. Create Daily Task (POST)

**File:** `app/api/daily-tasks/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { weeklyGoalId, description, resources } = await request.json();

        // Validate required fields
        if (!weeklyGoalId || !description) {
            return NextResponse.json(
                { error: 'Missing required fields: weeklyGoalId, description' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Verify weekly goal exists and belongs to user
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

        // Check if week is already complete
        if (weeklyGoal.status === 'complete') {
            return NextResponse.json(
                { error: 'Cannot add tasks to a completed weekly goal' },
                { status: 400 }
            );
        }

        // Count existing tasks for this week
        const existingTasksCount = await DailyTaskModel.countDocuments({
            weeklyGoalId
        });

        // Check max limit (7 tasks per week)
        if (existingTasksCount >= 7) {
            return NextResponse.json(
                { error: 'Maximum 7 tasks per week. This week is full.' },
                { status: 400 }
            );
        }

        // Determine the day number (sequential)
        const dayNumber = existingTasksCount + 1;

        // Get the previous day's task to check if it exists and is complete
        if (dayNumber > 1) {
            const previousTask = await DailyTaskModel.findOne({
                weeklyGoalId,
                dayNumber: dayNumber - 1
            });

            if (!previousTask) {
                return NextResponse.json(
                    { error: `You must create Day ${dayNumber - 1} before creating Day ${dayNumber}` },
                    { status: 400 }
                );
            }

            // Note: We don't check if previous task is complete for CREATION
            // We only check completion status for UNLOCKING (which happens on completion)
        }

        // Determine initial status
        // Day 1 is always active, Day 2-7 start as locked
        const initialStatus = dayNumber === 1 ? 'active' : 'locked';

        // Create the daily task
        const dailyTask = await DailyTaskModel.create({
            weeklyGoalId,
            dayNumber,
            description,
            resources: resources || [],
            status: initialStatus
        });

        // Add task reference to weekly goal
        await WeeklyGoalModel.findByIdAndUpdate(
            weeklyGoalId,
            {
                $push: { dailyTasks: dailyTask._id }
            }
        );

        return NextResponse.json({
            success: true,
            data: dailyTask
        }, { status: 201 });

    } catch (error) {
        console.error('Daily task creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create daily task' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const weeklyGoalId = searchParams.get('weeklyGoalId');

        if (!weeklyGoalId) {
            return NextResponse.json(
                { error: 'weeklyGoalId query parameter is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Verify weekly goal belongs to user
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

        // Fetch all daily tasks for this week, sorted by day number
        const dailyTasks = await DailyTaskModel.find({
            weeklyGoalId
        }).sort({ dayNumber: 1 });

        return NextResponse.json({
            success: true,
            data: dailyTasks,
            count: dailyTasks.length
        });

    } catch (error) {
        console.error('Daily tasks fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch daily tasks' },
            { status: 500 }
        );
    }
}
```

---

### 2. Get Single Task, Update Task

**File:** `app/api/daily-tasks/[id]/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = params;

        await dbConnect();

        // Find the task
        const dailyTask = await DailyTaskModel.findById(id);

        if (!dailyTask) {
            return NextResponse.json(
                { error: 'Daily task not found' },
                { status: 404 }
            );
        }

        // Verify ownership through weekly goal
        const weeklyGoal = await WeeklyGoalModel.findOne({
            _id: dailyTask.weeklyGoalId,
            clerk_id: userId
        });

        if (!weeklyGoal) {
            return NextResponse.json(
                { error: 'Unauthorized to view this task' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            data: dailyTask
        });

    } catch (error) {
        console.error('Daily task fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch daily task' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = params;
        const { description, resources } = await request.json();

        await dbConnect();

        // Find the task
        const dailyTask = await DailyTaskModel.findById(id);

        if (!dailyTask) {
            return NextResponse.json(
                { error: 'Daily task not found' },
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
                { error: 'Unauthorized to update this task' },
                { status: 403 }
            );
        }

        // Don't allow updating completed tasks
        if (dailyTask.status === 'complete') {
            return NextResponse.json(
                { error: 'Cannot update a completed task' },
                { status: 400 }
            );
        }

        // Update the task (only description and resources)
        const updatedTask = await DailyTaskModel.findByIdAndUpdate(
            id,
            {
                ...(description && { description }),
                ...(resources && { resources })
            },
            { new: true, runValidators: true }
        );

        return NextResponse.json({
            success: true,
            data: updatedTask
        });

    } catch (error) {
        console.error('Daily task update error:', error);
        return NextResponse.json(
            { error: 'Failed to update daily task' },
            { status: 500 }
        );
    }
}
```

---

### 3. Mark Task Complete (Critical Endpoint)

**File:** `app/api/daily-tasks/[id]/complete/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import { checkAndCompleteWeek } from '@/app/api/utils/weeklyGoalHelpers';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = params;
        const { code, learningNotes } = await request.json();

        // Validate completion data
        if (!code || !learningNotes) {
            return NextResponse.json(
                { error: 'Missing required fields: code, learningNotes' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find the task
        const dailyTask = await DailyTaskModel.findById(id);

        if (!dailyTask) {
            return NextResponse.json(
                { error: 'Daily task not found' },
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
                { error: 'Unauthorized to complete this task' },
                { status: 403 }
            );
        }

        // Check if task is already complete
        if (dailyTask.status === 'complete') {
            return NextResponse.json(
                { error: 'Task is already completed' },
                { status: 400 }
            );
        }

        // Check if task is locked
        if (dailyTask.status === 'locked') {
            return NextResponse.json(
                { error: `This task is locked. Complete Day ${dailyTask.dayNumber - 1} first.` },
                { status: 400 }
            );
        }

        // Mark task as complete
        dailyTask.status = 'complete';
        dailyTask.completionData = {
            code,
            learningNotes,
            completedAt: new Date()
        };
        await dailyTask.save();

        // Unlock the next task (Day N+1)
        if (dailyTask.dayNumber < 7) {
            const nextTask = await DailyTaskModel.findOne({
                weeklyGoalId: dailyTask.weeklyGoalId,
                dayNumber: dailyTask.dayNumber + 1
            });

            if (nextTask && nextTask.status === 'locked') {
                nextTask.status = 'active';
                await nextTask.save();
                
                console.log(`Day ${nextTask.dayNumber} unlocked!`);
            }
        }

        // Check if week is now complete (all 7 tasks done)
        await checkAndCompleteWeek(dailyTask.weeklyGoalId.toString());

        return NextResponse.json({
            success: true,
            data: dailyTask,
            message: dailyTask.dayNumber < 7 
                ? `Task completed! Day ${dailyTask.dayNumber + 1} is now unlocked.`
                : 'Task completed! This was the final task of the week.'
        });

    } catch (error) {
        console.error('Task completion error:', error);
        return NextResponse.json(
            { error: 'Failed to complete task' },
            { status: 500 }
        );
    }
}
```

---

## Testing the API

### Manual Testing Workflow

**1. Create Day 1 Task**
```http
POST http://localhost:3000/api/daily-tasks
Content-Type: application/json

{
  "weeklyGoalId": "YOUR_WEEKLY_GOAL_ID",
  "description": "Learn useState hook",
  "resources": [
    {
      "url": "https://react.dev/reference/react/useState",
      "title": "React Docs - useState"
    }
  ]
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "weeklyGoalId": "...",
    "dayNumber": 1,
    "description": "Learn useState hook",
    "resources": [...],
    "status": "active",
    "createdAt": "..."
  }
}
```

---

**2. Try to Create Day 3 (should fail - must create Day 2 first)**
```http
POST http://localhost:3000/api/daily-tasks
Content-Type: application/json

{
  "weeklyGoalId": "YOUR_WEEKLY_GOAL_ID",
  "description": "Learn useContext hook"
}
```

**Expected Response (400):**
```json
{
  "error": "You must create Day 2 before creating Day 3"
}
```

---

**3. Create Day 2 Task (should be locked)**
```http
POST http://localhost:3000/api/daily-tasks
Content-Type: application/json

{
  "weeklyGoalId": "YOUR_WEEKLY_GOAL_ID",
  "description": "Learn useEffect hook"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "dayNumber": 2,
    "status": "locked",
    ...
  }
}
```

---

**4. Try to Complete Day 2 (should fail - it's locked)**
```http
POST http://localhost:3000/api/daily-tasks/[DAY_2_ID]/complete
Content-Type: application/json

{
  "code": "const [count, setCount] = useState(0);",
  "learningNotes": "useState is amazing!"
}
```

**Expected Response (400):**
```json
{
  "error": "This task is locked. Complete Day 1 first."
}
```

---

**5. Complete Day 1 (should unlock Day 2)**
```http
POST http://localhost:3000/api/daily-tasks/[DAY_1_ID]/complete
Content-Type: application/json

{
  "code": "const [count, setCount] = useState(0);\nsetCount(count + 1);",
  "learningNotes": "Learned how to use useState for state management. The setter function triggers re-render."
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "dayNumber": 1,
    "status": "complete",
    "completionData": {
      "code": "...",
      "learningNotes": "...",
      "completedAt": "..."
    }
  },
  "message": "Task completed! Day 2 is now unlocked."
}
```

---

**6. Verify Day 2 is Now Active**
```http
GET http://localhost:3000/api/daily-tasks?weeklyGoalId=YOUR_WEEKLY_GOAL_ID
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "dayNumber": 1,
      "status": "complete"
    },
    {
      "dayNumber": 2,
      "status": "active"  // Changed from locked!
    }
  ]
}
```

---

**7. Get All Tasks for a Week**
```http
GET http://localhost:3000/api/daily-tasks?weeklyGoalId=YOUR_WEEKLY_GOAL_ID
```

---

**8. Update Task (before completion)**
```http
PUT http://localhost:3000/api/daily-tasks/[TASK_ID]
Content-Type: application/json

{
  "description": "Master useEffect hook with cleanup",
  "resources": [
    {
      "url": "https://react.dev/reference/react/useEffect",
      "title": "React Docs - useEffect"
    }
  ]
}
```

---

**9. Try to Update Completed Task (should fail)**
```http
PUT http://localhost:3000/api/daily-tasks/[COMPLETED_TASK_ID]

{
  "description": "New description"
}
```

**Expected Response (400):**
```json
{
  "error": "Cannot update a completed task"
}
```

---

**10. Complete All 7 Tasks (Week Auto-Completes)**

After completing Day 7:
```http
POST http://localhost:3000/api/daily-tasks/[DAY_7_ID]/complete

{
  "code": "...",
  "learningNotes": "..."
}
```

**Expected:**
- Task marked complete
- Weekly goal status automatically changes to 'complete'
- completedAt timestamp set on weekly goal

---

## Edge Cases to Test

1. **Create task for non-existent week** → 404
2. **Create task for completed week** → 400
3. **Try to create 8th task** → 400 (max 7)
4. **Complete locked task** → 400
5. **Complete already completed task** → 400
6. **Update other user's task** → 403
7. **Missing completion data** → 400
8. **Skip day creation** → 400

---

## Lock System Flow Diagram

```
Week Created
    ↓
Day 1: ACTIVE (user creates)
Day 2: LOCKED (user creates)
Day 3: LOCKED (user creates)
...
    ↓
User completes Day 1
    ↓
Day 1: COMPLETE
Day 2: ACTIVE (auto-unlocked!)
    ↓
User completes Day 2
    ↓
Day 2: COMPLETE
Day 3: ACTIVE (auto-unlocked!)
    ↓
... continue pattern ...
    ↓
User completes Day 7
    ↓
Day 7: COMPLETE
Weekly Goal: COMPLETE (auto!)
    ↓
User can now create Week 2
```

---

## Validation Rules Summary

### POST `/api/daily-tasks`
- ✅ User must be authenticated
- ✅ Required: `weeklyGoalId`, `description`
- ✅ Optional: `resources` array
- ✅ Weekly goal must exist and belong to user
- ✅ Weekly goal cannot be complete
- ✅ Max 7 tasks per week
- ✅ Must create tasks sequentially (1, 2, 3...)
- ✅ Day 1 starts as 'active', Days 2-7 start as 'locked'

### GET `/api/daily-tasks?weeklyGoalId=x`
- ✅ User must be authenticated
- ✅ weeklyGoalId query param required
- ✅ Weekly goal must belong to user
- ✅ Returns tasks sorted by dayNumber

### PUT `/api/daily-tasks/:id`
- ✅ User must be authenticated
- ✅ Can only update own tasks
- ✅ Cannot update completed tasks
- ✅ Can update: `description`, `resources`

### POST `/api/daily-tasks/:id/complete`
- ✅ User must be authenticated
- ✅ Required: `code`, `learningNotes`
- ✅ Task cannot be locked
- ✅ Task cannot already be complete
- ✅ Auto-unlocks next task
- ✅ Auto-completes week if 7/7 done

---

## Checklist

- [ ] Create `app/api/daily-tasks/route.ts` with POST and GET
- [ ] Create `app/api/daily-tasks/[id]/route.ts` with GET and PUT
- [ ] Create `app/api/daily-tasks/[id]/complete/route.ts` with POST
- [ ] Test POST - Create Day 1 (should be active)
- [ ] Test POST - Create Day 2 (should be locked)
- [ ] Test POST - Try to skip days (should fail)
- [ ] Test POST - Try to create 8th task (should fail)
- [ ] Test GET - List all tasks for week
- [ ] Test PUT - Update task description
- [ ] Test PUT - Try to update completed task (should fail)
- [ ] Test Complete - Try to complete locked task (should fail)
- [ ] Test Complete - Complete Day 1 (should unlock Day 2)
- [ ] Test Complete - Verify Day 2 status changed to active
- [ ] Test Complete - Complete all 7 tasks (week auto-completes)
- [ ] Verify week auto-completion logic works

---

## Common Issues & Solutions

**Issue:** Day 2 not unlocking after Day 1 completion  
**Solution:** Check the unlock logic in complete endpoint - ensure it finds and updates nextTask

**Issue:** Can create tasks out of order  
**Solution:** Verify sequential check in POST - should count existing tasks and enforce day number

**Issue:** Locked task can be completed  
**Solution:** Check status validation in complete endpoint

**Issue:** Week not auto-completing after 7th task  
**Solution:** Verify `checkAndCompleteWeek()` is being called in complete endpoint

---

## Next Steps

After completing this task:
1. Move to Task 05: Task Completion Logic (refinement)
2. This will add any additional business logic around completion
3. Then move to AI integration (Task 06)

---

## Git Commit

After successfully completing and testing this task:

```bash
# Stage the API files
git add app/api/daily-tasks/route.ts
git add app/api/daily-tasks/[id]/route.ts
git add app/api/daily-tasks/[id]/complete/route.ts

# Commit with descriptive message
git commit -m "feat: add Daily Tasks API with lock system

- Add POST endpoint to create tasks sequentially
- Add GET endpoint to list tasks for a week
- Add PUT endpoint to update task details
- Add POST complete endpoint with unlock logic
- Implement Day 1 active, Days 2-7 locked on creation
- Auto-unlock next day when current day completed
- Prevent skipping days or creating out of order
- Integrate with week auto-completion helper
- Enforce max 7 tasks per week"

# Push to your branch
git push origin your-branch-name
```

---

**Status:** Ready to implement  
**Previous Task:** `03-weekly-goals-api.md` ✅  
**Next Task:** `05-task-completion-logic.md`