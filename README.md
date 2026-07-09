# FootVerse

> **Your Universe of Footwear**
> A modern full-stack footwear e-commerce platform that brings together **live product sourcing**, **secure authentication**, **fast performance**, and **seamless online shopping**. Built using **Next.js**, **Express.js**, **MongoDB**, **Redis**, **Stripe**, and the **CJ Dropshipping API**.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=flat-square&logo=redis)
![Stripe](https://img.shields.io/badge/Stripe-Payment-635BFF?style=flat-square&logo=stripe)

---

## Project Overview

FootVerse is a full-stack footwear e-commerce platform that demonstrates modern software engineering practices and real-world e-commerce architecture.

Unlike traditional stores that manually manage inventory, FootVerse integrates directly with **CJ Dropshipping** to source live product data. Products are fetched, transformed into a consistent format, stored in **MongoDB** (the source of truth), cached in **Redis**, and displayed through a responsive **Next.js** frontend.

The platform provides a complete shopping experience: user authentication with OTP verification, product search and filtering, wishlist, shopping cart, secure Stripe payments, Cash-on-Delivery, full order management, order cancellation and returns, and an admin dashboard.

The project follows a modular architecture with separate frontend and backend services, making it scalable, maintainable, and cloud-ready on **Vercel** and **Render**.

---

## Project Objectives

- Build a modern full-stack e-commerce application.
- Source live products from CJ Dropshipping with MongoDB as the source of truth.
- Implement secure authentication using JWT and email OTP verification.
- Improve performance using Redis caching.
- Enable secure online payments using Stripe, plus Cash on Delivery.
- Provide complete order management, including cancellation, returns, and refunds.
- Follow scalable backend architecture and clean coding practices.
- Deploy using modern cloud platforms.

---

## Features

### User Authentication
- User registration with email OTP verification
- Secure login (JWT)
- Forgot password / reset password
- Protected routes
- Logout

### Product Management
- Live product sourcing from CJ Dropshipping
- MongoDB-backed catalog (source of truth) with hourly sync
- Product categories, search, filtering, and sorting
- Product variants and size selection
- Product details and related products
- Automatic soft-delete of products CJ no longer offers

### Wishlist
- Add/remove products
- Persistent wishlist for logged-in users

### Shopping Cart
- Add/remove items and update quantity
- Automatic price calculation
- Guest cart that merges on login

### Checkout & Payments
- Secure Stripe card payments
- Cash on Delivery (COD)
- Shipping information and order summary
- Payment confirmation via redirect and webhook

### Order Management
- Place orders (Stripe or COD)
- Order history and order details
- Order status lifecycle (Confirmed → Processing → Packed → Shipped → Delivered)
- CJ Dropshipping order synchronization
- Order cancellation with reasons and refunds
- Return requests with admin approval
- Cancelled-order archive collection

### Admin
- View and manage returns and cancellations
- Approve/reject returns, mark refunds complete
- Advance order fulfillment status
- Reconcile MongoDB ↔ CJ order consistency
- Manual product sync

### Email Services
- OTP verification email
- Password reset email

### Performance Optimization
- Redis caching of product responses
- Faster API responses and fewer CJ API calls
- MongoDB as primary source, reducing repeated external requests

---

## Tech Stack

### Frontend

| Technology | Why It Was Used |
| --- | --- |
| **Next.js (App Router)** | Server-side rendering, file-based routing, and strong performance for a modern storefront. |
| **React.js** | Reusable UI components and efficient interface management. |
| **JavaScript (ES6+)** | Application logic across frontend and backend. |
| **Tailwind CSS** | Responsive, clean, utility-first styling. |
| **Framer Motion** | Hero animations, page transitions, hover effects, and interactive UI. |
| **Context API** | Global state for auth, cart, and wishlist without prop drilling. |

### Backend

| Technology | Why It Was Used |
| --- | --- |
| **Node.js** | JavaScript runtime for the backend server. |
| **Express.js** | RESTful APIs, routing, middleware, and business logic. |
| **MongoDB** | Stores users, products, carts, orders, wishlists, and more. |
| **Mongoose** | Schemas, models, and validation for MongoDB. |
| **Redis** | Caches product responses to cut latency and CJ API calls. |
| **JWT** | Secure authentication and protected routes. |
| **bcryptjs** | Password hashing before storage. |
| **Nodemailer** | OTP and password-reset emails. |
| **Stripe** | Secure online card payments. |
| **dotenv** | Manages environment variables. |
| **Express Rate Limit** | Protects auth/OTP endpoints from abuse. |
| **CORS** | Secure frontend↔backend communication across origins. |

### Third-Party Integrations

| Service | Why It Was Used |
| --- | --- |
| **CJ Dropshipping API** | Live product data, variants, freight calculation, and order processing. |
| **Stripe API** | Secure payment processing and confirmation. |
| **SMTP Email (Gmail)** | Delivers OTP and password-reset emails via Nodemailer. |

### Development Tools

| Tool | Why It Was Used |
| --- | --- |
| **Git / GitHub** | Version control and repository hosting. |
| **VS Code** | Primary editor. |
| **Postman** | API testing. |
| **npm** | Dependency management and scripts. |

---

## System Architecture

FootVerse follows a modular client-server architecture where the frontend, backend, database, cache, and third-party services are separated for scalability and maintainability.

```mermaid
flowchart TD
    U([User])
    FE[Next.js Frontend<br/>Vercel]
    BE[Express Backend<br/>Render]
    DB[(MongoDB Atlas<br/>source of truth)]
    R[(Redis<br/>Upstash cache)]
    CJ[[CJ Dropshipping API]]
    ST[[Stripe]]
    ML[[Email / Gmail]]

    U --> FE
    FE -->|REST /api| BE
    BE --> DB
    BE --> R
    BE --> CJ
    BE --> ST
    BE --> ML
    ST -->|redirect + webhook| FE
```

- **Frontend:** UI, product browsing, authentication, cart, wishlist, checkout.
- **Backend:** API requests, authentication, business logic, payments, external services.
- **MongoDB:** Source of truth for users, products, orders, and more.
- **Redis:** Caches frequently accessed product data.
- **CJ Dropshipping:** Live product data and order synchronization.
- **Stripe:** Secure online payments.

---

## Product Data Flow (MongoDB → Redis → CJ)

**MongoDB is the primary source of truth.** Redis caches responses; CJ is the fallback and the hourly refresh source.

```mermaid
flowchart TD
    A([User requests products]) --> B{MongoDB<br/>has products?}
    B -->|Found| C[Return from MongoDB]
    B -->|Not found| D{Redis<br/>has pool?}
    D -->|Hit| E[Save to MongoDB] --> F[Return response]
    D -->|Miss| G[Call CJ API]
    G --> H[Receive raw CJ data]
    H --> I[Transform to FootVerse format]
    I --> J[Save to MongoDB]
    J --> K[Update Redis cache]
    K --> L[Return response]
```

### Hourly Product Sync

```mermaid
flowchart TD
    T([Scheduler: hourly + on startup]) --> P[Build CJ pool]
    P --> U[Upsert products into MongoDB<br/>price, stock, images]
    U --> S[Soft-delete products CJ no longer returns]
    S --> C[Invalidate Redis cache]
    C --> D([Storefront serves fresh data])
```

**Benefits:** no manual inventory, always-updated catalog, faster loading, lower CJ API usage, and resilience — if Redis or CJ is unavailable, the store still serves from MongoDB.

---

## Authentication Flow

FootVerse uses **JWT** for authentication with **email OTP verification** at registration. A `PendingUser` holds the data and hashed OTP until verified, then a real `User` is created.

```mermaid
flowchart TD
    A([User submits registration]) --> B[Create PendingUser<br/>hashed OTP + expiry]
    B --> C[Email OTP to user]
    C --> D([User enters OTP])
    D --> E{OTP valid & not expired?}
    E -->|No| F[Reject / allow resend]
    E -->|Yes| G[Create User, delete PendingUser]
    G --> H[Issue JWT token]
    H --> I([Logged in])
```

### Login

```mermaid
flowchart LR
    A([User login]) --> B{Credentials valid?}
    B -->|Yes| C[Generate JWT] --> D[Access protected routes]
    B -->|No| E[Reject]
```

**Security features:** bcrypt password hashing, JWT authentication, OTP email verification, protected API routes, rate-limited auth endpoints, and password reset.

---

## Order & Payment Flow

Two payment paths. **COD** finalizes immediately; **Stripe** finalizes after payment is confirmed via redirect *and* webhook (idempotent).

```mermaid
flowchart TD
    A([User checks out]) --> B{Payment method?}

    B -->|COD| C[Create Order in MongoDB<br/>status: Confirmed]
    C --> D[Clear cart] --> E[CJ sync in background] --> F([Order in history])

    B -->|Card / Stripe| G[Create pending Order]
    G --> H[Create Stripe Checkout Session]
    H --> I([User pays on Stripe])
    I --> J{Payment confirmed}
    J -->|Success redirect| K[Verify session → mark paid]
    J -->|Stripe webhook| L[Webhook → mark paid]
    K --> M[Order finalized]
    L --> M
    M --> E
```

---

## CJ Order Synchronization

After an order is saved in MongoDB, it syncs to CJ so the supplier fulfills it. Freight is calculated dynamically for the destination; legacy pre-CJ orders are skipped.

```mermaid
flowchart TD
    A([Order saved in MongoDB]) --> B{Legacy pre-CJ order?}
    B -->|Yes| C[Skip CJ]
    B -->|No| D[Resolve variant]
    D --> E[Freight-calculate → cheapest logistics]
    E --> F[Create order at CJ]
    F --> G{Success?}
    G -->|Yes| H[Save cjOrderId, status: Synced]
    G -->|Rate limited| I[Retry with backoff] --> F
    G -->|Fail| J[status: CJ Sync Failed<br/>Mongo order still valid]
    J -.admin reconcile.-> K[Find & re-sync mongo-only orders]
```

The order **always** saves in MongoDB first; CJ is secondary and self-healing via the admin reconcile tools.

---

## Order Cancellation & Return

```mermaid
flowchart TD
    A([Order detail]) --> B{Status?}
    B -->|Pending / Confirmed / Processing / Packed| C[Cancel Order]
    B -->|Delivered| D[Return Order]
    B -->|Shipped| E[No action]

    C --> F[Pick reason] --> G[Update order → Cancelled]
    G --> H[Archive copy → cancelledorders]
    G --> I{Online payment?}
    I -->|Yes| J[Refund: 5–7 days]

    D --> K[Reason + comments]
    K --> L{Payment method?}
    L -->|COD| M[Collect UPI / bank details]
    L -->|Card| N[Refund to original method]
    M --> O[Return: Requested]
    N --> O
    O --> P([Admin approves / rejects])
    P --> Q[Approved → Returned + refund Processing]
```

---

## Database Overview

MongoDB stores all application data in separate collections.

| Collection | Purpose |
| --- | --- |
| `users` | Registered users, addresses, admin flag |
| `pendingusers` | Registration data + OTP until verified |
| `products` | CJ product snapshots (source of truth) + lifecycle fields |
| `categories` | Category metadata |
| `carts` | Per-user shopping carts |
| `wishlists` | Per-user wishlists |
| `orders` | All orders, timeline, CJ sync, cancel/return/refund |
| `cancelledorders` | Full archived copy of each cancelled order |
| `transactions` | Payment transaction records |

---

## Application Workflow

```mermaid
flowchart TD
    U([User]) --> FE[Next.js Frontend]
    FE --> BE[Express Backend]
    BE --> R[(Redis Cache)]
    BE --> DB[(MongoDB)]
    BE --> CJ[[CJ Dropshipping API]]
    BE --> ST[[Stripe]]
    BE --> ML[[Email Service]]
    BE --> RES([Response to User])
```

---

## Performance Optimizations

- Redis caching for frequently accessed product data.
- MongoDB as primary source, reducing repeated CJ calls.
- Cache invalidation on every product sync (no stale listings).
- Modular backend architecture and reusable React components.
- Efficient API response handling.

---

## Security Measures

- JWT-based authentication
- Password hashing with bcrypt
- OTP email verification
- Protected backend routes and rate-limited auth endpoints
- Secure payment processing with Stripe
- Input validation and error handling
- Environment variables for sensitive credentials
- Idempotent payment finalization (safe redirect + webhook)

---

## Folder Structure

```text
FootVerse/
│
├── footverse-frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── data/
│   ├── public/
│   └── package.json
│
├── footverse-backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── transformers/
│   │   ├── utils/
│   │   └── server.js
│   └── package.json
│
├── README.md
└── .gitignore
```

| Folder | Description |
| --- | --- |
| **footverse-frontend/** | Next.js application with all UI components and pages |
| **footverse-backend/** | Express.js backend with REST APIs |
| **controllers/** | Business logic for API requests |
| **routes/** | API endpoint definitions |
| **models/** | MongoDB schemas |
| **middleware/** | Authentication, CORS, and rate-limiting |
| **services/** | CJ, Stripe, product, order, sync, and email logic |
| **transformers/** | Convert raw CJ data into FootVerse format |
| **utils/** | Helpers, including Redis cache utilities |
| **config/** | Database and Redis configuration |

---

## Getting Started

### Prerequisites

- Node.js (v18 or above)
- npm
- MongoDB
- Redis
- Git

You will also need accounts for:

- CJ Dropshipping
- Stripe
- Gmail (App Password for email)
- MongoDB Atlas *(for cloud deployment)*
- Redis / Upstash *(for cloud deployment)*

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/PrachiSirola/FootVerse.git
cd FootVerse
```

### 2. Install Backend Dependencies

```bash
cd footverse-backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../footverse-frontend
npm install
```

---

## Environment Variables

### Backend

Create a `.env` file inside **footverse-backend/** with the following keys (leave values blank here; fill them in locally — never commit real secrets):

```env
PORT=5000

MONGO_URI=
REDIS_URL=
JWT_SECRET=

CJ_API_KEY=
CJ_API_BASE=
CJ_POOL_PER_KEYWORD=20
PRODUCT_SYNC_MS=3600000

STRIPE_SECRET_KEY=

MAIL_USER=
MAIL_PASS=
MAIL_FROM=

CLIENT_URL=http://localhost:3000
CLIENT_ORIGIN=http://localhost:3000
```

### Frontend

Create a `.env.local` file inside **footverse-frontend/**:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> **Note:** `NEXT_PUBLIC_API_URL` is the backend **root** URL — the app appends `/api` automatically. Do not include `/api` or a trailing slash. Keep all `.env` files out of Git.

---

## Running the Project

### 1. Start MongoDB

```bash
mongod
```

### 2. Start Redis

```bash
redis-server
```

### 3. Start Backend

```bash
cd footverse-backend
node src/server.js
```

Backend runs on `http://localhost:5000`. On first start it seeds MongoDB from CJ and then syncs hourly.

### 4. Start Frontend

```bash
cd footverse-frontend
npm run dev
```

Frontend runs on `http://localhost:3000`.

---

## Deployment

The frontend and backend deploy independently.

```mermaid
flowchart TD
    REPO[GitHub repo<br/>footverse-frontend + footverse-backend]
    REPO -->|push main| V[Vercel<br/>frontend]
    REPO -->|push main| RN[Render<br/>backend]
    V --> DOM[Production domain<br/>*.vercel.app]
    RN --> API[Backend<br/>*.onrender.com]
    DOM -->|NEXT_PUBLIC_API_URL| API
    API -->|CLIENT_ORIGIN / CLIENT_URL| DOM
    API --> ATLAS[(MongoDB Atlas)]
    API --> UPSTASH[(Upstash Redis)]
    API --> CJ2[[CJ Dropshipping]]
    API --> STRIPE2[[Stripe]]
```

### Frontend (Vercel)
- Connect the GitHub repository (root directory: `footverse-frontend`).
- Set `NEXT_PUBLIC_API_URL` to the backend root URL.
- Deploy.

### Backend (Render)
- Connect the GitHub repository (root directory: `footverse-backend`).
- Build command: `npm install` · Start command: `node src/server.js`.
- Add all backend environment variables.
- Set `CLIENT_ORIGIN` and `CLIENT_URL` to the frontend URL (for CORS and email links).
- Deploy.

### Connection rules
- **Frontend → Backend:** `NEXT_PUBLIC_API_URL` = backend root URL (no `/api`).
- **Backend → Frontend (CORS):** `CLIENT_ORIGIN` allows the frontend domain.

---

## Design Principles

- **MongoDB is the source of truth** — Redis and CJ are supporting layers.
- **Writes are never blocked by external services** — orders save first; CJ/Stripe are secondary and self-heal.
- **Idempotency** — payment finalization and syncs can safely run more than once.
- **Graceful degradation** — the storefront serves from MongoDB even if Redis or CJ is down.
- **Soft deletes** — removed CJ products are hidden, not destroyed, preserving order history.

---

## License

This project is developed for educational and portfolio purposes.
