# API Reference

**Status:** Features 1–5.

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
| `GET` | `/todo/lists/:listId/todos` | Yes | Fetch todos in an owned list |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo to an owned list |
| `PUT` | `/todo/todos/:id` | Yes | Update an owned todo (`title` and/or `completed`) |
| `DELETE` | `/todo/todos/:id` | Yes | Delete an owned todo |
| `GET` | `/todo/users/:id` | Yes | Fetch the authenticated user's profile (self only) |
| `PUT` | `/todo/users/:id` | Yes | Update the authenticated user's profile (self only) |

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

### Todo body (`POST .../todos` `201`, `PUT /todo/todos/:id` `200`)

Create request: `{ "title": "Buy milk", "dueDate": "2026-07-15" }`. `dueDate` is optional (`YYYY-MM-DD` or `null`). Client-supplied `userId` / `listId` is ignored. On `PUT`, omit `dueDate` to leave it unchanged; send `null` to clear it.

```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "dueDate": "2026-07-15",
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

`GET /todo/lists/:listId/todos` returns an array of that shape, incomplete first, then `createdAt` ascending.

### Todo errors

| Case | Status | Body |
|------|--------|------|
| Empty/whitespace title | `400` | `{ "message": "Todo title is required." }` |
| Invalid `dueDate` | `400` | `{ "message": "Due date must be a valid date in YYYY-MM-DD format." }` |
| Title longer than 255 characters | `400` | `{ "message": "Todo title must be 255 characters or fewer." }` |
| Invalid `listId` / todo `id` | `400` | `{ "message": "List id is invalid." }` / `{ "message": "Todo id is invalid." }` |
| Missing, unowned, or unknown list | `404` | `{ "message": "List with id=<id> not found." }` |
| Missing, unowned, or unknown todo | `404` | `{ "message": "Todo with id=<id> not found." }` |

### Profile body (`GET` / `PUT /todo/users/:id` `200`)

Update request (password optional):

```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "password": "newpassword123"
}
```

```json
{
  "id": 42,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "role": "worker",
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

Password hashes are never returned. `role` is read-only.

### Profile errors

| Case | Status | Body |
|------|--------|------|
| Missing required field | `400` | `{ "message": "<Field> is required." }` |
| Password shorter than 8 characters | `400` | `{ "message": "Password must be at least 8 characters." }` |
| Duplicate username | `400` | `{ "message": "Username is already taken." }` |
| Duplicate email | `400` | `{ "message": "Email is already registered." }` |
| Other user or unknown id | `404` | `{ "message": "User with id=<id> not found." }` |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.
