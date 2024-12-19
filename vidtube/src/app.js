import express from "express";
import dotenv from "dotenv";
import cors from "cors"; 

const app = express();
dotenv.config({path: "./src/.env"});

//middlewares
app.use(cors({origin: process.env.CORS_ORIGIN}));
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true,limit: "16kb"}));
app.use(express.static("public"));

//routes
import healthcheckRouter from "./routes/healthcheck.routes.js";
app.use("/api/healthcheck", healthcheckRouter);

export {app};