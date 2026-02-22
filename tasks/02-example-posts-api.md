# Task 02: Example Posts API

**Phase:** 1 - Backend  
**Estimated Time:** 2-3 hours  
**Dependencies:** Task 01 (Database Models) ✅

---

## Objective

Create CRUD API endpoints for managing example posts that users will use as style references for AI-generated content.

---

## Prerequisites

- ✅ ExamplePostModel created (Task 01)
- ✅ Clerk authentication configured
- ✅ MongoDB connection ready

---

## API Endpoints to Create

### Overview

```
POST   /api/example-posts          - Create new example post
GET    /api/example-posts          - List user's example posts (with filters)
PUT    /api/example-posts/:id      - Update existing example post
DELETE /api/example-posts/:id      - Delete example post
```

---

## Implementation

### 1. Create Example Post (POST)

**File:** `app/api/example-posts/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ExamplePostModel from '@/app/api/models/ExamplePostModel';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { type, platform, content } = await request.json();

        // Validate required fields
        if (!type || !platform || !content) {
            return NextResponse.json(
                { error: 'Missing required fields: type, platform, content' },
                { status: 400 }
            );
        }

        // Validate enum values
        if (!['learning', 'product'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type. Must be "learning" or "product"' },
                { status: 400 }
            );
        }

        if (!['x', 'linkedin', 'blog'].includes(platform)) {
            return NextResponse.json(
                { error: 'Invalid platform. Must be "x", "linkedin", or "blog"' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user already has 2 examples for this type+platform combination
        const existingCount = await ExamplePostModel.countDocuments({
            clerk_id: userId,
            type,
            platform
        });

        if (existingCount >= 2) {
            return NextResponse.json(
                { error: `Maximum 2 example posts allowed per type per platform. Delete an existing ${type} post for ${platform} first.` },
                { status: 400 }
            );
        }

        // Create the example post
        const examplePost = await ExamplePostModel.create({
            clerk_id: userId,
            type,
            platform,
            content
        });

        return NextResponse.json({
            success: true,
            data: examplePost
        }, { status: 201 });

    } catch (error) {
        console.error('Example post creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create example post' },
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
        const type = searchParams.get('type');
        const platform = searchParams.get('platform');

        // Build query
        const query: any = { clerk_id: userId };
        
        if (type && ['learning', 'product'].includes(type)) {
            query.type = type;
        }
        
        if (platform && ['x', 'linkedin', 'blog'].includes(platform)) {
            query.platform = platform;
        }

        // Fetch example posts
        const examplePosts = await ExamplePostModel.find(query)
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            data: examplePosts,
            count: examplePosts.length
        });

    } catch (error) {
        console.error('Example posts fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch example posts' },
            { status: 500 }
        );
    }
}
```

---

### 2. Update & Delete Example Post

**File:** `app/api/example-posts/[id]/route.ts`

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ExamplePostModel from '@/app/api/models/ExamplePostModel';

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
        const { type, platform, content } = await request.json();

        await dbConnect();

        // Find the example post and verify ownership
        const examplePost = await ExamplePostModel.findOne({
            _id: id,
            clerk_id: userId
        });

        if (!examplePost) {
            return NextResponse.json(
                { error: 'Example post not found or unauthorized' },
                { status: 404 }
            );
        }

        // Validate if type or platform is being changed
        if (type && !['learning', 'product'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type. Must be "learning" or "product"' },
                { status: 400 }
            );
        }

        if (platform && !['x', 'linkedin', 'blog'].includes(platform)) {
            return NextResponse.json(
                { error: 'Invalid platform. Must be "x", "linkedin", or "blog"' },
                { status: 400 }
            );
        }

        // If changing type or platform, check the 2-per-type-per-platform limit
        if ((type && type !== examplePost.type) || (platform && platform !== examplePost.platform)) {
            const newType = type || examplePost.type;
            const newPlatform = platform || examplePost.platform;

            const existingCount = await ExamplePostModel.countDocuments({
                clerk_id: userId,
                type: newType,
                platform: newPlatform,
                _id: { $ne: id } // Exclude current document
            });

            if (existingCount >= 2) {
                return NextResponse.json(
                    { error: `Maximum 2 example posts allowed for ${newType} on ${newPlatform}` },
                    { status: 400 }
                );
            }
        }

        // Update the example post
        const updatedPost = await ExamplePostModel.findByIdAndUpdate(
            id,
            {
                ...(type && { type }),
                ...(platform && { platform }),
                ...(content && { content })
            },
            { new: true, runValidators: true }
        );

        return NextResponse.json({
            success: true,
            data: updatedPost
        });

    } catch (error) {
        console.error('Example post update error:', error);
        return NextResponse.json(
            { error: 'Failed to update example post' },
            { status: 500 }
        );
    }
}

export async function DELETE(
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

        // Find and delete the example post (verify ownership)
        const deletedPost = await ExamplePostModel.findOneAndDelete({
            _id: id,
            clerk_id: userId
        });

        if (!deletedPost) {
            return NextResponse.json(
                { error: 'Example post not found or unauthorized' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Example post deleted successfully'
        });

    } catch (error) {
        console.error('Example post deletion error:', error);
        return NextResponse.json(
            { error: 'Failed to delete example post' },
            { status: 500 }
        );
    }
}
```

---

## Testing the API

### Manual Testing with Thunder Client / Postman

**1. Create Example Post**
```http
POST http://localhost:3000/api/example-posts
Content-Type: application/json

