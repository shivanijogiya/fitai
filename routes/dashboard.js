// ─── routes/dashboard.js ─────────────────────────────────────────────────────
const router = require('express').Router();
const auth = require('../middleware/auth');
const { Workout, Meal, WaterLog } = require('../models');

router.get('/', auth, async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [meals, water, workouts] = await Promise.all([
      Meal.find({ userId: req.user._id, date: { $gte: today, $lt: tomorrow } }),
      WaterLog.find({ userId: req.user._id, timestamp: { $gte: today, $lt: tomorrow } }),
      Workout.find({ userId: req.user._id, date: { $gte: today, $lt: tomorrow } }),
    ]);

    const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
    const totalWater = water.reduce((s, w) => s + w.amount, 0);
    const workoutMinutes = workouts.reduce((s, w) => s + w.durationMinutes, 0);

    res.json({
      totalCalories,
      totalWater,
      workoutMinutes,
      steps: 0, // Integrate HealthKit / Google Fit later
      sleepHours: 0,
    });
  } catch (err) { next(err); }
});

module.exports = router;

// ─── routes/progress.js ───────────────────────────────────────────────────────
const progressRouter = require('express').Router();
const progressAuth = require('../middleware/auth');
const { Meal: PMeal, WaterLog: PWater, Workout: PWorkout } = require('../models');

progressRouter.get('/', progressAuth, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const from = new Date();
    from.setDate(from.getDate() - days);

    const [meals, water, workouts] = await Promise.all([
      PMeal.find({ userId: req.user._id, date: { $gte: from } }).lean(),
      PWater.find({ userId: req.user._id, timestamp: { $gte: from } }).lean(),
      PWorkout.find({ userId: req.user._id, date: { $gte: from } }).lean(),
    ]);

    // Aggregate calories per day
    const calMap = {};
    meals.forEach(m => {
      const d = new Date(m.date).toLocaleDateString();
      calMap[d] = (calMap[d] || 0) + m.calories;
    });

    // Aggregate water per day
    const waterMap = {};
    water.forEach(w => {
      const d = new Date(w.timestamp).toLocaleDateString();
      waterMap[d] = (waterMap[d] || 0) + w.amount;
    });

    // Workout frequency (per day of week)
    const freqMap = Array(7).fill(0);
    workouts.forEach(w => {
      freqMap[new Date(w.date).getDay()]++;
    });

    // Streak: consecutive days with at least one meal logged
    let streak = 0;
    const today = new Date().toLocaleDateString();
    for (let i = 0; i < 60; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (calMap[d.toLocaleDateString()]) streak++;
      else if (i > 0) break;
    }

    res.json({
      calories: Object.entries(calMap).map(([d, v], i) => ({ day: i, value: v })),
      water: Object.entries(waterMap).map(([d, v], i) => ({ day: i, value: v })),
      workoutFrequency: freqMap,
      streak,
    });
  } catch (err) { next(err); }
});

module.exports.progressRouter = progressRouter;
