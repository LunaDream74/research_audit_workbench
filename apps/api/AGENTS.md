# Analysis API Agent Contract

- This service is stateless: no Supabase database or storage credentials and no durable writes.
- Pydantic schemas are the HTTP source of truth.
- Audit rules must be deterministic, evidence-linked, and cautious about causal claims.
- Treat archives as untrusted input and keep all private endpoints behind Supabase JWT verification.

