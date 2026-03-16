import mongoose from 'mongoose';

const flashSaleSchema = new mongoose.Schema(
  {
    endAt: {
      type: Date,
      required: true
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    closeReason: {
      type: String,
      enum: ['replaced', 'cleared', 'expired', null],
      default: null
    },
    closedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

flashSaleSchema.index({ createdAt: -1 });
flashSaleSchema.index({ isPublished: 1, endAt: -1 });

const FlashSale = mongoose.model('FlashSale', flashSaleSchema);

export default FlashSale;
