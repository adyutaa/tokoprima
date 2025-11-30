# TokoPrima - AI-Powered E-Commerce Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-336791?style=for-the-badge&logo=postgresql)
![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-000000?style=for-the-badge)

**A modern, full-stack e-commerce platform featuring AI-powered semantic search, real-time inventory management, and seamless payment integration.**

[Features](#features) • [Tech Stack](#tech-stack) • [Architecture](#architecture) • [Getting Started](#getting-started) • [API Reference](#api-reference)

</div>

---

## Overview

**TokoPrima** is a production-ready e-commerce platform built with cutting-edge technologies. It combines the power of Next.js App Router for seamless SSR/SSG, vector embeddings for intelligent product search, and Xendit payment gateway for Indonesian market support.

### Key Highlights

- **Semantic Search** - Find products using natural language powered by OpenAI, VoyageAI, or Google Gemini embeddings
- **Vector Database** - Pinecone integration for lightning-fast similarity search
- **Modern Authentication** - Lucia-based session management with role-based access control
- **Payment Integration** - Xendit gateway supporting ShopeePay and other Indonesian payment methods
- **Admin Dashboard** - Complete back-office management for products, orders, and customers

---

## Features

### Customer Experience

| Feature               | Description                                                |
| --------------------- | ---------------------------------------------------------- |
| **AI-Powered Search** | Natural language product discovery using vector embeddings |
| **Smart Catalog**     | Filter by price range, stock availability, and categories  |
| **Shopping Cart**     | Persistent cart with real-time updates (Zustand)           |
| **Secure Checkout**   | Multi-step checkout with address validation                |
| **Order Tracking**    | Real-time order status updates via webhooks                |
| **User Reviews**      | Product rating and review system                           |

### Admin Dashboard

| Feature                 | Description                                    |
| ----------------------- | ---------------------------------------------- |
| **Product Management**  | Full CRUD with image uploads to Supabase       |
| **Category Management** | Organize products with flexible categorization |
| **Order Management**    | Track and manage all customer orders           |
| **Customer Management** | View and manage registered users               |
| **Vector Sync**         | Auto-generate embeddings for new products      |

### Technical Features

| Feature                       | Description                                |
| ----------------------------- | ------------------------------------------ |
| **Multiple Embedding Models** | Support for OpenAI, VoyageAI, and Gemini   |
| **Fallback Search**           | Text-based search when vector search fails |
| **Comprehensive Logging**     | Performance metrics and search analytics   |
| **Type Safety**               | End-to-end TypeScript with Zod validation  |

---

## Tech Stack

### Frontend

```
Next.js 14.2       → React meta-framework with App Router
React 18           → UI library with Server Components
TypeScript 5.7     → Type-safe development
Tailwind CSS 3.4   → Utility-first styling
shadcn/ui          → High-quality component library
Zustand            → Lightweight state management
TanStack Table     → Advanced data tables
```

### Backend

```
Next.js API Routes → Serverless API endpoints
Prisma 5.14        → Type-safe ORM
PostgreSQL         → Primary database
Lucia 3.2          → Session-based authentication
Zod                → Schema validation
```

### AI/ML & Vector Search

```
Pinecone           → Vector database
OpenAI             → text-embedding-3-large (3072 dimensions)
VoyageAI           → voyage-3-large embeddings
Google Gemini      → Alternative embedding model
```

### Infrastructure

```
Supabase           → File storage & PostgreSQL hosting
Xendit             → Payment gateway (ShopeePay)
Vercel             → Deployment platform
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Customer Frontend          │          Admin Dashboard           │
│  ├── Homepage               │          ├── Products CRUD         │
│  ├── Catalog & Filters      │          ├── Categories            │
│  ├── Product Details        │          ├── Orders                │
│  ├── Shopping Cart          │          └── Customers             │
│  └── Checkout Flow          │                                    │
└─────────────────────────────┴────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  /api/products    → Product listing                              │
│  /api/search      → Semantic search with vector embeddings       │
│  /api/reviews     → Product reviews (authenticated)              │
│  /api/order/status→ Xendit payment webhook                       │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐
│  PostgreSQL  │  │   Pinecone   │  │         External APIs         │
│   (Prisma)   │  │  Vector DB   │  │  ├── OpenAI Embeddings        │
│              │  │              │  │  ├── VoyageAI Embeddings      │
│  • Users     │  │  • Products  │  │  ├── Supabase Storage         │
│  • Products  │  │    Vectors   │  │  └── Xendit Payments          │
│  • Orders    │  │              │  │                                │
└──────────────┘  └──────────────┘  └──────────────────────────────┘
```

### Search Flow

```
User Query → Embedding Generation → Pinecone Vector Search → PostgreSQL Fetch → Ranked Results
     │              │                       │                      │              │
     │         OpenAI/Voyage            Similarity              Product         Sort by
     │         API Call                 Matching                Details         Score
     │                                                                            │
     └─────────────────────── Fallback: Text-based search ──────────────────────┘
```

---

## Project Structure

```
tokoprima/
├── src/
│   ├── app/
│   │   ├── (admin)/dashboard/      # Admin panel routes
│   │   │   ├── (auth)/sign-in/     # Admin authentication
│   │   │   └── (index)/
│   │   │       ├── categories/     # Category management
│   │   │       ├── customers/      # Customer list
│   │   │       ├── orders/         # Order management
│   │   │       └── products/       # Product CRUD
│   │   │
│   │   ├── (customer)/             # Customer-facing routes
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in/        # Customer login
│   │   │   │   └── sign-up/        # Registration
│   │   │   └── (index)/
│   │   │       ├── page.tsx        # Homepage
│   │   │       ├── carts/          # Shopping cart
│   │   │       ├── catalogs/       # Product catalog
│   │   │       └── detail-product/ # Product details
│   │   │
│   │   └── api/                    # API endpoints
│   │       ├── products/           # Product listing
│   │       ├── search/             # Semantic search
│   │       ├── reviews/            # Product reviews
│   │       └── order/status/       # Payment webhook
│   │
│   ├── lib/                        # Core utilities
│   │   ├── auth.ts                 # Lucia authentication
│   │   ├── searchService.ts        # Semantic search logic
│   │   ├── embeddings.ts           # OpenAI embeddings
│   │   ├── VoyageAI.ts             # VoyageAI embeddings
│   │   ├── gemini.ts               # Gemini embeddings
│   │   ├── PineconeService.ts      # Vector DB operations
│   │   ├── supabase.ts             # File storage
│   │   ├── schema.ts               # Zod schemas
│   │   └── xendit.ts               # Payment gateway
│   │
│   ├── components/                 # Reusable UI components
│   ├── hooks/                      # Custom React hooks
│   │   ├── useCart.tsx             # Cart state management
│   │   └── useFilter.tsx           # Filter state
│   └── types/                      # TypeScript definitions
│
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── migrations/                 # Migration history
│
└── public/                         # Static assets
```

---

## Database Schema

```prisma
model User {
  id         Int        @id @default(autoincrement())
  name       String
  email      String     @unique
  password   String     // bcrypt hashed
  role       RoleUser   @default(customer)
  orders     Order[]
  sessions   Session[]
}

model Product {
  id          Int       @id @default(autoincrement())
  name        String
  description String
  price       BigInt    // IDR currency
  images      String[]  // Supabase storage URLs
  categories  String[]
  orders      OrderProduct[]
}

model Order {
  id        Int          @id @default(autoincrement())
  code      String       @unique  // Xendit reference
  user_id   Int
  total     BigInt
  status    StatusOrder  @default(pending)
  detail    OrderDetail?
  products  OrderProduct[]
}

enum RoleUser {
  superadmin
  customer
}

enum StatusOrder {
  pending
  success
  failed
}
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Accounts for: Supabase, Pinecone, OpenAI/VoyageAI, Xendit

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tokoprima.git
cd tokoprima

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"
DIRECT_URL="postgresql://user:password@host:5432/database"

# Supabase (File Storage)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_KEY="your-anon-key"

# AI/ML Services
OPENAI_API_KEY="sk-..."
VOYAGEAI_API_KEY="pa-..."
GEMINI_API_KEY="..."

# Vector Database
PINECONE_API_KEY="..."

# Payment Gateway
NEXT_PUBLIC_XENDIT_KEYS="xnd_..."
NEXT_PUBLIC_REDIRECT_URL="https://yourdomain.com/order/success"

# Environment
NODE_ENV="development"
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test
npm run test:watch

# Linting
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## API Reference

### Products

```http
POST /api/products
Content-Type: application/json

{
  "limit": 30
}
```

**Response:**

```json
[
  {
    "id": 1,
    "name": "Product Name",
    "price": 150000,
    "images": ["image1.jpg"],
    "categories": ["electronics"]
  }
]
```

### Semantic Search

```http
POST /api/search
Content-Type: application/json

{
  "search": "wireless headphones",
  "model": "voyage",
  "indexName": "ecommerce-voyage-3-large",
  "namespace": "products-1"
}
```

**Response:**

```json
[
  {
    "id": 1,
    "name": "Bluetooth Headphones",
    "score": 0.89,
    "price": 299000
  }
]
```

### Product Reviews

```http
POST /api/reviews
Authorization: Cookie-based session

{
  "product_id": 1,
  "rating": 5,
  "comment": "Great product!"
}
```

### Payment Webhook

```http
POST /api/order/status
Content-Type: application/json

{
  "data": {
    "reference_id": "ORDER_12345",
    "status": "SUCCEEDED"
  }
}
```

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Pinecone Indexes

The application supports multiple embedding models with their respective Pinecone indexes:

| Model                           | Index Name                 | Dimensions |
| ------------------------------- | -------------------------- | ---------- |
| OpenAI `text-embedding-3-large` | `ecommerce-3-large`        | 3072       |
| VoyageAI `voyage-3-large`       | `ecommerce-voyage-3-large` | 1024       |

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Pinecone](https://www.pinecone.io/) - Vector Database
- [shadcn/ui](https://ui.shadcn.com/) - UI Components
- [Lucia](https://lucia-auth.com/) - Authentication Library
- [Xendit](https://www.xendit.co/) - Payment Gateway

---

<div align="center">

**Built with Next.js**

Made by [Adyuta Indra Adyatma](https://github.com/yourusername)

</div>
