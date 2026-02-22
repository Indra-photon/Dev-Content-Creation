# Task 01: Database Models

**Phase:** 1 - Backend  
**Estimated Time:** 2-3 hours  
**Dependencies:** None (uses existing MongoDB connection)

---

## Objective

Create 3 new Mongoose models to support the focused learning system: ExamplePost, WeeklyGoal, and DailyTask.

---

## Prerequisites

- ✅ MongoDB connection already set up (`lib/dbConnect.ts`)
- ✅ UserModel already exists with `clerk_id` field
- ✅ Mongoose already installed

---

## Models to Create

### 1. ExamplePost Model
**File:** `app/api/models/ExamplePostModel.ts`

```typescript
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IExamplePost extends Document {
    clerk_id: string;
    type: 'learning' | 'product';
    platform: 'x' | 'linkedin' | 'blog';
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const ExamplePostSchema = new Schema<IExamplePost>(
    {
        clerk_id: {
            type: String,
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: ['learning', 'product'],
            required: true
        },
        platform: {
            type: String,
            enum: ['x', 'linkedin', 'blog'],
            required: true
        },
        content: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Compound index for querying by user, type, and platform
ExamplePostSchema.index({ clerk_id: 1, type: 1, platform: 1 });

const ExamplePostModel: Model<IExamplePost> = 
    mongoose.models.ExamplePost || mongoose.model<IExamplePost>('ExamplePost', ExamplePostSchema);

export default ExamplePostModel;
```

**Purpose:** Stores user's example posts that AI will use as style references.

**Business Rules:**
- Max 2 posts per user per type per platform (enforced in API layer)
- Content should be the actual text of the post

---

### 2. WeeklyGoal Model
**File:** `app/api/models/WeeklyGoalModel.ts`

```typescript
import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IWeeklyGoal extends Document {
    clerk_id: string;
    title: string;
    type: 'learning' | 'product';
    status: 'active' | 'complete';
    startDate: Date;
    completedAt?: Date;
    dailyTasks: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const WeeklyGoalSchema = new Schema<IWeeklyGoal>(
    {
        clerk_id: {
            type: String,
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ['learning', 'product'],
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'complete'],
            default: 'active'
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        completedAt: {
            type: Date
        },
        dailyTasks: [{
            type: Schema.Types.ObjectId,
            ref: 'DailyTask'
        }]
    },
    {
        timestamps: true
    }
);

// Index for querying user's goals ordered by date
WeeklyGoalSchema.index({ clerk_id: 1, startDate: -1 });

const WeeklyGoalModel: Model<IWeeklyGoal> = 
    mongoose.models.WeeklyGoal || mongoose.model<IWeeklyGoal>('WeeklyGoal', WeeklyGoalSchema);

export default WeeklyGoalModel;
```

**Purpose:** Represents a weekly learning or product building goal.

**Key Fields:**
- `dailyTasks`: Array of references to DailyTask documents
- `status`: Auto-updates to 'complete' when all 7 tasks are done
- `startDate`: Used to enforce sequential week creation

---

### 3. DailyTask Model
**File:** `app/api/models/DailyTaskModel.ts`

```typescript
import mongoose, { Document, Schema, Model, Types } from 'mongoose';

interface Resource {
    url: string;
    title?: string;
}

interface CompletionData {
    code: string;
    learningNotes: string;
    completedAt: Date;
}

export interface IDailyTask extends Document {
    weeklyGoalId: Types.ObjectId;
    dayNumber: number; // 1-7
    description: string;
    resources: Resource[];
    status: 'locked' | 'active' | 'complete';
    completionData?: CompletionData;
    createdAt: Date;
    updatedAt: Date;
}

const DailyTaskSchema = new Schema<IDailyTask>(
    {
        weeklyGoalId: {
            type: Schema.Types.ObjectId,
            ref: 'WeeklyGoal',
            required: true,
            index: true
        },
        dayNumber: {
            type: Number,
            required: true,
            min: 1,
            max: 7
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        resources: [{
            url: {
                type: String,
                required: true
            },
            title: {
                type: String
            }
        }],
        status: {
            type: String,
            enum: ['locked', 'active', 'complete'],
            default: 'locked'
        },
        completionData: {
            code: {
                type: String
            },
            learningNotes: {
                type: String
            },
            completedAt: {
                type: Date
            }
        }
    },
    {
        timestamps: true
    }
);

// Compound index for querying tasks by week and day
DailyTaskSchema.index({ weeklyGoalId: 1, dayNumber: 1 }, { unique: true });

const DailyTaskModel: Model<IDailyTask> = 
    mongoose.models.DailyTask || mongoose.model<IDailyTask>('DailyTask', DailyTaskSchema);

export default DailyTaskModel;
```

