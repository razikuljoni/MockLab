# MockLab API Reference

Base URL: `http://localhost:3001` (local) or your deployed MockLab API domain.

All requests should supply `Content-Type: application/json`. Authenticated routes require an `Authorization: Bearer <jwt_or_api_key>` or `X-MockLab-Key: <api_key>` header.

---

## 1. Authentication & Users

### `POST /api/v1/auth/signup`
Creates user account and automatically provisions personal workspace with pre-seeded Petstore demo.
```json
{
  "email": "developer@company.com",
  "password": "SecurePassword123!",
  "name": "Jane Developer",
  "workspaceName": "Acme Corp"
}
```

### `POST /api/v1/auth/login`
Authenticates credentials and returns JWT session token.
```json
{
  "email": "developer@company.com",
  "password": "SecurePassword123!"
}
```

### `GET /api/v1/auth/me`
Returns currently authenticated user profile and membership roles.

---

## 2. Workspaces & Team

### `GET /api/v1/workspaces`
Lists workspaces accessible to the authenticated user.

### `GET /api/v1/workspaces/:id`
Retrieves workspace metadata, plan tier, and member counts.

### `PATCH /api/v1/workspaces/:id`
Updates workspace settings (`name`, `slug`, `defaultEnv`, `mockAuthDefault`, `logRetentionDays`). *Admin/Owner only.*

### `POST /api/v1/workspaces/:id/pause-all`
Pauses all mock servers across all projects in the workspace. Returns HTTP 503 to all inbound mock traffic. *Admin/Owner only.*

### `DELETE /api/v1/workspaces/:id`
Permanently destroys the workspace and all child mocks. *Owner only.*

### `GET /api/v1/workspaces/:id/members`
Lists workspace members, roles, and join timestamps.

### `POST /api/v1/workspaces/:id/invites`
Invites a new team member by email with designated role (`ADMIN`, `EDITOR`, `VIEWER`).

---

## 3. Projects & Specifications

### `GET /api/v1/workspaces/:workspaceId/projects`
Lists all mock projects within a workspace.

### `POST /api/v1/workspaces/:workspaceId/projects`
Creates a new project.
```json
{
  "name": "Payment Gateway",
  "slug": "payment-gw",
  "environment": "development",
  "mockAuth": "PUBLIC"
}
```

### `POST /api/v1/projects/:id/spec/import`
Parses and imports OpenAPI 3.0/3.1 (JSON/YAML) or GraphQL schema.
```json
{
  "sourceUrl": "https://petstore.swagger.io/v2/swagger.json",
  "rawSpec": "openapi: 3.0.0..."
}
```

### `GET /api/v1/projects/:id/endpoints`
Returns all parsed operations with path parameters, request bodies, and default status codes.

---

## 4. Inbound Mock Execution (`/m/:slug/*`)

### `ALL /m/:slug/:path*`
Executes mock matching engine against defined priority rules.

#### Headers Supported:
- `X-MockLab-Key`: Project or workspace API key (required on `PRIVATE` projects).
- `X-MockLab-Scenario`: Scenario isolation key (e.g. `order-flow-run-1`).
- `X-MockLab-Bucket`: Explicit state bucket targeting.

#### Response Headers Returned:
- `X-MockLab-Rule`: Name of the matched rule.
- `X-RateLimit-Limit`: Request quota limit.
- `X-RateLimit-Remaining`: Remaining quota in sliding window.
- `X-RateLimit-Reset`: Unix timestamp when quota resets.

---

## 5. Contract Testing & CI Sweeps

### `POST /api/v1/projects/:id/contract-runs`
Triggers external contract test execution against real provider.
- Returns `200 OK` on `PASS` or `NON_BREAKING`.
- Returns `409 Conflict` on `FAIL_BREAKING` to fail CI pipeline gates automatically.

### `GET /api/v1/projects/:id/badge`
Returns a dynamic SVG status badge suitable for READMEs:
```markdown
![MockLab Contract](https://api.mocklab.dev/api/v1/projects/petstore/badge)
```

---

## 6. API Keys & Rate Limits

### `GET /api/v1/workspaces/:id/keys`
Lists active and revoked API keys (hashes excluded, only prefix and `last4` returned).

### `POST /api/v1/workspaces/:id/keys`
Generates a new API token. Raw key returned **only once** in response.
```json
{
  "name": "GitHub Actions CI Runner",
  "prefix": "mk_live_",
  "rateLimitPerMin": 120,
  "scopes": ["mock:read", "mock:write", "tests:run"]
}
```

### `POST /api/v1/workspaces/:id/keys/:keyId/revoke`
Immediately invalidates an API token. Subsequent calls return `401 Unauthorized`.
