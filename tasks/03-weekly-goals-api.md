# Task 03: Weekly Goals API

**Phase:** 1 - Backend  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 01 (Database Models) ✅

---

## Objective

Create API endpoints for managing weekly goals with enforcement of sequential week creation and automatic status tracking based on task completion.

---

## Prerequisites

- ✅ WeeklyGoalModel created (Task 01)
- ✅ DailyTaskModel created (Task 01)
- ✅ Clerk authentication configured
- ✅ MongoDB connection ready

---

## API Endpoints to Create

### Overview

```
POST   /api/weekly-goals           - Create new weekly goal
GET    /api/weekly-goals           - List all user's weekly goals
GET    /api/weekly-goals/:id       - Get single weekly goal with tasks
PUT    /api/weekly-goals/:id       - Update weekly goal
```

---

## Business Rules

### Critical Lock Logic:
1. **User can only have ONE active weekly goal at a time**
2. **Cannot create new week until previous week is 100% complete (7/7 tasks done)**
3. **Status auto-updates to 'complete' when all 7 tasks are done**
4. **completedAt timestamp auto-set when week completes**

---

## Implementation

### 1. Create Weekly Goal (POST)

**File:** `app/api/weekly-goals/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { title, type } = await request.json();

        // Validate required fields
        if (!title || !type) {
            return NextResponse.json(
                { error: 'Missing required fields: title, type' },
                { status: 400 }
            );
        }

        // Validate type enum
        if (!['learning', 'product'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type. Must be "learning" or "product"' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user has an active weekly goal
        const activeGoal = await WeeklyGoalModel.findOne({
            clerk_id: userId,
            status: 'active'
        });

        if (activeGoal) {
            // Check if the active goal is actually complete (all 7 tasks done)
            const completedTasksCount = await DailyTaskModel.countDocuments({
                weeklyGoalId: activeGoal._id,
                status: 'complete'
            });

            if (completedTasksCount < 7) {
                return NextResponse.json(
                    { 
                        error: 'You have an incomplete weekly goal. Complete all 7 tasks before creating a new week.',
                        activeGoal: {
                            id: activeGoal._id,
                            title: activeGoal.title,
                            completedTasks: completedTasksCount,
                            totalTasks: 7
                        }
                    },
                    { status: 400 }
                );
            }

            // If all 7 tasks are done, auto-complete the previous week
            activeGoal.status = 'complete';
            activeGoal.completedAt = new Date();
            await activeGoal.save();
        }

        // Create new weekly goal
        const weeklyGoal = await WeeklyGoalModel.create({
            clerk_id: userId,
            title,
            type,
            status: 'active',
            startDate: new Date(),
            dailyTasks: []
        });

        return NextResponse.json({
            success: true,
            data: weeklyGoal
        }, { status: 201 });

    } catch (error) {
        console.error('Weekly goal creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create weekly goal' },
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

        await dbConnect();

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const type = searchParams.get('type');

        // Build query
        const query: any = { clerk_id: userId };
        
        if (status && ['active', 'complete'].includes(status)) {
            query.status = status;
        }
        
        if (type && ['learning', 'product'].includes(type)) {
            query.type = type;
        }

        // Fetch weekly goals with task counts
        const weeklyGoals = await WeeklyGoalModel.find(query)
            .sort({ startDate: -1 });

        // Enrich with task completion counts
        const enrichedGoals = await Promise.all(
            weeklyGoals.map(async (goal) => {
                const totalTasks = await DailyTaskModel.countDocuments({
                    weeklyGoalId: goal._id
                });

                const completedTasks = await DailyTaskModel.countDocuments({
                    weeklyGoalId: goal._id,
                    status: 'complete'
                });

                return {
                    ...goal.toObject(),
                    taskStats: {
                        total: totalTasks,
                        completed: completedTasks,
                        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
                    }
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: enrichedGoals,
            count: enrichedGoals.length
        });

    } catch (error) {
        console.error('Weekly goals fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch weekly goals' },
            { status: 500 }
        );
    }
}
```

---

### 2. Get Single Weekly Goal & Update

