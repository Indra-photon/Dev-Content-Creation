import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import { getOrCreateWeekForTask, canCreateTaskOnDate } from '@/lib/weekHelpers';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { description, resources, type, scheduledDate } = await request.json();

        // Validate required fields
        if (!description || !type) {
            return NextResponse.json(
                { error: 'Missing required fields: description, type' },
                { status: 400 }
            );
        }

        if (!['learning', 'product'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type. Must be "learning" or "product"' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Use provided date or default to today
        const taskDate = scheduledDate || new Date().toISOString().split('T')[0];

        // Check if user can create task on this date
        const canCreate = await canCreateTaskOnDate(userId, taskDate);
        if (!canCreate.canCreate) {
            return NextResponse.json(
                { 
                    error: canCreate.reason,
                    incompleteTasks: canCreate.incompleteTasks,
                    previousDate: canCreate.previousDate
                },
                { status: 400 }
            );
        }

        // Get or create weekly goal (auto-managed in background)
        const weeklyGoal = await getOrCreateWeekForTask(userId, type);

        // Count tasks on this specific date
        const tasksOnDate = await DailyTaskModel.countDocuments({
            weeklyGoalId: weeklyGoal._id,
            scheduledDate: {
                $gte: new Date(taskDate),
                $lt: new Date(new Date(taskDate).getTime() + 24 * 60 * 60 * 1000)
            }
        });

        // All tasks on the same day start as "active" (no locks within a day)
        const initialStatus = 'active';

        // Day number is just for reference (not used for locking)
        const dayNumber = tasksOnDate + 1;

        // Create the daily task
        const dailyTask = await DailyTaskModel.create({
            weeklyGoalId: weeklyGoal._id,
            dayNumber,
            description,
            resources: resources || [],
            status: initialStatus,
            scheduledDate: new Date(taskDate),
        });

        // Add task reference to weekly goal
        await WeeklyGoalModel.findByIdAndUpdate(
            weeklyGoal._id,
            { $push: { dailyTasks: dailyTask._id } }
        );

        return NextResponse.json({
            success: true,
            data: {
                ...dailyTask.toObject(),
                goalType: type,
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Daily task creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create daily task' },
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

        const { searchParams } = new URL(request.url);
        const weeklyGoalId = searchParams.get('weeklyGoalId');

        if (!weeklyGoalId) {
            return NextResponse.json(
                { error: 'weeklyGoalId query parameter is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Verify weekly goal belongs to user
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

        // Fetch all daily tasks for this week, sorted by day number
        const dailyTasks = await DailyTaskModel.find({
            weeklyGoalId
        }).sort({ dayNumber: 1 });

        return NextResponse.json({
            success: true,
            data: dailyTasks,
            count: dailyTasks.length
        });

    } catch (error) {
        console.error('Daily tasks fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch daily tasks' },
            { status: 500 }
        );
    }
}
