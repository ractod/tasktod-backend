import mongoose from "mongoose";

const MeetingSchema = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Object, required: true },
    startTime: {type: String, required: true},
    endTime: {type: String, required: true},
    tags: { type: Array, default: [] },
});

export default mongoose.models.Meeting || mongoose.model("Meeting", MeetingSchema);
``