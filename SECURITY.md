# Security Policy

## Supported Versions

We release patches for security vulnerabilities only in the latest version. Since this app is not a dependency to anything, you should always keep it up to date.

## Reporting a Vulnerability

The GameFeeder team takes security issues seriously. We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **GitHub Security Advisory** (Preferred)
   - Navigate to the [Security tab](https://github.com/GameFeeder/GameFeeder/security)
   - Click "Report a vulnerability"
   - Fill out the form with details about the vulnerability

2. **Email**
   - Send an email describing the vulnerability to the repository maintainers
   - Include as much information as possible (see below)

### What to Include in Your Report

Please include the following information to help us better understand the nature and scope of the issue:

- Type of issue (e.g., API token exposure, injection vulnerability, authentication bypass)
- Full paths of source file(s) related to the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it
- Any special configuration required to reproduce the issue

### What to Expect

After you submit a report, here's what will happen:

1. **Acknowledgment**: We'll acknowledge receipt of your vulnerability report within 48 hours
2. **Assessment**: We'll investigate and validate the vulnerability within 7 days
3. **Updates**: We'll keep you informed about our progress toward a fix
4. **Resolution**: Once the vulnerability is resolved, we'll notify you
5. **Disclosure**: We'll coordinate with you on the appropriate disclosure timeline

We ask that you:
- Give us reasonable time to investigate and mitigate the issue before public disclosure
- Make a good faith effort to avoid privacy violations, data destruction, and service interruption
- Do not access or modify data that doesn't belong to you

## Security Best Practices for Contributors

### API Keys and Secrets

- **Never commit API keys, tokens, or credentials** to the repository
- Use environment variables for all sensitive configuration
- Review the `.gitignore` file to ensure sensitive files are excluded
- Use the provided `.env.example` as a template, never commit actual `.env` files

### Dependencies

- Regularly update dependencies to patch known vulnerabilities
- Run `npm audit` before submitting pull requests
- Review security advisories for all dependencies
- Consider using `npm audit fix` for automated fixes

### Code Review

- All code changes require review before merging
- Security-sensitive changes require additional scrutiny
- Use static analysis tools to identify potential security issues
- Follow the principle of least privilege in all code

### Discord and Telegram Bot Security

When working with bot functionality:

- **Validate all user input** before processing
- **Sanitize data** before sending to Discord/Telegram APIs
- **Rate limit** commands to prevent abuse
- **Implement proper permission checks** before executing admin commands
- **Never log or store** user messages unless absolutely necessary
- **Handle errors gracefully** without exposing sensitive information

### Database Security

- Use parameterized queries to prevent injection attacks
- Encrypt sensitive data at rest
- Implement proper access controls
- Regularly backup data with encryption
- Sanitize all data before storage

### Infrastructure Security

- Keep Docker images updated
- Use minimal base images to reduce attack surface
- Run containers with non-root users when possible
- Implement network segmentation
- Monitor logs for suspicious activity

## Security Features

GameFeeder implements the following security measures:

- **Input validation**: All user commands and inputs are validated
- **Rate limiting**: Commands are rate-limited to prevent abuse
- **Permission system**: Role-based access control for admin commands
- **Minimal data collection**: We only store channel IDs for active subscriptions
- **Data deletion**: Users can remove all stored data by unsubscribing
- **Secure communication**: All API communications use HTTPS/WSS
- **Dependency scanning**: Automated vulnerability scanning via GitHub Dependabot

## Privacy and Data Handling

Please refer to our [Privacy section in the README](./README.md#privacy) for information about data collection and storage.

Key points:
- We only store channel IDs for active subscriptions and custom prefixes
- All data is stored unencrypted (channel IDs are not sensitive)
- Users can delete their data by unsubscribing and resetting prefixes
- We do not store user messages or personal information

## Security Updates

Security updates will be released as soon as possible after a vulnerability is confirmed. Updates will be communicated through:

- GitHub Security Advisories
- Release notes
- Discord server announcements (if applicable)

## Attribution

We believe in giving credit to security researchers who help improve our project. With your permission, we will acknowledge your contribution in:
- Release notes
- Security advisories
- Contributors list

Please let us know if you prefer to remain anonymous.

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Discord Developer Documentation - Security](https://discord.com/developers/docs/topics/oauth2#bot-authorization-flow)
- [Telegram Bot Security Best Practices](https://core.telegram.org/bots/tutorial#security)

## Questions?

If you have questions about this security policy or need clarification, please open a discussion in the GitHub Discussions section or reach out through our Discord server.

---

Thank you for helping keep GameFeeder and its users safe!
