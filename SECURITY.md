# Security Policy

This document outlines the security measures and vulnerability management for the NFD Blog project.

## Supported Versions

We currently support the following versions:

| Version | Supported          |
|---------|--------------------|
| Latest  | ✅                 |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly by:

1. **Private Disclosure**: Send a detailed report to the project maintainers
2. **Do Not Publicly Disclose**: Allow us time to investigate and patch
3. **Provide Details**: Include steps to reproduce, impact assessment, and any potential mitigations

## Recent Security Updates

### React CVE Security Patches (December 15, 2025)

We have successfully patched the following React security vulnerabilities:

#### CVE-2025-55184
- **Description**: React Server Components vulnerability in dev mode
- **Severity**: High
- **Status**: ✅ PATCHED in React 19.2.3
- **Impact**: Could lead to remote code execution in development environments

#### CVE-2025-67779
- **Description**: React DOM cross-site scripting (XSS) vulnerability
- **Severity**: High
- **Status**: ✅ PATCHED in React DOM 19.2.3
- **Impact**: Could allow XSS attacks through improper input sanitization

#### CVE-2025-55183
- **Description**: React Server Actions request forgery vulnerability
- **Severity**: Medium
- **Status**: ✅ PATCHED in React 19.2.3
- **Impact**: Could allow unauthorized action execution

### Applied Updates

```json
{
  "react": "19.2.1 → 19.2.3",
  "react-dom": "19.2.1 → 19.2.3"
}
```

### Verification

The security patches have been verified by:
1. Running `npm audit` to confirm no high-severity vulnerabilities remain
2. Ensuring all tests pass with the updated dependencies
3. Verifying application functionality in development and production builds

## Security Best Practices

This project implements the following security measures:

1. **Dependency Management**
   - Regular security audits with `npm audit`
   - Automated vulnerability scanning in CI/CD pipeline
   - Prompt patching of known vulnerabilities

2. **Content Security**
   - XSS prevention through proper input sanitization
   - Content Security Policy (CSP) headers
   - Safe rendering of user-generated content

3. **Environment Security**
   - Secure handling of API keys and secrets
   - Environment-based configuration management
   - Protection against sensitive data exposure

4. **Code Quality**
   - ESLint security plugin integration
   - TypeScript strict mode for type safety
   - Comprehensive test coverage including security tests

For detailed security implementation guidelines, see [docs/security-considerations-best-practices.md](docs/security-considerations-best-practices.md).

## Security Alerts

We monitor security alerts through:
- GitHub Dependabot for automated vulnerability detection
- npm Security Advisories
- React Security Working Group updates

## Security Changelog

All security-related updates will be documented in this file with:
- Date of update
- Vulnerabilities addressed
- Versions patched
- Verification steps completed