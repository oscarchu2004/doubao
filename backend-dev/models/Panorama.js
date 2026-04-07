const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

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
    panoramaId: {
    type: String,
    required: true,
    unique: true,
    // default: () => new mongoose.Types.ObjectId().toString()
    default: () => uuidv4(),
    },
});


// ✅ Extra safety: if somehow panoramaId is missing, add it before saving
PanoramaSchema.pre("save", function (next) {
  if (!this.panoramaId) {
    this.panoramaId = uuidv4();
  }
  next();
});


module.exports = mongoose.model("Panorama", PanoramaSchema);
