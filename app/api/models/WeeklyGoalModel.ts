import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IWeeklyGoal extends Document {
    clerk_id: string;
    title: string;
    type: 'learning' | 'product';
    status: 'active' | 'complete';
    startDate: Date;
    completedAt?: Date;
    dailyTasks: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const WeeklyGoalSchema = new Schema<IWeeklyGoal>(
    {
        clerk_id: {
            type: String,
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ['learning', 'product'],
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'complete'],
            default: 'active'
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        completedAt: {
            type: Date
        },
        dailyTasks: [{
            type: Schema.Types.ObjectId,
            ref: 'DailyTask'
        }]
    },
    {
        timestamps: true
    }
);

// Index for querying user's goals ordered by date
WeeklyGoalSchema.index({ clerk_id: 1, startDate: -1 });

const WeeklyGoalModel: Model<IWeeklyGoal> = 
    mongoose.models.WeeklyGoal || mongoose.model<IWeeklyGoal>('WeeklyGoal', WeeklyGoalSchema);

export default WeeklyGoalModel;