**File:** `app/api/weekly-goals/[id]/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';

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

        // Find weekly goal and verify ownership
        const weeklyGoal = await WeeklyGoalModel.findOne({
            _id: id,
            clerk_id: userId
        });

        if (!weeklyGoal) {
            return NextResponse.json(
                { error: 'Weekly goal not found or unauthorized' },
                { status: 404 }
            );
        }

        // Fetch all daily tasks for this week
        const dailyTasks = await DailyTaskModel.find({
            weeklyGoalId: id
        }).sort({ dayNumber: 1 });

        // Calculate task statistics
        const taskStats = {
            total: dailyTasks.length,
            completed: dailyTasks.filter(t => t.status === 'complete').length,
            active: dailyTasks.filter(t => t.status === 'active').length,
            locked: dailyTasks.filter(t => t.status === 'locked').length,
            progress: dailyTasks.length > 0 
                ? Math.round((dailyTasks.filter(t => t.status === 'complete').length / dailyTasks.length) * 100) 
                : 0
        };

        return NextResponse.json({
            success: true,
            data: {
                ...weeklyGoal.toObject(),
                dailyTasks,
                taskStats
            }
        });

    } catch (error) {
        console.error('Weekly goal fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch weekly goal' },
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
        const { title, type } = await request.json();

        await dbConnect();

        // Find weekly goal and verify ownership
        const weeklyGoal = await WeeklyGoalModel.findOne({
            _id: id,
            clerk_id: userId
        });

        if (!weeklyGoal) {
            return NextResponse.json(
                { error: 'Weekly goal not found or unauthorized' },
                { status: 404 }
            );
        }

        // Validate type if provided
        if (type && !['learning', 'product'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type. Must be "learning" or "product"' },
                { status: 400 }
            );
        }

        // Only allow updating title and type (not status - that's managed by system)
        const updatedGoal = await WeeklyGoalModel.findByIdAndUpdate(
            id,
            {
                ...(title && { title }),
                ...(type && { type })
            },
            { new: true, runValidators: true }
        );

        return NextResponse.json({
            success: true,
            data: updatedGoal
        });

    } catch (error) {
        console.error('Weekly goal update error:', error);
        return NextResponse.json(
            { error: 'Failed to update weekly goal' },
            { status: 500 }
        );
    }
}
```

---

### 3. Helper Function - Check and Auto-Complete Week

**File:** `app/api/utils/weeklyGoalHelpers.ts`

```typescript
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';

/**
 * Check if a weekly goal is complete and update status if needed
 * Called after a daily task is completed
 */
export async function checkAndCompleteWeek(weeklyGoalId: string) {
    try {
        const weeklyGoal = await WeeklyGoalModel.findById(weeklyGoalId);
        
        if (!weeklyGoal || weeklyGoal.status === 'complete') {
            return weeklyGoal;
        }

        // Count completed tasks
        const completedTasks = await DailyTaskModel.countDocuments({
            weeklyGoalId,
            status: 'complete'
        });

        // If all 7 tasks are complete, mark week as complete
        if (completedTasks === 7) {
            weeklyGoal.status = 'complete';
            weeklyGoal.completedAt = new Date();
            await weeklyGoal.save();
            
            console.log(`Weekly goal ${weeklyGoalId} auto-completed!`);
        }

        return weeklyGoal;
    } catch (error) {
        console.error('Error checking week completion:', error);
        throw error;
    }
}

/**
 * Get the current active weekly goal for a user
 */
export async function getCurrentWeeklyGoal(clerk_id: string) {
    try {
        const activeGoal = await WeeklyGoalModel.findOne({
            clerk_id,
            status: 'active'
        });

        return activeGoal;
    } catch (error) {
        console.error('Error getting current weekly goal:', error);
        throw error;
    }
}
```

---

## Testing the API

### Manual Testing with Thunder Client / Postman

**1. Create First Weekly Goal**
```http
POST http://localhost:3000/api/weekly-goals
Content-Type: application/json

{
  "title": "Master React Hooks",
  "type": "learning"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "clerk_id": "user_...",
    "title": "Master React Hooks",
    "type": "learning",
    "status": "active",
    "startDate": "2024-...",
    "dailyTasks": [],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

**2. Try to Create Second Week (should fail if first incomplete)**
```http
POST http://localhost:3000/api/weekly-goals
Content-Type: application/json

{
  "title": "Build Dashboard Feature",
  "type": "product"
}
```

**Expected Response (400):**
```json
{
  "error": "You have an incomplete weekly goal. Complete all 7 tasks before creating a new week.",
  "activeGoal": {
    "id": "...",
    "title": "Master React Hooks",
    "completedTasks": 0,
    "totalTasks": 7
  }
}
```

---

**3. Get All Weekly Goals**
```http
GET http://localhost:3000/api/weekly-goals
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Master React Hooks",
      "type": "learning",
      "status": "active",
      "taskStats": {
        "total": 3,
        "completed": 1,
        "progress": 33
      }
    }
  ],
  "count": 1
}
```

---

**4. Get Filtered Weekly Goals**
```http
GET http://localhost:3000/api/weekly-goals?status=active
GET http://localhost:3000/api/weekly-goals?type=learning
GET http://localhost:3000/api/weekly-goals?status=complete&type=product
```

---

**5. Get Single Weekly Goal with Tasks**
```http
GET http://localhost:3000/api/weekly-goals/[GOAL_ID]
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Master React Hooks",
    "type": "learning",
    "status": "active",
    "dailyTasks": [
      {
        "_id": "...",
        "dayNumber": 1,
        "description": "Learn useState",
        "status": "complete"
      },
      {
        "_id": "...",
        "dayNumber": 2,
        "description": "Learn useEffect",
        "status": "active"
      },
      {
        "_id": "...",
        "dayNumber": 3,
        "description": "Learn useContext",
        "status": "locked"
      }
    ],
    "taskStats": {
      "total": 3,
      "completed": 1,
      "active": 1,
      "locked": 1,
      "progress": 33
    }
  }
}
```

---

**6. Update Weekly Goal**
```http
PUT http://localhost:3000/api/weekly-goals/[GOAL_ID]
Content-Type: application/json

