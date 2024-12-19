import mongoose from "mongoose";
import {DB_NAME} from '../constants.js'; 

const connectDB = async () => {
    try {
        console.log('Mongo URI:', process.env.MONGO_URI);
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`Connected to MongoDB at host: ${connectionInstance.connection.host}, database: ${connectionInstance.connection.name}`);

    } catch (error) {
        console.log("Failed to connnect to Mongo DB ", error);
        process.exit(1);
    }
}

export default connectDB;