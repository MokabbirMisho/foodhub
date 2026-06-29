import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
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
    price: {
      type: Number,
      required: true,
      min: [0, 'Price must be greater than or equal to 0'],
    },
    discountPrice: {
      type: Number,
      default: null,
      min: [0, 'Discount price must be greater than or equal to 0'],
      validate: {
        validator(value) {
          return value === null || value <= this.price;
        },
        message: 'Discount price cannot be greater than price',
      },
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isVegetarian: {
      type: Boolean,
      default: false,
    },
    preparationTime: {
      type: Number,
      default: 20,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

const FoodItem = mongoose.model('FoodItem', foodItemSchema);

export default FoodItem;

