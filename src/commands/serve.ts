import express from 'express';
import { loadPassport, readAuditLog, getSigningKey } from '../utils/storage';
import { buildVerificationPayload } from './verify';
import { success, info } from '../utils/colors';
import * as crypto from 'crypto';

// Re-export public key as hex for external verifiers
function getPublicKeyHex(): string {
  // In HMAC systems the "public key" is intentionally absent.
  // We expose the key fingerprint (first 8 bytes of SHA-256 of the key).
  const key = getSigningKey();
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16) + '…(fingerprint only)';
}

interface ServeOptions {
  port?: string;
}

export function serveCommand(opts: ServeOptions): void {
  const port = parseInt(opts.port ?? '3000', 10);
  const app = express();
  app.use(express.json());

  app.get('/verify/:passportId', (req, res) => {
    if (!/^[0-9a-f-]{36}$/.test(req.params.passportId)) {
      return res.status(400).json({ valid: false, error: 'Invalid passport ID format' });
    }
    try {
      const passport = loadPassport(req.params.passportId);
      const result = buildVerificationPayload(passport, req.query.scope as string | undefined);
      res.status(result.valid ? 200 : 400).json(result);
    } catch (err) {
      res.status(404).json({ valid: false, error: String(err) });
    }
  });

  app.get('/audit/:passportId', (req, res) => {
    if (!/^[0-9a-f-]{36}$/.test(req.params.passportId)) {
      return res.status(400).json({ error: 'Invalid passport ID format' });
    }
    const entries = readAuditLog()
      .filter((e) => e.passport_id === req.params.passportId)
      .map(({ signature: _sig, ...rest }) => rest); // redact signature
    res.json({ passport_id: req.params.passportId, entries });
  });

  app.get('/.well-known/ai-passport-key', (_req, res) => {
    res.json({
      algorithm: 'HMAC-SHA256',
      note: 'HMAC keys are symmetric and must remain secret. This endpoint serves the key fingerprint only. For asymmetric verification, migrate to RSA/ECDSA.',
      fingerprint: getPublicKeyHex(),
    });
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.listen(port, () => {
    success(`AI Passport server running on port ${port}`);
    info(`  GET /verify/:passportId`);
    info(`  GET /audit/:passportId`);
    info(`  GET /.well-known/ai-passport-key`);
  });
}
