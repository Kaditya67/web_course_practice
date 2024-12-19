import express from "express";
import dotenv from "dotenv";
import cors from "cors"; 
import cookieParser from "cookie-parser";

const app = express();
dotenv.config({path: "./src/.env"});

//middlewares
app.use(cors({origin: process.env.CORS_ORIGIN}));
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true,limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser())

//routes
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js"
import { errorHandler } from "./middlewares/error.middlewares.js";

app.use("/api/healthcheck", healthcheckRouter);
app.use("/api/v1/users",userRouter)

app.use(errorHandler)
export {app};