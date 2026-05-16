const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "assigned", "in-progress", "resolved", "rejected", "closed"],
  },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  comment: { type: String },
  changedAt: { type: Date, default: Date.now },
});

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        "roads",
        "water_supply",
        "electricity",
        "sanitation",
        "drainage",
        "street_lights",
        "parks",
        "noise_pollution",
        "encroachment",
        "other",
      ],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in-progress", "resolved", "rejected", "closed"],
      default: "pending",
    },
    location: {
      address: { type: String, required: true },
      ward: { type: String },
      pincode: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    images: [{ type: String }], // file paths
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    statusHistory: [statusHistorySchema],
    resolutionNote: { type: String },
    resolvedAt: { type: Date },
    dueDate: { type: Date },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      submittedAt: { type: Date },
    },
  },
  { timestamps: true }
);

// Auto-generate complaint ID before saving
complaintSchema.pre("save", async function () {
  if (!this.complaintId) {
    const count = await mongoose.model("Complaint").countDocuments();
    this.complaintId = `MCC-${String(count + 1).padStart(6, "0")}`;
  }
});
module.exports = mongoose.model("Complaint", complaintSchema);