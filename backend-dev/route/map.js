const express = require("express");
const mapController = require("../controllers/mapController");
const authMiddleware = require("../middlewares/auth");
const router = express.Router();

// Routes
router.get("/", authMiddleware.authenticate, mapController.getAllMaps);
router.get("/:id", authMiddleware.authenticate, mapController.getMapById);
router.post("/create", authMiddleware.authenticate, mapController.createMap);
router.get("/creator/:creatorId", authMiddleware.authenticate, mapController.getMapCreator);
router.delete("/delete/:id", authMiddleware.authenticate, mapController.deleteMap);

module.exports = router;
