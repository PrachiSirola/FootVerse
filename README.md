# FootVerse

> **Your Universe of Footwear**
> A modern full-stack footwear e-commerce platform that brings together **live product sourcing**, **secure authentication**, **fast performance**, and **seamless online shopping**. Built using **Next.js**, **Express.js**, **MongoDB**, **Redis**, **Stripe**, and **CJ Dropshipping API**.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square\&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square\&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square\&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square\&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=flat-square\&logo=redis)
![Stripe](https://img.shields.io/badge/Stripe-Payment-635BFF?style=flat-square\&logo=stripe)

---

# 📖 Project Overview

FootVerse is a full-stack footwear e-commerce platform developed as a major academic project to demonstrate modern software engineering practices and real-world e-commerce architecture.

Unlike traditional e-commerce websites that manually manage product inventories, FootVerse integrates directly with **CJ Dropshipping** to fetch live product data. Products are synchronized, processed, cached using Redis, stored in MongoDB, and displayed through a responsive Next.js frontend.

The platform provides a complete shopping experience, including user authentication, OTP verification, product search, wishlist management, shopping cart, secure payments using Stripe, order management, coupons, and user profiles.

The project follows a modular architecture with separate frontend and backend services, making it scalable, maintainable, and ready for cloud deployment using **Vercel** and **Render**.

---

# 🎯 Project Objectives

The main objectives of FootVerse are:

* Build a modern full-stack e-commerce application.
* Integrate live products from CJ Dropshipping.
* Implement secure authentication using JWT and OTP verification.
* Improve performance using Redis caching.
* Enable secure online payments using Stripe.
* Follow scalable backend architecture and clean coding practices.
* Deploy the application using modern cloud platforms.

---

# ✨ Features

## User Authentication

* User Registration
* Secure Login
* JWT Authentication
* Email OTP Verification
* Forgot Password
* Reset Password
* Protected Routes
* Logout Functionality

---

## Product Management

* Live Product Fetching from CJ Dropshipping
* Product Categories
* Product Search
* Advanced Filtering
* Sorting Options
* Product Variants
* Size Selection
* Product Details
* Related Products

---

## Wishlist

* Add Products to Wishlist
* Remove Products
* Persistent Wishlist for Logged-in Users

---

## Shopping Cart

* Add to Cart
* Remove from Cart
* Update Product Quantity
* Automatic Price Calculation
* Coupon Support

---

## Checkout & Payments

* Secure Stripe Payment Gateway
* Shipping Information
* Order Summary
* Payment Confirmation

---

## Order Management

* Place Orders
* View Order History
* Order Details
* Order Tracking
* CJ Dropshipping Order Synchronization

---

## User Profile

* View Profile
* Edit Personal Information
* Manage Orders
* Wishlist
* Coupons
* Logout

---

## Email Services

* OTP Verification Email
* Password Reset Email
* Order Confirmation Email

---

## Performance Optimization

* Redis Product Caching
* Faster API Responses
* Reduced Database Queries
* Reduced CJ API Requests

---

# Technology Stack

## Frontend

| Technology    | Purpose           |
| ------------- | ----------------- |
| Next.js 14    | React Framework   |
| React         | User Interface    |
| Tailwind CSS  | Styling           |
| Framer Motion | Animations        |
| Axios         | API Communication |

---

## Backend

| Technology         | Purpose             |
| ------------------ | ------------------- |
| Node.js            | JavaScript Runtime  |
| Express.js         | REST API Framework  |
| JWT                | Authentication      |
| Nodemailer         | Email Service       |
| bcrypt             | Password Encryption |
| Express Middleware | API Security        |

---

## Database

| Technology | Purpose                    |
| ---------- | -------------------------- |
| MongoDB    | Primary Database           |
| Mongoose   | ODM (Object Data Modeling) |

---

## Cache

| Technology | Purpose                    |
| ---------- | -------------------------- |
| Redis      | High-Speed In-Memory Cache |

---

## Third-Party Services

| Service         | Purpose             |
| --------------- | ------------------- |
| CJ Dropshipping | Live Product Source |
| Stripe          | Payment Gateway     |
| Gmail SMTP      | Email Delivery      |

---

## Deployment

| Service                    | Purpose          |
| -------------------------- | ---------------- |
| Vercel                     | Frontend Hosting |
| Render                     | Backend Hosting  |
| MongoDB Atlas *(Optional)* | Cloud Database   |
| Redis Cloud *(Optional)*   | Cloud Cache      |

---

➡️ **Part 2** covers the complete system architecture, CJ Dropshipping workflow, Redis caching, authentication flow, payment flow, and application data flow.

# System Architecture

FootVerse follows a modular client-server architecture where the frontend, backend, database, cache, and third-party services are separated to improve scalability and maintainability.

```text
                        User
                          │
                          ▼
              Next.js Frontend (Vercel)
                          │
                    REST API Requests
                          │
                          ▼
             Express.js Backend (Render)
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    MongoDB         Redis Cache     Stripe
        │
        ▼
 CJ Dropshipping API
```

### Architecture Overview

* **Frontend:** Handles user interface, product browsing, authentication, cart, wishlist, and checkout.
* **Backend:** Processes API requests, authentication, business logic, payment handling, and communication with external services.
* **MongoDB:** Stores users, products, orders, coupons, and other application data.
* **Redis:** Caches frequently accessed product data to improve performance.
* **CJ Dropshipping:** Provides live product information and order synchronization.
* **Stripe:** Processes secure online payments.

---

# CJ Dropshipping Integration

One of the key features of FootVerse is its integration with **CJ Dropshipping**, allowing the platform to display live products instead of relying on manually entered inventory.

### Product Synchronization Flow

```text
CJ Dropshipping
      │
      ▼
Fetch Product Data
      │
      ▼
Backend Processing
      │
      ▼
Filter & Format Products
      │
      ▼
Store in Redis Cache
      │
      ▼
Store in MongoDB
      │
      ▼
Display on Frontend
```

### Features

* Live product sourcing
* Automatic product synchronization
* Variant handling
* Category mapping
* Image optimization
* Price conversion
* Product pool generation
* Reduced duplicate products

### Benefits

* No manual inventory management
* Always updated product catalog
* Faster product loading
* Better scalability
* Lower API usage through caching

---

# ⚡ Redis Caching

Redis is used to reduce unnecessary API calls and database queries by storing frequently accessed data in memory.

### Cached Data

* Product Pool
* Product Categories
* Featured Products
* Product Details
* Search Results

### Cache Flow

```text
User Request
      │
      ▼
Check Redis Cache
      │
 ┌────┴────┐
 │         │
Hit       Miss
 │         │
 ▼         ▼
Return   Fetch from MongoDB
Data         │
             ▼
      Update Redis Cache
             │
             ▼
      Return Response
```

### Advantages

* Faster API responses
* Reduced MongoDB load
* Reduced CJ API requests
* Better user experience
* Improved scalability

---

# Authentication Flow

FootVerse uses **JWT (JSON Web Token)** for secure authentication along with **OTP email verification** for user registration.

### Registration Process

```text
User Registration
        │
        ▼
Generate OTP
        │
        ▼
Send OTP via Email
        │
        ▼
User Verifies OTP
        │
        ▼
Account Created
        │
        ▼
JWT Token Generated
```

### Login Process

```text
User Login
      │
      ▼
Validate Credentials
      │
      ▼
Generate JWT
      │
      ▼
Protected Routes
```

### Security Features

* Password Encryption using bcrypt
* JWT Authentication
* OTP Email Verification
* Protected API Routes
* Secure Logout
* Password Reset

---

# Payment Flow

Stripe is integrated to provide secure and reliable online payments.

```text
Add Products to Cart
         │
         ▼
Proceed to Checkout
         │
         ▼
Enter Shipping Details
         │
         ▼
Stripe Payment Gateway
         │
 ┌───────┴────────┐
 │                │
Success         Failure
 │                │
 ▼                ▼
Create Order   Show Error
 │
 ▼
Sync with CJ
 │
 ▼
Confirmation Email
```

### Payment Features

* Secure payment processing
* Order verification
* Payment confirmation
* Order creation after successful payment

---

# Database Overview

MongoDB stores all application data in separate collections for better organization.

### Main Collections

* Users
* Products
* Categories
* Orders
* Wishlist
* Coupons
* OTP Verification
* Cart

Each collection is linked through unique identifiers, ensuring efficient querying and scalability.

---

# Application Workflow

The following diagram shows how different components interact when a user accesses the platform.

```text
User
 │
 ▼
Next.js Frontend
 │
 ▼
Express Backend
 │
 ├──────────────► Redis Cache
 │                     │
 │                     ▼
 │               Cached Response
 │
 ▼
MongoDB Database
 │
 ▼
CJ Dropshipping API
 │
 ▼
Stripe Payment Gateway
 │
 ▼
Email Service
 │
 ▼
Response Returned to User
```

---

# Performance Optimizations

To improve speed and scalability, FootVerse includes several optimization techniques:

* Redis caching for frequently accessed data.
* Optimized MongoDB queries.
* Reduced external API requests.
* Modular backend architecture.
* Reusable React components.
* Lazy loading where applicable.
* Efficient API response handling.

---

# Security Measures

FootVerse follows industry-standard security practices to protect user data.

* JWT-based authentication
* Password hashing with bcrypt
* OTP verification
* Protected backend routes
* Secure payment processing with Stripe
* Input validation
* Environment variables for sensitive credentials
* Error handling and API validation

---

➡️ **Part 3 includes the project folder structure, installation guide, environment variables, deployment on Vercel and Render, future improvements, author information, and license.**
# Project Structure

The project follows a clean and modular folder structure by separating the frontend and backend into independent applications.

```text
FootVerse/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── public/
│   ├── styles/
│   ├── utils/
│   ├── services/
│   └── package.json
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── cache/
│   ├── utils/
│   ├── scripts/
│   ├── server.js
│   └── package.json
│
├── README.md
└── .gitignore
```

### Folder Description

| Folder           | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| **frontend/**    | Next.js application containing all UI components and pages |
| **backend/**     | Express.js backend with REST APIs                          |
| **controllers/** | Business logic for API requests                            |
| **routes/**      | API endpoint definitions                                   |
| **models/**      | MongoDB database schemas                                   |
| **middleware/**  | Authentication and request middleware                      |
| **services/**    | CJ Dropshipping, Stripe, Email and other services          |
| **cache/**       | Redis caching logic                                        |
| **utils/**       | Helper functions and utilities                             |
| **config/**      | Database and application configuration                     |

---

# Getting Started

## Prerequisites

Before running the project, make sure the following software is installed:

* Node.js (v18 or above)
* npm
* MongoDB
* Redis
* Git
* VS Code (Recommended)

You will also need accounts for:

* CJ Dropshipping
* Stripe
* Gmail (App Password)
* MongoDB Atlas *(Optional)*
* Redis Cloud *(Optional)*

---

# Installation

## 1. Clone the Repository

```bash
git clone https://github.com/PrachiSirola/FootVerse.git

cd FootVerse
```

---

## 2. Install Backend Dependencies

```bash
cd backend

npm install
```

---

## 3. Install Frontend Dependencies

```bash
cd ../frontend

npm install
```

---

# Environment Variables

Create a `.env` file inside the **backend** directory and add the following variables.

```env
PORT=5000

MONGO_URI=

JWT_SECRET=

REDIS_URL=

CJ_EMAIL=
CJ_PASSWORD=
CJ_ACCESS_TOKEN=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

EMAIL_USER=
EMAIL_PASS=

CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000
```

---

# Running the Project

## Step 1: Start MongoDB

```bash
mongod
```

---

## Step 2: Start Redis

```bash
redis-server
```

---

## Step 3: Start Backend

```bash
cd backend

node src/server.js
```

Backend will run on:

```text
http://localhost:5000
```

---

## Step 4: Start Frontend

```bash
cd frontend

npm run dev
```

Frontend will run on:

```text
http://localhost:3000
```

---

# Deployment

The project is designed for independent frontend and backend deployment.

## Frontend

* Platform: **Vercel**
* Connect GitHub repository
* Configure environment variables
* Deploy

## Backend

* Platform: **Render**
* Connect GitHub repository
* Add environment variables
* Configure build command
* Deploy Express server

---


