import mongoose from 'mongoose';

const createDaySchedule = (open, close) => ({
  isClosed: {
    type: Boolean,
    default: false,
  },
  open: {
    type: String,
    default: open,
  },
  close: {
    type: String,
    default: close,
  },
});

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        default: 'Germany',
        trim: true,
      },
    },
    cuisineTypes: [
      {
        type: String,
        trim: true,
      },
    ],
    logo: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    ratingAverage: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    estimatedDeliveryTime: {
      type: String,
      trim: true,
    },
    openingHours: {
      monday: createDaySchedule('10:00', '22:00'),
      tuesday: createDaySchedule('10:00', '22:00'),
      wednesday: createDaySchedule('10:00', '22:00'),
      thursday: createDaySchedule('10:00', '22:00'),
      friday: createDaySchedule('10:00', '23:00'),
      saturday: createDaySchedule('11:00', '23:00'),
      sunday: createDaySchedule('11:00', '22:00'),
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    isTemporarilyClosed: {
      type: Boolean,
      default: false,
    },
    temporaryClosedReason: {
      type: String,
      trim: true,
      default: '',
    },
    availabilityNote: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// For now, each restaurant owner can create only one restaurant profile.
restaurantSchema.index({ owner: 1 }, { unique: true });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
