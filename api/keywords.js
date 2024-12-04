const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const connectToDatabase = async () => {
  if (mongoose.connection.readyState) return;

  const MONGO_URI = process.env.MONGO_URI;

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Database connection failed");
  }
};

// Define Schema and Model
const keywordSchema = new mongoose.Schema({
  channelId: { type: String, required: true },
  channelName: { type: String, required: true },
  destination: { type: String, required: true },
  keywordid: {type: String, required: true},
  prompt: { type: String, required: true },
  alertCount: { type: Number, default: 0 },
});

const Keyword = mongoose.model('Keyword', keywordSchema);

const corsMiddleware = cors({
  origin: "*",
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
});

module.exports = async (req, res) => {
  corsMiddleware(req, res, async () => {
    try {
      await connectToDatabase();

      // GET Request
      if (req.method === 'GET') {
        const { channelId } = req.query;
        let keywords;
        if (channelId) {
          keywords = await Keyword.find({ channelId });
        } else {
          keywords = await Keyword.find();
        }
        return res.status(200).json(keywords);
      }

      // POST Request
      if (req.method === 'POST') {
        const { channelId, channelName, destination, prompt, keywordid } = req.body;

        if (!channelId || !channelName || !destination || !prompt || !keywordid) {
          return res.status(400).send('All fields are required.');
        }

        const newKeyword = new Keyword({ channelId, channelName, destination, prompt, keywordid });
        await newKeyword.save();
        return res.status(201).json(newKeyword);
      }

      if (req.method === 'DELETE') {
        const { id } = req.query;

        if (!id) {
          return res.status(400).send('Keyword ID is required.');
        }

        const deletedKeyword = await Keyword.findByIdAndDelete(id);
        if (!deletedKeyword) {
          return res.status(404).send('Keyword not found.');
        }

        return res.status(204).send();
      }
      res.setHeader('Allow', 'GET, POST, DELETE');
      return res.status(405).send('Method Not Allowed');
    } catch (err) {
      console.error('Unhandled server error:', err);
      return res.status(500).send('A server error has occurred.');
    }
  });
};
