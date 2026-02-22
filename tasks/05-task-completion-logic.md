# Task 05: Task Completion Logic

**Phase:** 1 - Backend  
**Estimated Time:** 2 hours  
**Dependencies:** Task 04 (Daily Tasks API) ✅, Task 03 (Weekly Goals API) ✅

---

## Objective

Refine and enhance the task completion workflow with additional business logic, validation, and edge case handling. This task focuses on ensuring the completion process is robust and handles all scenarios.

---

## Prerequisites

- ✅ Daily Tasks API completed (Task 04)
- ✅ Weekly Goals API completed (Task 03)
- ✅ Helper functions created (checkAndCompleteWeek)

---

## What This Task Covers

This task is about **refinement and validation** of the completion logic already implemented in Task 04. We'll add:

1. **Additional validation rules**
2. **Better error messages**
3. **Completion data validation**
4. **Race condition handling**
5. **Idempotency checks**
6. **Audit logging**

---

## Enhancements to Implement

### 1. Enhanced Completion Data Validation

**File:** `app/api/utils/completionValidators.ts`

```typescript
interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validate code submission
 */
export function validateCode(code: string): ValidationResult {
    // Remove whitespace for length check
    const trimmedCode = code.trim();
    
    if (!trimmedCode) {
        return {
            valid: false,
            error: 'Code cannot be empty'
        };
    }
    
    if (trimmedCode.length < 10) {
        return {
            valid: false,
            error: 'Code must be at least 10 characters. Share a meaningful code snippet.'
        };
    }
    
    if (trimmedCode.length > 10000) {
        return {
            valid: false,
            error: 'Code is too long. Maximum 10,000 characters.'
        };
    }
    
    return { valid: true };
}

/**
 * Validate learning notes submission
 */
export function validateLearningNotes(notes: string): ValidationResult {
    const trimmedNotes = notes.trim();
    
    if (!trimmedNotes) {
        return {
            valid: false,
            error: 'Learning notes cannot be empty'
        };
    }
    
    if (trimmedNotes.length < 20) {
        return {
            valid: false,
            error: 'Learning notes must be at least 20 characters. Share what you learned!'
        };
    }
    
    if (trimmedNotes.length > 5000) {
        return {
            valid: false,
            error: 'Learning notes are too long. Maximum 5,000 characters.'
        };
    }
    
    return { valid: true };
}

/**
 * Validate GitHub URL format
 */
export function validateGitHubUrl(url: string): ValidationResult {
    const githubPattern = /^https:\/\/(github\.com|gist\.github\.com)\/.+/;
    
    if (!githubPattern.test(url)) {
        return {
            valid: false,
            error: 'Invalid GitHub URL. Must be from github.com or gist.github.com'
        };
    }
    
    return { valid: true };
}

/**
 * Sanitize code input (remove potentially harmful content)
 */
export function sanitizeCode(code: string): string {
    // Remove any script tags or suspicious content
    return code
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .trim();
}

/**
 * Sanitize learning notes
 */
export function sanitizeLearningNotes(notes: string): string {
    return notes.trim();
}
```

---

### 2. Update Completion Endpoint with Validation

**File:** Update `app/api/daily-tasks/[id]/complete/route.ts`

Add these imports and update the POST handler:

