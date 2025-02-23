import express from "express";
import {
  getHistories,
  createHistory,
} from "../controllers/historyUsageController.js";
const historyUsageRouter = express.Router();

historyUsageRouter.post(
  "/createHistory/:userId/:internetOfThingId",
  createHistory
);
historyUsageRouter.get("/getHistory/:userId/:internetOfThingId", getHistories);

export default historyUsageRouter;
