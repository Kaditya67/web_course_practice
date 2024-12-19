import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;
 
    if (!(error instanceof ApiError)) {
         
        const statusCode = error.statusCode || 
                           (error instanceof mongoose.Error ? 400 : 500); // Default to 500 for unknown errors

        const message = error.message || "Something went wrong";
         
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }
 
    const response = {
        statusCode: error.statusCode,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
        ...(error.errors && { errors: error.errors })  // Include validation errors if present
    };

    return res.status(error.statusCode).json(response);
};

export { errorHandler };
