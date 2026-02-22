import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import { checkAndCompleteWeek } from '@/app/api/utils/weeklyGoalHelpers';
import { validateCode, validateLearningNotes, sanitizeCode, sanitizeLearningNotes } from '@/app/api/utils/completionValidators';

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

        // Enhanced validation
        const codeValidation = validateCode(code);
        if (!codeValidation.valid) {
            return NextResponse.json(
                { error: codeValidation.error },
                { status: 400 }
            );
        }

        const notesValidation = validateLearningNotes(learningNotes);
        if (!notesValidation.valid) {
            return NextResponse.json(
                { error: notesValidation.error },
                { status: 400 }
            );
        }

        // Sanitize inputs
        const sanitizedCode = sanitizeCode(code);
        const sanitizedNotes = sanitizeLearningNotes(learningNotes);

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

        // Check if task is already complete (idempotency)
        if (dailyTask.status === 'complete') {
            return NextResponse.json(
                { 
                    success: true,
                    data: dailyTask,
                    message: 'Task was already completed'
                },
                { status: 200 }
            );
        }

        // Check if task is locked
        if (dailyTask.status === 'locked') {
            return NextResponse.json(
                { error: `This task is locked. Complete Day ${dailyTask.dayNumber - 1} first.` },
                { status: 400 }
            );
        }

        // Mark task as complete with sanitized data
        dailyTask.status = 'complete';
        dailyTask.completionData = {
            code: sanitizedCode,
            learningNotes: sanitizedNotes,
            completedAt: new Date()
        };
        await dailyTask.save();

        // Unlock the next task (Day N+1)
        let nextTaskUnlocked = false;
        if (dailyTask.dayNumber < 7) {
            const nextTask = await DailyTaskModel.findOne({
                weeklyGoalId: dailyTask.weeklyGoalId,
                dayNumber: dailyTask.dayNumber + 1
            });

            if (nextTask && nextTask.status === 'locked') {
                nextTask.status = 'active';
                await nextTask.save();
                nextTaskUnlocked = true;
                
                console.log(`✅ Day ${nextTask.dayNumber} unlocked for user ${userId}`);
            }
        }

        // Check if week is now complete (all 7 tasks done)
        const updatedWeek = await checkAndCompleteWeek(dailyTask.weeklyGoalId.toString());
        const weekCompleted = updatedWeek?.status === 'complete';

        // Log completion event
        console.log(`✅ Task completed - User: ${userId}, Week: ${dailyTask.weeklyGoalId}, Day: ${dailyTask.dayNumber}`);
        if (weekCompleted) {
            console.log(`🎉 Week ${dailyTask.weeklyGoalId} completed!`);
        }

        // Build response message
        let message = 'Task completed successfully!';
        if (weekCompleted) {
            message = '🎉 Congratulations! You completed all 7 tasks. Your week is now complete!';
        } else if (nextTaskUnlocked) {
            message = `Task completed! Day ${dailyTask.dayNumber + 1} is now unlocked.`;
        } else if (dailyTask.dayNumber === 7) {
            message = 'Task completed! This was the final task of the week.';
        }

        return NextResponse.json({
            success: true,
            data: dailyTask,
            message,
            nextTaskUnlocked,
            weekCompleted
        });

    } catch (error) {
        console.error('Task completion error:', error);
        return NextResponse.json(
            { error: 'Failed to complete task' },
            { status: 500 }
        );
    }
}
