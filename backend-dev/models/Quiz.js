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
    },
        quizID: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
        },
        quizId: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
        },
});

module.exports = mongoose.model("Quiz", QuizSchema);