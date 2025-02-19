import express from "express";
import {
  increamentWaterUsage,
  createSubscribe,
} from "../controllers/subscribeController.js";

const subscribeRouter = express.Router();

subscribeRouter.post("/increamentUsedWater/:subscribeId", increamentWaterUsage);
subscribeRouter.post("/createSubscribtion", createSubscribe);

export default subscribeRouter;
