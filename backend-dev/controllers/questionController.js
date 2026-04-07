const Question = require("../models/Question");
const { v4: uuidv4 } = require('uuid');

const questionController = {
    // create question linked to quiz
    createQuestion: async (req, res) => {
        try {
            const { quizId, questionText, options, correctAnswerIndex, answerExplanation } = req.body;

            // validate required fields
            if (!quizId || !questionText || !options || correctAnswerIndex === undefined) {
                return res.status(400).json({
                    error: "quizId, questionText, options, and correctAnswerIndex are required"
                });
            }

            // validate correctAnswerIndex is within options range
            if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
                return res.status(400).json({
                    error: `correctAnswerIndex must be between 0 and ${options.length - 1}`
                });
            }

            // Handle options - convert strings to proper format if needed
            const formattedOptions = options.map((option, index) => {
                // If option is a string (old format), convert to object format
                if (typeof option === 'string') {
                    return {
                        text: option,
                        imageUrl: ""
                    };
                }
                
                // If option is already an object, validate it
                const hasText = option.text && option.text.trim() !== "";
                const hasImage = option.imageUrl && option.imageUrl.trim() !== "";

                // Must have exactly one: either text or image, not both, not neither
                if (hasText && hasImage) {
                    throw new Error(`Option ${index + 1} cannot have both text and image`);
                }
                if (!hasText && !hasImage) {
                    throw new Error(`Option ${index + 1} must have either text or image`);
                }

                return {
                    text: hasText ? option.text : "",
                    imageUrl: hasImage ? option.imageUrl : ""
                };
            });

            const newQuestion = await Question.create({
                questionID: uuidv4(),
                questionId: uuidv4(),
                quizId,
                questionText,
                options: formattedOptions,
                correctAnswerIndex,
                answerExplanation: answerExplanation || ""
            });

            res.status(201).json({
                message: "Question created successfully!",
                question: newQuestion
            });
        } catch (error) {
            console.error(error);
            // handle MongoDB validation errors
            if (error.name === 'ValidationError') {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get question details
    getQuestionById: async (req, res) => {
        try {
            const { id } = req.params;
            const question = await Question.findById(id).populate("quizId", "title");

            if (!question) {
                return res.status(404).json({ error: "Question not found" });
            }
            res.status(200).json({ question });
        } catch (error) {
            console.error(error);
            // handle invalid ObjectId format
            if (error.name === 'CastError' && error.kind === 'ObjectId') {
                return res.status(400).json({ error: "Invalid question ID format" });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get questions by quiz ID
    getQuestionsByQuizId: async (req, res) => {
        try {
            const { quizId } = req.params;
            const questions = await Question.find({ quizId });
            res.status(200).json({
                questions,
                count: questions.length
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

    // update Question
    updateQuestion: async (req, res) => {
        try {
            const { id } = req.params;
            const { questionText, options, correctAnswerIndex, answerExplanation } = req.body;

            const question = await Question.findById(id);
            if (!question) {
                return res.status(404).json({ error: "Question not found" });
            }

            // update fields if provided
            if (questionText !== undefined) question.questionText = questionText;
            if (answerExplanation !== undefined) question.answerExplanation = answerExplanation;

            if (options !== undefined) {
                // Handle options - convert strings to proper format if needed
                const formattedOptions = options.map((option, index) => {
                    // If option is a string (old format), convert to object format
                    if (typeof option === 'string') {
                        return {
                            text: option,
                            imageUrl: ""
                        };
                    }
                    
                    // If option is already an object, validate it
                    const hasText = option.text && option.text.trim() !== "";
                    const hasImage = option.imageUrl && option.imageUrl.trim() !== "";

                    // Must have exactly one: either text or image, not both, not neither
                    if (hasText && hasImage) {
                        throw new Error(`Option ${index + 1} cannot have both text and image`);
                    }
                    if (!hasText && !hasImage) {
                        throw new Error(`Option ${index + 1} must have either text or image`);
                    }

                    return {
                        text: hasText ? option.text : "",
                        imageUrl: hasImage ? option.imageUrl : ""
                    };
                });

                question.options = formattedOptions;

                // If correctAnswerIndex is also being updated, validate it
                if (correctAnswerIndex !== undefined) {
                    if (correctAnswerIndex < 0 || correctAnswerIndex >= formattedOptions.length) {
                        return res.status(400).json({
                            error: `correctAnswerIndex must be between 0 and ${formattedOptions.length - 1}`
                        });
                    }
                    question.correctAnswerIndex = correctAnswerIndex;
                }
            } else if (correctAnswerIndex !== undefined) {
                // if only correctAnswerIndex changes, validate it's still within options range
                if (correctAnswerIndex < 0 || correctAnswerIndex >= question.options.length) {
                    return res.status(400).json({
                        error: `correctAnswerIndex must be between 0 and ${question.options.length - 1}`
                    });
                }
                question.correctAnswerIndex = correctAnswerIndex;
            }

            await question.save();

            res.status(200).json({
                message: "Question updated successfully!",
                question
            });
        } catch (error) {
            console.error(error);
            // handle invalid ObjectId format
            if (error.name === 'CastError' && error.kind === 'ObjectId') {
                return res.status(400).json({ error: "Invalid question ID format" });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // delete question
    deleteQuestion: async (req, res) => {
        try {
            const { id } = req.params;

            const deleted = await Question.findByIdAndDelete(id);
            if (!deleted) {
                return res.status(404).json({ error: "Question not found" });
            }
            res.status(200).json({ message: "Question deleted successfully." });
        } catch (error) {
            console.error(error);
            // handle invalid ObjectId format
            if (error.name === 'CastError' && error.kind === 'ObjectId') {
                return res.status(400).json({ error: "Invalid question ID format" });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

module.exports = questionController;