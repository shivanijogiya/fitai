# FitAI - AI-Powered Wellness Companion

A cross-platform Flutter app with a Node.js backend that helps users track workouts, nutrition, and water intake, and get personalised health coaching via Gemini AI.

---

## Features

| Category | What's included |
|---|---|
| **Auth** | Login, Signup, JWT, Forgot Password (email reset) |
| **Profile** | Age, height, weight, goal, medical conditions, daily calorie target |
| **Dashboard** | Calorie ring, water ring, workout progress, motivational quote, quick actions |
| **Workouts** | Add exercise/sets/reps/duration, infinite-scroll history, weekly summary |
| **Meals** | Breakfast/Lunch/Dinner/Snacks, food photo upload, AI calorie estimation |
| **Water** | Quick-add (150/250/350/500 ml), custom amount, hydration tips |
| **AI Coach ⭐** | Gemini-powered chat with live context (today's meals, recent workouts) |
| **Analytics** | Weight trend, calorie trend vs target, water bar chart, workout frequency, streak |
| **Notifications** | Water reminders (every 2 h), workout reminder (7 am), meal reminders |
| **Admin** | User list, active user count, popular workouts, daily new user chart |
| **Dark mode** | Full Material 3 dark theme, persisted in SharedPreferences |
| **Offline cache** | Hive boxes opened; providers fall back to cache on API failure |

---

## Tech Stack

```
Flutter (Riverpod · go_router · fl_chart · Hive · flutter_local_notifications)
    ↕  REST + JWT
Node.js / Express
    ↕
MongoDB Atlas   ·   Gemini 1.5 Flash   ·   Cloudinary
```

---

## Project Structure

```
fitai/
├── lib/
│   ├── main.dart
│   ├── models/models.dart
│   ├── services/
│   │   ├── api_service.dart
│   │   └── notification_service.dart
│   ├── providers/
│   │   ├── auth_provider.dart
│   │   └── health_providers.dart
│   ├── screens/
│   │   ├── auth/         splash · login · signup · forgot_password
│   │   ├── dashboard/    dashboard_screen
│   │   ├── workout/      workout_screen
│   │   ├── meal/         meal_screen
│   │   ├── water/        water_screen
│   │   ├── chat/         ai_chat_screen
│   │   ├── analytics/    analytics_screen
│   │   └── profile/      profile_screen · edit_profile_screen
│   ├── widgets/shell_scaffold.dart
│   ├── routes/app_router.dart
│   └── utils/theme.dart
├── pubspec.yaml
└── backend/
    ├── server.js
    ├── package.json
    ├── .env.example
    ├── middleware/auth.js
    ├── models/index.js
    └── routes/
        ├── auth.js        POST /signup  POST /login  POST /forgot-password
        ├── profile.js     GET /profile  PUT /profile
        ├── workout.js     POST /workout  GET /workouts  GET /workouts/weekly
        ├── meal.js        POST /meal  GET /meals  POST /meal/analyze-image
        ├── water.js       POST /water  GET /water/today  DELETE /water/:id
        ├── progress.js    GET /progress  GET /progress/weight  POST /progress/weight
        ├── dashboard.js   GET /dashboard
        ├── chat.js        POST /chat
        └── admin.js       GET /admin/stats  GET /admin/users
```

---

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env        # fill in your secrets
npm install
node server.js              # or: npm run dev  (with nodemon)
```

Deploy to Railway in one command:
```bash
railway up
```

### Flutter

1. Open `lib/services/api_service.dart` and replace the base URL:
   ```dart
   const _baseUrl = 'https://YOUR-RAILWAY-URL.railway.app/api';
   ```

2. Install dependencies and generate code:
   ```bash
   flutter pub get
   dart run build_runner build --delete-conflicting-outputs
   ```

3. Run:
   ```bash
   flutter run              # connected device
   flutter run -d chrome    # web
   flutter build apk        # Android
   flutter build ios        # iOS (Mac + Xcode)
   ```

---

## Environment Variables

See `backend/.env.example` for all required variables.

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | [MongoDB Atlas](https://cloud.mongodb.com) → Connect → Drivers |
| `JWT_SECRET` | Any 64+ char random string (`openssl rand -hex 32`) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) |
| `CLOUDINARY_*` | [Cloudinary Console](https://cloudinary.com/console) |
| `EMAIL_USER/PASS` | Gmail + App Password (2FA must be on) |

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Register new user |
| POST | `/api/auth/login` | — | Login → JWT |
| POST | `/api/auth/forgot-password` | — | Send reset email |
| GET | `/api/profile` | ✓ | Get own profile |
| PUT | `/api/profile` | ✓ | Update profile |
| POST | `/api/workout` | ✓ | Log a workout |
| GET | `/api/workouts` | ✓ | Workout history (paginated) |
| GET | `/api/workouts/weekly` | ✓ | Weekly summary |
| POST | `/api/meal` | ✓ | Log a meal |
| GET | `/api/meals?date=YYYY-MM-DD` | ✓ | Meals for a date |
| POST | `/api/meal/analyze-image` | ✓ | AI calorie estimate from photo |
| POST | `/api/water` | ✓ | Log water intake |
| GET | `/api/water/today` | ✓ | Today's water total |
| GET | `/api/progress?days=30` | ✓ | Calorie/water/workout trend |
| GET | `/api/progress/weight` | ✓ | Weight trend (90 days) |
| POST | `/api/progress/weight` | ✓ | Log weight entry |
| GET | `/api/dashboard` | ✓ | Today's summary |
| POST | `/api/chat` | ✓ | AI health coach (Gemini) |
| GET | `/api/admin/stats` | admin | Platform analytics |
| GET | `/api/admin/users` | admin | User list + search |

---

## Bonus Features Implemented

- ✅ Dark mode (toggleable, persisted)
- ✅ Offline cache (Hive — degrades gracefully)
- ✅ Infinite scroll on workout history
- ✅ Pull-to-refresh scaffolding
- ✅ Image upload (food photo → Cloudinary → Gemini vision)
- ✅ AI chatbot with personalised context injection
- ✅ Admin dashboard endpoints

---

## MongoDB Collections

| Collection | Key fields |
|---|---|
| `users` | name, email, password (bcrypt), age, height, weight, goal, medicalConditions, dailyCalorieTarget, isAdmin |
| `workouts` | userId, exercise, sets, reps, duration, caloriesBurned |
| `meals` | userId, name, mealType, calories, protein, carbs, fat, imageUrl, loggedAt |
| `waterlogs` | userId, amount, unit, loggedAt |
| `progress` | userId, weight, date |
