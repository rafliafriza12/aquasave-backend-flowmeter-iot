import mongoose from "mongoose";

const HistoryUsages = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    internetOfThingId: {
      type: String,
      required: true,
    },
    usedWater: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("HistoryUsage", HistoryUsages);
