# RentAnything-Backend 🚀

A robust, scalable backend for the RentAnything platform, built with **NestJS**, **TypeORM**, and **PostgreSQL**. Featuring real-time chat, role-based access control, and comprehensive API documentation.

---

## 🏗️ Technical Stack

- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [TypeORM](https://typeorm.io/)
- **Cache**: [Redis](https://redis.io/) (via `@nestjs/cache-manager`)
- **Real-time**: [Socket.io](https://socket.io/)
- **Documentation**: [Swagger](https://swagger.io/) (OpenAPI 3.0)
- **Security**: [Passport.js](https://www.passportjs.org/) (JWT Strategy)
- **Validation**: `class-validator` & `class-transformer`

---

## ✨ Core Features

- **🔐 Authentication**:
  - Secure phone-based OTP login.
  - JWT Access & Refresh Token rotation.
  - Role-Based Access Control (RBAC) Supporting `INDIVIDUAL`, `COMPANY`, and `ADMIN`.
- **🏪 Marketplace**:
  - Item management (Create, Update, Delete).
  - Multi-level Categories & Sub-Categories.
  - Address and location management.
- **📅 Rentals & Pricing**:
  - Dynamic pricing (Daily, Weekly, Monthly rates).
  - Availability scheduling for items.
  - Rental request and history tracking.
- **💬 Real-time Communication**:
  - Thread-based chat system between buyers and sellers.
  - Real-time updates via Socket.io.
- **🚨 Incident Management**:
  - Incident reporting for rental disputes with media support.
- **🛠️ Common Infrastructure**:
  - Global Global Exception Filter for standardized error responses.
  - Global Transform Interceptor for standardized `{ "data": ... }` response wrapping.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ 
- **PostgreSQL**: Local or cloud instance.
- **Redis**: For caching and real-time features.

### 1. Installation

```bash
$ npm install
```

### 2. Configuration

Create a `.env` file in the root directory based on your local setup:

```env
PORT=3008
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASS=your_pass
DB_NAME=rent_anything
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Running the App

```bash
# Development (watch mode)
$ npm run dev

# Production mode
$ npm run build
$ npm run start:prod
```

---

## 📖 API Documentation

The project includes built-in interactive documentation via Swagger.

- **URL**: [http://localhost:3008/docs](http://localhost:3008/docs)
- **API Prefix**: All functional endpoints are prefixed with `/api` (e.g., `/api/auth/login`).

---

## 📂 Project Structure

```text
src/
├── common/        # Shared decorators, guards, filters, interceptors, and enums
├── config/        # Environment configurations (DB, JWT, Redis, Swagger)
├── auth/          # Authentication logic & OTP verification
├── user/          # User profiles & entity definitions
├── item/          # Item inventory & management
├── category/      # Multi-level category system
├── rental/        # Rental process & history
├── chat/          # Real-time messaging system
├── pricing/       # Dynamic rate management
└── main.ts        # Application entry point & global setup
```

---

## 🧪 Testing

```bash
# Unit tests
$ npm run test

# End-to-end tests
$ npm run test:e2e
```

---

## 📄 License

This project is [UNLICENSED](LICENSE).
