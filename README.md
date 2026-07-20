# ShortStack

A full-stack URL shortener application with secure authentication, protected user dashboards, server-side redirects, click analytics, custom aliases, QR code generation, link expiry, and daily click trends.

## Features

- Secure user signup and login using JWT authentication
- Protected dashboard for managing personal links
- Create short URLs with optional custom aliases
- Server-side URL redirection
- QR code generation for each short URL
- Optional link expiry
- Copy, edit, and delete shortened links
- Click analytics including:
  - Total clicks
  - Last visited time
  - Recent visit history
  - Browser and device information
  - Daily click trends
- Long URL validation
- Per-user link ownership
- Responsive user interface

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Recharts
- qrcode.react
- lucide-react

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### Authentication
- JWT
- bcrypt

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/sriranjini227-eng/ShortStack.git
cd ShortStack
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Update the `.env` file with:

- MongoDB URI
- JWT Secret

### 4. Start MongoDB

Run MongoDB locally or use a MongoDB Atlas connection string.

### Optional: Docker

```bash
docker compose up -d
```

If MongoDB is unavailable during local development, the backend falls back to local JSON storage located at:

```
server/.data/db.json
```

To require MongoDB during startup, set:

```
REQUIRE_MONGO=true
```

### 5. Run the application

```bash
npm run dev
```

Frontend:

```
http://127.0.0.1:5173
```

Backend:

```
http://127.0.0.1:4000
```

## Demo

Live Application:
https://short-stack-two.vercel.app/

Demo Video:
https://www.loom.com/share/189edd3dc6d44ca69c0d0333aaabd3ee

## Future Improvements

- Password reset via email
- Advanced analytics dashboard
- Link search and filtering
- Export analytics
- Custom domains
- Rate limiting
- Unit and integration testing

## License

This project is intended for learning and portfolio purposes.
