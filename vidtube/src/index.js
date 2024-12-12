import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({path: "./src/.env"});
const PORT = process.env.PORT || 3000;

//middlewares
app.use(cors({origin: process.env.CORS_ORIGIN}));
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true,limit: "16kb"}));
app.use(express.static("public"));

connectDB()
.then(()=>{
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => console.log(error));