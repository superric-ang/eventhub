import mongoose, { Document, Schema } from 'mongoose';

export interface IPromoCode extends Document {
  code: string;
  event: mongoose.Types.ObjectId;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  currentUses: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  startsAt: Date;
  expiresAt: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const promoSchema = new Schema<IPromoCode>(
  {
    code: { type: String, required: true, uppercase: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: { type: Number, required: true },
    maxUses: { type: Number, default: 100 },
    currentUses: { type: Number, default: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

promoSchema.index({ code: 1, event: 1 }, { unique: true });

export default mongoose.model<IPromoCode>('PromoCode', promoSchema);
