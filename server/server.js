import express from "express";
import { readdirSync } from "fs";
import cors from "cors";
import mongoose from "mongoose";
import morgan from 'morgan'
import dotenv from 'dotenv'
import fs from 'fs'
dotenv.config();
const app = express();

// db connection
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB Connected"))
  .catch((err) => console.log("DB Connection Error: ", err));

// middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// route middleware
fs.readdirSync("./routes").forEach((file) => {
  import(`./routes/${file}`).then((route) => {
    app.use("/api", route.default);
  });
});
const port = process.env.PORT || 8000;

app.listen(port, () => console.log(`Server is running on port ${port}`));
