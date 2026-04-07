const Instruction = require("../models/Instruction");

const instructionController = {
    // create a new instruction
    createInstruction: async (req, res) => {
        try {
            const { title, description, steps } = req.body;

            if (!title || !steps || !Array.isArray(steps) || steps.length === 0) {
                return res.status(400).json({ error: "Title and at least one step are required" });
            }
            const Instruction = await Instruction.create({
                title,
                description,
                steps,
            });
            res.status(201).json({
                message: "Instruction created successfully!",
                instruction: Instruction
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // get instruction details
    getInstructionById: async (req, res) => {
        try {
            const { id } = req.params;

            const instruction = await Instruction.findById(id);

            if (!instruction) {
                return res.status(404).json({ error: "Instruction not found" });
            }
            res.status(200).json({ instruction });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    // update instruction
    updateInstruction: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, steps } = req.body;

            const instruction = await Instruction.findById(id);
            if (!instruction) {
                return res.status(404).json({ error: "Instruction not found" });
            }

            if (title !== undefined) instruction.title = title;
            if (description !== undefined) instruction.description = description;
            if (steps !== undefined && Array.isArray(steps)) instruction.steps = steps;
            await instruction.save();
            res.status(200).json({
                message: "Instruction updated successfully!",
                instruction
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

module.exports = instructionController;
