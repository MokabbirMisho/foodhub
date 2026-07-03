# FoodHub

A production-deployed, multi-vendor food ordering and delivery platform built
with the MERN stack. FoodHub provides dedicated workflows for customers,
restaurant owners, riders, and administrators.

[Live Demo](https://foodhub-phi-wine.vercel.app) |
[Backend API](https://foodhub-zurl.onrender.com) |
[API Health](https://foodhub-zurl.onrender.com/api/health)

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, React Router, Axios
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Authentication:** JWT, bcryptjs, Google Identity
- **Media:** Cloudinary, Multer
- **Deployment:** Vercel, Render, MongoDB Atlas

## Project Highlights

- Role-based authentication and authorization across four account types
- Complete multi-vendor restaurant approval and management flow
- Persistent guest cart with authenticated customer checkout
- Secure backend-side order price and total calculation
- Restaurant preparation and rider delivery workflows
- Cloudinary restaurant, cover, and food image uploads
- Delivered-order restaurant reviews with aggregated ratings
- Production security middleware, rate limiting, CORS, and environment config

## Features By Role

### Customer

- Browse approved restaurants and available menus
- Manage a persistent cart and place orders
- Follow order status, cancel pending orders, and review delivered orders

### Restaurant Owner

- Create and maintain a restaurant profile
- Upload images and manage food availability
- View incoming orders and update preparation status

### Rider

- Browse ready, unassigned deliveries
- Accept deliveries and mark assigned orders as delivered

### Admin

- Review, approve, or reject restaurant applications
- Search and filter platform-wide orders
- Access platform review data through the admin API

## Screenshots

> Add the final production screenshots to `docs/screenshots/` using the filenames
> below.

| Home and authentication | Restaurant discovery |
| --- | --- |
| ![FoodHub home](docs/screenshots/home.png) | ![Restaurant listing](docs/screenshots/restaurants.png) |

| Cart and checkout | Restaurant dashboard |
| --- | --- |
| ![Cart and checkout](docs/screenshots/cart-checkout.png) | ![Restaurant dashboard](docs/screenshots/restaurant-dashboard.png) |

| Rider dashboard | Admin dashboard |
| --- | --- |
| ![Rider dashboard](docs/screenshots/rider-dashboard.png) | ![Admin dashboard](docs/screenshots/admin-dashboard.png) |

## Demo Credentials

These credentials are for demo and testing only.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@foodhub.com` | `Admin123` |
| Restaurant Owner | `owner1@example.com` | `Owner123` |
| Customer | `customer10@example.com` | `Customer123` |
| Rider | `rider1@example.com` | `Rider123` |

## Local Setup

Clone the repository and create local environment files from the supplied
examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Start the backend:

```bash
cd server
npm install
npm run dev
```

Start the frontend in a second terminal:

```bash
cd client
npm install
npm run dev
```

The frontend defaults to `http://localhost:5173` and the API to
`http://localhost:5001`.

## Environment Variables

Backend (`server/.env`):

```env
PORT=5001
NODE_ENV=development
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Frontend (`client/.env`):

```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

Real credentials and secrets must never be committed.

## API Overview

| Resource | Base path | Purpose |
| --- | --- | --- |
| Auth | `/api/auth` | Local and Google authentication |
| Restaurants | `/api/restaurants` | Profiles, discovery, and approval |
| Foods | `/api/foods` | Menu management and public menus |
| Orders | `/api/orders` | Customer, owner, rider, and admin workflows |
| Uploads | `/api/uploads` | Cloudinary image uploads |
| Reviews | `/api/reviews` | Customer reviews and public ratings |

## Deployment

- **Frontend:** Vercel
- **Backend API:** Render
- **Database:** MongoDB Atlas
- **Image hosting:** Cloudinary

The frontend uses `VITE_API_URL` for the deployed API. Render uses `CLIENT_URL`
for the allowed Vercel origin. The included `client/vercel.json` handles SPA
route refreshes, while `render.yaml` documents the backend service setup.

For the deployed real-time notification connection, configure:

```env
# Render
NODE_ENV=production
CLIENT_URL=https://foodhub-phi-wine.vercel.app
MONGO_URI=
JWT_SECRET=
GOOGLE_CLIENT_ID=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Vercel
VITE_API_URL=https://foodhub-zurl.onrender.com/api
VITE_SOCKET_URL=https://foodhub-zurl.onrender.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Socket.io uses the existing FoodHub JWT for authentication. REST APIs remain
the source of truth if the socket connection is unavailable.

### Security Notes

- Never commit `.env` files or production credentials.
- Local storage is used for JWT persistence in this demo; production systems
  should consider secure, HTTP-only cookies.
- Socket.io connections are authenticated with the FoodHub JWT and scoped to
  user and role rooms.
- Backend routes use role and ownership checks for customer, owner, rider, and
  admin operations.
- Demo online payment is simulated. It does not process or store card details.
- Uploads accept JPEG, PNG, and WebP images up to 3 MB.

## Future Improvements

- Stripe payment integration
- Live rider location tracking
- Transactional email notifications
- Admin analytics and reporting
- Restaurant availability schedules
- Location-aware search optimization
