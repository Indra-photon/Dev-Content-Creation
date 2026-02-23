import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';

/**
 * Get or create the appropriate weekly goal for a task
 * Weeks are auto-managed in the background (every 7 unique dates = 1 week)
 */
export async function getOrCreateWeekForTask(
  userId: string,
  type: 'learning' | 'product'
) {
  // Try to find existing active week
  let week = await WeeklyGoalModel.findOne({
    clerk_id: userId,
    status: 'active'
  });

  // If no active week, create one
  if (!week) {
    const weekCount = await WeeklyGoalModel.countDocuments({
      clerk_id: userId
    });

    week = await WeeklyGoalModel.create({
      clerk_id: userId,
      title: `Week ${weekCount + 1}`,
      type,
      status: 'active',
      startDate: new Date(),
      dailyTasks: []
    });
  }

  return week;
}

/**
 * Get all unique dates that have tasks
 */
async function getUniqueDatesWithTasks(userId: string): Promise<string[]> {
  const weeklyGoals = await WeeklyGoalModel.find({
    clerk_id: userId
  }).select('_id');

  const weeklyGoalIds = weeklyGoals.map(g => g._id);

  const tasks = await DailyTaskModel.find({
    weeklyGoalId: { $in: weeklyGoalIds }
  }).select('scheduledDate').sort({ scheduledDate: 1 });

  // Get unique dates (YYYY-MM-DD format)
  const uniqueDates = [...new Set(
    tasks.map(t => new Date(t.scheduledDate).toISOString().split('T')[0])
  )];

  return uniqueDates;
}

/**
 * Check if user can create task on a new date
 * Rule: All tasks from previous date must be complete before creating tasks on next date
 */
export async function canCreateTaskOnDate(
  userId: string, 
  newDate: string // YYYY-MM-DD format
): Promise<{
  canCreate: boolean;
  reason?: string;
  incompleteTasks?: any[];
  previousDate?: string;
}> {
  const weeklyGoals = await WeeklyGoalModel.find({
    clerk_id: userId
  }).select('_id');

  const weeklyGoalIds = weeklyGoals.map(g => g._id);

  // Get all tasks
  const allTasks = await DailyTaskModel.find({
    weeklyGoalId: { $in: weeklyGoalIds }
  }).sort({ scheduledDate: 1 });

  // If no tasks exist, can create on any date
  if (allTasks.length === 0) {
    return { canCreate: true };
  }

  // Get unique dates with tasks
  const uniqueDates = [...new Set(
    allTasks.map(t => new Date(t.scheduledDate).toISOString().split('T')[0])
  )].sort();

  const newDateObj = new Date(newDate);
  
  // Check if creating task on existing date
  if (uniqueDates.includes(newDate)) {
    // Can always add more tasks to an existing date
    return { canCreate: true };
  }

  // Creating task on a NEW date - check if all tasks from previous dates are complete
  const datesBeforeNew = uniqueDates.filter(d => new Date(d) < newDateObj);
  
  if (datesBeforeNew.length === 0) {
    // Creating task before all existing dates, allow it
    return { canCreate: true };
  }

  // Get the most recent date before the new date
  const previousDate = datesBeforeNew[datesBeforeNew.length - 1];

  // Check if all tasks from that date are complete
  const tasksOnPreviousDate = allTasks.filter(t => {
    const taskDate = new Date(t.scheduledDate).toISOString().split('T')[0];
    return taskDate === previousDate;
  });

  const incompleteTasks = tasksOnPreviousDate.filter(t => t.status !== 'complete');

  if (incompleteTasks.length > 0) {
    return {
      canCreate: false,
      reason: `Complete all tasks from ${new Date(previousDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} first (${tasksOnPreviousDate.length - incompleteTasks.length}/${tasksOnPreviousDate.length} done)`,
      incompleteTasks,
      previousDate
    };
  }

  return { canCreate: true };
}

/**
 * Get the latest date with tasks
 */
export async function getLatestTaskDate(userId: string): Promise<string | null> {
  const weeklyGoals = await WeeklyGoalModel.find({
    clerk_id: userId
  }).select('_id');

  const weeklyGoalIds = weeklyGoals.map(g => g._id);

  const latestTask = await DailyTaskModel.findOne({
    weeklyGoalId: { $in: weeklyGoalIds }
  }).sort({ scheduledDate: -1 });

  if (!latestTask) return null;

  return new Date(latestTask.scheduledDate).toISOString().split('T')[0];
}
