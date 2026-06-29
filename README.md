# FoodHub

FoodHub is a full-stack, multi-vendor food ordering and delivery platform built
as a portfolio and demo project. It supports restaurant discovery, menu
management, ordering, delivery workflows, image uploads, and restaurant reviews.

## Tech Stack

- React, Vite, Tailwind CSS, React Router, and Axios
- Node.js and Express
- MongoDB and Mongoose
- JWT, bcryptjs, and Google Identity
- Cloudinary and Multer

## Features By Role

### Customer

- Browse approved restaurants and menus
- Maintain a guest cart in localStorage
- Place and cancel orders
- Track order status
- Review restaurants after a delivered order

### Restaurant Owner

- Create and update a restaurant profile
- Upload restaurant and food images
- Create and manage menu items
- View orders and update preparation status

### Rider

- Browse available deliveries
- Accept ready orders
- View assigned deliveries and mark them delivered

### Admin

- Approve or reject restaurants
- View all orders with filters
- View reviews through the admin API

## Project Structure

```text
foodhub/
  client/   React and Vite frontend
  server/   Express and MongoDB API
```

## Environment Setup

Create local environment files from the included examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Server variables:

```env
PORT=5001
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NODE_ENV=development
```

Client variables:

```env
VITE_API_URL=http://localhost:5001/api
VITE_GOOGLE_CLIENT_ID=
```

Never commit real `.env` files or production secrets.

## Run Locally

Install and start the backend:

```bash
cd server
npm install
npm run dev
```

In another terminal, install and start the frontend:

```bash
cd client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the API defaults to
`http://localhost:5001`. Check the API with `GET /api/health`.

## Demo Credentials

These are local/demo examples only and should not be used in production. Create
matching users in your local database before using them.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@foodhub.com` | `Admin123` |
| Restaurant Owner | `owner1@example.com` | `Owner123` |
| Customer | `customer10@example.com` | `Customer123` |
| Rider | `rider1@example.com` | `Rider123` |

## API Overview

- `/api/auth` registration, login, Google authentication, and current user
- `/api/restaurants` restaurant profiles, public discovery, and approval
- `/api/foods` owner menu management and public menus
- `/api/orders` customer, restaurant, rider, and admin order workflows
- `/api/uploads` Cloudinary image uploads
- `/api/reviews` customer restaurant reviews and public ratings

## Deployment

### Backend On Render

Create a Render Web Service from this repository. The included `render.yaml`
can configure the service automatically, or use these manual settings:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

Add these environment variables in Render:

```env
NODE_ENV=production
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=use_a_long_random_production_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-foodhub-app.vercel.app
GOOGLE_CLIENT_ID=your_google_client_id
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Render supplies `PORT` automatically. After deployment, verify:

```text
https://your-render-backend-url.onrender.com/api/health
```

### Frontend On Vercel

Import the repository into Vercel with these project settings:

- Root directory: `client`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

Add these environment variables before deploying:

```env
VITE_API_URL=https://your-render-backend-url.onrender.com/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

The included `client/vercel.json` sends SPA routes such as `/restaurants`,
`/cart`, and dashboard URLs to `index.html`, preventing refresh 404 errors.

### MongoDB Atlas

- Use a dedicated database user with a strong password.
- Add Render's outbound address to Atlas Network Access when available.
- `0.0.0.0/0` can be used for a temporary demo, but it permits connections
  from every IP and is less secure.
- Keep the Atlas connection string only in Render's environment settings.

### Google OAuth

- Add the deployed Vercel URL to Authorized JavaScript origins.
- Keep `VITE_GOOGLE_CLIENT_ID` and backend `GOOGLE_CLIENT_ID` synchronized.
- Add the Render backend URL to the Google configuration if your OAuth setup
  uses backend origins or redirect URIs.

### Final URL Updates

The two deployments depend on each other:

1. Deploy the backend and copy its Render URL.
2. Set Vercel's `VITE_API_URL` to the Render URL followed by `/api`.
3. Deploy the frontend and copy its Vercel URL.
4. Set Render's `CLIENT_URL` to that exact Vercel origin.
5. Redeploy both services after changing build-time or runtime variables.

Serve both applications over HTTPS and keep all secrets in the hosting
providers' environment settings.
