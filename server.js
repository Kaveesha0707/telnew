require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests, please try again later."
}));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*', // Limit origin in production
  })
);

// Serve static files from the 'public' folder (for React/SPAs)
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // Exit if connection fails
  });

// Define Schema and Model for Keyword with the new fields
const keywordSchema = new mongoose.Schema({
  channelId: { type: String, required: true },
  channelName: { type: String, required: true },
  destination: { type: String, required: true },
  keywordid: {type: String, required: true},
  prompt: { type: String, required: true },
  alertCount: { type: Number, default: 0 },
});

const Keyword = mongoose.model('Keyword', keywordSchema);

// API Routes

// Get all keywords
app.get('/api/keywords', async (req, res) => {
  try {
    const keywords = await Keyword.find();
    res.json(keywords);
  } catch (err) {
    console.error('Error fetching keywords:', err.message);
    res.status(500).json({ message: 'Unable to fetch keywords.' });
  }
});

// Add a new keyword (with additional fields)
app.post(
  '/api/keywords',
  [
    body('channelId').notEmpty().withMessage('Channel ID is required'),
    body('channelName').notEmpty().withMessage('Channel Name is required'),
    body('destination').notEmpty().withMessage('Destination is required'),
    body('prompt').notEmpty().withMessage('Prompt is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { channelId, channelName, destination, prompt, keywordid } = req.body;

    try {
      // Check if keyword already exists based on `channelId` and `channelName`
      const existingKeyword = await Keyword.findOne({ channelId, channelName });
      if (existingKeyword) {
        return res.status(400).json({ message: 'Keyword already exists for this channel.' });
      }

      const newKeyword = new Keyword({ channelId, channelName, destination, prompt, keywordid });
      await newKeyword.save();
      res.status(201).json(newKeyword);
    } catch (err) {
      console.error('Error adding keyword:', err.message);
      res.status(500).json({ message: 'Unable to add keyword.' });
    }
  }
);

// Delete a keyword
app.delete('/api/keywords/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Keyword.findByIdAndDelete(id);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting keyword:', err.message);
    res.status(500).send('Unable to delete keyword.');
  }
})

// Catch-all Route (for React/SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
