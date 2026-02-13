# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Validiant seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- Open a public GitHub issue
- Post about it on social media
- Attempt to exploit the vulnerability

### Please DO:

1. Email us at security@validiant.com (or create a private security advisory on GitHub)
2. Provide detailed information about the vulnerability:
   - Type of issue (e.g., SQL injection, XSS, etc.)
   - Full paths of source file(s) related to the vulnerability
   - Location of the affected source code (tag/branch/commit)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue

### What to expect:

- We will acknowledge receipt of your vulnerability report within 48 hours
- We will send you regular updates about our progress
- We will notify you when the vulnerability is fixed
- We will credit you in our security advisory (unless you prefer to remain anonymous)

## Security Best Practices

When contributing to Validiant, please follow these security guidelines:

### Authentication & Authorization

- Never commit secrets, API keys, or passwords
- Use environment variables for sensitive data
- Implement proper JWT token validation
- Use HTTPS for all API communications
- Implement rate limiting on authentication endpoints

### Input Validation

- Validate all user input on both client and server
- Use Zod schemas for type-safe validation
- Sanitize input to prevent XSS attacks
- Use parameterized queries to prevent SQL injection

### Data Protection

- Encrypt sensitive data at rest
- Use HTTPS/TLS for data in transit
- Implement proper CORS policies
- Follow the principle of least privilege
- Regularly update dependencies

### Frontend Security

- Avoid using `dangerouslySetInnerHTML`
- Sanitize user-generated content
- Implement Content Security Policy (CSP)
- Use secure HTTP headers

### Backend Security

- Validate all API inputs
- Implement rate limiting
- Use prepared statements for database queries
- Log security events
- Keep dependencies updated

## Security Tools

We use the following tools to maintain security:

- **Dependabot**: Automated dependency updates
- **Snyk**: Vulnerability scanning
- **ESLint**: Static code analysis
- **OWASP ZAP**: Security testing

## Security Updates

Security updates will be released as soon as possible after a vulnerability is confirmed. We will:

1. Release a patch version
2. Update the CHANGELOG
3. Publish a security advisory
4. Notify users via GitHub and email

## Hall of Fame

We appreciate security researchers who help us keep Validiant secure. Responsible disclosure reporters will be credited here:

- (No reports yet)

Thank you for helping keep Validiant and our users safe!
