const express = require("express");
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middlewares/auth");
const router = express.Router();

// route
router.post("/create", authMiddleware.authenticate , taskController.createTask);
router.get("/mission/:missionId", authMiddleware.authenticate , taskController.getTasksByMissionId);
router.get("/hotspot/:hotspotId", authMiddleware.authenticate , taskController.getTaskByHotspotId);
router.get("/map/:mapId/grouped", authMiddleware.authenticate , taskController.getTaskByMapId);
router.put("/update/:id", authMiddleware.authenticate , taskController.updateTask);
router.put("/complete/:id", authMiddleware.authenticate , taskController.completeTask);
router.delete("/delete/:id", authMiddleware.authenticate , taskController.deleteTask);

module.exports = router;
