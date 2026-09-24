---
name: Web App Security Checklist
description: A comprehensive security checklist to audit and secure web applications. Use this skill when asked to perform a security check or audit on a web application.
---

# Web App Security Checklist

When asked to perform a security check or audit on a web application, systematically verify the application against the following checklist:

1. **Secure your API keys.** Ensure they are not exposed in client-side code or public repositories.
2. **Hide all .env files.** Verify `.env` is in `.gitignore` and not committed.
3. **Never hardcode secrets.** Ensure all secrets are loaded via environment variables.
4. **Add authentication.** Ensure core routes are protected.
5. **Verify permissions server-side.** Check for proper role-based access control (RBAC).
6. **Don't trust frontend user IDs.** Always extract user IDs from verified server-side tokens (e.g., JWT).
7. **Isolate user data.** Ensure users can only access their own data unless authorized as an admin.
8. **Lock down your database.** Ensure database ports are not publicly exposed and require strong authentication.
9. **Secure Firebase, Supabase, and storage.** Implement correct row-level security (RLS) or storage rules.
10. **Protect admin routes.** Ensure administrative endpoints have strict role requirements.
11. **Disable production debug mode.** Ensure debug modes and verbose logging are turned off in production.
12. **Hide detailed errors.** Do not leak stack traces or raw error messages to the client (return generic 500 errors instead).
13. **Validate inputs server-side.** Use libraries like Zod, Joi, or custom validation for all incoming requests.
14. **Sanitize user content.** Protect against XSS by escaping or sanitizing HTML/rich text inputs.
15. **Secure file uploads.** Validate file types, sanitize filenames (e.g. against path traversal), and scan for malware if possible.
16. **Prevent SQL/NoSQL injection.** Use parameterized queries or ORMs/ODMs (like Mongoose) correctly.
17. **Rate-limit login and signup.** Use tools like `express-rate-limit` to prevent brute-force and spam attacks.
18. **Check Git history for secrets.** Ensure no secrets were committed in the past.
19. **Add security headers; restrict CORS.** Use `helmet` for headers and properly configure CORS origins.
20. **Test as an untrusted user.** Mentally or manually trace workflows assuming malicious intent.
21. **Ask your AI agent.** Use this skill and agent capabilities to automatically review and fix these issues.

## Execution
When running this skill, produce a Markdown report detailing the application's status for each point:
- 🟢 **Passing** (Implemented)
- 🟡 **Needs Improvement** (Partial implementation)
- 🔴 **Failing** (Needs immediate action)

Offer to automatically implement fixes for any failing items.
