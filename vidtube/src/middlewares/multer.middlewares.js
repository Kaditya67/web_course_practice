import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("Storing file in: ./public/temp"); // Debugging storage
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        console.log("File received:", file); // Debugging file details
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extname = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extname);
    }
});


export const upload = multer({ storage });
