import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
//import isEmail from "validator/lib/isEmail";

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:[true,"please provide your name!"],
        minLength:[3,"Name must contains at least 3 characters"],
        maxLength:[30,"Name cannot Exceed 30 characters!"],
    },

    email:{
        type:String,
        required:[true,"please provide your email!"],
        validate:[validator.isEmail,"Please provide a valid email!"],   
    },

    phone:{
        type:Number,
        required:[true,"please provide your phone number!"],   
    },

    password:{
        type:String,
        required:[true,"please provide your password!"],
        minLength:[8,"Password must contains at least 8 characters"],
        maxLength:[30,"Password cannot Exceed 30 characters!"],
        select:false
    },

    role:{
        type:String,
        required:[true,"please provide your role"],
        enum:["Job Seeker","Employer"],
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },

})

//HASHING THE PASSWORD
userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        next()
    }
    this.password=await bcrypt.hash(this.password,10);

})

//COMPARING THE PASSWORD
userSchema.methods.comparedPassword=async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password);
}

//GENERATING A JWT TOKEN FOR AUTHORIZATION
userSchema.methods.getJWTToken=function(){
    return jwt.sign({id:this._id},process.env.JWT_SECRET_KEY,{
        expiresIn:process.env.JWT_EXPIRE,
    })
}

export const User=mongoose.model("User",userSchema);
