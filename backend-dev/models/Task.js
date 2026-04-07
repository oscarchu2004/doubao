const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    details: [{
        order: Number,
        text: String,
        imagePath: String, // local path to instructional image if any
        videoUrl: String,  // youTube embed URL if any
    }],
    missionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mission',
    },
    order: {
        type: Number,
        default: 0
    }, // for sequencing tasks within a mission
    isCompleted: {
        type: Boolean,
        default: false,
    },
    taskID: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
        },
        taskId: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
        },

});

module.exports = mongoose.model("Task", TaskSchema);
