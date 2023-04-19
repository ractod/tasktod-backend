import mongoose from "mongoose";

const TaskSchema = mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Object, required: true },
    startTime: {type: String, required: true},
    endTime: {type: String, required: true},
    tags: { type: Array, default: [] },
});

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
