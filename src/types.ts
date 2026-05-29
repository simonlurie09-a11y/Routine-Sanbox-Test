export interface PassportPrincipal {
  name: string;
  email: string;
  identity_hash: string;
  did?: string;
}

export interface PassportAgent {
  name: string;
  model: string;
  agent_id: string;
}

export interface PassportConstraints {
  max_transaction_usd?: number;
  allowed_domains?: string[];
  active_hours_utc?: string;
  [key: string]: unknown;
}

export interface Passport {
  passport_id: string;
  version: string;
  issued_at: string;
  expires_at: string;
  principal: PassportPrincipal;
  agent: PassportAgent;
  scopes: string[];
  constraints?: PassportConstraints;
  signature: string;
  issuer_public_key_url: string;
}

export interface VerificationResult {
  valid: boolean;
  passport_id: string;
  principal_name: string;
  authorized_scopes: string[];
  verification_timestamp: string;
  verifier_nonce: string;
  error?: string;
}

export interface AuditEntry {
  entry_id: string;
  timestamp: string;
  passport_id: string;
  action: string;
  scope_used: string;
  result: string;
  result_hash: string;
  entry_hash: string;
  prev_hash: string;
  signature: string;
}

export interface RevocationList {
  revoked: Array<{
    passport_id: string;
    revoked_at: string;
    reason?: string;
  }>;
}
