# Transactions API

A small Node.js/Express + TypeScript API for user accounts, wallets, and money transfers. Built as a learning project to practice REST API design, JWT auth, and Prisma/PostgreSQL.

## Stack

- Node.js, Express 5, TypeScript
- Prisma ORM + PostgreSQL
- JWT auth, bcrypt password hashing
- Zod for validation

## Setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Copy the env template and fill in your own values
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL` — PostgreSQL connection string
   - `JWT_SECRET` — any long random string, used to sign auth tokens
3. Run database migrations
   ```bash
   npx prisma migrate dev
   ```
4. Start the dev server
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:3002`.

## API Endpoints

All routes are prefixed with `/api`. Wallet and transfer routes require an `Authorization: Bearer <token>` header (obtained from login).

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new user |
| POST | `/api/auth/login` | Log in, returns a JWT |

### Wallets
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/wallets/create` | Create a wallet for the logged-in user |
| GET | `/api/wallets/info` | Get the logged-in user's wallet info |
| GET | `/api/wallets/:id/balance` | Get balance for a specific wallet |
| POST | `/api/wallets/:id/deposit` | Deposit funds into a wallet |

### Transfers
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/transfers/transfer` | Transfer funds between wallets |
| GET | `/api/transfers/:id/history` | Get transaction history for a wallet |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |

## Data Model

- **User** — has one wallet
- **Wallet** — belongs to a user, has a balance/currency, has many transactions
- **Transaction** — belongs to a wallet, records amount/type/note

See [prisma/schema.prisma](prisma/schema.prisma) for full details.

## Notes

This project was built to learn Node.js/Express/Prisma fundamentals — error handling, validation, and test coverage are still a work in progress.
