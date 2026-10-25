# API Reference

**Status:** Features 1–2.

API mount path: `/todo` (see `backend/server.js`). Authenticated routes require `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Process health check |
| `POST` | `/todo/register` | No | Create a user account and session |
| `POST` | `/todo/login` | No | Authenticate and return a session payload |
| `POST` | `/todo/logout` | Yes | Invalidate the current session token |
| `GET` | `/todo/lists` | Yes | Fetch lists owned by the authenticated user (A–Z by name) |
| `POST` | `/todo/lists` | Yes | Create a list owned by the authenticated user |
| `PUT` | `/todo/lists/:listId` | Yes | Rename an owned list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete an owned list |

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

### List body (`POST /todo/lists` `201`, `PUT /todo/lists/:listId` `200`)

Create request: `{ "name": "Groceries" }`. Client-supplied `userId` is ignored.

```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

`GET /todo/lists` returns an array of that shape, sorted alphabetically by `name`.

### List errors

| Case | Status | Body |
|------|--------|------|
| Empty/whitespace name | `400` | `{ "message": "List name is required." }` |
| Name longer than 100 characters | `400` | `{ "message": "List name must be 100 characters or fewer." }` |
| Invalid `listId` | `400` | `{ "message": "List id is invalid." }` |
| Missing, unowned, or unknown list | `404` | `{ "message": "List with id=<id> not found." }` |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.
