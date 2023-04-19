import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    meetings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Meeting" }],
});

export default mongoose.model("User", userSchema);
