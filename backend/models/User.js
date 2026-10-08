const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  review: { type: String, maxlength: 500 },
  videoReview: { type: String, maxlength: 8000000 },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['student', 'teacher'],
      required: true
    },
    phone: {
      type: String,
      trim: true
    },
    // Teacher specific fields
    degree: {
      type: String,
      trim: true
    },
    subjects: {
      type: [String],
      default: []
    },
    experience: {
      type: Number,
      min: 0,
      default: 0
    },
    feePerHour: {
      type: Number,
      min: 0
    },
    availability: {
      type: String,
      trim: true
    },
    availabilitySlots: [{
      day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      start: { type: String, trim: true },
      end: { type: String, trim: true }
    }],
    bio: {
      type: String,
      maxlength: 1000
    },
    profileImage: {
      type: String,
      default: ''
    },
    demoVideo: {
      type: String,
      default: ''
    },
    identityDocument: {
      type: String,
      default: '',
      select: false
    },
    identityDocumentName: {
      type: String,
      default: ''
    },
    identityVerified: {
      type: Boolean,
      default: false
    },
    location: {
      state: { type: String, trim: true },
      district: { type: String, trim: true },
      city: { type: String, trim: true },
      coordinates: {
        lat: { type: Number, min: -90, max: 90 },
        lng: { type: Number, min: -180, max: 180 }
      }
    },
    isApproved: {
      type: Boolean,
      default: true
    },
    ratings: [ratingSchema],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate average rating
userSchema.methods.calculateAverageRating = function () {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
  } else {
    const sum = this.ratings.reduce((acc, r) => acc + r.rating, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10;
    this.totalReviews = this.ratings.length;
  }
};

module.exports = mongoose.model('User', userSchema);
