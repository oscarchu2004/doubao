const mongoose = require("mongoose");

const PanoramaSchema = new mongoose.Schema({
    mapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Map',
        required: true,
    },
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    imagePath: {
        type: String,
        required: true, 
    },
    positionOnMinimap: {
        x: Number, // coordinates on floor plan
        y: Number,
    },
});


module.exports = mongoose.model("Panorama", PanoramaSchema);
