const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { WaterLog } = require('../models');

// POST /api/water
router.post('/', auth, async (req, res, next) => {
  try {
    const { amount, unit = 'ml', loggedAt } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });
    const log = await WaterLog.create({
      userId: req.user.id,
      amount,
      unit,
      loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
    });
    res.status(201).json(log);
  } catch (err) { next(err); }
});

// GET /api/water/today
router.get('/today', auth, async (req, res, next) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);
    const logs = await WaterLog.find({
      userId: req.user.id,
      loggedAt: { $gte: start, $lte: end },
    }).sort({ loggedAt: -1 });
    const total = logs.reduce((s, l) => s + l.amount, 0);
    res.json({ logs, total, unit: 'ml' });
  } catch (err) { next(err); }
});

// DELETE /api/water/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const log = await WaterLog.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!log) return res.status(404).json({ error: 'Log not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
