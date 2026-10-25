# Behavior & Rules Reference

**Living snapshot** of product rules currently in force.

| File | Role |
|------|------|
| [api.md](./api.md) | Routes / payloads |
| [data-model.md](./data-model.md) | Tables / columns |
| **This file** | Ownership, sort, validation, UI rules |

## Auth and sessions

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login is **username + password** (username `trim().toLowerCase()`) | `POST /todo/login` | Feature 1; ADR-0002 |
| New users get role **`worker`** | `POST /todo/register` | Feature 1 |
| Passwords hashed with **bcrypt**, `SALT_ROUNDS = 10`; hashes never returned | User model defaultScope + auth controller | Feature 1 |
| Session lifetime **24 hours**; JWT stored in `sessions` | Session row `expirationDate` + JWT `expiresIn: 86400` | Feature 1 |
| Login **reuses** a non-expired, non-revoked session for the same user | Auth controller | Feature 1 |
| Logout **clears** the session token server-side | `POST /todo/logout` | Feature 1 |
| Protected API requires `Authorization: Bearer <token>` that exists and is unexpired | `authenticate` middleware | Feature 1 |
| Authenticated requests resolve to `req.user.id` | `authenticate` | Feature 1 |
| Client session stored in `localStorage` key **`user`** | `Utils.setStore` / `removeItem` | Feature 1 |
| Unauthenticated visitors to protected routes go to **login**; signed-in visitors to login/register go to **home** | `router.beforeEach` | Feature 1 |
| API `401` clears `user` and redirects to login | axios interceptor | Feature 1 |
| Registration email: required + `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; invalid format **"Enter a valid email address."** | `emailRules` in `frontend/src/config/validation.js` | Feature 1 |
| Password minimum **8 characters** | Client rules + register controller | Feature 1 |

## Lists and ownership

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Every list belongs to exactly one user for its lifetime | `lists.userId` set from `req.user.id` only | Feature 2; ADR-0002 |
| Reads/updates/deletes scoped with `userId: req.user.id` | `getAccessibleListOrNull` + `findAll` where | Feature 2 |
| Cross-user list access → **`404`**, never `403` | List controller | Feature 2; ADR-0002 |
| List names trimmed; empty/whitespace rejected | Client `listNameRules` + list controller | Feature 2 |
| List name max **100** characters | List controller | Feature 2 |
| Lists returned **alphabetically by name** | `findAll` `order: name ASC` | Feature 2 |

## UI

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login and register use a full-screen layout (**no MenuBar**) | `App.vue` | Feature 1 |
| Auth errors shown in `<v-alert type="error">` | Login / Register views | Feature 1 |
| Signed-in **MenuBar** shows the user's name and **Sign out** | `MenuBar.vue` | Feature 2 |
| Dashboard heading **My Lists**; primary action **+ New List** | `Dashboard.vue` | Feature 2 |
| Empty lists copy: **"No lists yet. Create your first list."** | `Dashboard.vue` | Feature 2 |
| Row icon actions: **Edit list**, **Delete list** (`size="small"`) | `Dashboard.vue` | Feature 2 |
