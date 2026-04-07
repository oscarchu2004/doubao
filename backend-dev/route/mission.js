const express = require("express");
const missionController = require("../controllers/missionController");
const authMiddleware = require("../middlewares/auth");
const router = express.Router();

// route
router.post("/create", authMiddleware.authenticate , missionController.createMission);
router.get("/:mapId", authMiddleware.authenticate , missionController.getMissionsByMapId);
router.put("/update/:id", authMiddleware.authenticate , missionController.updateMission);
router.delete("/delete/:id", authMiddleware.authenticate , missionController.deleteMission);

module.exports = router;
