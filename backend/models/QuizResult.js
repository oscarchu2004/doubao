const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    mapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Map',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    passed: {
        type: Boolean,
        required: true
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        },
        userAnswerIndex: Number,
        isCorrect: Boolean
    }],
    completedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("QuizResult", quizResultSchema);