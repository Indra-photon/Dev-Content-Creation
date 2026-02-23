import mongoose, { Document, Schema, Model, Types } from 'mongoose';

interface Resource {
    url: string;
    title?: string;
}

interface CompletionData {
    code: string;
    learningNotes: string;
    completedAt: Date;
}

export interface IDailyTask extends Document {
    weeklyGoalId: Types.ObjectId;
    dayNumber: number; // 1-7
    description: string;
    resources: Resource[];
    status: 'locked' | 'active' | 'complete';
    scheduledDate: Date;
    completionData?: CompletionData;
    createdAt: Date;
    updatedAt: Date;
}

const DailyTaskSchema = new Schema<IDailyTask>(
    {
        weeklyGoalId: {
            type: Schema.Types.ObjectId,
            ref: 'WeeklyGoal',
            required: true,
            index: true
        },
        dayNumber: {
            type: Number,
            required: true,
            min: 1,
            max: 7
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        resources: [{
            url: {
                type: String,
                required: true
            },
            title: {
                type: String
            }
        }],
        status: {
            type: String,
            enum: ['locked', 'active', 'complete'],
            default: 'locked'
        },
        scheduledDate: {
            type: Date,
            default: Date.now
        },
        completionData: {
            code: {
                type: String
            },
            learningNotes: {
                type: String
            },
            completedAt: {
                type: Date
            }
        }
    },
    {
        timestamps: true
    }
);

// Compound index for querying tasks by week and day
DailyTaskSchema.index({ weeklyGoalId: 1, dayNumber: 1 }, { unique: true });

const DailyTaskModel: Model<IDailyTask> = 
    mongoose.models.DailyTask || mongoose.model<IDailyTask>('DailyTask', DailyTaskSchema);

export default DailyTaskModel;
