import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    shortDesc: {
      type: String,
      default: ''
    },
    seoTitle: {
      type: String,
      default: ''
    },
    seoDesc: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    salePrice: {
      type: Number,
      min: 0
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    images: {
      type: [String],
      default: []
    },
    colors: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          hex: { type: String, required: true, trim: true }
        }
      ],
      default: []
    },
    specs: {
      type: [
        {
          key: { type: String, required: true, trim: true },
          value: { type: String, required: true, trim: true }
        }
      ],
      default: []
    },
    status: {
      type: String,
      enum: ['active', 'hidden', 'draft', 'archived', 'out_of_stock'],
      default: 'draft'
    },
    previousStatus: {
      type: String,
      enum: ['active', 'hidden', 'draft', 'archived', 'out_of_stock', null],
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

productSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
productSchema.index({ isDeleted: 1, status: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
