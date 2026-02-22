
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPayment extends Document {
  user_id: string; // Store Clerk ID or User _id
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  type: 'one_time' | 'subscription';
  product_id: string; // e.g., 'prod_123' or 'plan_monthly'
  provider_id: string; // Dodo payment ID or session ID
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    user_id: {
      type: String,
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
      required: true
    },
    type: {
      type: String,
      enum: ['one_time', 'subscription'],
      required: true
    },
    product_id: {
      type: String,
      required: true
    },
    provider_id: {
      type: String,
      required: true,
      unique: true
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

const PaymentModel: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default PaymentModel;
