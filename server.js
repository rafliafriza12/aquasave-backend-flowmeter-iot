import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { configDotenv } from "dotenv";
import bodyParser from "body-parser";
import userRouter from "./routes/userRoutes.js";
import historyUsageRouter from "./routes/historyUsageRoutes.js";
import internetOfThingRouter from "./routes/internetOfThingRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
const app = express();
const port = 8000;

configDotenv();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(`mongodb://localhost:27017/aquasave`);
const db = mongoose.connection;
db.on("error", (err) => console.log(err));
db.once("open", () => console.log("database connected..."));

app.get("/", (req, res) => {
  res.status(200).json({
    status: 200,
    message: "API Aquasave",
  });
});

app.use("/auth", userRouter);
app.use("/history", historyUsageRouter);
app.use("/tool", internetOfThingRouter);
app.use("/notification", notificationRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
