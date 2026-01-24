# Privacy Policy

**Last Updated: January 25, 2026**

## Introduction

GameFeeder ("we", "us", "our", or "the bot") is a notification bot for Discord and Telegram that provides updates and blog posts for multiple games. This Privacy Policy explains how we collect, use, store, and protect information when you use our bot services.

By using GameFeeder, you agree to the collection and use of information in accordance with this policy.

## Information We Collect

### 1. Automatically Collected Information

When you use GameFeeder, we automatically collect the following data:

#### Discord Users
- **Channel IDs**: The unique identifier of Discord channels where the bot is configured
- **Server IDs**: The unique identifier of Discord servers (guilds) where the bot operates
- **User IDs**: Discord user IDs when you interact with bot commands (for command execution and permission verification)
- **Command Usage Data**: Information about which commands are used and when (for functionality and debugging purposes)

#### Telegram Users
- **Chat IDs**: The unique identifier of Telegram chats where the bot is configured
- **User IDs**: Telegram user IDs when you interact with bot commands (for command execution and permission verification)
- **Command Usage Data**: Information about which commands are used and when (for functionality and debugging purposes)

### 2. User-Provided Information

#### Subscription Data
- **Game Subscriptions**: Which games you have subscribed to for notifications
- **Custom Prefixes**: Custom command prefixes you have set for your server/channel
- **Channel Labels**: Optional labels set by bot administrators for debugging purposes

### 3. Information We Do NOT Collect

We want to be clear about what we **do not** collect:

- **Message Content**: We do not read, store, or process the content of user messages (except for direct bot commands)
- **Personal Information**: We do not collect names, email addresses, phone numbers, or other personally identifiable information
- **Voice or Video Data**: We do not access or store voice or video communications
- **Direct Messages**: We do not read or store DMs between users (only direct commands sent to the bot)
- **Server Member Lists**: We do not collect lists of server members
- **User Activity**: We do not track user presence, status, or activity outside of bot interactions

## How We Use Your Information

We use the collected information solely for the following purposes:

1. **Service Delivery**: To send game update notifications to channels that have subscribed to specific games
2. **Command Processing**: To execute commands and verify user permissions (admin/owner roles)
3. **Configuration Management**: To remember your game subscriptions and custom prefix settings
4. **Bot Functionality**: To respond to commands like `!games`, `!stats`, `!help`, etc.
5. **Debugging and Support**: To troubleshoot issues and provide technical support
6. **Service Improvement**: To analyze usage patterns and improve bot functionality

## Legal Basis for Processing (GDPR)

For users in the European Union, our legal basis for processing your data is:

- **Legitimate Interest** (Article 6(1)(f) GDPR): Processing is necessary for our legitimate interests in providing bot services, preventing abuse, and improving functionality
- **Consent** (Article 6(1)(a) GDPR): By adding the bot to your server or subscribing to notifications, you consent to data processing
- **Contract Performance** (Article 6(1)(b) GDPR): Processing is necessary to deliver the services you've requested

## Data Storage and Security

### Storage Location
- All data is stored on secure servers with appropriate technical and organizational security measures
- Data is stored unencrypted as it consists of non-sensitive identifiers (channel IDs, server IDs)
- We use industry-standard hosting providers with strong security practices

### Security Measures
- **Access Control**: Limited access to data by authorized personnel only
- **Secure Transmission**: All communications with Discord and Telegram APIs use HTTPS/WSS encryption
- **Regular Updates**: We keep dependencies updated to patch security vulnerabilities
- **Rate Limiting**: Protection against abuse and unauthorized access attempts
- **Input Validation**: All user inputs are validated to prevent injection attacks

### Data Retention

We retain your data as follows:

- **Active Subscription Data**: Retained while you maintain active game subscriptions
- **Custom Prefix Settings**: Retained until you reset the prefix to default
- **Channel Labels**: Retained until removed by bot administrators
- **Deleted Data**: When you unsubscribe from all feeds and reset your prefix, all associated data is removed from our systems within 30 days

## Data Sharing and Third Parties

### We DO NOT:
- Sell your data to third parties
- Share your data with advertisers
- Provide your data to data brokers
- Use your data for marketing purposes
- Share data with analytics services for tracking

### We MAY Share Data With:
- **Discord/Telegram**: We interact with their APIs to deliver notifications and respond to commands (as required for bot functionality)
- **Hosting Providers**: Our infrastructure providers who assist in operating the bot (under strict confidentiality agreements)
- **Legal Requirements**: If required by law, court order, or governmental authority to comply with legal obligations

## Your Rights and Choices

### Your Rights
You have the following rights regarding your data:

- **Right to Access**: Request information about what data we hold about you
- **Right to Deletion**: Request deletion of your data by unsubscribing from all feeds and resetting custom settings
- **Right to Rectification**: Request correction of inaccurate data
- **Right to Restriction**: Request limitation of data processing in certain circumstances
- **Right to Data Portability**: Request your data in a portable format
- **Right to Object**: Object to data processing based on legitimate interests
- **Right to Withdraw Consent**: Withdraw consent at any time by removing the bot from your server

