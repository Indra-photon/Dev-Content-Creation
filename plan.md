# Focused Learning & Content System - Implementation Plan

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Auth:** Clerk ✅ (already configured)
- **Database:** MongoDB + Mongoose ✅ (already connected)
- **AI:** Anthropic Claude API
- **Frontend:** React + Tailwind CSS ✅
- **State:** Zustand ✅ (already set up)

## Existing Infrastructure
✅ Clerk auth with protected routes  
✅ UserModel (clerk_id, email, name)  
✅ MongoDB connection ready  
✅ Navbar, layout, UserSync component  
✅ Payment system (can ignore)

---

# PHASE 1: Backend (API + Models)

## 1.1 Database Models
**File:** `tasks/01-database-models.md`

Create 3 new Mongoose models:

**ExamplePost Model**
- clerk_id (ref to user)
- type: 'learning' | 'product'
- platform: 'x' | 'linkedin' | 'blog'
- content: string
- timestamps

**WeeklyGoal Model**
- clerk_id (ref to user)
- title: string
- type: 'learning' | 'product'
- status: 'active' | 'complete'
- startDate: Date
- dailyTasks: [ObjectId] refs
- timestamps

**DailyTask Model**
- weeklyGoalId: ObjectId (ref)
- dayNumber: 1-7
- description: string
- resources: [{ url, title }]
- status: 'locked' | 'active' | 'complete'
- completionData: { code, learningNotes, completedAt }
- timestamps

---

## 1.2 Example Posts API
**File:** `tasks/02-example-posts-api.md`

**Endpoints:**
```
POST   /api/example-posts          - Create
GET    /api/example-posts          - List (filter by type/platform)
PUT    /api/example-posts/:id      - Update
DELETE /api/example-posts/:id      - Delete
```

**Rules:**
- Max 2 per type per platform
- Auth with Clerk `auth()`
- Query by clerk_id

---

## 1.3 Weekly Goals API
**File:** `tasks/03-weekly-goals-api.md`

**Endpoints:**
```
POST   /api/weekly-goals           - Create new week
GET    /api/weekly-goals           - List all user's weeks
GET    /api/weekly-goals/:id       - Get single with tasks
PUT    /api/weekly-goals/:id       - Update
```

**Business Logic:**
- Block creation if previous week incomplete
- Auto-complete when 7/7 tasks done
- Calculate progress (X/7)

---

## 1.4 Daily Tasks API
**File:** `tasks/04-daily-tasks-api.md`

**Endpoints:**
```
POST   /api/daily-tasks                  - Add task to week
GET    /api/daily-tasks?weeklyGoalId=x   - Get all for week
PUT    /api/daily-tasks/:id              - Update
POST   /api/daily-tasks/:id/complete     - Mark complete
```

**Lock Logic:**
- Day 1 always active
- Day N+1 locked until Day N complete
- Sequential enforcement

---

## 1.5 Task Completion Logic
**File:** `tasks/05-task-completion-logic.md`

**On completion:**
1. Validate: code + learningNotes required
2. Save completionData
3. Unlock next day (N+1)
4. Check if week complete (7/7)
5. Update WeeklyGoal status if done

---

## 1.6 AI Integration Setup
**File:** `tasks/06-ai-integration-setup.md`

**Setup:**
- Install `@anthropic-ai/sdk`
- Create `lib/claudeService.js`
- Build prompt templates:
  - Learning tone (educational)
  - Product tone (shipping updates)
  - 3 formats: X (short), LinkedIn (med), Blog (long)
  - Weekly wrap-up

**Prompt Strategy:**
- Include user's example posts
- Pass code + learningNotes
- Different tone per goal type

---

## 1.7 Content Generation API
**File:** `tasks/07-content-generation-api.md`

**Endpoint:**
```
POST /api/content/generate
Body: { taskId }
```

**Flow:**
1. Get clerk_id from `auth()`
2. Fetch task completion data
3. Fetch example posts (match goal type)
4. Build prompt with examples
5. Call Claude API
6. Return { x_post, linkedin_post, blog_post }

---

## 1.8 Weekly Wrap-up API
**File:** `tasks/08-weekly-wrapup-api.md`

**Endpoint:**
```
POST /api/content/weekly-wrapup
Body: { weeklyGoalId }
```

**Flow:**
1. Verify 7/7 complete
2. Fetch all 7 task completion data
3. Aggregate code + notes
4. Fetch example posts
5. Generate summary (3 formats)

---

## 1.9 Backend Testing
**File:** `tasks/09-backend-testing.md`

