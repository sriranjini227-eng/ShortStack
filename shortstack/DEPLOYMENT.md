# Deployment Guide

Recommended public deployment:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## 1. Create MongoDB Atlas database

Create a free MongoDB Atlas cluster and copy the connection string. It should look like:

```text
mongodb+srv://USER:PASSWORD@cluster-name.mongodb.net/katomarans_url_shortener
```

## 2. Deploy backend on Render

Create a new Render Web Service from this repository.

Use these settings:

- Build Command: `npm install`
- Start Command: `npm run server:start`
- Health Check Path: `/api/health`

Set these environment variables in Render:

```env
NODE_ENV=production
REQUIRE_MONGO=true
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=a_long_random_secret
CLIENT_URL=https://your-vercel-frontend-url.vercel.app
APP_BASE_URL=https://your-render-backend-url.onrender.com
```

After deploy, test:

```text
https://your-render-backend-url.onrender.com/api/health
```

## 3. Deploy frontend on Vercel

Create a new Vercel project from this repository.

Use these settings:

- Framework Preset: Vite
- Build Command: `npm run client:build`
- Output Directory: `dist`

Set this environment variable in Vercel:

```env
VITE_API_URL=https://your-render-backend-url.onrender.com/api
```

Redeploy the frontend after adding the env var.

## 4. Update backend CLIENT_URL

After Vercel gives you the final frontend URL, update Render's `CLIENT_URL` to that Vercel URL and redeploy the backend.

## Notes

Local JSON fallback is for development only. Public deployment should use MongoDB Atlas with `REQUIRE_MONGO=true`.