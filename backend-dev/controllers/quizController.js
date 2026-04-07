const Quiz = require("../models/Quiz");
const Hotspot = require("../models/Hotspot");
const Question = require('../models/Question');
const { v4: uuidv4 } = require('uuid');

const quizController = {
    // create quiz linked to map
    createQuiz: async (req, res) => {
        try {
            const { mapId, title, description, passingScore } = req.body;

            if (!mapId || !title) {
                return res.status(400).json({ error: "mapId and title are required" });
            }
            const newQuiz = await Quiz.create({
                quizID: uuidv4(),
                quizId: uuidv4(),
                mapId,
                title,
                description,
                passingScore: passingScore || 70,
            });
            res.status(201).json({
                message: "Quiz created successfully!",
                quiz: newQuiz
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get quiz details
    getQuizById: async (req, res) => {
        try {
            const { id } = req.params;
            const quiz = await Quiz.findById(id).populate("mapId", "title");

            if (!quiz) {
                return res.status(404).json({ error: "Quiz not found" });
            }
            res.status(200).json({ quiz });
        } catch (error) {
            console.error(error);
            // handle invalid ObjectId format
            if (error.name === 'CastError' && error.kind === 'ObjectId') {
                return res.status(400).json({ error: "Invalid quiz ID format" });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get quizzes by map ID
    getQuizzesByMapId: async (req, res) => {
        try {
            const { mapId } = req.params;
            const quizzes = await Quiz.find({ mapId });
            res.status(200).json({
                quizzes,
                count: quizzes.length
            });
        } catch (error) {
            console.error(error);
            // handle invalid ObjectId format
            if (error.name === 'CastError' && error.kind === 'ObjectId') {
                return res.status(400).json({ error: "Invalid map ID format" });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get quizzes by panorama ID
    getQuizzesByPanoramaId: async (req, res) => {
        try {
            const {hotspotId} = req.params;
            const hotspot = await Hotspot.findById({hotspotId});

            if (!hotspot || !hotspot.requiresChallenge || !hotspot.challengeQuizId) {
                return res.status(404).json({ message: 'No challenge found for this hotspot' });
            }
            return res.json({ questions });
        } catch (error) {
            console.error('Error fetching challenge:', error);
            return res.status(500).json({ message: 'Server error' });
        }

    },

    // update quiz
    updateQuiz: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, passingScore } = req.body;

            const quiz = await Quiz.findById(id);
            if (!quiz) {
                return res.status(404).json({ error: "Quiz not found" });
            }
            if (title !== undefined) quiz.title = title;
            if (description !== undefined) quiz.description = description;
            if (passingScore !== undefined) quiz.passingScore = passingScore;
            await quiz.save();
            res.status(200).json({
                message: "Quiz updated successfully!",
                quiz
            });
        } catch (error) {
            console.error(error);
            // handle invalid ObjectId format
            if (error.name === 'CastError' && error.kind === 'ObjectId') {
                return res.status(400).json({ error: "Invalid quiz ID format" });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // delete quiz
    deleteQuiz: async (req, res) => {
        try {
            const { id } = req.params;
            await Question.deleteMany({ quizId: id });
            const deleted = await Quiz.findByIdAndDelete(id);
            if (!deleted) {
                return res.status(404).json({ error: "Quiz not found" });
            }
            res.status(200).json({ message: "Quiz deleted successfully." });
        } catch (error) {
            console.error(error);
            // handle invalid ObjectId format
            if (error.name === 'CastError' && error.kind === 'ObjectId') {
                return res.status(400).json({ error: "Invalid quiz ID format" });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

module.exports = quizController;