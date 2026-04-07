const express = require("express");
const hotspotController = require("../controllers/hotspotController");
const authMiddleware = require("../middlewares/auth");
const router = express.Router();

// Routes
router.post("/create", authMiddleware.authenticate, hotspotController.createHotspot);
router.get("/:id", authMiddleware.authenticate, hotspotController.getHotspotById);
router.put("/update/:id", authMiddleware.authenticate, hotspotController.updateHotspot);
router.get("/panorama/:panoramaId", authMiddleware.authenticate, hotspotController.getHotspotsByPanoramaId);
router.delete("/delete/:id", authMiddleware.authenticate, hotspotController.deleteHotspot);

module.exports = router;
