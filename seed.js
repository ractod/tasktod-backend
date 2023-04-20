import dotenv from "dotenv";
import mongoose from "mongoose";
import Users from "./models/user.js";
import Products from "./models/products.js";
import * as data from "./data.js";
dotenv.config();

async function seed() {
  mongoose
    .connect(
      "mongodb+srv://sahebm:WyUO43rfiAuzAgEu@cluster0.pzfki.mongodb.net/?retryWrites=true&w=majority",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    .then(() => {
      console.log("MongoDB connected!!");
    })
    .catch((err) => {
      console.log("Failed to connect to MongoDB", err);
    });

  await Users.deleteMany({});
  await Products.deleteMany({});
  await Products.insertMany(data.products);
  await Users.insertMany(data.users);
  mongoose.disconnect();

  console.info("Done!");
}

seed();

// MONGO_URI=mongodb+srv://rkplus:RKrezaplusRK15@cluster0.ol7lryr.mongodb.net/?retryWrites=true&w=majority
// PORT=5000
// NODE_ENV=development
// COOKIE_PARSER_SECRET=cookieSecret