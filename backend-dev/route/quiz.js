const express = require("express");
const quizController = require("../controllers/quizController");
const authMiddleware = require("../middlewares/auth");
const router = express.Router();

// route
router.post("/create", authMiddleware.authenticate , quizController.createQuiz);
router.get("/map/:mapId", authMiddleware.authenticate , quizController.getQuizzesByMapId);
// router.get("/hotspot/:hotspotId", authMiddleware.authenticate , quizController.getQuizzesByPanoramaId);
router.get("/:id", authMiddleware.authenticate , quizController.getQuizById);
// router.put("/update/:id", authMiddleware.authenticate , quizController.updateQuiz);
router.delete("/delete/:id", authMiddleware.authenticate , quizController.deleteQuiz);

module.exports = router;
