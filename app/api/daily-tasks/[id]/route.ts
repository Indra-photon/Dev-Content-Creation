import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';

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
