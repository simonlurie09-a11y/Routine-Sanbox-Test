# AI Passport

A cryptographically verifiable credential system that proves an AI agent is authorized to act on behalf of a specific individual for defined tasks.

## Concept

An **AI Passport** is a signed, auditable authorization document that:

- **Identifies** the individual granting authority (the *principal*)
- **Scopes** exactly which tasks/actions the AI agent may perform
- **Expires** automatically based on a configurable duration
- **Verifiable** by third parties without contacting the issuer directly
- **Auditable** via a tamper-evident chain-hashed log of every action

---

## Quick Start

```bash
npm install
npm run build

# Run the full demo (issue → verify → audit → integrity check)
./dist/index.js demo

# Issue a new passport interactively
./dist/index.js issue

# Verify a passport
./dist/index.js verify <passport-id>

# View audit trail
./dist/index.js audit show

# Revoke a passport
./dist/index.js revoke <passport-id>

# Start verification server
./dist/index.js serve --port 3000
```

---

## Passport Format

```json
{
  "passport_id": "<uuid>",
  "version": "1.0",
  "issued_at": "<ISO 8601>",
  "expires_at": "<ISO 8601>",
  "principal": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "identity_hash": "<sha256(email:salt)>"
  },
  "agent": {
    "name": "Claude",
    "model": "claude-sonnet-4-6",
    "agent_id": "<uuid>"
  },
  "scopes": ["email.read", "calendar.write", "banking.readonly"],
  "constraints": {
    "max_transaction_usd": 500,
    "allowed_domains": ["gmail.com", "calendar.google.com"],
    "active_hours_utc": "08:00-20:00"
  },
  "signature": "<HMAC-SHA256 hex>",
  "issuer_public_key_url": "https://example.com/.well-known/ai-passport-key"
}
```

### Field reference

| Field | Description |
|-------|-------------|
| `passport_id` | UUID v4 unique identifier |
| `version` | Schema version (`1.0`) |
| `issued_at` | ISO 8601 issuance timestamp |
| `expires_at` | ISO 8601 expiry; verification fails after this |
| `principal.identity_hash` | SHA-256 of `email:salt` — salt stored separately |
| `agent.agent_id` | UUID for this specific agent instance |
| `scopes` | Allowed action scopes (dot-notation) |
| `constraints` | Optional guardrails enforced at verify time |
| `signature` | HMAC-SHA256 over canonical JSON of all other fields |

---

## Trust Model

### Signing
Passports are signed with **HMAC-SHA256** using a 256-bit key stored in `~/.ai-passport/keys/signing.key` (permissions `0600`). The signature covers a **canonical JSON** representation of all passport fields (keys sorted recursively), preventing field-order manipulation attacks.

### Identity Privacy
The principal's email is **not stored** in the passport beyond the `identity_hash`. The hash is computed as:

```
SHA-256(email + ":" + per_passport_salt)
```

The salt is stored separately in `~/.ai-passport/salts/<passport_id>.salt` and never embedded in the passport file, so the passport can be shared without revealing the email.

### Audit Chain
Every action logged under a passport produces an entry that:
1. Hashes its own content
2. Includes the hash of the previous entry (`prev_hash`)
3. Is HMAC-signed

This creates a **chain-linked audit trail** where any tampering with historical entries breaks all subsequent hashes, detectable via `ai-passport audit verify`.

### Revocation
A local `~/.ai-passport/revocation-list.json` lists revoked passport IDs. Verification checks this list **before** signature validation, so revoked passports fail immediately regardless of signature validity.

---

## CLI Commands

### `ai-passport issue`
Issue a new passport interactively or via flags:

```bash
ai-passport issue
ai-passport issue --name "Jane Smith" --email jane@example.com \
  --agent Claude --model claude-sonnet-4-6 \
  --scopes "email.read,banking.readonly" --expiry 30d
ai-passport issue --json   # machine-readable output
```

### `ai-passport verify <id|path>`
Verify a passport:

