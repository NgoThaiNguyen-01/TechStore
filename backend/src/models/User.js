import mongoose from 'mongoose';
import { normalizeUserContactProfile } from '../utils/userContactProfile.js';

const emailContactSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      maxlength: 255,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email']
    },
    label: {
      type: String,
      maxlength: 80,
      trim: true,
      default: ''
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const phoneContactSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      maxlength: 10,
      trim: true,
      match: [/^(03|05|07|08|09)\d{8}$/, 'Invalid phone']
    },
    label: {
      type: String,
      maxlength: 80,
      trim: true,
      default: ''
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const addressContactSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      maxlength: 500,
      trim: true
    },
    label: {
      type: String,
      maxlength: 80,
      trim: true,
      default: ''
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const cartItemSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variant: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120
    },
    qty: {
      type: Number,
      min: 1,
      default: 1
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const wishlistItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true
    },
    email: {
      type: String,
      required: true,
      maxlength: 255,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email']
    },
    phone: {
      type: String,
      maxlength: 10,
      trim: true,
      match: [/^(03|05|07|08|09)\d{8}$/, 'Invalid phone']
    },
    address: {
      type: String,
      maxlength: 500,
      trim: true
    },
    emails: {
      type: [emailContactSchema],
      default: []
    },
    phones: {
      type: [phoneContactSchema],
      default: []
    },
    addresses: {
      type: [addressContactSchema],
      default: []
    },
    avatar: {
      type: String,
      maxlength: 2048,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: [
        'CUSTOMER',
        'ADMIN',
        'SUPER_ADMIN',
        'PRODUCT_MANAGER',
        'ORDER_MANAGER',
        'INVENTORY'
      ],
      default: 'CUSTOMER'
    },
    superAdminType: {
      type: String,
      enum: ['FOUNDING', 'REGULAR', null],
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false
    },
    resetPasswordToken: {
      type: String,
      select: false,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
      default: null
    },
    resetPasswordRequestWindowStart: {
      type: Date,
      select: false,
      default: null
    },
    resetPasswordRequestCount: {
      type: Number,
      select: false,
      default: 0
    },
    cartItems: {
      type: [cartItemSchema],
      default: []
    },
    wishlistItems: {
      type: [wishlistItemSchema],
      default: []
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    lifetimeSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    memberTier: {
      type: String,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      default: 'BRONZE'
    }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ 'emails.value': 1 });
userSchema.index({ 'phones.value': 1 });

userSchema.pre('validate', function (next) {
  const contacts = normalizeUserContactProfile(this.toObject());

  this.email = contacts.email;
  this.phone = contacts.phone || undefined;
  this.address = contacts.address || undefined;
  this.emails = contacts.emails;
  this.phones = contacts.phones;
  this.addresses = contacts.addresses;

  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const raw = String(this.password || '');
  const strong =
    raw.length >= 8
    && /[A-Z]/.test(raw)
    && /[a-z]/.test(raw)
    && /\d/.test(raw)
    && /[^A-Za-z0-9]/.test(raw);
  if (!strong) {
    return next(new Error('Password does not meet complexity requirements'));
  }
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
