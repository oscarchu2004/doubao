const express = require("express");
const panoramaController = require("../controllers/panoramaController");
const authMiddleware = require("../middlewares/auth");
const router = express.Router();

// route
router.post("/create", authMiddleware.authenticate , panoramaController.createPanorama);
router.get("/:id", authMiddleware.authenticate , panoramaController.getPanoramaById);
router.get('/map/:mapId', authMiddleware.authenticate, panoramaController.getPanoramasByMapId);
router.put("/update/:id", authMiddleware.authenticate , panoramaController.updatePanorama);
router.delete("/delete/:id", authMiddleware.authenticate , panoramaController.deletePanorama);

module.exports = router;
