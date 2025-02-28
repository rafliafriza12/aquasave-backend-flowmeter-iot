import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { configDotenv } from "dotenv";
import bodyParser from "body-parser";
import userRouter from "./routes/userRoutes.js";
import historyUsageRouter from "./routes/historyUsageRoutes.js";
import internetOfThingRouter from "./routes/internetOfThingRoutes.js";

const app = express();
const port = 8000;

configDotenv();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

async function connectDB() {
  try {
    await mongoose.connect(process.env.DB_URI, clientOptions);
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Koneksi ke MongoDB gagal:", error);
    process.exit(1); // Keluar dari proses jika koneksi gagal
  }
}
app.get("/", (req, res) => {
  res.status(200).json({
    status: 200,
    message: "API Aquasave",
  });
});

app.use("/auth", userRouter);
app.use("/history", historyUsageRouter);
app.use("/tool", internetOfThingRouter);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(console.dir);