**Purpose:** Represents individual daily tasks within a weekly goal.

**Key Fields:**
- `dayNumber`: 1-7, used for lock logic
- `status`: Controls whether task can be edited
- `completionData`: Only populated when task is marked complete
- `resources`: Array of URLs user needs to study

**Important Index:**
- Unique compound index on `weeklyGoalId + dayNumber` ensures only one task per day per week

---

## Testing the Models

Create a simple test file to verify models work:

**File:** `app/api/test-models/route.ts` (temporary, delete after testing)

```typescript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ExamplePostModel from '@/app/api/models/ExamplePostModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';

export async function GET() {
    try {
        await dbConnect();
        
        // Test creating documents
        const testPost = await ExamplePostModel.create({
            clerk_id: 'test_user_123',
            type: 'learning',
            platform: 'x',
            content: 'This is a test post'
        });
        
        const testGoal = await WeeklyGoalModel.create({
            clerk_id: 'test_user_123',
            title: 'Test Week',
            type: 'learning'
        });
        
        const testTask = await DailyTaskModel.create({
            weeklyGoalId: testGoal._id,
            dayNumber: 1,
            description: 'Test task',
            resources: [{ url: 'https://example.com' }],
            status: 'active'
        });
        
        // Clean up test data
        await ExamplePostModel.deleteOne({ _id: testPost._id });
        await DailyTaskModel.deleteOne({ _id: testTask._id });
        await WeeklyGoalModel.deleteOne({ _id: testGoal._id });
        
        return NextResponse.json({ 
            success: true, 
            message: 'All models working correctly' 
        });
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
```

**Test:**
1. Run: `npm run dev`
2. Visit: `http://localhost:3000/api/test-models`
3. Should see: `{ "success": true, "message": "All models working correctly" }`
4. Delete the test route file after confirming

---

## Checklist

- [ ] Create `ExamplePostModel.ts` with all fields and indexes
- [ ] Create `WeeklyGoalModel.ts` with all fields and indexes
- [ ] Create `DailyTaskModel.ts` with all fields and indexes
- [ ] Verify all TypeScript interfaces are correct
- [ ] Test models with temporary test route
- [ ] Verify indexes are created in MongoDB
- [ ] Delete test route file
- [ ] All models properly exported

---

## Verification

After creating the models, verify in MongoDB:

```bash
# Connect to MongoDB and run:
db.exampleposts.getIndexes()
db.weeklygoals.getIndexes()
db.dailytasks.getIndexes()
```

Each collection should have the indexes defined in the schemas.

---

## Common Issues & Solutions

**Issue:** "Model already compiled" error  
**Solution:** Use the pattern `mongoose.models.ModelName || mongoose.model()` (already in code)

**Issue:** TypeScript errors on Types.ObjectId  
**Solution:** Import `Types` from mongoose: `import { Types } from 'mongoose'`

**Issue:** Indexes not created  
**Solution:** Restart your app or manually create indexes in MongoDB

---

## Next Steps

After completing this task:
1. Move to Task 02: Example Posts API
2. The API endpoints will use these models to create/read/update/delete data

---

## Git Commit

After successfully completing this task, commit your changes:

```bash
# Stage the new model files
git add app/api/models/ExamplePostModel.ts
git add app/api/models/WeeklyGoalModel.ts
git add app/api/models/DailyTaskModel.ts

# Commit with descriptive message
git commit -m "feat: add database models for learning system

- Add ExamplePostModel for storing AI reference posts
- Add WeeklyGoalModel for weekly learning/product goals
- Add DailyTaskModel with lock system support
- Include proper indexes for query optimization
- Add TypeScript interfaces for type safety"

# Push to your branch
git push origin your-branch-name
```

**Commit Message Convention:**
- `feat:` for new features
- Use present tense ("add" not "added")
- Include bullet points for multiple changes
- Reference what the change accomplishes

---

**Status:** Ready to implement  
**Next Task:** `02-example-posts-api.md`