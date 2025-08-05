import mongoose, {Schema} from "mongoose";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const userSchema= new Schema({
    name: {
        type: String,
        required: [true, "Please provide your name"]
    },
    username: {
        type: String,
        default: function () {
            let curr = this.name;
            let user = '';
            let i = 0;
            while (i < curr.length && curr[i] !== ' ') {
                user += curr[i];  
                i++;
            }
            return '@' + user + '123';
        }

        
    },

    email: {
        type: String,
        required:[true, "Please provide a email"],
        unique:true,
        lowercase:true,
        trim:true
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],

    },
    avatar:{
        type: String,
        
    },
    isVerified: {
        type: Boolean,
        default: false
    },

    highlights:{
        type: String,
        default: "anonymous"
    },
    designation:{
        type: String, 
        required: function () {
            
            return this.isComplete;
          },
    },
    institute:{
        type: String,
        required: function () {
            
            return this.isComplete;
          },
    },
    isComplete: { type: Boolean, default: false },
    Bio:String,

    // Presence: {
    //     type: Number,
    //     default : 0
    // },
    // Concepts: {
    //     type: Number,
    //     default: 0
    // },
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,
    verifyToken: String,
    verifyTokenExpiry: Date,
    AccessToken: String,
    lastSeen: { type: Date, default: () => new Date() }

})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next()
    
    this.password=await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.generateAccessToken= async function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.isPasswordCorrect= async function (password) {
    return bcrypt.compare(password, this.password)
}
const User=mongoose.model("User", userSchema);

export default User