### How to Exercise Your Rights

**To Delete Your Data:**
1. Unsubscribe from all game feeds using the `!unsubscribe <game>` command
2. Reset your custom prefix using the `!prefix !` command (or default prefix)
3. Data will be automatically removed from our systems within 30 days

**For Other Requests:**
- Join our [Discord Support Server](https://discord.gg/hFNRHE5)
- Contact us via GitHub Issues at https://github.com/GameFeeder/GameFeeder/issues
- Use the feedback button on our Discord server

## Children's Privacy

GameFeeder does not knowingly collect personal information from children under 13 (or the minimum age required in your jurisdiction). Discord and Telegram have their own age restrictions. If we become aware that we have collected data from a child under the applicable age without parental consent, we will delete that information.

## International Data Transfers

Our services may involve transferring data across international borders. For users in the European Union:
- We ensure appropriate safeguards are in place for international data transfers
- We comply with GDPR requirements for data transfers outside the EU/EEA
- We use standard contractual clauses when transferring data to third countries

## California Privacy Rights (CCPA)

If you are a California resident, you have additional rights under the California Consumer Privacy Act:

- **Right to Know**: What personal information we collect, use, and share
- **Right to Delete**: Request deletion of your personal information
- **Right to Opt-Out**: We do not sell personal information, so opt-out is not applicable
- **Right to Non-Discrimination**: We will not discriminate against you for exercising your privacy rights

To exercise these rights, contact us through our support channels.

## Cookies and Tracking

GameFeeder does not use cookies or tracking technologies. We do not track users across different websites or services.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect:
- Changes in our data practices
- New features or services
- Legal or regulatory requirements
- User feedback and best practices

When we make changes:
- The "Last Updated" date at the top will be revised
- Significant changes will be announced in our Discord server
- Continued use of the bot after changes constitutes acceptance

We encourage you to review this Privacy Policy periodically.

## Discord Privileged Intents

GameFeeder requests the following Discord privileged intents:

### Server Members Intent
- **Purpose**: To verify user permissions (admin/owner) for restricted commands
- **Data Accessed**: Server member information to check roles and permissions
- **Why Necessary**: Required to ensure only authorized users can modify bot settings (subscribe/unsubscribe, change prefix)

### Message Content Intent
- **Status**: NOT REQUIRED
- **Usage**: GameFeeder operates using slash commands and mentions, and does not require access to message content beyond direct commands

### Presence Intent
- **Status**: NOT REQUIRED
- **Usage**: GameFeeder does not track user presence or activity

## Open Source Transparency

GameFeeder is open source software licensed under GPL-3.0. You can:
- Review our source code at https://github.com/GameFeeder/GameFeeder
- Verify our data collection practices
- Submit security reports for vulnerabilities
- Contribute to improving privacy and security

## Third-Party Services

GameFeeder relies on the following external services:

1. **Discord API**: For Discord bot functionality (subject to [Discord's Privacy Policy](https://discord.com/privacy))
2. **Telegram API**: For Telegram bot functionality (subject to [Telegram's Privacy Policy](https://telegram.org/privacy))
3. **Game Publishers**: We fetch publicly available update information from game publishers' websites and RSS feeds

We are not responsible for the privacy practices of these third-party services.

## Data Breach Notification

In the unlikely event of a data breach that affects your personal information:
- We will notify affected users within 72 hours of discovering the breach
- We will notify relevant supervisory authorities as required by law
- We will take immediate steps to contain and remediate the breach
- We will provide information about what happened and what steps you should take

## Contact Information

If you have questions, concerns, or requests about this Privacy Policy or our data practices, please contact us:

- **Discord Support Server**: https://discord.gg/hFNRHE5
- **GitHub Issues**: https://github.com/GameFeeder/GameFeeder/issues
- **GitHub Discussions**: https://github.com/GameFeeder/GameFeeder/discussions
- **Email**: [Create an issue on GitHub for privacy inquiries]

For security vulnerabilities, please see our [Security Policy](https://github.com/GameFeeder/GameFeeder/blob/main/SECURITY.md).

## Compliance and Certifications

GameFeeder is committed to compliance with:
- **GDPR** (General Data Protection Regulation) - EU
- **CCPA** (California Consumer Privacy Act) - California, USA
- **Discord Developer Terms** and **Developer Policy**
- **Telegram Bot API Terms** of Service

## Acceptance of This Policy

By using GameFeeder, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.

---

**GameFeeder is not affiliated with any games or corporations it posts updates for.**

Game trademarks belong to their respective owners:
- Artifact, CS:GO, Dota 2, Steam, Team Fortress 2, and Dota Underlords are registered trademarks of Valve Corporation
- Other game names and trademarks are property of their respective owners

This bot is a community project and is not officially endorsed by any game publisher.
