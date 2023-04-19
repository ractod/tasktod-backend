import express from "express";
import asyncHandler from "express-async-handler";
import UserModel from "../models/user.js";
import { isAuthWithCookie, setCookie } from "./../utils.js";
import cookie from "cookie";

function decideMiddleware(req, res, next) {
    const parsedCookie = cookie.parse(req.headers.cookie || "");
    if (parsedCookie.userToken) {
      return isAuthWithCookie(req, res, next);
    }
    // skip this middleware
    next();
}

const router = express.Router();

router.get(
  "/seed",
  asyncHandler(async (req, res) => {
    const createdUsers = await User.insertMany(data.users);
    res.send({ createdUsers });
  })
);

router.post("/register", asyncHandler(async (req, res) => {
    try {
        // checking if the user is already in the data base :
        const emailExist = await UserModel.findOne({ email: req.body.email });
        
        if (emailExist) return res.status(400).json({ message: "this email is already exist" });
        
        const user = await UserModel.create({
            name: req.body.name.trim(),
            lastName: req.body.lastName.trim(),
            email: req.body.email.trim(),
            password: req.body.password.trim(),
        })
        user.populate({ path: "tasks", model: "Task" })
        .populate({ path: "meetings", model: "Meeting" })
        
    
        // ? set the httpOnly cookie from back-end
        setCookie(user, res);
        
        res.status(200).json({ user,  message: "your account has been craeted successfuly" });

    } catch(error) { res.status(400).send({ message: error }); }
  })
);

router.post("/login", asyncHandler(async (req, res) => {
    try {
        // checking if the email exists :
        const user = await UserModel.findOne({ email: req.body.email.trim().toLowerCase() })
        .populate({
            path: "tasks",
            model: "Task"
        })
        .populate({
            path: "meetings",
            model: "Meeting"
        })

        if (!user) return res.status(401).json({ message: "this email doesn't exist" });

        // PASSWORD IS CORRECT :
        if (req.body.password != user.password) return res.status(401).json({ message: "password is wrong" });

        //? set the httpOnly cookie from back-end
        setCookie(user, res);

        res.status(200).json({ user, message: "you have logged in successfuly" });

    } catch { res.status(400).send({ message: "failed to connect to the server" }); }
}));

router.get("/logout", asyncHandler(async (req, res) => {
    try {
        const cookieOptions = {
            maxAge: 1,
            httpOnly: true,
            signed: true,
            sameSite: "Lax",
            secure: true,
            path: "/",
            domain: process.env.NODE_ENV === "development" ? "localhost" : ".fronthooks.ir",
        };
        // Set cookie
        res.cookie("userToken", null, cookieOptions); //
        return res.status(200).json({ message: "you have logged out successfuly" });

    } catch { res.status(400).send({ message: "failed to connect to the server" }); } 
}));

router.get("/load", decideMiddleware, asyncHandler(async (req, res) => {
    try {
        const user = await UserModel.findById(req?.user?._id)
        .populate({
            path: "tasks",
            model: "Task"
        })
        .populate({
            path: "meetings",
            model: "Meeting"
        })
    
        if (user) { return res.status(200).send({ user }); }
        return res.status(200).json({ user: null });

    } catch { res.status(400).send({ message: "failed to connect to the server" }); }
}));

export default router;