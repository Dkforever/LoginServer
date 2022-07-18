import { User } from "../models/users.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";
import cloudinary from "cloudinary";
import fs from "fs";

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // to Upload file 
        let  avatar = req.files.avatar.tempFilePath;
        



        // till here

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        //   this below line is to generate OTP
        const otp = Math.floor(Math.random() * 10000);

        const mycloud = await cloudinary.v2.uploader.upload(avatar, { folder: "avatar", }); // to upload file after otp

        fs.rmSync("./tmp", { recursive: true });  // this is to delete the file and TMP folder from server after uploading on Clodinary

        // Below code is for creating new user according to this field in database
        user = await User.create({
            name,
            email,
            password,
            avatar: {
                public_id: mycloud.public_id,
                url: mycloud.secure_url,
            },
            otp,
            otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000),
        });


        await sendMail(email, "OTP for verification", `Your OTP is ${otp}`);

        sendToken(res,
            user,
            201,
            "OTP sent to your email");


    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const verify = async (req, res) => {
    try {
        const otp = Number(req.body.otp);
        const user = await User.findById(req.user._id);

        if (user.otp !== otp || user.otp_expiry < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP is incorrect or expired" });
        }

        user.verified = true;
        user.otp = null;
        user.otp_expiry = null;
        await user.save();

        sendToken(res, user, 200, "User verified successfully");

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

};

// This is for login

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ success: false, message: "Please Enter all fields" });
        }

        const user = await User.findOne({ email }).select("+password");
        console.log(user);
        if (!user) {
            return res.status(400).json({ success: false, message: "Invild email or password" });
        }


        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invild  password" });
        }

        sendToken(res, user, 200, "Login Successfully");



    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const logout = async (req, res) => {
    try {
        res
            .status(200)
            .cookie("token", null, {
                expires: new Date(Date.now()),
            })
            .json({ success: true, message: "Logout Successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const addTask = async (req, res) => {
    try {
        const { title, description } = req.body;
        const user = await User.findById(req.user._id);

        user.tasks.push({
            title,
            description,
            completed: false,
            createdAt: new Date(Date.now())
        });
        await user.save();
        res.status(200).json({ success: true, message: "Task added successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const removeTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const user = await User.findById(req.user._id);

        user.tasks = user.tasks.filter((task) => task._id.toString() !== taskId.toString());

        await user.save();
        res.status(200).json({ success: true, message: "Task Removed successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const user = await User.findById(req.user._id);

        user.task = user.tasks.find(
            (task) => task._id.toString() === taskId.toString()
        );
        user.task.completed = !user.task.completed;

        await user.save();

        res.status(200).json({ success: true, message: "Task Updated successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        sendToken(res, user, 200, `Welcome Back Ram ${user.name}`);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { name } = req.body;
        const  avatar = req.files.avatar.tempFilePath;
    

        if (name) user.name = name;
        if (avatar) {
         await cloudinary.v2.uploader.destroy(user.avatar.public_id);

            const mycloud = await cloudinary.v2.uploader.upload(avatar, { folder: "avatar", }); // to upload file after otp
           fs.rmSync("./tmp",{recursive:true});

           user.avatar={
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
         }
        };

    

        await user.save();

        res.status(200).json({ success: true, message: "Profile Updated successfully" });

        //  sendToken(res, user, 200,`Welcome Back Ram ${user.name}`);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};




export const updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Please Enter all fields" });
        }


        const isMatch = await user.comparePassword(oldPassword);

        if (!isMatch) {
            return res
                .status(400)
                .json({ success: false, message: "Old password is incorrect" });
        }

        user.password = newPassword;
        await user.save();
        res.status(200).json({ success: true, message: "Password Updated successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Change or Forgot Password

export const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const otp = Math.floor(Math.random() * 10000);
        user.resetPasswordOtp = otp;
        user.resetPasswordExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes    
        await user.save();


        await sendMail(email, "OTP for Reset password", `Your OTP is ${otp}`);


        res.
            status(200)
            .json({ success: true, message: `OTP sent to your email ${email}` });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const resetPassword = async (req, res) => {
    try {
        const { otp, newPassword } = req.body;

        const user = await User.findOne({
            resetPasswordOtp: otp,
            resetPasswordExpiry: { $gt: Date.now() }
        }).select("+password");


        if (!user) {
            return res.status(400).json({ success: false, message: "invalid otp or Expired" });
        }

        if (!otp || !newPassword) {
            return res.status(400).json({ success: false, message: "Please Enter all fields" });
        }


        user.password = newPassword;

        user.resetPasswordOtp = null;
        user.resetPasswordExpiry = null;
        user.save();

        res.
            status(200)
            .json({ success: true, message: `password changed successfully` });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};




