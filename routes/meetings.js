import cookie from "cookie";

// utils
import { findByDate, isAuthWithCookie, isOverlapping } from "../utils.js";
import asyncHandler from "express-async-handler";

// express
import express from "express";

// models
import meetingModel from "../models/meeting.js";
import UserModel from "../models/user.js";

function decideMiddleware(req, res, next) {
    const parsedCookie = cookie.parse(req.headers.cookie || "");
    if (parsedCookie.userToken) {
        return isAuthWithCookie(req, res, next);
    }
    // skip this middleware
    next();
}

const router = express.Router();

// complete the meeting :
router.put("/:meetingId", isAuthWithCookie, asyncHandler(async (req, res) => {
    try {
        const meeting = await meetingModel.findOne({ _id: req.params.meetingId });
        let message = ""
        
        if(meeting.tags.includes("completed")) {
            meeting.tags.fill("uncompleted", 1, 2)
            message = "Meeting UnCompleted Successfuly"
        } else {
            meeting.tags.fill("completed", 1, 2)
            message = "Meeting Completed Successfuly"
        }
        
        await meetingModel.findByIdAndUpdate(req.params.meetingId, meeting)
        
        const user = await UserModel.findById(req.user._id)
        .populate({ path: "meetings", model: "Meeting" })

        return res.status(200).json({ meetings: user.meetings, message });

    } catch { res.status(400).send({ message: "failed to connect to the server" }); }
}));

// delete meeting
router.delete("/:meetingId", decideMiddleware, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id)
        .populate({
            path: "meetings",
            model: "Meeting",
        })

        user.meetings.pull(req.params.meetingId)
        await user.save()

        res.status(201).json({ meetings: user.meetings , message: "Meeting Has Been Deleted Successfuly" })

    } catch { res.status(400).send({ message: "failed to connect to the server" }); }
})

// create a meeting
router.post("/",isAuthWithCookie, decideMiddleware, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id)
        .populate({ path: "meetings", model: "Meeting" })

        if(isOverlapping(user.meetings, req.body.date, req.body))  return res.status(400).json({ message: "Entered Time has Overlapping With Another Meeting" })

        const meeting = await meetingModel.create({...req.body, tags: [ req.body.tag, "uncompleted"]})
        user.meetings.push(meeting)
        await user.save()
        res.status(201).json({ meetings: user.meetings, message: "Meeting Has Been Created Successfuly" })

    } catch(err) { 
        console.log(err)
        res.status(400).send({ message: "failed to connect to the server sds" });
     }
})

// get user meetings
router.get("/", isAuthWithCookie, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id)
        .populate({ 
            path: "meetings", 
            model: "Meeting", 
        });

        res.status(200).send(user.meetings)

    } catch { res.status(400).send({ message: "failed to connect to the server" }); }
})

router.put("/update",isAuthWithCookie, decideMiddleware, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id)
        .populate({ path: "meetings", model: "Meeting" })
        user.meetings.pull({ _id: req.body.meetingId })
        
        
        if(isOverlapping(user.meetings, req.body.newValues.date, req.body.newValues))  return res.status(400).json({ message: "Entered Time has Overlapping With Another Task" })
        
        const meeting = await meetingModel.findByIdAndUpdate(req.body.meetingId, {...req.body.newValues, tags: ["uncompleted", req.body.newValues.tag]}, { new: true })
        user.meetings.push(meeting)
        await user.save()
        return res.status(201).json({ meetings: user.meetings, message: "Meeting Has Been Updated Successfuly" })

    } catch(error) { 
        console.log(error)
        res.status(400).send({ message: "failed to connect to the server" }); 
    }
})

export default router