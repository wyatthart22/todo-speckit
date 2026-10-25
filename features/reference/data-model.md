# Data Model Reference

**Status:** Feature 1 identity and session tables.

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

Password is excluded from the Sequelize default scope.

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required; cleared to `""` on logout |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours from session creation |
| `userId` | INTEGER FK | Required, references `users.id` |

## Associations

- User `hasMany` Session (`as: "sessions"`, `foreignKey: "userId"`)
- Session `belongsTo` User (`as: "user"`, `foreignKey: "userId"`)
