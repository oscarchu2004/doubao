const QuizResult = require("../models/QuizResult");
const { v4: uuidv4 } = require('uuid');

const quizResultController = {
    // save quiz result
    saveQuizResult: async (req, res) => {
        try {
            const { userId, quizId, mapId, score, passed, answers } = req.body;

            if (!userId || !quizId || !mapId || score === undefined || passed === undefined) {
                return res.status(400).json({ error: "All fields are required" });
            }

            const newQuizResult = await QuizResult.create({
                quizresultID: uuidv4(),
                quizresulId: uuidv4(),
                userId,
                quizId,
                mapId,
                score,
                passed,
                answers
            });
            res.status(201).json({
                message: "Quiz result saved successfully!",
                quizResult: newQuizResult
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get quiz results by user ID
    getQuizResultsByUser: async (req, res) => {
        try {
            const { userId } = req.params;
            const results = await QuizResult.find({ userId })
                .populate('quizId', 'title')
                .populate('mapId', 'title')
                .sort({ completedAt: -1 });
            res.status(200).json({ results });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // check if user has passed a specific quiz
    checkQuizPassed: async (req, res) => {
        try {
            const { userId, quizId } = req.params;

            const result = await QuizResult.findOne({
                userId,
                quizId,
                passed: true
            }).sort({ completedAt: -1 });

            res.status(200).json({
                passed: !!result,
                result: result
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

module.exports = quizResultController;
