const Map = require("../models/Map");
const Panorama = require("../models/Panorama");
const Mission = require("../models/Mission");
const Task = require("../models/Task");
const Hotspot = require("../models/Hotspot");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const { v4: uuidv4 } = require('uuid');

const mapController = {
    //create a new map
    createMap: async (req, res) => {
        try {
            const { title, description, minimapPath, thumbnailPath, isPublic, initialView } = req.body;

            let NewTitle = title;
            // validate
            if (!title) {
                // generate a template number based on existing template count
                const existingTemplatesCount = await Map.countDocuments({
                    title: /^Template\d+$/,
                    creator: req.user.id
                });

                // create a new template title with the next number in sequence
                const templateNumber = existingTemplatesCount;
                NewTitle = `Template${templateNumber}`;
            }

            // create new map
            const newMap = new Map({
		mapID: uuidv4(),
		title: NewTitle,
                description,
                minimapPath,
                thumbnailPath,
                isPublic: isPublic || false,
                creator: req.user.id,               // dttach the user who created
                startingPanoramaId: null,
                updatedAt: new Date(),
                initialView: initialView || {
                    yaw: 0,
                    pitch: 0,
                    hfov: 125
                }
            });

            await newMap.save();
            res.status(201).json({ message: "Map created successfully!", map: newMap });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // list all maps
    getAllMaps: async (req, res) => {
        try {
            const maps = await Map.find()
                .populate("startingPanoramaId", "title imagePath"); // show starting panorama title + image only
            res.status(200).json({ maps });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    //get map detail
    getMapById: async (req, res) => {
        try {
            const { id } = req.params;

            const map = await Map.findById(id)
                .populate("startingPanoramaId", "title imagePath")
            // .populate("completionQuizId", "title description");

            if (!map) {
                return res.status(404).json({ error: "Map not found" });
            }
            res.status(200).json({ map });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    getMapCreator: async (req, res) => {
        try {
            const { creatorId } = req.params;

            const maps = await Map.find({ creator: creatorId })
                .populate("startingPanoramaId", "title imagePath")
                .sort({ updatedAt: -1 });

            res.status(200).json({ maps });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // delete map
    deleteMap: async (req, res) => {
        try {
            const { id } = req.params;

            // find the map first
            const map = await Map.findById(id);
            if (!map) {
                return res.status(404).json({ error: "Map not found" });
            }

            // keep track of deletion counts
            let deletedCounts = {
                missions: 0,
                tasks: 0,
                hotspots: 0,
                quizzes: 0,
                panoramas: 0
            };

            // delete all missions (this will cascade to tasks and task hotspots)
            const missions = await Mission.find({ mapId: id });
            for (const mission of missions) {
                const associatedTasks = await Task.find({ missionId: mission._id });
                const taskIds = associatedTasks.map(task => task._id);

                // delete hotspots associated with these tasks
                if (taskIds.length > 0) {
                    const deletedTaskHotspots = await Hotspot.deleteMany({ taskId: { $in: taskIds } });
                    deletedCounts.hotspots += deletedTaskHotspots.deletedCount;
                }

                // delete all tasks associated with this mission
                const deletedTasks = await Task.deleteMany({ missionId: mission._id });
                deletedCounts.tasks += deletedTasks.deletedCount;
            }

            // delete all missions
            const deletedMissions = await Mission.deleteMany({ mapId: id });
            deletedCounts.missions = deletedMissions.deletedCount;

            // find all panoramas in this map
            const panoramas = await Panorama.find({ mapId: id });
            const panoramaIds = panoramas.map(p => p._id);

            // delete remaining hotspots (navigation and info hotspots)
            const remainingHotspots = await Hotspot.deleteMany({
                panoramaId: { $in: panoramaIds }
            });
            deletedCounts.hotspots += remainingHotspots.deletedCount;

            // also delete navigation hotspots that target panoramas in this map
            // const targetingHotspots = await Hotspot.deleteMany({
            //     type: 'navigation',
            //     targetPanoramaId: { $in: panoramaIds }
            // });
            // deletedCounts.hotspots += targetingHotspots.deletedCount;

            // delete all panoramas in this map
            const deletedPanoramas = await Panorama.deleteMany({ mapId: id });
            deletedCounts.panoramas = deletedPanoramas.deletedCount;

            // delete all quizzes associated with this map
            const deletedQuizzes = await Quiz.deleteMany({ mapId: id });
            deletedCounts.quizzes = deletedQuizzes.deletedCount;

            // also delete questions associated with these quizzes
            const quizzes = await Quiz.find({ mapId: id });
            const quizIds = quizzes.map(q => q._id);
            if (quizIds.length > 0) {
                await Question.deleteMany({ quizId: { $in: quizIds } });
            }

            // delete the map itself
            await Map.findByIdAndDelete(id);

            res.status(200).json({
                message: "Map and all associated data deleted successfully",
                deletedMap: {
                    id: map._id,
                    title: map.title
                },
                deletedItems: deletedCounts
            });

        } catch (error) {
            console.error('Error deleting map:', error);
            if (error.name === 'CastError' && error.kind === 'ObjectId') {
                return res.status(400).json({ error: "Invalid map ID format" });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    }

};

module.exports = mapController;
