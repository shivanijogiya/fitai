// ─── models/User.js ──────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  age: { type: Number, default: 25 },
  height: { type: Number, default: 170 },   // cm
  weight: { type: Number, default: 70 },    // kg
  goal: {
    type: String,
    enum: ['lose_weight', 'gain_muscle', 'maintain'],
    default: 'maintain',
  },
  medicalConditions: String,
  dailyCalorieTarget: { type: Number, default: 2000 },
  dailyWaterTarget: { type: Number, default: 2500 },
  dailyStepTarget: { type: Number, default: 8000 },
  isAdmin: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

UserSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpiry;
  return obj;
};

// ─── models/Workout.js ────────────────────────────────────────────────────────
const WorkoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  exercise: { type: String, required: true },
  sets: { type: Number, default: 0 },
  reps: { type: Number, default: 0 },
  durationMinutes: { type: Number, default: 0 },
  caloriesBurned: { type: Number, default: 0 },
  notes: String,
  date: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

// ─── models/Meal.js ───────────────────────────────────────────────────────────
const MealSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true,
  },
  calories: { type: Number, required: true },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  imageUrl: String,
  date: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

// ─── models/WaterLog.js ───────────────────────────────────────────────────────
const WaterLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true }, // ml
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

// ─── models/Progress.js ───────────────────────────────────────────────────────
const ProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  weight: Number,
  bodyFat: Number,
  date: { type: Date, default: Date.now, index: true },
  steps: { type: Number, default: 0 },
  sleepHours: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', UserSchema),
  Workout: mongoose.model('Workout', WorkoutSchema),
  Meal: mongoose.model('Meal', MealSchema),
  WaterLog: mongoose.model('WaterLog', WaterLogSchema),
  Progress: mongoose.model('Progress', ProgressSchema),
};
