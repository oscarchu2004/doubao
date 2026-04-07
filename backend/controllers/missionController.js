const Mission = require("../models/Mission");
const Task = require("../models/Task");
const Hotspot = require("../models/Hotspot");

const missionController = {
    //create a new mission linked to a map
    createMission: async (req, res) => {
        try {
            const { mapId, title, description, order, isSequential, isActive } = req.body;

            if (!mapId || !title || order === undefined) {
                return res.status(400).json({ error: "Map ID, title, and order are required" });
            }
            const mission = await Mission.create({
                mapId,
                title,
                description,
                order,
                isSequential: isSequential !== undefined ? isSequential : true,
                isActive: isActive !== undefined ? isActive : true
            });
            res.status(201).json({
                message: "Mission created successfully!",
                mission: mission
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get all missions of a map
    getMissionsByMapId: async (req, res) => {
        try {
            const { mapId } = req.params;

            const missions = await Mission.find({ mapId })
                .sort({ order: 1 }); // sort missions by order ascending
            res.status(200).json({ missions });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get mission by id with its tasks
    getMissionById: async (req, res) => {
        try {
            const { id } = req.params;

            const mission = await Mission.findById(id);

            if (!mission) {
                return res.status(404).json({ error: "Mission not found" });
            }

            // get all tasks associated with this mission
            const tasks = await Task.find({ missionId: id })
                .sort({ order: 1 }) // sort tasks by order
                .populate('targetHotspotId', 'title panoramaId position'); // include hotspot details

            res.status(200).json({
                mission,
                tasks
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // update mission
    updateMission: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, order, isSequential, isActive } = req.body;

            const mission = await Mission.findById(id);

            if (!mission) {
                return res.status(404).json({ error: "Mission not found" });
            }

            //update mission
            if (title !== undefined) mission.title = title;
            if (description !== undefined) mission.description = description;
            if (order !== undefined) mission.order = order;
            if (isSequential !== undefined) mission.isSequential = isSequential;
            if (isActive !== undefined) mission.isActive = isActive;

            await mission.save();
            res.status(200).json({
                message: "Mission updated successfully!",
                mission
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // delete mission
    deleteMission: async (req, res) => {
        try {
            const { id } = req.params;

            const mission = await Mission.findById(id);
            if (!mission) {
                return res.status(404).json({ error: "Mission not found" });
            }

            // get all tasks associated with this mission
            const associatedTasks = await Task.find({ missionId: id });

            // delete all hotspots associated with these tasks
            const taskIds = associatedTasks.map(task => task._id);
            if (taskIds.length > 0) {
                await Hotspot.deleteMany({ taskId: { $in: taskIds } });
            }

            // dlete all tasks associated with this mission
            await Task.deleteMany({ missionId: id });

            // delete the mission
            await Mission.findByIdAndDelete(id);

            res.status(200).json({
                message: "Mission and all associated tasks and hotspots deleted successfully",
                deletedItems: {
                    mission: 1,
                    tasks: associatedTasks.length,
                    hotspots: taskIds.length
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },
};

module.exports = missionController;