import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';

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
