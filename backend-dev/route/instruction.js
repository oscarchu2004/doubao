const express = require("express");
const instructionController = require("../controllers/instructionController");
const authMiddleware = require("../middlewares/auth");
const router = express.Router();

// route
router.post("/create", authMiddleware.authenticate , instructionController.createInstruction);
router.get("/:id", authMiddleware.authenticate , instructionController.getInstructionById);
router.put("/update/:id", authMiddleware.authenticate , instructionController.updateInstruction);

module.exports = router;
