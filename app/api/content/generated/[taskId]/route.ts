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
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { taskId } = await params;

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
