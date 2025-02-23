import mongoose from "mongoose";

const InternetOfThingTools = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    toolName: {
      type: String,
      required: true,
    },
    totalUsedWater: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("InternetOfThingTool", InternetOfThingTools);
