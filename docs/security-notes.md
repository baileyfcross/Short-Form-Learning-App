# Security Notes

- Passwords are hashed with bcrypt before storage.
- Access and refresh tokens use separate secrets and configurable TTLs.
- `requireAuth` protects private routes; `requireRole` protects moderator/admin routes.
- Normal user responses intentionally omit `reliabilityScore`.
- Uploaded files are validated by MIME type and size before storage.
- Object storage is abstracted; the local implementation writes outside Neo4j and guards against path traversal.
- Upload and auth endpoints have rate limits.
- Helmet and constrained CORS are enabled.
- Full materials are private by default; public feed entries must be approved snippets.
- Material owners can view and download their own uploaded files without moderation. Full uploaded files are not exposed to other users through public feed approval.
- Admins and moderators can view uploaded files for review. Download/delete privileges remain separate from moderator review access.
- Public feed snippets depend on their source material. If the owner or an admin deletes the uploaded material, generated snippets are deleted from the feed as well.
- Approved public snippets expose view-only access to the source document from the feed. Owner-only download access remains separate.
- Malware scanning is designed as a future upload pipeline step and should be added before public production use.
- Production deployments should terminate TLS at the edge or service mesh and only expose HTTPS.

## Remaining Production Work

- Add refresh-token rotation and token revocation storage.
- Add CSRF protection if tokens move to cookies.
- Add malware scanning and media probing before storage finalization.
- Add per-user storage quotas and upload abuse detection.
- Add audit logs for admin moderation and reliability edits.
- Add ownership checks to any new material or snippet mutations.
- Add signed URLs for private object access.
- Add structured security event logging and alerting.
