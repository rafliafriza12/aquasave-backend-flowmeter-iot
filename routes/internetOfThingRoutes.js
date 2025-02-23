import express from "express";
import {
  toolRegister,
  getToolsByUserId,
} from "../controllers/internetOfThingController.js";

const internetOfThingRouter = express.Router();

internetOfThingRouter.post("/toolRegister", toolRegister);
internetOfThingRouter.get("/getToolsByUserId/:userId", getToolsByUserId);

export default internetOfThingRouter;
