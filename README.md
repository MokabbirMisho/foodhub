# FoodHub — Full-Stack Food Delivery Platform

FoodHub is a full-stack food delivery web application with customer ordering,
restaurant management, rider delivery, admin control, real-time notifications,
map tracking, analytics, and role-based access.

## Live Demo

- **Frontend:** [foodhub-phi-wine.vercel.app](https://foodhub-phi-wine.vercel.app)
- **Backend API:** [foodhub-zurl.onrender.com](https://foodhub-zurl.onrender.com)
- **Health check:** [foodhub-zurl.onrender.com/api/health](https://foodhub-zurl.onrender.com/api/health)

> The Render free-tier service may need a short moment to wake up on the first
> request.

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@foodhub.com` | `Admin123` |
| Restaurant Owner | `owner1@example.com` | `Owner123` |
| Customer | `customer10@example.com` | `Customer123` |
| Rider | `rider1@example.com` | `Rider123` |

These accounts are for demonstration and testing only. If the demo customer
password was changed during testing, create or reset a demo customer and update
this README accordingly.

**Demo online payment**

```text
Card number: 4242 4242 4242 4242
Expiry:     12/34
CVC:        123
```

This is a frontend demo payment flow only. No real payment is processed and no
card details are sent to or stored by the backend.

## Product Highlights

- Four distinct workflows: customer, restaurant owner, rider, and admin
- Local email/password authentication plus Google customer authentication
- Role-based authorization and resource ownership checks
- Restaurant approval, profiles, images, menus, schedules, and availability
- Advanced restaurant and food search, filtering, sorting, and pagination
- Persistent guest cart with authenticated customer checkout
- Backend-calculated prices, delivery fees, and order totals
- Cash on delivery and clearly labeled simulated online payment
- Full order lifecycle from placement through preparation and delivery
- Rider acceptance, location updates, and OpenStreetMap/Leaflet tracking
- Real-time Socket.io order and delivery notifications
- Customer profiles, saved addresses, geocoding, and password changes
- Delivered-order reviews with aggregate restaurant ratings
- Restaurant owner performance overview and platform-wide admin overview
- Cloudinary image uploads with protected, validated upload endpoints
- Production CORS, Helmet headers, rate limiting, and environment validation

## Features by Role

### Customer

- Discover approved restaurants and available food items
- Search by restaurant, cuisine, dish, category, and tags
- Filter by availability, rating, delivery fee, and delivery time
- Maintain a guest cart and sign in only when placing an order
- Use saved addresses, current-location lookup, or manual delivery details
- Place COD or simulated online-payment orders
- Cancel pending orders and follow status updates in real time
- Track rider and delivery locations on an OpenStreetMap
- Review delivered orders and manage account security

### Restaurant Owner

- Create and update one restaurant profile
- Upload a logo, cover image, and food images
- Manage menu items, prices, tags, and availability
- Configure weekly opening hours and temporary closures
- Receive new-order notifications and update preparation status
- View revenue, orders, status, payment, and top-item performance

### Rider

- View ready and unassigned deliveries
- Atomically accept a delivery so it cannot be claimed twice
- View customer, address, order, and payment details
- Update rider location and mark assigned deliveries as delivered
- Receive real-time delivery availability notifications

### Admin

- View platform revenue, users, restaurants, and order performance
- Approve or reject restaurant applications
- Search and inspect platform orders
- Search, filter, block, and unblock users
- Review recent platform activity from a responsive admin sidebar

## Screenshots

Add final production screenshots using the filenames below.

### Landing Page

![Landing Page](./screenshots/landing-page.png)

### Customer Dashboard

![Customer Dashboard](./screenshots/customer-dashboard.png)

### Restaurant Listing

![Restaurant Listing](./screenshots/restaurant-listing.png)

### Restaurant Detail & Menu

![Restaurant Detail and Menu](./screenshots/restaurant-detail-menu.png)

### Cart & Checkout

![Cart and Checkout](./screenshots/cart-checkout.png)

### Customer Orders & Tracking

![Customer Orders and Tracking](./screenshots/customer-orders-tracking.png)

### Restaurant Owner Dashboard

![Restaurant Owner Dashboard](./screenshots/restaurant-owner-dashboard.png)

### Rider Dashboard

![Rider Dashboard](./screenshots/rider-dashboard.png)

### Admin Dashboard

![Admin Dashboard](./screenshots/admin-dashboard.png)

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcryptjs, Google Identity Services |
| Real time | Socket.io |
| Maps | OpenStreetMap, Leaflet, React Leaflet, Nominatim |
| Images | Cloudinary, Multer |
| Security | Helmet, CORS allowlist, Express rate limiting |
| Deployment | Vercel, Render |

## Architecture

```text
foodhub/
├── client/                 React + Vite frontend
│   └── src/
│       ├── components/     Shared and role-specific UI
│       ├── context/        Auth, cart, and notification providers
│       ├── pages/          Public and role-based screens
│       ├── routes/         Route guards and application routes
│       └── services/       REST, upload, map, and Socket.io clients
├── server/                 Express API and Socket.io server
│   └── src/
│       ├── config/         Database, Cloudinary, CORS, and environment config
│       ├── controllers/    Application and analytics logic
│       ├── middleware/     Authentication, roles, uploads, and rate limits
│       ├── models/         Mongoose schemas
│       ├── routes/         Public and protected API routes
│       ├── socket/         Authenticated room and event handling
│       └── utils/          Tokens and availability helpers
└── screenshots/            Portfolio screenshot placeholders
```

## Local Setup

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB Atlas or a compatible MongoDB connection
- Cloudinary account for image uploads
- Google OAuth client ID for Google authentication

### 1. Configure the backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### 2. Configure the frontend

In a second terminal:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The frontend runs at `http://localhost:5173`; the API defaults to
`http://localhost:5001/api`.

## Environment Variables

Never commit real environment files or secret values.

### Backend (`server/.env`)

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

### Frontend (`client/.env`)

```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## API Overview

| Resource | Base path | Purpose |
| --- | --- | --- |
| Health | `/api/health` | Deployment health check |
| Auth | `/api/auth` | Local and Google authentication |
| Customer | `/api/customer` | Profile, addresses, and password management |
| Restaurants | `/api/restaurants` | Discovery, ownership, approval, and analytics |
| Foods | `/api/foods` | Menu management and public food search |
| Orders | `/api/orders` | Customer, owner, rider, and admin order workflows |
| Uploads | `/api/uploads` | Protected Cloudinary image uploads |
| Reviews | `/api/reviews` | Customer reviews and restaurant ratings |
| Geocoding | `/api/geocode` | OpenStreetMap address and coordinate lookup |
| Admin | `/api/admin` | User management and platform overview |

## Security & Reliability

- JWT-protected API and Socket.io authentication
- Customer, owner, rider, and admin role guards
- Ownership checks for restaurants, menus, orders, reviews, and addresses
- Password hashing with bcryptjs and passwords excluded from responses
- Blocked-account checks on REST and Socket.io authentication
- Backend-derived food prices and order totals
- Atomic rider delivery assignment
- Production environment validation and strict CORS origins
- General and authentication-specific rate limits
- Helmet security headers and one-megabyte JSON body limits
- Image MIME validation and a three-megabyte upload limit

The demo currently persists JWTs in `localStorage`. A higher-security production
version should use secure, HTTP-only cookies.

## Deployment

### Backend — Render

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Set `NODE_ENV=production`
- Configure MongoDB, JWT, frontend origin, Google, and Cloudinary variables

### Frontend — Vercel

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Set:

```env
VITE_API_URL=https://foodhub-zurl.onrender.com/api
VITE_SOCKET_URL=https://foodhub-zurl.onrender.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

`client/vercel.json` provides SPA rewrites for direct route refreshes.

## Verification

```bash
cd client
npm run build
```

The project has also been smoke-tested across public search, role-based login,
protected API boundaries, analytics endpoints, CORS, and authenticated
Socket.io connections.

## Future Improvements

- Real Stripe or another production payment provider
- Live continuous rider GPS updates
- Transactional email and push notifications
- Restaurant-specific promotions and coupon management
- Expanded automated unit, integration, and end-to-end test coverage
- Search ranking and location optimization at larger scale