**Test:**
- All endpoints with Postman
- Lock system (can't skip days)
- Week progression (can't create Week 2 early)
- AI generation quality
- Edge cases (missing data, invalid inputs)

---

# PHASE 2: Frontend (UI + Components)

## 2.1 Navigation & Routes
**File:** `tasks/10-layout-navigation.md`

**Add:**
- Nav links: "Goals", "Examples"
- Routes: `/dashboard/goals`, `/dashboard/examples`
- Empty states, loading states

---

## 2.2 Example Posts UI
**File:** `tasks/11-example-posts-ui.md`

**Page:** `/dashboard/examples`

**Features:**
- List grouped by Type → Platform
- Add/Edit form
- Show count (2/2 max)
- Delete with confirm

---

## 2.3 Weekly Goals Dashboard
**File:** `tasks/12-weekly-goals-dashboard.md`

**Page:** `/dashboard/goals`

**Display:**
- All weeks (Active/Complete badges)
- Progress bars (X/7)
- "New Week" button (disabled if current incomplete)
- Click to view details

---

## 2.4 Create Weekly Goal
**File:** `tasks/13-create-weekly-goal.md`

**Modal/Page:**
- Title input
- Type selector (Learning/Product)
- Validation: check prev week
- Submit → redirect to tasks

---

## 2.5 Daily Tasks View
**File:** `tasks/14-daily-tasks-view.md`

**Page:** `/dashboard/goals/:id`

**Show 7 cards:**
- **Locked:** 🔒 "Complete Day X first"
- **Active:** "Add Task" or task details
- **Complete:** ✅ + "Generate Content"

---

## 2.6 Add Daily Task
**File:** `tasks/15-add-daily-task.md`

**Form:**
- Description textarea
- Resources (dynamic input for multiple URLs)
- Validate: prev day complete

---

## 2.7 Task Completion Flow
**File:** `tasks/16-task-completion-flow.md`

**Modal:**
- Code input (textarea or GitHub link)
- Learning notes (raw thoughts)
- Submit → unlock next day

---

## 2.8 Content Generation UI
**File:** `tasks/17-content-generation-ui.md`

**Features:**
- "Generate" button
- Loading spinner
- 3 tabs: X | LinkedIn | Blog
- Copy buttons
- Character counts

---

## 2.9 Weekly Wrap-up UI
**File:** `tasks/18-weekly-wrapup-ui.md`

**Trigger:** 7/7 complete

**Display:**
- "Generate Wrap-up" button
- Same 3-tab layout
- Copy/edit

---

## 2.10 Polish & Responsive
**File:** `tasks/19-responsive-polish.md`

**Tasks:**
- Mobile (320px+)
- Tablet, desktop
- Loading skeletons
- Animations
- Error states
- Toasts

---

# PHASE 3: Testing & Integration

## 3.1 E2E Testing
**File:** `tasks/20-e2e-testing.md`

**Flow:**
1. Sign up → Create Week 1 → Add Day 1
2. Complete Day 1 → Day 2 unlocks
3. Complete 7/7 → Generate content
4. Generate wrap-up
5. Try to create Week 2 (blocked until Week 1 done)

---

## 3.2 AI Quality Testing
**File:** `tasks/21-ai-testing.md`

**Test:**
- Learning vs Product tone
- Different code types
- Example post style matching
- Refine prompts

---

## 3.3 Bug Fixes
**File:** `tasks/22-bug-fixes.md`

Fix issues, improve validation, optimize

---

# PHASE 4: Deployment

## 4.1 Deployment Prep
**File:** `tasks/23-deployment-prep.md`

- Env vars checklist
- DB indexes
- Error logging

---

## 4.2 Deploy to Production
**File:** `tasks/24-deployment.md`

**Platform:** Vercel

**Env vars:**
```
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
MONGODB_URI
ANTHROPIC_API_KEY
```

---

## 4.3 Documentation
**File:** `tasks/25-documentation.md`

- README.md
- User guide
- API docs (optional)

---

# Development Notes

**Workflow:**
1. Complete Phase 1 before Phase 2
2. Each task = 1-3 hours
3. Git branch per feature
4. Test before moving on

**Auth Pattern:**
```js
const { userId } = await auth() // Clerk
// Query: UserModel.findOne({ clerk_id: userId })
```

**Lock System:**
```
Day 1: active (always)
Day 2: locked (until Day 1 complete)
Day 3: locked (until Day 2 complete)
...
Week 2: blocked (until Week 1 = 7/7)
```

---

# Success Criteria (MVP)

✅ Create weekly goals (Learning/Product)  
✅ Add 7 tasks sequentially (lock system works)  
✅ Mark complete with code + notes  
✅ Generate content (X, LinkedIn, Blog)  
✅ Weekly wrap-up after 7/7  
✅ Cannot skip days or weeks  
✅ Mobile + desktop responsive

---

# Future Enhancements

- Email notifications
- Calendar view
- Analytics/streaks
- Export to platforms
- Templates
- Multi-week view