{
  "title": "Master React Hooks & Context"
}
```

---

## Edge Cases to Test

1. **Multiple active weeks** - System should prevent this
2. **Creating week when previous 7/7 done** - Should auto-complete previous week
3. **Get non-existent goal** - Should return 404
4. **Update other user's goal** - Should return 404
5. **Invalid type value** - Should return 400
6. **Missing required fields** - Should return 400

---

## Integration with Daily Tasks

The helper function `checkAndCompleteWeek()` should be called from the Daily Tasks API when a task is marked complete. This will be implemented in Task 04 and 05.

**Preview of how it will be used (Task 05):**

```typescript
// In daily task completion endpoint
import { checkAndCompleteWeek } from '@/app/api/utils/weeklyGoalHelpers';

// After marking task complete
await checkAndCompleteWeek(task.weeklyGoalId.toString());
```

---

## Validation Rules Summary

### POST `/api/weekly-goals`
- ✅ User must be authenticated
- ✅ Required: `title`, `type`
- ✅ `type` must be: `'learning'` or `'product'`
- ✅ Cannot create if active goal exists with <7 completed tasks
- ✅ Auto-completes previous week if it has 7/7 tasks done

### GET `/api/weekly-goals`
- ✅ User must be authenticated
- ✅ Optional filters: `?status=active&type=learning`
- ✅ Returns enriched data with task statistics
- ✅ Sorted by startDate descending (newest first)

### GET `/api/weekly-goals/:id`
- ✅ User must be authenticated
- ✅ Can only view own goals
- ✅ Returns goal with all daily tasks
- ✅ Includes detailed task statistics

### PUT `/api/weekly-goals/:id`
- ✅ User must be authenticated
- ✅ Can only update own goals
- ✅ Can update: `title`, `type`
- ✅ Cannot manually update: `status`, `completedAt` (system managed)

---

## Checklist

- [ ] Create `app/api/weekly-goals/route.ts` with POST and GET
- [ ] Create `app/api/weekly-goals/[id]/route.ts` with GET and PUT
- [ ] Create `app/api/utils/weeklyGoalHelpers.ts` with helper functions
- [ ] Test POST - Create first weekly goal
- [ ] Test POST - Verify cannot create second if first incomplete
- [ ] Test POST - Verify auto-completion of previous week
- [ ] Test GET - List all goals with stats
- [ ] Test GET - Filter by status
- [ ] Test GET - Filter by type
- [ ] Test GET/:id - Get single goal with tasks
- [ ] Test PUT - Update goal title
- [ ] Test PUT - Update goal type
- [ ] Test ownership verification
- [ ] Test all error cases

---

## Common Issues & Solutions

**Issue:** Can create multiple active weeks  
**Solution:** Check the POST endpoint logic - should query for existing active goal

**Issue:** Previous week not auto-completing  
**Solution:** Verify the task count check is using `status: 'complete'` filter

**Issue:** Task stats showing wrong numbers  
**Solution:** Ensure you're counting documents with proper weeklyGoalId filter

**Issue:** Cannot update goal status manually  
**Solution:** This is intentional - status is system-managed via task completion

---

## Next Steps

After completing this task:
1. Move to Task 04: Daily Tasks API
2. Daily Tasks will reference weeklyGoalId
3. Task completion will trigger week auto-completion

---

## Git Commit

After successfully completing and testing this task:

```bash
# Stage the API files
git add app/api/weekly-goals/route.ts
git add app/api/weekly-goals/[id]/route.ts
git add app/api/utils/weeklyGoalHelpers.ts

# Commit with descriptive message
git commit -m "feat: add Weekly Goals API with sequential enforcement

- Add POST endpoint to create weekly goals
- Add GET endpoint with status/type filtering
- Add GET/:id endpoint with task statistics
- Add PUT endpoint to update goals
- Implement active week check (prevents multiple active weeks)
- Add auto-completion when previous week hits 7/7 tasks
- Include helper functions for week completion logic
- Enrich responses with task progress statistics"

# Push to your branch
git push origin your-branch-name
```

---

**Status:** Ready to implement  
**Previous Task:** `02-example-posts-api.md` ✅  
**Next Task:** `04-daily-tasks-api.md`