import mongoose from "mongoose";

export const dbConnection = (connectionString) => {
  mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => {
      console.log('Connected to database!');
    })
    .catch((err) => {
      console.log(`Some error occurred while connecting to database:${err}`);
    });
};