{
  "type": "learning",
  "platform": "x",
  "content": "Today I learned about React hooks! The useEffect hook is powerful for side effects. 🚀 #100DaysOfCode"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "clerk_id": "user_...",
    "type": "learning",
    "platform": "x",
    "content": "Today I learned about...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

**2. Get All Example Posts**
```http
GET http://localhost:3000/api/example-posts
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [...],
  "count": 2
}
```

---

**3. Get Filtered Example Posts**
```http
GET http://localhost:3000/api/example-posts?type=learning&platform=x
```

---

**4. Update Example Post**
```http
PUT http://localhost:3000/api/example-posts/[POST_ID]
Content-Type: application/json

{
  "content": "Updated content here!"
}
```

---

**5. Delete Example Post**
```http
DELETE http://localhost:3000/api/example-posts/[POST_ID]
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Example post deleted successfully"
}
```

---

**6. Test Max Limit (should fail on 3rd attempt)**
```http
# Create 1st post for learning + x
POST /api/example-posts
{ "type": "learning", "platform": "x", "content": "Post 1" }

# Create 2nd post for learning + x
POST /api/example-posts
{ "type": "learning", "platform": "x", "content": "Post 2" }

# Try to create 3rd post for learning + x (should fail)
POST /api/example-posts
{ "type": "learning", "platform": "x", "content": "Post 3" }
```

**Expected Response (400):**
```json
{
  "error": "Maximum 2 example posts allowed per type per platform. Delete an existing learning post for x first."
}
```

---

## Edge Cases to Test

1. **Unauthorized access** - Call endpoints without Clerk auth (should return 401)
2. **Missing fields** - Create without type/platform/content (should return 400)
3. **Invalid enum values** - Use invalid type like "testing" (should return 400)
4. **Update non-existent post** - Update with fake ID (should return 404)
5. **Delete other user's post** - Try to delete another user's post (should return 404)
6. **Maximum limit enforcement** - Try to create 3rd post for same type+platform (should return 400)

---

## Validation Rules Summary

### POST `/api/example-posts`
- ✅ User must be authenticated (Clerk)
- ✅ Required: `type`, `platform`, `content`
- ✅ `type` must be: `'learning'` or `'product'`
- ✅ `platform` must be: `'x'`, `'linkedin'`, or `'blog'`
- ✅ Max 2 posts per user per type per platform

### GET `/api/example-posts`
- ✅ User must be authenticated
- ✅ Optional filters: `?type=learning&platform=x`
- ✅ Returns only user's own posts

### PUT `/api/example-posts/:id`
- ✅ User must be authenticated
- ✅ Can only update own posts
- ✅ Validates enum values if changing type/platform
- ✅ Enforces max limit if changing type/platform

### DELETE `/api/example-posts/:id`
- ✅ User must be authenticated
- ✅ Can only delete own posts

---

## Error Handling

All endpoints include:
- Try-catch blocks
- Proper HTTP status codes
- Descriptive error messages
- Console error logging
- User-friendly error responses

---

## Checklist

- [ ] Create `app/api/example-posts/route.ts` with POST and GET handlers
- [ ] Create `app/api/example-posts/[id]/route.ts` with PUT and DELETE handlers
- [ ] Test POST - Create example post
- [ ] Test POST - Verify max 2 limit enforcement
- [ ] Test GET - List all example posts
- [ ] Test GET - Filter by type
- [ ] Test GET - Filter by platform
- [ ] Test PUT - Update example post
- [ ] Test PUT - Verify ownership check
- [ ] Test DELETE - Delete example post
- [ ] Test DELETE - Verify ownership check
- [ ] Test all error cases (401, 400, 404, 500)
- [ ] Verify MongoDB indexes are being used

---

## Database Queries Used

This implementation uses these MongoDB operations:

```typescript
// Count documents
ExamplePostModel.countDocuments({ clerk_id, type, platform })

// Create document
ExamplePostModel.create({ clerk_id, type, platform, content })

// Find multiple with filters
ExamplePostModel.find(query).sort({ createdAt: -1 })

// Find one by ID and user
ExamplePostModel.findOne({ _id, clerk_id })

// Update by ID
ExamplePostModel.findByIdAndUpdate(id, updateData, { new: true })

// Delete by ID and user
ExamplePostModel.findOneAndDelete({ _id, clerk_id })
```

---

## Common Issues & Solutions

**Issue:** "Unauthorized" error even when logged in  
**Solution:** Verify Clerk middleware is configured correctly and you're testing with authenticated requests

**Issue:** Can't create more than 2 posts  
**Solution:** This is expected! Delete an existing post for that type+platform combination first

**Issue:** Can update/delete other users' posts  
**Solution:** Check that query includes `clerk_id: userId` filter

**Issue:** TypeScript errors on params  
**Solution:** Ensure proper typing: `{ params }: { params: { id: string } }`

---

## Next Steps

After completing this task:
1. Move to Task 03: Weekly Goals API
2. The Weekly Goals API will reference these example posts when generating content

---

## Git Commit

After successfully completing and testing this task:

```bash
# Stage the API files
git add app/api/example-posts/route.ts
git add app/api/example-posts/[id]/route.ts

# Commit with descriptive message
git commit -m "feat: add Example Posts CRUD API

- Add POST endpoint to create example posts
- Add GET endpoint with type/platform filtering
- Add PUT endpoint to update example posts
- Add DELETE endpoint to remove example posts
- Enforce max 2 posts per type per platform
- Add ownership verification for update/delete
- Include comprehensive error handling and validation"

# Push to your branch
git push origin your-branch-name
```

---

**Status:** Ready to implement  
**Previous Task:** `01-database-models.md` ✅  
**Next Task:** `03-weekly-goals-api.md`