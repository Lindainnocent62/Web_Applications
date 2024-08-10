require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Middlewares
app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Importing port
const port = process.env.PORT || 3000;

// Connecting to database
try {
  mongoose.connect("mongodb://localhost:27017/layTech_admin");
} catch (err) {
  console.log("connection failed", err);
}

const db_connection = mongoose.connection;
db_connection.on("error", (err) => { console.log("connection error") });
db_connection.once("open", () => { console.log("connection successful") });

// Data warehouse (users, logs, and exercises)
// Creating schema that define the structure of our document(database object)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  }
});

// Creating another schema that define the structure of our document of another(database object)
const ExerciseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: false,
    default: new Date().toDateString()
  }, username: {
    type: String,
    sparse: true // Ensure sparse index if not all documents have a username
  }
});

// Creating models to create a collection of documents
const User = mongoose.model("users", userSchema);
const Exercise = mongoose.model("exercises", ExerciseSchema);

// Returning the UI
app.get('/', (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Creating a new user 
app.post('/api/users', async (req, res) => {
  const username_ = req.body.username;

  try {
    // Checking if username already exist
    const userfound = await User.findOne({ username: username_ });

    if (userfound) {
      // Old user found matching the username response
      res.json({
        username: userfound.username,
        _id: userfound._id
      });
    } else {
      // Create a new user
      const user_created = await User.create({
        username: username_
      });

      // New user created response
      res.status(200).json({
        username: user_created.username,
        _id: user_created._id
      });
    }
  } catch (err) {
    console.log("Failed to retrieve user from data base: ",err);
    res.status(503).json({message: err.message})
  }
});

// Getting a list of all users
app.get("/api/users", async (req, res) => {
  const users = await User.find();

  if(users && users.length > 0) {
    res.json(users); // This can also be achieved with a simple mapping
  } else {
    res.status(503).json({
      error: "no users found"
    });
  }
});

//exercises creation endpoint 
app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  console.log("User searched:", userId);

  try {
    // Finding the user by userId
    const findUser = await User.findById(userId);

    // If user found, create the exercise; else return a notification that user matching ID is not found
    if (findUser) {
      // Ensure the date is valid before converting it
      const exerciseDate = req.body.date ? new Date(req.body.date) : new Date(); // Format the provided date or use current date

      if (isNaN(exerciseDate)) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      // Create the exercise for the user
      const user_exercise = await Exercise.create({
        username: findUser.username,
        description: req.body.description,
        duration: Number(req.body.duration), // Ensure duration is a number
        date: exerciseDate.toDateString(),
        userId: findUser._id, // Associate the exercise with the user
      });

      console.log("Exercise successfully created!", user_exercise);

      // Return the user object with the new exercise added
      res.json({
        _id: findUser._id,
        username: findUser.username,
        description: user_exercise.description,
        duration: user_exercise.duration,
        date: user_exercise.date,
      });

    } else {
      res.status(404).json({ message: "No user with that ID exists!" });
    }
  } catch (err) {
    console.error(err.stack);
    if (err.name === 'ValidationError') {
      res.status(400).json({ error: err.message }); // Specific validation error message
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Getting the user's exercise log
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const userId = req.params._id;
    //check if userId exist in database
    const foundUser = await User.findById(userId);

    if (!foundUser) {
      return res.status(404).json({
        error: "No user exists for that id!",
      });
    }

    //continue if user found...
    //query parameters from&to are dates and limit is integer that limits the number of outputs
    let {from, to, limit} = req.query;

    // Convert limit to an integer if provided, and ensure it's a valid number
    //limit = limit ? parseInt(limit) : undefined;

    // Convert dates to ISO format if provided, and handle edge cases
    let dateFilter = {};

    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) {
        dateFilter.$gte = fromDate;//from.toISOString();
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) {
        dateFilter.$lte = toDate; //to.toISOString();
      }
    }

    // Build the query object
    let queryObject = { userId: foundUser._id };
    if (Object.keys(dateFilter).length > 0) {
      queryObject.date = dateFilter;
    }

    // Find exercises based on the query object and apply limit
    let exercisesQuery = Exercise.find(queryObject).sort({ date: 1 });
    if (limit) {
      exercisesQuery = exercisesQuery.limit(parseInt(limit));
    }

    //executing query
    let exercises = await exercisesQuery.exec();

   
      // Ensure all date objects are strings and process exercises
      exercises = exercises.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString() // Convert date to string
      }));

      res.json({
        username: foundUser.username,
        count: exercises.length,
        _id: foundUser._id,
        log: exercises
        });

  } catch (error) {

    console.log(err.stack);
    res.status(500).json({ error: 'Server error, failed to retrieve user logs' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Your app is listening on port http://localhost:${port}`);
});
