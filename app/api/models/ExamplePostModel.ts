import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IExamplePost extends Document {
    clerk_id: string;
    type: 'learning' | 'product';
    platform: 'x' | 'linkedin' | 'blog';
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const ExamplePostSchema = new Schema<IExamplePost>(
    {
        clerk_id: {
            type: String,
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: ['learning', 'product'],
            required: true
        },
        platform: {
            type: String,
            enum: ['x', 'linkedin', 'blog'],
            required: true
        },
        content: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Compound index for querying by user, type, and platform
ExamplePostSchema.index({ clerk_id: 1, type: 1, platform: 1 });

const ExamplePostModel: Model<IExamplePost> = 
    mongoose.models.ExamplePost || mongoose.model<IExamplePost>('ExamplePost', ExamplePostSchema);

export default ExamplePostModel;
