#  URL Shortener

A full-stack URL shortener with authentication, protected user dashboard, server-side redirects, click analytics, custom aliases, QR codes, expiry dates, and daily click charts.

## Tech Stack

- Frontend: React, Vite, React Router, Recharts, qrcode.react, lucide-react
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT with bcrypt password hashing
- APIs: REST

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create environment config:

   ```bash
   copy .env.example .env
   ```

3. Update `.env` with your MongoDB URI and JWT secret.

4. Start MongoDB locally or use a hosted MongoDB URI.

   With Docker:

   ```bash
   docker compose up -d
   ```

   If MongoDB is unavailable during local development, the API falls back to local JSON demo storage at `server/.data/db.json` so the UI and full workflow can still be tested. Set `REQUIRE_MONGO=true` in `.env` when you want startup to fail unless MongoDB connects.

5. Run the app:

   ```bash
   npm run dev
   ```

The React app runs at `http://127.0.0.1:5173` and the API runs at `http://127.0.0.1:4000`.

## Implemented Requirements

- User signup and login
- Protected dashboard routes
- Per-user short link ownership
- Long URL validation
- Unique short codes and optional custom aliases
- Server-side redirect handling
- Delete links and copy short links from the UI
- Click counts, last visit, recent visit history, and daily click chart
- QR code for each short URL
- Optional link expiry
- Hashed passwords and environment-based configuration



This project is a part of a hackathon run by https://katomaran.com
