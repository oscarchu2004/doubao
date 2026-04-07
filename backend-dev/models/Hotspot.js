const mongoose = require("mongoose");

const HotspotSchema = new mongoose.Schema({
    panoramaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Panorama',
        required: true,
    },
    title: {
        type: String,
    },
    position: {
        yaw: Number,   // horizontal angle in degrees
        pitch: Number, // vertical angle in degrees
    },
    type: {
        type: String,
        enum: ['navigation', 'info', 'task'],
        required: true
    },
    // navigation hotspot fields
    targetPanoramaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Panorama',
        required: function () {
            return this.type === 'navigation';
        }
    },
    // view angle when arriving at the target panorama
    targetInitialView: {
        yaw: Number,   // where to look when arriving 
        pitch: Number,
        hfov: Number   // field of view
    },
    // task hotspot field - stores reference to the associated task
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: function () {
            return this.type === 'task';
        }
    },
    isVisible: {
        type: Boolean,
        default: true,
    },
    requiresChallenge: {
        type: Boolean,
    },
    challengeQuizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
    },
    hotspotID: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
        },
        hotspotId: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
        },
});

module.exports = mongoose.model("Hotspot", HotspotSchema);