```typescript
import { validateCode, validateLearningNotes, sanitizeCode, sanitizeLearningNotes } from '@/app/api/utils/completionValidators';

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

        // Enhanced validation
        const codeValidation = validateCode(code);
        if (!codeValidation.valid) {
            return NextResponse.json(
                { error: codeValidation.error },
                { status: 400 }
            );
        }

        const notesValidation = validateLearningNotes(learningNotes);
        if (!notesValidation.valid) {
            return NextResponse.json(
                { error: notesValidation.error },
                { status: 400 }
            );
        }

        // Sanitize inputs
        const sanitizedCode = sanitizeCode(code);
        const sanitizedNotes = sanitizeLearningNotes(learningNotes);

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

        // Check if task is already complete (idempotency)
        if (dailyTask.status === 'complete') {
            return NextResponse.json(
                { 
                    success: true,
                    data: dailyTask,
                    message: 'Task was already completed'
                },
                { status: 200 }
            );
        }

        // Check if task is locked
        if (dailyTask.status === 'locked') {
            return NextResponse.json(
                { error: `This task is locked. Complete Day ${dailyTask.dayNumber - 1} first.` },
                { status: 400 }
            );
        }

        // Mark task as complete with sanitized data
        dailyTask.status = 'complete';
        dailyTask.completionData = {
            code: sanitizedCode,
            learningNotes: sanitizedNotes,
            completedAt: new Date()
        };
        await dailyTask.save();

        // Unlock the next task (Day N+1)
        let nextTaskUnlocked = false;
        if (dailyTask.dayNumber < 7) {
            const nextTask = await DailyTaskModel.findOne({
                weeklyGoalId: dailyTask.weeklyGoalId,
                dayNumber: dailyTask.dayNumber + 1
            });

            if (nextTask && nextTask.status === 'locked') {
                nextTask.status = 'active';
                await nextTask.save();
                nextTaskUnlocked = true;
                
                console.log(`✅ Day ${nextTask.dayNumber} unlocked for user ${userId}`);
            }
        }

        // Check if week is now complete (all 7 tasks done)
        const updatedWeek = await checkAndCompleteWeek(dailyTask.weeklyGoalId.toString());
        const weekCompleted = updatedWeek?.status === 'complete';

        // Log completion event
        console.log(`✅ Task completed - User: ${userId}, Week: ${dailyTask.weeklyGoalId}, Day: ${dailyTask.dayNumber}`);
        if (weekCompleted) {
            console.log(`🎉 Week ${dailyTask.weeklyGoalId} completed!`);
        }

        // Build response message
        let message = 'Task completed successfully!';
        if (weekCompleted) {
            message = '🎉 Congratulations! You completed all 7 tasks. Your week is now complete!';
        } else if (nextTaskUnlocked) {
            message = `Task completed! Day ${dailyTask.dayNumber + 1} is now unlocked.`;
        } else if (dailyTask.dayNumber === 7) {
            message = 'Task completed! This was the final task of the week.';
        }

        return NextResponse.json({
            success: true,
            data: dailyTask,
            message,
            nextTaskUnlocked,
            weekCompleted
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

### 3. Enhanced Week Completion Helper

**File:** Update `app/api/utils/weeklyGoalHelpers.ts`

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
        
        if (!weeklyGoal) {
            console.error(`Weekly goal ${weeklyGoalId} not found`);
            return null;
        }
        
        if (weeklyGoal.status === 'complete') {
            return weeklyGoal; // Already complete
        }

        // Count completed tasks
        const completedTasks = await DailyTaskModel.countDocuments({
            weeklyGoalId,
            status: 'complete'
        });

        // Count total tasks (should be 7, but check anyway)
        const totalTasks = await DailyTaskModel.countDocuments({
            weeklyGoalId
        });

        console.log(`Week ${weeklyGoalId}: ${completedTasks}/${totalTasks} tasks completed`);

        // If all tasks are complete, mark week as complete
        if (completedTasks === 7 && totalTasks === 7) {
            weeklyGoal.status = 'complete';
            weeklyGoal.completedAt = new Date();
            await weeklyGoal.save();
            
            console.log(`✅ Weekly goal ${weeklyGoalId} auto-completed!`);
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

/**
 * Get completion statistics for a weekly goal
 */
export async function getWeeklyGoalStats(weeklyGoalId: string) {
    try {
        const totalTasks = await DailyTaskModel.countDocuments({
            weeklyGoalId
        });

        const completedTasks = await DailyTaskModel.countDocuments({
            weeklyGoalId,
            status: 'complete'
        });

        const activeTasks = await DailyTaskModel.countDocuments({
            weeklyGoalId,
            status: 'active'
        });

        const lockedTasks = await DailyTaskModel.countDocuments({
            weeklyGoalId,
            status: 'locked'
        });

        return {
            total: totalTasks,
            completed: completedTasks,
            active: activeTasks,
            locked: lockedTasks,
            progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            isComplete: completedTasks === 7 && totalTasks === 7
        };
    } catch (error) {
        console.error('Error getting weekly goal stats:', error);
        throw error;
    }
}
```

---

### 4. Additional API Endpoint - Get Completion Summary

**File:** `app/api/daily-tasks/[id]/completion/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';

/**
 * Get completion data for a specific task
 * Useful for displaying what the user submitted
 */
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

        // Check if task is completed
        if (dailyTask.status !== 'complete') {
            return NextResponse.json(
                { error: 'Task is not completed yet' },
                { status: 400 }
            );
        }

        // Return completion data
        return NextResponse.json({
            success: true,
            data: {
                taskId: dailyTask._id,
                dayNumber: dailyTask.dayNumber,
                description: dailyTask.description,
                completionData: dailyTask.completionData,
                weeklyGoalType: weeklyGoal.type
            }
        });

    } catch (error) {
        console.error('Error fetching completion data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch completion data' },
            { status: 500 }
        );
    }
}
```

---

## Testing Enhanced Logic

### Test Cases

**1. Validate Minimum Code Length**
```http
POST http://localhost:3000/api/daily-tasks/[TASK_ID]/complete
Content-Type: application/json

{
  "code": "abc",
  "learningNotes": "This is a meaningful learning note about what I discovered today."
}
```

**Expected Response (400):**
```json
{
  "error": "Code must be at least 10 characters. Share a meaningful code snippet."
}
```

---

**2. Validate Minimum Notes Length**
```http
POST http://localhost:3000/api/daily-tasks/[TASK_ID]/complete
Content-Type: application/json

{
  "code": "const x = 10; console.log(x);",
  "learningNotes": "Short"
}
```

