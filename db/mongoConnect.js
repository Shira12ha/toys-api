const mongoose = require("mongoose");

async function connectDB() {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is missing");
  }

  await mongoose.connect(process.env.MONGO_URL);

  console.log("MongoDB connected");
}

exports.connectDB = connectDB;