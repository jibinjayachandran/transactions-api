# Transactions API

A fintech-style REST API for user accounts, wallets, and money transfers. Built as a learning project to practice REST API design, JWT auth with refresh token rotation, Prisma/PostgreSQL, Redis caching, automated testing, and Docker deployment.

## Stack

- Node.js, Express 5, TypeScript
- Prisma ORM + PostgreSQL
- Redis (via `ioredis`) — cache-aside pattern for wallet balances, JWT revocation (blocklist + token versioning)
- JWT auth (access + refresh tokens), bcrypt password hashing
- Zod for validation
- Jest + Supertest — unit and integration tests
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
   - `REDIS_URL` — Redis connection string (e.g. `redis://localhost:6379`)

3. Run database migrations
```bash
   npx prisma migrate dev
```
4. Make sure Redis is running locally
```bash
   redis-cli ping   # should return PONG
```
5. Start the dev server
```bash
   npm run dev
```
   Server runs on `http://localhost:3002`.

### Running with Docker

```bash
docker compose up --build
docker compose exec api npx prisma migrate dev --name init
```

API available at `http://localhost:3002`. Postgres available at `localhost:5433`. Redis runs as a separate `redis` service in `docker-compose.yml`.

## Testing

The project has two layers of automated tests:

- **Unit tests** — pure logic, no I/O (e.g. Zod validation schemas)
- **Integration tests** — full HTTP request → route → service → Prisma → Postgres round trip, using Supertest against a real (separate) test database

### Setup

1. Create a dedicated test database, separate from your dev database
```bash
   psql -U your_user -d postgres -c "CREATE DATABASE transactions_test_db;"
```
2. Copy `.env.test` and point `DATABASE_URL` at the test database
```dotenv
   DATABASE_URL="postgresql://your_user@localhost:5432/transactions_test_db?schema=public"
   JWT_SECRET=supersecretkey123
   REDIS_URL="redis://localhost:6379"
```
3. Apply migrations to the test database
```bash
   npx dotenv -e .env.test -- npx prisma migrate deploy
```

### Running tests

```bash
npm test
```

This runs `jest --runInBand` against `.env.test`. Tests run serially (`--runInBand`) rather than in parallel, since integration tests share one real Postgres test database and parallel workers would race against each other's setup/cleanup.

Test files live alongside the code they test, inside `__tests__/` folders (e.g. `src/routes/__tests__/`, `src/validators/__tests__/`). Integration tests clean up related tables (respecting foreign key order — child tables before parent tables) before each test to keep tests isolated and repeatable.

## API Endpoints

All routes are prefixed with `/api`. Wallet, transfer, and logout-all routes require an `Authorization: Bearer <accessToken>` header obtained from login.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new user |
| POST | `/api/auth/login` | Log in, returns an access token (5min) and refresh token (7 days) |
| POST | `/api/auth/refresh` | Get a new access token using a refresh token (rotates refresh token) |
| POST | `/api/auth/logout` | Revoke the current session's refresh token **and** immediately blocklist its access token (requires Bearer token) |
| POST | `/api/auth/logout-all` | Revoke all sessions for the logged-in user across all devices, invalidating every access token already issued (requires Bearer token) |

### Wallets
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/wallets/create` | Create a wallet for the logged-in user |
| GET | `/api/wallets/info` | Get the logged-in user's wallets |
| GET | `/api/wallets/:id/balance` | Get balance for a specific wallet (Redis cached, see below) |
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
2. **Login** — returns a short-lived `accessToken` (5 min) and a long-lived `refreshToken` (7 days)
3. **Authenticated requests** — pass `accessToken` in `Authorization: Bearer <token>` header. Every request is checked against Redis for immediate revocation (see below), in addition to standard JWT signature/expiry checks
4. **Token refresh** — when the access token expires, call `/api/auth/refresh` with the refresh token to get a new pair. The old refresh token is immediately invalidated (rotation)
5. **Logout** — call `/api/auth/logout` with the refresh token (and current access token in the header) to revoke just this session, immediately — not just at natural expiry
6. **Logout all** — call `/api/auth/logout-all` to instantly revoke every session and every previously issued access token across all devices

## Token Revocation

Access tokens are short-lived JWTs, which are stateless by design — normally there's no way to invalidate one before it naturally expires. Two complementary Redis-backed mechanisms close that gap:

**Single-token blocklist** (used by `/logout`)
- Every access token is signed with a unique `jti` (JWT ID) claim.
- On logout, the token's `jti` is written to Redis (`blocklist:<jti>`) with a TTL matched to the token's *remaining* lifetime — once the token would have expired naturally anyway, the blocklist entry is no longer needed and Redis cleans it up automatically.
- `protect` middleware checks the blocklist on every request, after verifying the JWT signature. A match means "revoked" even though the signature is still technically valid.
- This targets exactly one token/session — logging out on one device doesn't affect others.

**Token versioning** (used by `/logout-all`)
- Every access token also carries a `tokenVersion` claim, set at sign time from a per-user counter stored in Redis (`tokenVersion:<userId>`).
- `logout-all` simply increments that counter. It doesn't need to know how many access tokens exist or where they are.
- `protect` middleware compares the token's `tokenVersion` claim against the current counter value in Redis. Any token signed before the increment now fails the check — instantly, across every device — without tracking individual tokens.
- Logging in again issues a fresh token stamped with the current version, so the user regains access normally.

The two mechanisms solve different problems: the blocklist targets *one specific token*; versioning invalidates *everything issued before a point in time* for a user, cheaply, using a single counter instead of a growing list.

## Caching

Wallet balance lookups (`GET /api/wallets/:id/balance`) use a **cache-aside** pattern with Redis:

- On read: check Redis first (`wallet:balance:<walletId>`). On a hit, return immediately without touching Postgres. On a miss, fetch from Postgres and populate Redis with a 60-second TTL.
- On write: any operation that changes a wallet's balance (deposit, transfer) immediately deletes the relevant cache key(s) after the database write succeeds, so the next read is forced to fetch a fresh value.
- The cached value includes `userId` alongside the balance, so ownership/authorization checks are still enforced on a cache hit, not just on a cache miss.
- The 60-second TTL acts as a safety net — if any future write path forgets to invalidate the cache, staleness is capped at 60 seconds rather than persisting indefinitely.

## Data Model

- **User** — can have one wallet, has many refresh token sessions
- **Wallet** — belongs to a user, holds a balance and currency, has many transactions
- **Transaction** — belongs to a wallet, records amount, type, and optional note
- **RefreshToken** — belongs to a user, one row per active session (supports multi-device login)

See [prisma/schema.prisma](prisma/schema.prisma) for full details.

## Notes

Built to practice Node.js/Express/Prisma fundamentals — covers JWT auth with refresh token rotation, multi-device session management, immediate token revocation via a Redis blocklist and token versioning, atomic transfers via Prisma transactions, Redis caching with the cache-aside pattern, Zod v4 validation middleware, Jest/Supertest testing, and Docker + Railway deployment.