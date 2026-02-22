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
            { error: 'Failed to generate weekly wrap-up. Please try again.' },
            { status: 500 }
        );
    }
}
