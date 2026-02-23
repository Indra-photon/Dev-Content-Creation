import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';
import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';

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

    // Get all weekly goals for this user
    const weeklyGoals = await WeeklyGoalModel.find({
      clerk_id: userId
    }).select('_id type title');

    const weeklyGoalIds = weeklyGoals.map(g => g._id);

    // Get all tasks across all weeks
    const tasks = await DailyTaskModel.find({
      weeklyGoalId: { $in: weeklyGoalIds }
    })
    .populate('weeklyGoalId', 'type title')
    .sort({ createdAt: 1 }); // Chronological order

    // Enrich with goal type
    const enrichedTasks = tasks.map(task => {
      const taskObj = task.toObject();
      const populatedGoal = task.weeklyGoalId as any;
      return {
        ...taskObj,
        goalType: populatedGoal?.type,
        goalTitle: populatedGoal?.title,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedTasks,
      count: enrichedTasks.length
    });

  } catch (error) {
    console.error('Error fetching all tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
