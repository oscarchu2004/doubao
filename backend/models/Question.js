const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true
    },
    quizId: {
        type: mongoose.Types.ObjectId,
        ref: "Quiz",
    },
    options: [{
        text: {
            type: String,
            default: ""
        },
        imageUrl: {
            type: String,
            default: ""
        },
    }],// max 4 options
    correctAnswerIndex: {
        type: Number,
        required: true
    }, // index: 0,1,2,3
    createdAt: {
        type: Date,
        default: Date.now
    },
    answerExplanation: {
        type: String,
        default: ""
    },
});

module.exports = mongoose.model("Question", QuestionSchema);