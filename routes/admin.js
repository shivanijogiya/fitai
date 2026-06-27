const router = require('express').Router();
const auth = require('../middleware/auth');
const { User, Workout, Meal, WaterLog } = require('../models');

// Admin guard middleware
const adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin only' });
  next();
};

// GET /api/admin/stats  — overview for admin dashboard
router.get('/stats', auth, adminOnly, async (req, res, next) => {
  try {
    const [totalUsers, totalWorkouts, totalMeals] = await Promise.all([
      User.countDocuments(),
      Workout.countDocuments(),
      Meal.countDocuments(),
    ]);

    const last7 = new Date(Date.now() - 7 * 86400000);
    const activeUsers = await Workout.distinct('userId', { date: { $gte: last7 } });

    // Top 5 exercises
    const popularWorkouts = await Workout.aggregate([
      { $group: { _id: '$exercise', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // New users per day (last 7 days)
    const newUsers = await User.aggregate([
      { $match: { createdAt: { $gte: last7 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalUsers,
      totalWorkouts,
      totalMeals,
      activeUsers: activeUsers.length,
      popularWorkouts,
      newUsers,
    });
  } catch (err) { next(err); }
});

// GET /api/admin/users  — paginated user list
router.get('/users', auth, adminOnly, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const search = req.query.q;

    const query = search
      ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(limit),
      User.countDocuments(query),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

module.exports = router;
