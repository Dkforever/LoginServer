import mongoose from "mongoose";
import  Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name: {
       type: String,
        required: true,
    },

    email: {
       type: String,
        required: true,
       unique: true,
    },
    password: {
       type: String,
        required: true,
        minlength: 8,
        select: false,
    },

    avatar: {
        public_id: String,
        required:false,
        url: String,

    },
    createdAt: {
        type: Date,
        default: Date.now,
    },

    tasks: [{
        title: "String",
        description: "String",
        completed: Boolean,
        createdAt: Date,
    },
    ],

    verified: {
        type: Boolean,
        default: false,
    },
    otp:Number,
    otp_expiry: Date,
    resetPasswordOtp: Number,
    resetPasswordExpiry: Date,

});

userSchema.pre("save", async function(next) {
    if(!this.isModified("password"))  return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();

})


userSchema.methods.getJWTToken = function() {
   return  Jwt.sign({_id: this._id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_COOKIE_EXPIRE * 60* 60 * 1000,
        
    });

};

userSchema.methods.comparePassword = async function(password) {
    console.log(password);
    console.log(this.password);
    return await bcrypt.compare(password, this.password);
}

// to delete user account if not verified in 5 minutes
userSchema.index({ otp_expiry: 1 }, { expireAfterSeconds: 0});


export const User = mongoose.model("User", userSchema);