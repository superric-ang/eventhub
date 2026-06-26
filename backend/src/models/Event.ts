import mongoose, { Document, Schema } from 'mongoose';

export interface ITicketTier {
  name: string;
  description: string;
  price: number;
  quantity: number;
  quantitySold: number;
  maxPerOrder: number;
  saleStart: Date;
  saleEnd: Date;
  isFree: boolean;
  benefits: string[];
}

export interface IEvent extends Document {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  format: 'in_person' | 'online' | 'hybrid';
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  organizer: mongoose.Types.ObjectId;
  coverImage: string;
  images: string[];
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    lat: number;
    lng: number;
  };
  onlineDetails: {
    platform: string;
    url: string;
    instructions: string;
  };
  startDate: Date;
  endDate: Date;
  timezone: string;
  ticketTiers: ITicketTier[];
  tags: string[];
  isFeatured: boolean;
  isPrivate: boolean;
  maxAttendees: number;
  currentAttendees: number;
  views: number;
  shares: number;
  settings: {
    refundPolicy: string;
    refundDays: number;
    requireApproval: boolean;
    showAttendeeCount: boolean;
    waitlistEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ticketTierSchema = new Schema<ITicketTier>({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0 },
  quantitySold: { type: Number, default: 0, min: 0 },
  maxPerOrder: { type: Number, default: 10 },
  saleStart: { type: Date },
  saleEnd: { type: Date },
  isFree: { type: Boolean, default: false },
  benefits: [{ type: String }],
});

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 500 },
    category: {
      type: String,
      required: true,
      enum: [
        'music', 'food_drink', 'performing_arts', 'visual_arts',
        'sports_fitness', 'health_wellness', 'tech', 'business',
        'charity_causes', 'community', 'family_education', 'fashion',
        'film_media', 'travel_outdoor', 'nightlife', 'other',
      ],
    },
    format: {
      type: String,
      enum: ['in_person', 'online', 'hybrid'],
      default: 'in_person',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'draft',
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coverImage: { type: String },
    images: [{ type: String }],
    venue: {
      name: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String, default: 'SG' },
      zipCode: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    onlineDetails: {
      platform: { type: String },
      url: { type: String },
      instructions: { type: String },
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    timezone: { type: String, default: 'Asia/Singapore' },
    ticketTiers: [ticketTierSchema],
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false },
    maxAttendees: { type: Number },
    currentAttendees: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    settings: {
      refundPolicy: { type: String, default: 'no_refunds' },
      refundDays: { type: Number, default: 0 },
      requireApproval: { type: Boolean, default: false },
      showAttendeeCount: { type: Boolean, default: true },
      waitlistEnabled: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ 'venue.city': 1 });
eventSchema.index({ organizer: 1 });

export default mongoose.model<IEvent>('Event', eventSchema);
