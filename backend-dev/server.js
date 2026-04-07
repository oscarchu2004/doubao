const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const path = require("path");

// env config
dotenv.config();

// route
const authRoute = require('./route/auth')
const userRoute = require('./route/user')
const mapRoute = require('./route/map')
const panoramaRoute = require('./route/panaroma')
const hotspotRoute = require('./route/hotspot')
const missionRoute = require('./route/mission')
const taskRoute = require('./route/task')
const questionRoute = require('./route/question')
const quizRoute = require('./route/quiz')
const quizResultRoute = require('./route/quizResult')
const uploadRoute = require('./route/upload')

const app = express();

// middlewares
// FIXME: do we really need this here, or better in nginx conf?
app.use(cookieParser());
app.use(cors({
  origin: 'https://shome3.hudini.online',
  credentials: true
}));

app.use(bodyParser.json());
app.use(morgan("dev"));


// mongoDB Connection
console.log("process.env.MONGO_URL: ", process.env.MONGO_URL)
mongoose.connect(process.env.MONGO_URL, {
})
    .then(() => console.log("MongoDB connected \n------------------------------------------------"))
    .catch((err) => console.error("MongoDB connection error:", err));




// routes
app.use('/v1/auth', authRoute)
app.use('/v1/user', userRoute)
app.use('/v1/maps', mapRoute)
app.use('/v1/panoramas', panoramaRoute)
app.use('/v1/hotspots', hotspotRoute)
app.use('/v1/missions', missionRoute)
app.use('/v1/tasks', taskRoute)
app.use('/v1/questions', questionRoute)
app.use('/v1/quiz', quizRoute)
app.use('/v1/quiz-results', quizResultRoute)
app.use('/v1/upload', uploadRoute) 

// expose uploaded files
app.use('/upload', express.static(path.join(__dirname, 'upload'))); // Note: changed 'uploads' to 'upload'

// start server
const PORT = process.env.PORT || 8090;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
