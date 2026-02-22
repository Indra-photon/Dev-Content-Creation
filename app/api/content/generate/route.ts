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
        if ((error as any)?.status === 429) {
            return NextResponse.json(
                { error: 'AI service rate limit exceeded. Please try again in a moment.' },
                { status: 429 }
            );
        }

        if ((error as any)?.status === 401) {
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
