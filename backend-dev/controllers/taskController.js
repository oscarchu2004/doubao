const Task = require("../models/Task");
const Mission = require("../models/Mission");
const Hotspot = require("../models/Hotspot");
const { v4: uuidv4 } = require('uuid');

const taskController = {
    // create a new task for a mission
    createTask: async (req, res) => {
        try {
            const { missionId, title, details, description, order } = req.body;

            // validate required fields
            if (!title) {
                return res.status(400).json({ error: "Title is required" });
            }

            // create new task
            const newTask = new Task({
                taskID: uuidv4(),
                taskId: uuidv4(),
                missionId,
                title,
                description,
                details,
                order: order !== undefined ? order : 0,
                isCompleted: false
            });

            await newTask.save();
            res.status(201).json({
                message: "Task created successfully!",
                task: newTask
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get tasks for a mission
    getTasksByMissionId: async (req, res) => {
        try {
            const { missionId } = req.params;

            // check if mission exists
            const mission = await Mission.findById(missionId);
            if (!mission) {
                return res.status(404).json({ error: "Mission not found" });
            }

            // get tasks and sort by order
            const tasks = await Task.find({ missionId })
                .sort({ order: 1 })
            res.status(200).json({ tasks });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // mark task as completed
    completeTask: async (req, res) => {
        try {
            const { id } = req.params;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({ error: "Task not found" });
            }

            task.isCompleted = true;
            await task.save();

            res.status(200).json({
                message: "Task marked as completed",
                task
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    getTaskByHotspotId: async (req, res) => {
        try {
            const { hotspotId } = req.params;

            // find the hotspot first to get the taskId
            const hotspot = await Hotspot.findById(hotspotId);
            if (!hotspot || !hotspot.taskId) {
                return res.status(404).json({
                    message: "No task found for this hotspot",
                    task: null
                });
            }

            // find the task using the taskId from hotspot
            const task = await Task.findById(hotspot.taskId);
            if (!task) {
                return res.status(404).json({
                    message: "Task not found",
                    task: null
                });
            }

            // if task has no mission, it's a standalone task
            if (!task.missionId) {
                return res.status(200).json({
                    task,
                    mission: null,
                    isAvailable: true
                });
            }

            // find the mission this task belongs to
            const mission = await Mission.findById(task.missionId);
            if (!mission) {
                return res.status(404).json({
                    message: "Mission not found for this task",
                    task: null
                });
            }

            // check if the mission is sequential
            if (mission.isSequential) {
                // get all tasks for this mission sorted by order field
                const missionTasks = await Task.find({ missionId: mission._id })
                    .sort({ order: 1 });

                // get current task order
                const currentTaskOrder = task.order;

                // check if all previous tasks (with lower order values) are completed
                const incompletePreviousTasks = missionTasks.filter(t =>
                    t.order < currentTaskOrder && !t.isCompleted
                );

                if (incompletePreviousTasks.length > 0) {
                    return res.status(200).json({
                        task,
                        mission: {
                            id: mission._id,
                            title: mission.title,
                            isSequential: true
                        },
                        isAvailable: false,
                        message: "Previous tasks must be completed first"
                    });
                }
            }

            // if mission is not sequential or all previous tasks are completed
            return res.status(200).json({
                task,
                mission: {
                    id: mission._id,
                    title: mission.title,
                    isSequential: mission.isSequential || false
                },
                isAvailable: true
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error" });
        }
    },

    getTaskByMapId: async (req, res) => {
        try {
            const { mapId } = req.params;

            // First get all missions for this map
            const missions = await Mission.find({ mapId, isActive: true })
                .sort({ order: 1 })
                .lean();

            // Get all tasks for these missions
            const missionIds = missions.map(m => m._id);
            const tasksWithMission = await Task.find({ missionId: { $in: missionIds } })
                .sort({ missionId: 1, order: 1 })
                .lean();

            // Get all tasks with no mission
            const tasksWithoutMission = await Task.find({
                $or: [
                    { missionId: null },
                    { missionId: { $exists: false } }
                ]
            })
                .sort({ order: 1 })
                .lean();

            // Group tasks by mission
            const missionsWithTasks = missions.map(mission => ({
                ...mission,
                tasks: tasksWithMission.filter(task => task.missionId.toString() === mission._id.toString())
            }));

            res.json({
                success: true,
                missions: missionsWithTasks,
                tasksWithoutMission: tasksWithoutMission
            });
        } catch (error) {
            console.error('Error fetching grouped tasks:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch missions and tasks'
            });
        }
    },

    // update a task
    updateTask: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, details, order, isCompleted, missionId } = req.body;

            const task = await Task.findById(id);

            if (!task) {
                return res.status(404).json({ error: "Task not found" });
            }

            if (title !== undefined) task.title = title;
            if (description !== undefined) task.description = description;
            if (order !== undefined) task.order = order;
            if (details !== undefined) task.details = details;
            if (isCompleted !== undefined) task.isCompleted = isCompleted;
            if (missionId !== undefined) task.missionId = missionId;

            await task.save();
            res.status(200).json({
                message: "Task updated successfully!",
                task
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // delete task
    deleteTask: async (req, res) => {
        try {
            const { id } = req.params;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({ error: "Task not found" });
            }

            // also remove the associated hotspot
            await Hotspot.findOneAndDelete({ taskId: id });

            await Task.findByIdAndDelete(id);

            res.status(200).json({ message: "Task and associated hotspot deleted successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },
};

module.exports = taskController;