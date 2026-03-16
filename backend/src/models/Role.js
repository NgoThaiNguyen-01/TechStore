import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
      }
    ]
  },
  { timestamps: true }
);

roleSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const Role = mongoose.model('Role', roleSchema);

export default Role;
