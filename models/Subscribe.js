import mongoose from "mongoose";

const Subscribe = new mongoose.Schema(
  {
    totalUsedWater: {
      type: Number,
      required: true,
      default: 0,
    },
    subscribtionName: {
      type: String,
      required: true,
    },
  },
  { timestapms: true }
);

export default mongoose.model("Subscribe", Subscribe);
