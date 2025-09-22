# SIH_2025_INTERNAL_ROUND

# Project Overview

A mobile attendance system that uses face recognition to mark attendance. The project consists of a React Native mobile application (`code/mobile_app`) and a Node.js + Express backend (`code/backend`) that uses face-api models and Prisma for data storage.

Tasks Accomplished

- Implemented facial recognition based attendance using pre-trained face-api models.
- Mobile app with screens for registration, login, marking attendance, and viewing history.
- Backend API for handling users, teachers, and attendance records with image upload support.
- Prisma schema and initial migrations for database setup.
- Offline storage/sync support for the mobile app (local caching of attendance when offline).

Technology Stack
This project leverages the following technologies:

- React Native (TypeScript): Mobile application for Android and iOS (`code/mobile_app`).
- Node.js + Express: REST API server (`code/backend/index.js` and routes in `code/backend/routes`).
- face-api.js models: Pre-trained models included in `code/backend/models` for face detection and recognition.
- Prisma ORM: Database schema and migrations in `code/backend/prisma`.
- JavaScript / TypeScript: Core languages used across the project.

Key Features

- Face-based Attendance: Mark attendance by recognizing faces from the mobile camera.
- Real-time Face Detection: Uses lightweight models for on-device/edge detection and recognition.
- Teacher & Student Accounts: Separate register/login flows for teachers and students.
- Attendance History: View attendance records and filter by date, class or student.
- Offline Support: Cache attendance locally and sync with backend when the device is back online.
- Secure Uploads: Store images/uploads on the backend with upload endpoints.

Folder structure (high level)

- `code/mobile_app` — React Native application (screens, services, navigation).
- `code/backend` — Express server, routes (`attendance.js`, `teacher.js`, `user.js`), Prisma schema, uploaded models and uploads folder.
- `code/backend/models` — pre-trained face-api model files used by the backend.

Local Setup Instructions
Follow these steps to run the project locally. Commands assume a bash shell.

Backend (Linux / macOS / Windows WSL)

1. Open a terminal and go to the backend folder:
   cd code/backend
2. Install dependencies:
   npm install
3. Create a `.env` file (copy from `.env.example` if provided) and set database URL and any required keys (e.g., PORT).
4. Setup the database with Prisma (example using SQLite or your DB):
   npx prisma migrate dev --name init
   or
   npx prisma db push
5. Start the server:
   npm run dev

Notes for Windows (non-WSL): Use PowerShell or Command Prompt. For native builds, ensure Node and required build tools are installed.

Mobile App (Android / iOS)

1. Open a terminal and go to the mobile app folder:
   cd code/mobile_app
2. Install dependencies:
   npm install
   or
   yarn install
3. If the project uses CocoaPods (iOS), run from `code/mobile_app/ios`:
   npx pod-install ios
4. Run on Android emulator or device:
   npm run android
   or for iOS simulator:
   npm run ios
   or if the app uses Expo, run:
   npx expo start

Environment variables & API base URL

- Configure the mobile app to point to the backend API. Edit `code/src/services/api.config.ts` and set the `BASE_URL` to your backend server (e.g., `http://192.168.1.100:3000` for LAN access).

API Endpoints (summary)

- POST `/api/user/register` — Register a new user.
- POST `/api/user/login` — Login user.
- POST `/api/teacher/register` — Register teacher.
- POST `/api/attendance/mark` — Mark attendance (image/data payload).
- GET `/api/attendance/history` — Get attendance records.

Usage

1. Run backend and mobile app on the same network (or use tunneling like ngrok).
2. Register a teacher and students from the mobile app.
3. Use the "Mark Attendance" screen to capture the face; the app sends the image to backend for recognition and the backend stores the attendance record.

Notes on models

- Pre-trained face-api models are stored in `code/backend/models`. These are used server-side for face detection/recognition. Keep these files in place for the recognition feature to work.

Contributing

- Fork the repo, create a feature branch, run tests and open a pull request. Follow consistent commit messages and keep changes small and focused.

License

- Add your project license here (e.g., MIT) or remove this section if not applicable.

Contact

- For questions, reach out to the maintainers or open an issue in the repository.
