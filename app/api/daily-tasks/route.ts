import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { weeklyGoalId, description, resources } = await request.json();

        // Validate required fields
        if (!weeklyGoalId || !description) {
            return NextResponse.json(
                { error: 'Missing required fields: weeklyGoalId, description' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Verify weekly goal exists and belongs to user
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

        // Check if week is already complete
        if (weeklyGoal.status === 'complete') {
            return NextResponse.json(
                { error: 'Cannot add tasks to a completed weekly goal' },
                { status: 400 }
            );
        }

        // Count existing tasks for this week
        const existingTasksCount = await DailyTaskModel.countDocuments({
            weeklyGoalId
        });

        // Check max limit (7 tasks per week)
        if (existingTasksCount >= 7) {
            return NextResponse.json(
                { error: 'Maximum 7 tasks per week. This week is full.' },
                { status: 400 }
            );
        }

        // Determine the day number (sequential)
        const dayNumber = existingTasksCount + 1;

        // Get the previous day's task to check if it exists and is complete
        if (dayNumber > 1) {
            const previousTask = await DailyTaskModel.findOne({
                weeklyGoalId,
                dayNumber: dayNumber - 1
            });

            if (!previousTask) {
                return NextResponse.json(
                    { error: `You must create Day ${dayNumber - 1} before creating Day ${dayNumber}` },
                    { status: 400 }
                );
            }

            // Note: We don't check if previous task is complete for CREATION
            // We only check completion status for UNLOCKING (which happens on completion)
        }

        // Determine initial status
        // Day 1 is always active, Day 2-7 start as locked
        const initialStatus = dayNumber === 1 ? 'active' : 'locked';

        // Create the daily task
        const dailyTask = await DailyTaskModel.create({
            weeklyGoalId,
            dayNumber,
            description,
            resources: resources || [],
            status: initialStatus
        });

        // Add task reference to weekly goal
        await WeeklyGoalModel.findByIdAndUpdate(
            weeklyGoalId,
            {
                $push: { dailyTasks: dailyTask._id }
            }
        );

        return NextResponse.json({
            success: true,
            data: dailyTask
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
