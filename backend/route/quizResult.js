const express = require('express');
const router = express.Router();
const quizResultController = require('../controllers/quizResultController');
const authMiddleware = require("../middlewares/auth");

// save quiz result
router.post('/', authMiddleware.authenticate, quizResultController.saveQuizResult);

// get quiz results by user
router.get('/user/:userId', authMiddleware.authenticate, quizResultController.getQuizResultsByUser);

// check if user has passed a quiz
router.get('/check/:userId/:quizId', authMiddleware.authenticate, quizResultController.checkQuizPassed);

module.exports = router;