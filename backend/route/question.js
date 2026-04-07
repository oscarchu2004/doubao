const express = require("express");
const questionController = require("../controllers/questionController");
const authMiddleware = require("../middlewares/auth");
const router = express.Router();

// route
router.post("/create", authMiddleware.authenticate , questionController.createQuestion);
router.get("/quiz/:quizId", authMiddleware.authenticate , questionController.getQuestionsByQuizId);
// router.put("/update/:id", authMiddleware.authenticate , questionController.updateQuestion);
// router.delete("/delete/:id", authMiddleware.authenticate , questionController.deleteQuestion);

module.exports = router;
