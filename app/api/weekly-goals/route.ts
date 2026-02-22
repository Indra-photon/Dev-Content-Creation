import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { title, type } = await request.json();

        // Validate required fields
        if (!title || !type) {
            return NextResponse.json(
                { error: 'Missing required fields: title, type' },
                { status: 400 }
            );
        }

        // Validate type enum
        if (!['learning', 'product'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type. Must be "learning" or "product"' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user has an active weekly goal
        const activeGoal = await WeeklyGoalModel.findOne({
            clerk_id: userId,
            status: 'active'
        });

        if (activeGoal) {
            // Check if the active goal is actually complete (all 7 tasks done)
            const completedTasksCount = await DailyTaskModel.countDocuments({
                weeklyGoalId: activeGoal._id,
                status: 'complete'
            });

            if (completedTasksCount < 7) {
                return NextResponse.json(
                    { 
                        error: 'You have an incomplete weekly goal. Complete all 7 tasks before creating a new week.',
                        activeGoal: {
                            id: activeGoal._id,
                            title: activeGoal.title,
                            completedTasks: completedTasksCount,
                            totalTasks: 7
                        }
                    },
                    { status: 400 }
                );
            }

            // If all 7 tasks are done, auto-complete the previous week
            activeGoal.status = 'complete';
            activeGoal.completedAt = new Date();
            await activeGoal.save();
        }

        // Create new weekly goal
        const weeklyGoal = await WeeklyGoalModel.create({
            clerk_id: userId,
            title,
            type,
            status: 'active',
            startDate: new Date(),
            dailyTasks: []
        });

        return NextResponse.json({
            success: true,
            data: weeklyGoal
        }, { status: 201 });

    } catch (error) {
        console.error('Weekly goal creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create weekly goal' },
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
        const status = searchParams.get('status');
        const type = searchParams.get('type');

        // Build query
        const query: any = { clerk_id: userId };
        
        if (status && ['active', 'complete'].includes(status)) {
            query.status = status;
        }
        
        if (type && ['learning', 'product'].includes(type)) {
            query.type = type;
        }

        // Fetch weekly goals with task counts
        const weeklyGoals = await WeeklyGoalModel.find(query)
            .sort({ startDate: -1 });

        // Enrich with task completion counts
        const enrichedGoals = await Promise.all(
            weeklyGoals.map(async (goal) => {
                const totalTasks = await DailyTaskModel.countDocuments({
                    weeklyGoalId: goal._id
                });

                const completedTasks = await DailyTaskModel.countDocuments({
                    weeklyGoalId: goal._id,
                    status: 'complete'
                });

                return {
                    ...goal.toObject(),
                    taskStats: {
                        total: totalTasks,
                        completed: completedTasks,
                        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
                    }
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: enrichedGoals,
            count: enrichedGoals.length
        });

    } catch (error) {
        console.error('Weekly goals fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch weekly goals' },
            { status: 500 }
        );
    }
}
