import mongoose from "mongoose";

const ScanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  engine: {
    type: String,
    enum: ["M1", "M2"],
    required: true,
  },
  isAI: {
    type: Boolean,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
  },
  certainty: {
    type: String,
  },
  imageUrl: {
    type: String,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Scan || mongoose.model("Scan", ScanSchema);
