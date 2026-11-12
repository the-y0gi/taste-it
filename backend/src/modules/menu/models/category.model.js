const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    trim: true,
  },
  image: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    trim: true,
  },
  operatingHours: {
    isRestricted: {
      type: Boolean,
      default: false,
    },
    startTime: {
      type: String,
      default: '', // e.g. "09:00 AM"
    },
    endTime: {
      type: String,
      default: '', // e.g. "11:00 AM"
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  disabledBranches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }]
}, {
  timestamps: true
});

categorySchema.index({ branchId: 1, slug: 1 });
categorySchema.index({ branchId: 1, isActive: 1, displayOrder: 1 });
categorySchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);
