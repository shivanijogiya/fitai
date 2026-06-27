// ─── routes/profile.js ───────────────────────────────────────────────────────
const router = require('express').Router();
const auth = require('../middleware/auth');
const { User } = require('../models');

router.get('/', auth, async (req, res, next) => {
  try {
    res.json({ user: req.user.toSafeJSON() });
  } catch (err) { next(err); }
});

router.put('/', auth, async (req, res, next) => {
  try {
    const allowed = ['name','age','height','weight','goal','medicalConditions',
                     'dailyCalorieTarget','dailyWaterTarget','dailyStepTarget'];
    allowed.forEach(k => { if (req.body[k] !== undefined) req.user[k] = req.body[k]; });
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (err) { next(err); }
});

module.exports = router;
