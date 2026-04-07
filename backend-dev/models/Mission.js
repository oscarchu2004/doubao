const mongoose = require("mongoose");

const MissionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    mapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Map',
        required: true
    },
    isSequential: {
        type: Boolean,
        default: true // if true, tasks must be completed in order
    },
    order:{
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    missionID: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
        },
        missionId: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
        },
});

module.exports = mongoose.model("Mission", MissionSchema);
