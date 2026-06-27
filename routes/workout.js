const router = require('express').Router();
const auth = require('../middleware/auth');
const { Workout } = require('../models');

// POST /api/workout
router.post('/', auth, async (req, res, next) => {
  try {
    const workout = await Workout.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ workout });
  } catch (err) { next(err); }
});

// GET /api/workouts  (paginated, infinite scroll)
router.get('/', auth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const workouts = await Workout.find({ userId: req.user._id })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Workout.countDocuments({ userId: req.user._id });
    res.json({ workouts, page, total, hasMore: page * limit < total });
  } catch (err) { next(err); }
});

// GET /api/workouts/weekly
router.get('/weekly', auth, async (req, res, next) => {
  try {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const workouts = await Workout.find({
      userId: req.user._id,
      date: { $gte: start },
    });
    const count = workouts.length;
    const totalMinutes = workouts.reduce((s, w) => s + w.durationMinutes, 0);
    const totalCalories = workouts.reduce((s, w) => s + w.caloriesBurned, 0);

    // Per-day breakdown (last 7 days)
    const freq = Array(7).fill(0);
    workouts.forEach(w => {
      const dayAgo = Math.floor((Date.now() - new Date(w.date)) / 86400000);
      if (dayAgo < 7) freq[6 - dayAgo]++;
    });

    res.json({ count, totalMinutes, totalCalories, freq });
  } catch (err) { next(err); }
});

module.exports = router;
