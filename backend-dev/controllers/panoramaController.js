const Panorama = require("../models/Panorama")
const Map = require("../models/Map")
const Hotspot = require("../models/Hotspot")
const Task = require("../models/Task");
const { v4: uuidv4 } = require('uuid');

const panoramaController = {
    createPanorama: async (req, res) => {
        try {
            const { mapId, title, description, imagePath, positionOnMinimap } = req.body;

            // validate required fields
            if (!mapId || !imagePath) {
                return res.status(400).json({ error: "Map ID and Image Path are required" });
            }

            // // validation for navigation type
            // if (type === 'navigation' && !targetPanoramaId) {
            //     return res.status(400).json({ error: "Target Panorama ID is required for navigation type hotspots" });
            // }

            // check if map exists
            const map = await Map.findById(mapId);
            if (!map) {
                return res.status(404).json({ error: "Map not found" });
            }

            // create new panorama
            const newPanorama = new Panorama({
                panoramaID: uuidv4(),
                panoramaId: uuidv4(),
                mapId,
                title,
                description,
                imagePath,
                positionOnMinimap,
            });
            await newPanorama.save();

            // update startingPanoramaId in MAP if this is the first panorama
            if (!map.startingPanoramaId) {
                map.startingPanoramaId = newPanorama._id;
                await map.save();
            }
	    // ✅ Automatically link the new panorama to the map
	    await Map.findByIdAndUpdate(
  		mapId,
 	        { $push: { panoramas: newPanorama._id } },
                { new: true }
	    );
	


            res.status(201).json({
                message: "Panorama created successfully!",
                panorama: newPanorama,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },


    // get panorama detail
    getPanoramaById: async (req, res) => {
        try {
            const { id } = req.params;

            const panorama = await Panorama.findById(id).populate("mapId", "title description");

            if (!panorama) {
                return res.status(404).json({ error: "Panorama not found" });
            }
            res.status(200).json({ panorama });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get all panoramas by map ID
    getPanoramasByMapId: async (req, res) => {
        try {
            const { mapId } = req.params;

            // check if map exists
            const map = await Map.findById(mapId);
            if (!map) {
                return res.status(404).json({ error: "Map not found" });
            }

            const panoramas = await Panorama.find({ mapId: mapId })
                .select('_id title description imagePath positionOnMinimap createdAt')
                .sort({ createdAt: -1 });

            res.status(200).json({
                panoramas,
                count: panoramas.length
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // update panorama info
    updatePanorama: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, positionOnMinimap } = req.body;

            const panorama = await Panorama.findById(id);
            if (!panorama) {
                return res.status(404).json({ error: "Panorama not found" });
            }
            if (title !== undefined) panorama.title = title;
            if (description !== undefined) panorama.description = description;
            if (positionOnMinimap !== undefined) panorama.positionOnMinimap = positionOnMinimap;

            await panorama.save();
            res.status(200).json({
                message: "Panorama updated",
                panorama,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // delete a panorama
    deletePanorama: async (req, res) => {
        try {
            const { id } = req.params;

            // find panorama
            const panorama = await Panorama.findById(id);
            if (!panorama) {
                return res.status(404).json({ error: "Panorama not found" });
            }

            // check if this is the starting panorama for a map
            const map = await Map.findOne({ startingPanoramaId: id });
            if (map) {
                return res.status(400).json({
                    error: "Cannot delete starting panorama. Please create a new map if you want to delete this panorama.",
                    isStartingPanorama: true,
                    mapId: map._id,
                    mapTitle: map.title
                });
            }

            // Find all hotspots associated with this panorama
            const hotspots = await Hotspot.find({ panoramaId: id });

            // Delete associated tasks for task hotspots
            for (const hotspot of hotspots) {
                if (hotspot.type === 'task' && hotspot.taskId) {
                    try {
                        await Task.findByIdAndDelete(hotspot.taskId);
                        console.log(`Deleted task ${hotspot.taskId} associated with hotspot ${hotspot._id}`);
                    } catch (taskError) {
                        console.error('Error deleting task:', taskError);
                    }
                }
            }

            // Delete all hotspots associated with this panorama
            await Hotspot.deleteMany({ panoramaId: id });

            // Find and delete navigation hotspots that target this panorama
            const targetingHotspots = await Hotspot.find({
                type: 'navigation',
                targetPanoramaId: id
            });
            await Hotspot.deleteMany({
                type: 'navigation',
                targetPanoramaId: id
            });

            // delete the panorama
            await Panorama.findByIdAndDelete(id);

            res.status(200).json({
                message: "Panorama deleted successfully",
                details: {
                    hotspotsDeleted: hotspots.length,
                    tasksDeleted: hotspots.filter(h => h.type === 'task' && h.taskId).length,
                    targetingHotspotsDeleted: targetingHotspots.length
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

module.exports = panoramaController;
