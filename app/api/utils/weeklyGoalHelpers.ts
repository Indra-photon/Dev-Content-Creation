import WeeklyGoalModel from '@/app/api/models/WeeklyGoalModel';
import DailyTaskModel from '@/app/api/models/DailyTaskModel';

/**
 * Check if a weekly goal is complete and update status if needed
 * Called after a daily task is completed
 */
export async function checkAndCompleteWeek(weeklyGoalId: string) {
    try {
        const weeklyGoal = await WeeklyGoalModel.findById(weeklyGoalId);
        
        if (!weeklyGoal || weeklyGoal.status === 'complete') {
            return weeklyGoal;
        }

        // Count completed tasks
        const completedTasks = await DailyTaskModel.countDocuments({
            weeklyGoalId,
            status: 'complete'
        });

        // Count total tasks (should be 7, but check anyway)
        const totalTasks = await DailyTaskModel.countDocuments({
            weeklyGoalId
        });

        console.log(`Week ${weeklyGoalId}: ${completedTasks}/${totalTasks} tasks completed`);

        // If all tasks are complete, mark week as complete
        if (completedTasks === 7 && totalTasks === 7) {
            weeklyGoal.status = 'complete';
            weeklyGoal.completedAt = new Date();
            await weeklyGoal.save();
            
            console.log(`✅ Weekly goal ${weeklyGoalId} auto-completed!`);
        }

        return weeklyGoal;
    } catch (error) {
        console.error('Error checking week completion:', error);
        throw error;
    }
}

/**
 * Get the current active weekly goal for a user
 */
export async function getCurrentWeeklyGoal(clerk_id: string) {
    try {
        const activeGoal = await WeeklyGoalModel.findOne({
            clerk_id,
            status: 'active'
        });

        return activeGoal;
    } catch (error) {
        console.error('Error getting current weekly goal:', error);
        throw error;
    }
}

/**
 * Get completion statistics for a weekly goal
 */
export async function getWeeklyGoalStats(weeklyGoalId: string) {
    try {
        const totalTasks = await DailyTaskModel.countDocuments({
            weeklyGoalId
        });

        const completedTasks = await DailyTaskModel.countDocuments({
            weeklyGoalId,
            status: 'complete'
        });

        const activeTasks = await DailyTaskModel.countDocuments({
            weeklyGoalId,
            status: 'active'
        });

        const lockedTasks = await DailyTaskModel.countDocuments({
            weeklyGoalId,
            status: 'locked'
        });

        return {
            total: totalTasks,
            completed: completedTasks,
            active: activeTasks,
            locked: lockedTasks,
            progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            isComplete: completedTasks === 7 && totalTasks === 7
        };
    } catch (error) {
        console.error('Error getting weekly goal stats:', error);
        throw error;
    }
}
