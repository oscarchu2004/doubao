const mongoose = require("mongoose");

const MapSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        required: true,
    },
    thumbnailPath: {
        type: String, // path to thumbnail
    },
    isPublic: {
        type: Boolean,
        default: false,
    },
    minimapPath: {
        type: String, // local path to floor image
    },
    startingPanoramaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Panorama'
    },
    initialView: {
        yaw: {
            type: Number,
            default: 0 // horizontal angle
        },
        pitch: {
            type: Number,
            default: 0 //  vertical angle
        },
        hfov: {
            type: Number,
            default: 125 //field of view
        }
    },
    // if you want it to be indexed in MongoDB
    mapID: {
	type: String,
	required: true,
	unique: true
    },
    // completionQuizId: {  // Quiz appear after user complete all missions
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Quiz'
    // }
});


module.exports = mongoose.model("Map", MapSchema);