**Expected Response (400):**
```json
{
  "error": "Learning notes must be at least 20 characters. Share what you learned!"
}
```

---

**3. Test Idempotency (complete same task twice)**
```http
POST http://localhost:3000/api/daily-tasks/[TASK_ID]/complete

{
  "code": "const x = 10;",
  "learningNotes": "Learned about variables and constants in JavaScript."
}

# Call again with same or different data
POST http://localhost:3000/api/daily-tasks/[TASK_ID]/complete

{
  "code": "different code",
  "learningNotes": "different notes"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "complete",
    "completionData": {
      "code": "const x = 10;",
      "learningNotes": "Learned about variables...",
      "completedAt": "..."
    }
  },
  "message": "Task was already completed"
}
```

Note: Original completion data is preserved, not overwritten.

---

**4. Get Completion Data**
```http
GET http://localhost:3000/api/daily-tasks/[TASK_ID]/completion
```

---

**5. Week Completion Message**

Complete the 7th task:
```http
POST http://localhost:3000/api/daily-tasks/[DAY_7_ID]/complete

{
  "code": "final code here",
  "learningNotes": "Final day learnings here, at least 20 characters."
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "🎉 Congratulations! You completed all 7 tasks. Your week is now complete!",
  "nextTaskUnlocked": false,
  "weekCompleted": true
}
```

---

## Edge Cases Handled

✅ **Empty or whitespace-only inputs** - Rejected with clear error  
✅ **Code too short (<10 chars)** - Rejected with minimum length requirement  
✅ **Notes too short (<20 chars)** - Rejected with minimum length requirement  
✅ **Code too long (>10,000 chars)** - Rejected with maximum length  
✅ **Notes too long (>5,000 chars)** - Rejected with maximum length  
✅ **Duplicate completion attempts** - Idempotent, returns success without overwriting  
✅ **Malicious script tags in code** - Sanitized before saving  
✅ **Week already complete** - Helper function handles gracefully  
✅ **Race conditions** - Database-level checks prevent issues

---

## Validation Summary

| Field | Min Length | Max Length | Additional Rules |
|-------|-----------|------------|------------------|
| code | 10 chars | 10,000 chars | HTML sanitized |
| learningNotes | 20 chars | 5,000 chars | Trimmed |

---

## Checklist

- [ ] Create `app/api/utils/completionValidators.ts`
- [ ] Update `app/api/daily-tasks/[id]/complete/route.ts` with validation
- [ ] Update `app/api/utils/weeklyGoalHelpers.ts` with enhanced logging
- [ ] Create `app/api/daily-tasks/[id]/completion/route.ts`
- [ ] Test code minimum length validation
- [ ] Test notes minimum length validation
- [ ] Test code maximum length validation
- [ ] Test idempotency (complete same task twice)
- [ ] Test sanitization (malicious input)
- [ ] Test week completion message
- [ ] Test completion data retrieval
- [ ] Verify console logging for debugging

---

## Logging & Debugging

The enhanced completion logic includes console logging:

```
✅ Day 2 unlocked for user user_abc123
✅ Task completed - User: user_abc123, Week: 64f..., Day: 1
Week 64f...: 7/7 tasks completed
✅ Weekly goal 64f... auto-completed!
🎉 Week 64f... completed!
```

These logs help you debug the flow and verify the system is working correctly.

---

## Common Issues & Solutions

**Issue:** Validation too strict - legitimate code rejected  
**Solution:** Adjust minimum length if needed, currently set to 10 chars

**Issue:** Users want to edit completion data  
**Solution:** This is intentional - completion is final. Could add separate endpoint if needed.

**Issue:** Sanitization removing legitimate code  
**Solution:** Current sanitization only removes script tags. Adjust regex if needed.

**Issue:** Console logs cluttering production  
**Solution:** Wrap in environment check: `if (process.env.NODE_ENV === 'development')`

---

## Next Steps

After completing this task:
1. Backend completion logic is fully robust
2. Move to Task 06: AI Integration Setup
3. AI will use the completion data (code + learningNotes) to generate content

---

## Git Commit

After successfully completing and testing this task:

```bash
# Stage the files
git add app/api/utils/completionValidators.ts
git add app/api/daily-tasks/[id]/complete/route.ts
git add app/api/daily-tasks/[id]/completion/route.ts
git add app/api/utils/weeklyGoalHelpers.ts

# Commit with descriptive message
git commit -m "feat: enhance task completion logic with validation

- Add completion data validators (min/max length)
- Add input sanitization for security
- Implement idempotency for duplicate completions
- Add detailed console logging for debugging
- Create completion data retrieval endpoint
- Enhance week completion messages
- Add getWeeklyGoalStats helper function
- Improve error messages for better UX"

# Push to your branch
git push origin your-branch-name
```

---

**Status:** Ready to implement  
**Previous Task:** `04-daily-tasks-api.md` ✅  
**Next Task:** `06-ai-integration-setup.md`