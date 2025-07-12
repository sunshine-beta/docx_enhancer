import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import connectDB from "./config/mongoose.connection.js";
import { router as documentRoute } from "./routes/document.route.js";

// setup dotenv package to use environment variables
dotenv.config();

// Database connect
await connectDB();

// intailize app
const app = express();

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

// routes middlewares
app.use("/documents", documentRoute);

// Routes
app.get("/", (_, res) => res.send("API is running"));

// intialize port
const PORT = process.env.PORT || 3001;

// run the app
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
