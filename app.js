import express  from "express";
import User from "./routers/User.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import fileUpload from "express-fileupload";

export const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use (cookieParser());
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
})
);
app.use (cors());

app.get("/",(req,res)=>{
    res.send("Server is running");
});

app.use("/api/v1", User);