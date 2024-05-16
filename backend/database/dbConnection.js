import mongoose from "mongoose";

export const dbConnection=()=>{
    mongoose.connect("mongodb+srv://japankaj282:pankaj7272@cluster0.ywkpfjr.mongodb.net/MERN_STACK_JOB_SEEKING?retryWrites=true&w=majority&appName=Cluster0",{
    }).then(()=>{
        console.log('Connected to database!');
    }).catch((err)=>{
        console.log(`some error occured while connecting to database:${err}`);
    })
}