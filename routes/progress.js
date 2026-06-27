const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Workout, Meal, WaterLog } = require('../models');

// GET /api/progress?days=30
router.get('/', auth, async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 90);
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    // Build daily buckets
    const buckets = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split('T')[0];
      buckets[key] = { date: key, calories: 0, water: 0, workoutMinutes: 0 };
    }

    // Meals
    const meals = await Meal.find({ userId: req.user.id, loggedAt: { $gte: since } });
    for (const m of meals) {
      const key = m.loggedAt.toISOString().split('T')[0];
      if (buckets[key]) buckets[key].calories += m.calories || 0;
    }

    // Water
    const water = await WaterLog.find({ userId: req.user.id, loggedAt: { $gte: since } });
    for (const w of water) {
      const key = w.loggedAt.toISOString().split('T')[0];
      if (buckets[key]) buckets[key].water += w.amount || 0;
    }

    // Workouts
    const workouts = await Workout.find({ userId: req.user.id, createdAt: { $gte: since } });
    const workoutFrequency = {};
    for (const w of workouts) {
      const key = w.createdAt.toISOString().split('T')[0];
      if (buckets[key]) buckets[key].workoutMinutes += w.duration || 0;
      workoutFrequency[key] = (workoutFrequency[key] || 0) + 1;
    }

    // Streak calculation
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const sortedKeys = Object.keys(buckets).sort().reverse();
    for (const key of sortedKeys) {
      if (key > today) continue;
      if (buckets[key].calories > 0 || buckets[key].workoutMinutes > 0) {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      days,
      data: Object.values(buckets),
      workoutFrequency,
      streak,
      summary: {
        avgCalories: Math.round(Object.values(buckets).reduce((s, b) => s + b.calories, 0) / days),
        avgWater: Math.round(Object.values(buckets).reduce((s, b) => s + b.water, 0) / days),
        totalWorkouts: workouts.length,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/progress/weight — weight trend from Progress collection
router.get('/weight', auth, async (req, res, next) => {
  try {
    const { Progress } = require('../models');
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const entries = await Progress.find({ userId: req.user.id, date: { $gte: since } })
      .sort({ date: 1 });
    res.json(entries);
  } catch (err) { next(err); }
});

// POST /api/progress/weight — log a weight entry
router.post('/weight', auth, async (req, res, next) => {
  try {
    const { Progress } = require('../models');
    const { weight, date } = req.body;
    const entry = await Progress.create({
      userId: req.user.id,
      weight,
      date: date ? new Date(date) : new Date(),
    });
    res.status(201).json(entry);
  } catch (err) { next(err); }
});

module.exports = router;
