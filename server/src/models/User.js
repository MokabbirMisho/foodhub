import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  label: {
    type: String,
    trim: true,
    default: 'Home',
  },
  fullName: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  street: {
    type: String,
    trim: true,
    required: true,
  },
  city: {
    type: String,
    trim: true,
    required: true,
  },
  postalCode: {
    type: String,
    trim: true,
    required: true,
  },
  country: {
    type: String,
    trim: true,
    default: 'Germany',
  },
  location: {
    lat: Number,
    lng: Number,
    displayName: {
      type: String,
      trim: true,
    },
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required() {
        return this.authProvider === 'local';
      },
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'restaurant_owner', 'rider', 'admin'],
      default: 'customer',
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Hash the password before saving a local user.
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare a login password with the hashed password in the database.
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
