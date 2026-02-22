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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;

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
