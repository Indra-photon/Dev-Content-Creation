
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IUser extends Document {
    clerk_id: string;
    email: string;
    name?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        clerk_id: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default UserModel;
