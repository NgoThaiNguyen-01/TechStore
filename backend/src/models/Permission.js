import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    }
  },
  { timestamps: true }
);

permissionSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;
