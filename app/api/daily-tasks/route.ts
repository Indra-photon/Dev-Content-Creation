import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import { getOrCreateWeekForTask, getNextTaskNumber, canCreateNextTask } from '@/lib/weekHelpers';

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

        // Check if user can create next task
        const canCreate = await canCreateNextTask(userId);
        if (!canCreate.canCreate) {
            return NextResponse.json(
                { 
                    error: canCreate.reason,
                    lastTask: canCreate.lastTask
                },
                { status: 400 }
            );
        }

        // Get next task number
        const taskNumber = await getNextTaskNumber(userId);

        // Get or create weekly goal (auto-managed)
        const weeklyGoal = await getOrCreateWeekForTask(userId, taskNumber, type);

        // Determine day number within the week
        const dayNumber = ((taskNumber - 1) % 7) + 1;

        // Determine initial status (Day 1 of any week is active, rest are locked)
        const initialStatus = dayNumber === 1 ? 'active' : 'locked';

        // Use provided date or default to today
        const taskDate = scheduledDate ? new Date(scheduledDate) : new Date();

        // Create the daily task
        const dailyTask = await DailyTaskModel.create({
            weeklyGoalId: weeklyGoal._id,
            dayNumber,
            description,
            resources: resources || [],
            status: initialStatus,
            scheduledDate: taskDate,
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
                taskNumber,
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
