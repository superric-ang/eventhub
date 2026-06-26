import mongoose, { Document, Schema } from 'mongoose';

export interface ITicketItem {
  ticketTierId: mongoose.Types.ObjectId;
  ticketTierName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  event: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  items: ITicketItem[];
  totalAmount: number;
  serviceFee: number;
  paymentFee: number;
  grandTotal: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  paymentId?: string;
  attendeeDetails: Array<{
    ticketTierId: string;
    tickets: Array<{
      name: string;
      email: string;
      phone?: string;
    }>;
  }>;
  promoCode?: string;
  discountAmount: number;
  notes?: string;
  checkedIn: boolean;
  checkedInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        ticketTierId: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        ticketTierName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    serviceFee: { type: Number, default: 0 },
    paymentFee: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    currency: { type: String, default: 'SGD' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    paymentMethod: { type: String, default: 'card' },
    paymentId: { type: String },
    attendeeDetails: [
      {
        ticketTierId: { type: String, required: true },
        tickets: [
          {
            name: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String },
          },
        ],
      },
    ],
    promoCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    notes: { type: String },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ event: 1, status: 1 });
orderSchema.index({ buyer: 1 });

export default mongoose.model<IOrder>('Order', orderSchema);
