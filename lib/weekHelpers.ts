import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';

/**
 * Get or create the appropriate weekly goal for the next task
 * Weeks are auto-managed in the background
 */
export async function getOrCreateWeekForTask(
  userId: string,
  taskNumber: number,
  type: 'learning' | 'product'
) {
  const weekNumber = Math.ceil(taskNumber / 7);
  const dayInWeek = ((taskNumber - 1) % 7) + 1;

  // Try to find existing week
  let week = await WeeklyGoalModel.findOne({
    clerk_id: userId,
    status: 'active'
  });

  // If no active week or it's full, check if we need a new week
  if (!week || dayInWeek === 1) {
    const taskCount = await DailyTaskModel.countDocuments({
      weeklyGoalId: week?._id
    });

    // Create new week if current is full (7 tasks)
    if (!week || taskCount === 7) {
      week = await WeeklyGoalModel.create({
        clerk_id: userId,
        title: `Week ${weekNumber}`,
        type,
        status: 'active',
        startDate: new Date(),
        dailyTasks: []
      });
    }
  }

  return week;
}

/**
 * Get the next available task number for a user
 */
export async function getNextTaskNumber(userId: string): Promise<number> {
  const weeklyGoals = await WeeklyGoalModel.find({
    clerk_id: userId
  }).select('_id');

  const weeklyGoalIds = weeklyGoals.map(g => g._id);

  const taskCount = await DailyTaskModel.countDocuments({
    weeklyGoalId: { $in: weeklyGoalIds }
  });

  return taskCount + 1;
}

/**
 * Check if user can create next task (previous must be complete)
 */
export async function canCreateNextTask(userId: string): Promise<{
  canCreate: boolean;
  reason?: string;
  lastTask?: any;
}> {
  const weeklyGoals = await WeeklyGoalModel.find({
    clerk_id: userId
  }).select('_id');

  const weeklyGoalIds = weeklyGoals.map(g => g._id);

  // Get the latest task
  const lastTask = await DailyTaskModel.findOne({
    weeklyGoalId: { $in: weeklyGoalIds }
  }).sort({ createdAt: -1 });

  // If no tasks, can create first one
  if (!lastTask) {
    return { canCreate: true };
  }

  // Check if last task is complete
  if (lastTask.status !== 'complete') {
    return {
      canCreate: false,
      reason: `Complete your previous task first (created ${new Date(lastTask.createdAt).toLocaleDateString()})`,
      lastTask
    };
  }

  return { canCreate: true };
}
