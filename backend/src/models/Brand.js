import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'hidden', 'draft', 'archived'],
      default: 'active'
    }
  },
  { timestamps: true }
);

brandSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const Brand = mongoose.model('Brand', brandSchema);

export default Brand;
