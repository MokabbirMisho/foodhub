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
    acceptsOnlineOrders: {
      type: Boolean,
      default: true,
    },
    autoAcceptOrders: {
      type: Boolean,
      default: false,
    },
    defaultPreparationTime: {
      type: Number,
      enum: [20, 30, 45],
      default: 30,
    },
    estimatedDeliveryTime: {
      type: String,
      trim: true,
    },
    ownerPreferenceLanguage: {
      type: String,
      enum: ['en', 'de'],
      default: 'en',
    },
    ownerTimeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '24h',
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
    isTemporarilyPaused: {
      type: Boolean,
      default: false,
    },
    temporaryPauseReason: {
      type: String,
      trim: true,
      default: '',
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
    deactivationRequest: {
      requested: {
        type: Boolean,
        default: false,
      },
      reason: {
        type: String,
        trim: true,
        default: '',
      },
      requestedAt: Date,
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
      },
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
