import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { configDotenv } from "dotenv";
import bodyParser from "body-parser";
import subscribeRouter from "./routes/subscribeRouter.js";

const app = express();
const port = 8000;

configDotenv();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(`${process.env.DB_URI}`);
const db = mongoose.connection;
db.on("error", (err) => console.log(err));
db.once("open", () => console.log("database connected..."));

app.get("/", (req, res) => {
  res.status(200).json({
    status: 200,
    message: "API Aquasave",
  });
});

app.use("/subscribe", subscribeRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
