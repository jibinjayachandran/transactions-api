# Transactions API

A fintech-style REST API for user accounts, wallets, and money transfers. Built as a learning project to practice REST API design, JWT auth with refresh token rotation, Prisma/PostgreSQL, and Docker deployment.

## Stack

- Node.js, Express 5, TypeScript
- Prisma ORM + PostgreSQL
- JWT auth (access + refresh tokens), bcrypt password hashing
- Zod for validation
- Docker + Railway deployment

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

### Running with Docker

```bash
docker compose up --build
docker compose exec api npx prisma migrate dev --name init
```

API available at `http://localhost:3002`. Postgres available at `localhost:5433`.

## API Endpoints

All routes are prefixed with `/api`. Wallet, transfer, and logout-all routes require an `Authorization: Bearer <accessToken>` header obtained from login.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new user |
| POST | `/api/auth/login` | Log in, returns an access token (15min) and refresh token (7 days) |
| POST | `/api/auth/refresh` | Get a new access token using a refresh token (rotates refresh token) |
| POST | `/api/auth/logout` | Revoke the current session's refresh token |
| POST | `/api/auth/logout-all` | Revoke all sessions for the logged-in user (requires Bearer token) |

### Wallets
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/wallets/create` | Create a wallet for the logged-in user |
| GET | `/api/wallets/info` | Get the logged-in user's wallets |
| GET | `/api/wallets/:id/balance` | Get balance for a specific wallet |
| POST | `/api/wallets/:id/deposit` | Deposit funds into a wallet |
| GET | `/api/wallets/:id/transactions` | Get paginated transaction history (`?page=1&limit=10`) |

### Transfers
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/transfers/transfer` | Atomically transfer funds between wallets |

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |

## Auth Flow

1. **Register** — create an account
2. **Login** — returns a short-lived `accessToken` (15 min) and a long-lived `refreshToken` (7 days)
3. **Authenticated requests** — pass `accessToken` in `Authorization: Bearer <token>` header
4. **Token refresh** — when the access token expires, call `/api/auth/refresh` with the refresh token to get a new pair. The old refresh token is immediately invalidated (rotation)
5. **Logout** — call `/api/auth/logout` with the refresh token to revoke the current session. Call `/api/auth/logout-all` to revoke all sessions across all devices

## Data Model

- **User** — can have one wallet, has many refresh token sessions
- **Wallet** — belongs to a user, holds a balance and currency, has many transactions
- **Transaction** — belongs to a wallet, records amount, type, and optional note
- **RefreshToken** — belongs to a user, one row per active session (supports multi-device login)

See [prisma/schema.prisma](prisma/schema.prisma) for full details.

## Notes

Built to practice Node.js/Express/Prisma fundamentals — covers JWT auth with refresh token rotation, multi-device session management, atomic transfers via Prisma transactions, Zod v4 validation middleware, and Docker + Railway deployment. Test coverage is a work in progress.