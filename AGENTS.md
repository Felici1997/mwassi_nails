# Project Agents

## Code Quality Agent
**Purpose**: Ensure the codebase maintains high standards of reliability, security, and maintainability.

**Responsibilities**:
- Run `npm run lint` and `npm run typecheck` before any merge.
- Audit for security vulnerabilities (e.g., hardcoded secrets, unsafe API calls).
- Verify adherence to Project Conventions (Next.js 14, Tailwind CSS, Prisma).
- Check for common performance bottlenecks (e.g., missing memoization in heavy components).
- Ensure proper error handling in all API routes.

**Verification Process**:
1. Execute build: `npm run build`.
2. Run linting: `npm run lint`.
3. Type check: `npm run typecheck` (if configured).
