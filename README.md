# Geeta Edu

A MERN learning platform where trainers run courses in batches and students enrol, attend live classes, submit assignments, take coding tests and chat with their batch. The repo has three apps:

| Folder | What it is |
|---|---|
| `backend/` | Express 5 REST API with MongoDB/Mongoose and Socket.IO |
| `frontend/` | React 19 + Vite + Tailwind web app |
| `mobile/` | Expo / React Native app (early stage) |

[`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) gives a file-by-file map.

## Features

- **Accounts**: email/password sign-up and login (bcrypt + JWT), Google sign-in, and three roles: student, trainer and admin. Sign-up only offers student and trainer. Admins are created with `backend/scripts/makeAdmin.js`.
- **Courses and batches**: trainers create courses and batches with videos, resources and announcements. Students browse them and enrol.
- **Payments**: paid batches use Razorpay. The server creates the order and then checks the payment signature against that stored order before it enrols the student. Free batches enrol directly.
- **Live classes**: trainers schedule, start and end sessions, and attendance is tracked.
- **Assignments**: trainers create and grade them. Students submit a link or upload a file (Cloudinary).
- **Coding tests**: trainers write questions with test cases. Students run code through the public Judge0 API and submit for scoring.
- **Batch chat**: real-time messages with Socket.IO. History is stored in MongoDB.
- **AI tools (Google Gemini)**: an interview coach, an AI tutor (lesson plan, sections, follow-up questions, quiz), and translation and lecture summaries.
- **Gamification**: the server awards points for enrolling, submitting assignments and completing tests. There are levels, streaks, badges and a leaderboard.
- **Multi-language UI**: i18next with English, Hindi and Bengali.
- **Admin panel**: stats, a user list, role changes and user deletion.

## Tech stack

- **Backend**: Node.js, Express 5, MongoDB + Mongoose, JWT, bcryptjs, Socket.IO, Razorpay, Cloudinary (multer), google-auth-library, `@google/generative-ai`
- **Frontend**: React 19, Vite, Tailwind CSS, React Router, Axios, socket.io-client, react-razorpay, `@react-oauth/google`, i18next
- **Mobile**: Expo 54, React Native 0.81

## Run locally

You need Node 18 or newer and a MongoDB connection string.

### Backend

```bash
cd backend
npm install
npm run dev        # nodemon server.js, port 5002 by default
```

Create `backend/.env` with:

```
MONGODB_URI=
JWT_SECRET=
PORT=5002
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
GOOGLE_CLIENT_ID=
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

`frontend/.env` uses `VITE_API_URL` (for example `http://localhost:5002/api`), `VITE_SOCKET_URL`, `VITE_RAZORPAY_KEY_ID` and `VITE_GOOGLE_CLIENT_ID`. If `VITE_API_URL` is not set, the app calls the deployed Render API.

### Mobile

```bash
cd mobile
npm install
npx expo start
```

The API address is hard-coded in `mobile/src/config/api.js`. Point it at your machine's LAN IP and port 5002.

## API overview

All routes are under `/api`: `auth`, `courses`, `batches`, `enrollments`, `payment`, `live-sessions`, `assignments`, `announcements`, `tests`, `upload`, `chat`, `ai`, `gamification` and `admin`. Most of them need an `Authorization: Bearer <token>` header. Trainer and admin actions are also checked by role.
