const Hotspot = require("../models/Hotspot");
const Task = require("../models/Task"); // Add Task model import

const hotspotController = {
    // create a new hotspot linked to a panorama
    createHotspot: async (req, res) => {
        try {
            const { panoramaId, title, position, type, targetPanoramaId, targetInitialView, taskId, isVisible, requiresChallenge, challengeQuizId } = req.body;

            // basic validation
            if (!panoramaId) {
                return res.status(400).json({ error: "Panorama ID is required" });
            }

            // validate required fields based on type
            if (type === 'navigation' && !targetPanoramaId) {
                return res.status(400).json({ error: "Target panorama ID is required for navigation hotspots" });
            }

            if (type === 'task' && !taskId) {
                return res.status(400).json({ error: "Task ID is required for task hotspots" });
            }

            const newHotspot = new Hotspot({
                panoramaId,
                title,
                position,
                type,
                targetPanoramaId,
                targetInitialView: targetInitialView || (type === 'navigation' ? {
                    yaw: 0,
                    pitch: 0,
                    hfov: 100
                } : undefined),
                taskId,
                isVisible: isVisible !== undefined ? isVisible : true,
                requiresChallenge: requiresChallenge !== undefined ? requiresChallenge : true,
                challengeQuizId,
            });

            await newHotspot.save();
            res.status(201).json({
                message: "Hotspot created successfully!",
                hotspot: newHotspot
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get hotspot details
    getHotspotById: async (req, res) => {
        try {
            const { id } = req.params;

            const hotspot = await Hotspot.findById(id)
                .populate("panoramaId", "title imagePath")
                .populate("targetPanoramaId", "title imagePath")
                .populate("taskId", "title description type")
                .populate("challengeQuizId", "title description");

            if (!hotspot) {
                return res.status(404).json({ error: "Hotspot not found" });
            }
            res.status(200).json({ hotspot });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get all hotspots for a panorama
    getHotspotsByPanoramaId: async (req, res) => {
        try {
            const { panoramaId } = req.params;

            const hotspots = await Hotspot.find({ panoramaId })
                .populate("targetPanoramaId", "title imagePath")
                .populate("taskId", "title description type")
                .populate("challengeQuizId", "title description");

            res.status(200).json({ hotspots });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get all hotspots by type
    getHotspotsByType: async (req, res) => {
        try {
            const { type } = req.params;

            if (!['navigation', 'info', 'task'].includes(type)) {
                return res.status(400).json({ error: "Invalid hotspot type" });
            }

            const hotspots = await Hotspot.find({ type })
                .populate("panoramaId", "title imagePath")
                .populate("targetPanoramaId", "title imagePath")
                .populate("taskId", "title description type")
                .populate("challengeQuizId", "title description");

            res.status(200).json({ hotspots });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // update hotspot info
    updateHotspot: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, position, type, targetPanoramaId, targetInitialView, taskId, isVisible, requiresChallenge, challengeQuizId } = req.body;

            const hotspot = await Hotspot.findById(id);

            if (!hotspot) {
                return res.status(404).json({ error: "Hotspot not found" });
            }

            // validate required fields based on type if type is being updated
            if (type !== undefined) {
                if (type === 'navigation' && !targetPanoramaId && !hotspot.targetPanoramaId) {
                    return res.status(400).json({ error: "Target panorama ID is required for navigation hotspots" });
                }
                if (type === 'task' && !taskId && !hotspot.taskId) {
                    return res.status(400).json({ error: "Task ID is required for task hotspots" });
                }
            }

            if (title !== undefined) hotspot.title = title;
            if (position !== undefined) hotspot.position = position;
            if (type !== undefined) hotspot.type = type;
            if (targetPanoramaId !== undefined) hotspot.targetPanoramaId = targetPanoramaId;
            if (targetInitialView !== undefined) hotspot.targetInitialView = targetInitialView;
            if (taskId !== undefined) hotspot.taskId = taskId;
            if (isVisible !== undefined) hotspot.isVisible = isVisible;
            if (challengeQuizId !== undefined) hotspot.challengeQuizId = challengeQuizId;
            if (requiresChallenge !== undefined) hotspot.requiresChallenge = requiresChallenge;

            await hotspot.save();
            res.status(200).json({
                message: "Hotspot updated successfully!",
                hotspot
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // delete a hotspot
    deleteHotspot: async (req, res) => {
        try {
            const { id } = req.params;

            // find the hotspot first to check its type
            const hotspot = await Hotspot.findById(id);
            if (!hotspot) {
                return res.status(404).json({ error: "Hotspot not found" });
            }

            // handle deletion based on hotspot type
            if (hotspot.type === 'task') {
                // for task hotspots, delete BOTH the task AND the hotspot
                if (hotspot.taskId) {
                    try {
                        // delete the associated task completely
                        const deletedTask = await Task.findByIdAndDelete(hotspot.taskId);
                        console.log(`Deleted task ${hotspot.taskId} associated with hotspot ${id}`);
                    } catch (taskError) {
                        console.error('Error deleting task:', taskError);
                        // continue with hotspot deletion even if task deletion fails
                    }
                }
            } else if (hotspot.type === 'navigation') {
                // for navigation hotspots, just delete the hotspot
                // no additional cleanup needed
            }

            // delete the hotspot itself
            await Hotspot.findByIdAndDelete(id);

            res.status(200).json({
                message: "Hotspot deleted successfully",
                deletedHotspot: {
                    id: hotspot._id,
                    type: hotspot.type,
                    title: hotspot.title
                }
            });

        } catch (error) {
            console.error('Error deleting hotspot:', error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

module.exports = hotspotController;