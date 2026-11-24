const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      default: "Main Dining",
      trim: true,
    },
    capacity: {
      type: Number,
      default: 4,
      min: 1,
      max: 30,
    },
    shape: {
      type: String,
      enum: ["square", "round", "rectangle"],
      default: "square",
    },
    status: {
      type: String,
      enum: ["available", "occupied", "billed", "reserved"],
      default: "available",
      index: true,
    },
    currentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    occupiedSince: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee table name uniqueness per branch
tableSchema.index({ branchId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Table", tableSchema);
