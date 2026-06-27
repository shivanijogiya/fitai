// ─── routes/meal.js ──────────────────────────────────────────────────────────
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const fs = require('fs');
const auth = require('../middleware/auth');
const { Meal } = require('../models');

const router = express.Router();
const upload = multer({ dest: '/tmp/' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});



// POST /api/meal
router.post('/', auth, async (req, res, next) => {
  try {
    const meal = await Meal.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ meal });
  } catch (err) { next(err); }
});

// GET /api/meals?date=YYYY-MM-DD
router.get('/', auth, async (req, res, next) => {
  try {
    const query = { userId: req.user._id };
    if (req.query.date) {
      const start = new Date(req.query.date);
      const end = new Date(req.query.date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }
    const meals = await Meal.find(query).sort({ date: -1 });
    res.json({ meals });
  } catch (err) { next(err); }
});

// POST /api/meal/analyze-image  (AI calorie estimation)
router.post('/analyze-image', auth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    // Read image as base64
    const imageBase64 = fs.readFileSync(req.file.path).toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    // Upload to Cloudinary
    const cloudResult = await cloudinary.uploader.upload(req.file.path);
    fs.unlinkSync(req.file.path);

    // Use GPT-4o mini vision to analyze the image
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            {
              type: 'text',
              text: 'Analyze this food image and return ONLY a JSON object with these exact fields: {"name":"food name","calories":number,"protein":number,"carbs":number,"fat":number}. All numbers in grams/kcal for a typical serving. Return only valid JSON, no markdown, no explanation.',
            },
          ],
        }],
        max_tokens: 200,
      }),
    });

    const openaiData = await openaiRes.json();
    if (!openaiRes.ok) throw new Error(openaiData.error?.message || 'OpenAI error');
    const text = openaiData.choices[0].message.content.replace(/```json|```/g, '').trim();
    const nutritionData = JSON.parse(text);

    res.json({ ...nutritionData, imageUrl: cloudResult.secure_url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// ─── routes/water.js ──────────────────────────────────────────────────────────
const waterRouter = require('express').Router();
const waterAuth = require('../middleware/auth');
const { WaterLog } = require('../models');

// POST /api/water
waterRouter.post('/', waterAuth, async (req, res, next) => {
  try {
    const log = await WaterLog.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ log });
  } catch (err) { next(err); }
});

// GET /api/water/today
waterRouter.get('/today', waterAuth, async (req, res, next) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const logs = await WaterLog.find({
      userId: req.user._id,
      timestamp: { $gte: start },
    });
    const totalMl = logs.reduce((s, l) => s + l.amount, 0);
    res.json({ totalMl, logs });
  } catch (err) { next(err); }
});

module.exports.waterRouter = waterRouter;