import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import { checkAndCompleteWeek } from '@/app/api/utils/weeklyGoalHelpers';

export async function POST(
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
        const { code, learningNotes } = await request.json();

        // Validate completion data
        if (!code || !learningNotes) {
            return NextResponse.json(
                { error: 'Missing required fields: code, learningNotes' },
                { status: 400 }
            );
        }

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
                { error: 'Unauthorized to complete this task' },
                { status: 403 }
            );
        }

        // Check if task is already complete
        if (dailyTask.status === 'complete') {
            return NextResponse.json(
                { error: 'Task is already completed' },
                { status: 400 }
            );
        }

        // Check if task is locked
        if (dailyTask.status === 'locked') {
            return NextResponse.json(
                { error: `This task is locked. Complete Day ${dailyTask.dayNumber - 1} first.` },
                { status: 400 }
            );
        }

        // Mark task as complete
        dailyTask.status = 'complete';
        dailyTask.completionData = {
            code,
            learningNotes,
            completedAt: new Date()
        };
        await dailyTask.save();

        // Unlock the next task (Day N+1)
        if (dailyTask.dayNumber < 7) {
            const nextTask = await DailyTaskModel.findOne({
                weeklyGoalId: dailyTask.weeklyGoalId,
                dayNumber: dailyTask.dayNumber + 1
            });

            if (nextTask && nextTask.status === 'locked') {
                nextTask.status = 'active';
                await nextTask.save();
                
                console.log(`Day ${nextTask.dayNumber} unlocked!`);
            }
        }

        // Check if week is now complete (all 7 tasks done)
        await checkAndCompleteWeek(dailyTask.weeklyGoalId.toString());

        return NextResponse.json({
            success: true,
            data: dailyTask,
            message: dailyTask.dayNumber < 7 
                ? `Task completed! Day ${dailyTask.dayNumber + 1} is now unlocked.`
                : 'Task completed! This was the final task of the week.'
        });

    } catch (error) {
        console.error('Task completion error:', error);
        return NextResponse.json(
            { error: 'Failed to complete task' },
            { status: 500 }
        );
    }
}
