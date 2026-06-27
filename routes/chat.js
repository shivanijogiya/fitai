const router = require('express').Router();
const auth = require('../middleware/auth');
const { Workout, Meal, WaterLog } = require('../models');

function buildSystemPrompt(user, recentWorkouts, todayCalories, waterToday) {
  const goalLabels = {
    lose_weight: 'losing weight',
    gain_muscle: 'gaining muscle',
    maintain: 'maintaining weight',
  };
  return `You are FitAI, a highly personalized AI health and fitness coach.

USER PROFILE:
- Name: ${user.name}
- Age: ${user.age}, Height: ${user.height}cm, Weight: ${user.weight}kg
- Goal: ${goalLabels[user.goal] || 'maintaining weight'}
- Daily calorie target: ${user.dailyCalorieTarget} kcal
${user.medicalConditions ? `- Medical conditions: ${user.medicalConditions}` : ''}

TODAY'S ACTIVITY:
- Calories consumed: ${todayCalories} kcal (target: ${user.dailyCalorieTarget} kcal)
- Water: ${waterToday} ml
- Recent workouts: ${recentWorkouts.map(w => `${w.exercise} (${w.duration}min)`).join(', ') || 'None logged recently'}

COACHING GUIDELINES:
1. Be empathetic, encouraging, and non-judgmental
2. Give SPECIFIC, ACTIONABLE advice tailored to their profile
3. Reference their actual data when relevant
4. Keep responses concise (2-4 sentences for simple queries)
5. Use emojis sparingly for warmth
6. Never give medical diagnoses`;
}

// POST /api/chat
router.post('/', auth, async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    const user = req.user;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [recentWorkouts, todayMeals, todayWater] = await Promise.all([
      Workout.find({ userId: user._id, createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } })
        .sort({ createdAt: -1 }).limit(5),
      Meal.find({ userId: user._id, loggedAt: { $gte: todayStart } }),
      WaterLog.find({ userId: user._id, loggedAt: { $gte: todayStart } }),
    ]);

    const todayCalories = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
    const waterToday = todayWater.reduce((s, w) => s + (w.amount || 0), 0);
    const systemPrompt = buildSystemPrompt(user, recentWorkouts, todayCalories, waterToday);

    // Build messages for Groq
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API error');
    }

    const reply = data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

module.exports = router;