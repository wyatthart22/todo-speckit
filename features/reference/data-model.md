# Data Model Reference

**Status:** Features 1–5.

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required |
| `lName` | STRING | Required |
| `email` | STRING | Required, unique |
| `username` | STRING(100) | Required, unique; stored lowercase |
| `password` | STRING(255) | Required; bcrypt hash only (`SALT_ROUNDS = 10`) |
| `role` | STRING(20) | Default `worker` |

Password is excluded from the Sequelize default scope. `fName`, `lName`, `email`, and `username` are editable via `PUT /todo/users/:id`; `password` is optional on that update (hashed when provided); `role` is read-only.

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required; cleared to `""` on logout |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours from session creation |
| `userId` | INTEGER FK | Required, references `users.id` |

### `lists`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required; trimmed; max 100 characters |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

### `todos`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `listId` | INTEGER FK | Required; references `lists.id`; cascade on list delete |
| `title` | STRING(255) | Required; trimmed; max 255 characters |
| `completed` | BOOLEAN | Default `false` |
| `dueDate` | DATEONLY | Nullable; optional on create/update; `YYYY-MM-DD` |
| `userId` | INTEGER FK | Required; references `users.id`; set from `req.user.id` on create |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

## Associations

- User `hasMany` Session (`as: "sessions"`, `foreignKey: "userId"`)
- Session `belongsTo` User (`as: "user"`, `foreignKey: "userId"`)
- User `hasMany` List (`as: "lists"`, `foreignKey: "userId"`)
- List `belongsTo` User (`as: "user"`, `foreignKey: "userId"`)
- User `hasMany` Todo (`as: "todos"`, `foreignKey: "userId"`)
- Todo `belongsTo` User (`as: "user"`, `foreignKey: "userId"`)
- List `hasMany` Todo (`as: "todos"`, `foreignKey: "listId"`, `onDelete: CASCADE`)
- Todo `belongsTo` List (`as: "list"`, `foreignKey: "listId"`)
