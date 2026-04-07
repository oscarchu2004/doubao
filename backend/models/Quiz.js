const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
    mapId: {
        type: mongoose.Types.ObjectId,
        ref: "Map", required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    passingScore: {
        type: Number,
        default: 70,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Quiz", QuizSchema);