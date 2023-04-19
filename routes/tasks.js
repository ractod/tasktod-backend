import cookie from "cookie";

// utils
import { findByDate, isAdmin, isAuthWithCookie, isOverlapping } from "../utils.js";

// express
import express from "express";
import asyncHandler from "express-async-handler";

// models
import UserModel from "../models/user.js";
import taskModel  from "../models/task.js";


function decideMiddleware(req, res, next) {
  const parsedCookie = cookie.parse(req.headers.cookie || "");
  if (parsedCookie.userToken) {
    return isAuthWithCookie(req, res, next);
  }
  // skip this middleware
  next();
}

const router = express.Router();

router.get("/seed",
  isAuthWithCookie,
  isAdmin,
  asyncHandler(async (req, res) => {
    const createdPosts = await Post.insertMany();
    return res.status(200).json({ createdPosts });
  })
);

// complete the task :
router.put("/:taskId", isAuthWithCookie, asyncHandler(async (req, res) => {
    try {
        const task = await taskModel.findById(req.params.taskId)
        let message = ""

        if (task.tags.includes("completed")) {
            task.tags.fill("uncompleted", 1, 2)
            message = "Task Uncompleted Successfully"
        } else {
            task.tags.fill("completed", 1, 2)
            message = "Task Completed Successfully"
        }

        await taskModel.findByIdAndUpdate(req.params.taskId, task)
        const user = await UserModel.findById(req.user._id)
        .populate({ path: "tasks", model: "Task" })

        return res.status(200).json({ tasks: user.tasks, message });

    } catch(err) {
        console.log(err)
        res.status(400).send({ message: "Failed to connect to the server" });
    }
}));


// create a Task
router.post("/",isAuthWithCookie, decideMiddleware, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id)
        .populate({ path: "tasks", model: "Task" })

        if(isOverlapping(user.tasks, req.body.date, req.body))  return res.status(400).json({ message: "Entered Time has Overlapping With Another Task" })
        
        const task = await taskModel.create({...req.body, tags: [req.body.tag, "uncompleted"]})
        user.tasks.push(task)
        await user.save()
        return res.status(201).json({ tasks: user.tasks, message: "Task Has Been Created Successfuly" })

    } catch(error) { 
        console.log(error)
        res.status(400).send({ message: "ailed to connect to the server" }); 
}
})

router.put("/update/:taskId",isAuthWithCookie, decideMiddleware, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id)
        .populate({ path: "tasks", model: "Task" })
        user.tasks.pull({ _id: req.params.taskId })
        
        
        if(isOverlapping(user.tasks, req.body.date, req.body))  return res.status(400).json({ message: "Entered Time has Overlapping With Another Task" })
        
        const task = await taskModel.findByIdAndUpdate(req.params.taskId, {...req.body, tags: [req.body.tag, "uncompleted"]}, { new: true })
        user.tasks.push(task)
        await user.save()
        return res.status(201).json({ tasks: user.tasks, message: "Task Has Been Updated Successfuly" })

    } catch(error) { 
        console.log(error)
        res.status(400).send({ message: "ailed to connect to the server" }); 
    }
})

// delete task
router.delete("/:taskId",isAuthWithCookie, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id)
        .populate({
            path: "tasks",
            model: "Task",
        })
        console.log(req.params)
        user.tasks.pull({ _id: req.params.taskId })
        await user.save()

        return res.status(201).json({ tasks: user.tasks , message: "Task Has Been Deleted Successfuly" })

    } catch { res.status(400).send({ message: "failed to connect to the server" }); }
})

// get user tasks
router.get("/", isAuthWithCookie, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id)
        .populate({ 
            path: "tasks", 
            model: "Task", 
        });

        res.status(200).send(user.tasks)

    } catch { res.status(400).send({ message: "failed to connect to the server" }); }
})


export default router;