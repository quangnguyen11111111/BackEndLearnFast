import express from "express";
import bodyParser from "body-parser";
import initWebRoutes from "./router/web";
import connectDB from "./config/connectDB";
import viewEngine from "./config/viewEngine";
import dotenv from "dotenv";
import cors from "cors"

dotenv.config();

const app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.URL_REACT);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
viewEngine(app);
initWebRoutes(app);
connectDB();
const port = process.env.PORT || 6969;
app.listen(port, () => {
  console.log("Backend Node.js is running on port: " + port); 
});
