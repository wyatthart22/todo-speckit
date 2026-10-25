# API Reference

**Status:** Feature 1 auth surface.

API mount path: `/todo` (see `backend/server.js`). Authenticated routes require `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Process health check |
| `POST` | `/todo/register` | No | Create a user account and session |
| `POST` | `/todo/login` | No | Authenticate and return a session payload |
| `POST` | `/todo/logout` | Yes | Invalidate the current session token |
| `GET` | `/todo/lists` | Yes | Return lists owned by the authenticated user (empty until Feature 2) |

### Auth success body (`POST /todo/register` `201`, `POST /todo/login` `200`)

```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

Password hashes are never returned.

### Auth errors

| Case | Status | Body |
|------|--------|------|
| Missing required field | `400` | `{ "message": "<Field> is required." }` |
| Password shorter than 8 characters | `400` | `{ "message": "Password must be at least 8 characters." }` |
| Duplicate username | `400` | `{ "message": "Username is already taken." }` |
| Duplicate email | `400` | `{ "message": "Email is already registered." }` |
| Bad credentials | `401` | `{ "message": "Invalid username or password." }` |
| Missing/invalid/expired token | `401` | `{ "message": "Unauthorized! …" }` |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.