```bash
ai-passport verify abc123
ai-passport verify ./passport.json --scope email.read
ai-passport verify abc123 --json
```

**Exit codes:** `0` = valid, `1` = invalid/expired/revoked.

### `ai-passport audit log <id> <action> <scope> <result>`
Log an action under a passport:

```bash
ai-passport audit log abc123 "Fetch inbox" email.read "12 messages returned"
```

### `ai-passport audit verify`
Verify the integrity of the entire audit chain:

```bash
ai-passport audit verify
ai-passport audit verify --json
```

### `ai-passport audit show`
Display the audit trail:

```bash
ai-passport audit show
ai-passport audit show --passport-id abc123
ai-passport audit show --json
```

### `ai-passport revoke <id>`
Revoke a passport:

```bash
ai-passport revoke abc123
ai-passport revoke abc123 --reason "Employee offboarded"
```

### `ai-passport revocations`
List all revoked passports.

### `ai-passport list`
List all stored passports with their status (VALID / EXPIRED / REVOKED).

### `ai-passport serve [--port 3000]`
Start the HTTP verification server.

### `ai-passport demo`
Run an end-to-end demo showing the full lifecycle in ~30 seconds.

---

## HTTP Verification Server

```bash
ai-passport serve --port 3000
```

### Endpoints

#### `GET /verify/:passportId`
Returns verification status. Optionally pass `?scope=email.read` to check scope authorization.

**Response:**
```json
{
  "valid": true,
  "passport_id": "...",
  "principal_name": "Jane Smith",
  "authorized_scopes": ["email.read", "calendar.write"],
  "verification_timestamp": "2024-12-01T10:00:00.000Z",
  "verifier_nonce": "a1b2c3d4e5f6..."
}
```

#### `GET /audit/:passportId`
Returns the redacted audit trail (signatures omitted) for a passport.

#### `GET /.well-known/ai-passport-key`
Returns the algorithm and key fingerprint. (HMAC keys are symmetric and cannot be made public; this endpoint documents the algorithm for integrators.)

---

## External Integration Guide

Organizations wishing to verify AI Passport credentials can:

1. **Receive the passport JSON** from the AI agent or user.
2. **Call the verification server** at `GET /verify/<passport_id>` (if you have network access to it).
3. **Check the verification response:**
   - `valid: true` — agent is authorized
   - `verifier_nonce` — use for replay protection; store and reject reused nonces
   - `authorized_scopes` — confirm the scope your service requires is listed
4. **Log the nonce** with the `verification_timestamp` in your audit system to detect replay attacks.

### Trust boundary note
In the current HMAC implementation, the signing key is known only to the passport issuer. This means external parties must trust the issuer's verification server. For a fully decentralized trust model, the signing algorithm should be upgraded to **RSA-PSS** or **ECDSA (P-256)**, where the private key is held by the issuer and the public key is published at `/.well-known/ai-passport-key`. The code is structured to support this migration.

---

## Storage Layout

```
~/.ai-passport/
├── keys/
│   └── signing.key          # 256-bit HMAC key (chmod 600, NEVER share)
├── salts/
│   └── <passport_id>.salt   # Per-passport salt for identity hash
├── passports/
│   └── <passport_id>.json   # Signed passport files (chmod 600)
├── revocation-list.json     # Revoked passport IDs
└── passport-audit.log       # Chain-hashed JSONL audit trail
```

---

## Security Checklist

- [x] Signature covers ALL fields via canonical sorted JSON
- [x] HMAC key stored at `0600` permissions, never embedded in passport
- [x] Per-passport salt keeps identity hash unlinkable across passports
- [x] Revocation list checked before signature validation
- [x] Timing-safe comparison for signature verification
- [x] Nonce included in every verification response
- [x] File permission warning if passport file is world-readable
- [x] Audit log chain-hashed to detect tampering

---

## Examples

See the `examples/` directory for:
- `sample-passport.json` — example passport structure
- `sample-audit.log` — example audit trail (JSONL format)
