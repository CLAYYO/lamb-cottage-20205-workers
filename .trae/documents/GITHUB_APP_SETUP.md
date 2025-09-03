# GitHub App Setup Guide for Pages CMS

This guide provides step-by-step instructions for creating and configuring a GitHub App to enable Pages CMS integration with your repository for content management.

## 1. Prerequisites

* GitHub account with repository access

* Pages CMS project ready for deployment

* Admin access to the repository where Pages CMS will be deployed

## 2. Create GitHub App

### 2.1 Navigate to GitHub App Creation

1. Go to GitHub and sign in to your account
2. Navigate to **Settings** > **Developer settings** > **GitHub Apps**
3. Click **New GitHub App**

### 2.2 Basic App Information

Fill in the following details:

**GitHub App name**: `Pages CMS - Lamb Cottage`
**Description**: `Content management system for Lamb Cottage website`
**Homepage URL**: `https://your-domain.com` (or your actual website URL)
**User authorization callback URL**: `https://your-cms.pages.dev/api/auth/callback`

### 2.3 Webhook Configuration

**Webhook URL**: `https://your-cms.pages.dev/api/webhooks/github`

**Webhook secret**: Generate a secure random string (save this for environment variables)

```bash
# Generate webhook secret (save this value)
openssl rand -hex 32
```

**SSL verification**: ✅ Enable SSL verification

### 2.4 Repository Permissions

Set the following permissions for your GitHub App:

**Repository permissions:**

* **Contents**: Read & Write (to manage content files)

* **Metadata**: Read (to access repository information)

* **Pull requests**: Read & Write (for content review workflow)

* **Issues**: Read & Write (for content management tasks)

**Account permissions:**

* **Email addresses**: Read (for user identification)

### 2.5 Subscribe to Events

Select the following webhook events:

**Repository events:**

* ✅ **Push** (to detect content changes)

* ✅ **Pull request** (for content review workflow)

* ✅ **Issues** (for content management)

* ✅ **Repository** (for repository changes)

**User events:**

* ✅ **Installation** (when app is installed/uninstalled)

* ✅ **Installation repositories** (when repositories are added/removed)

### 2.6 Installation Settings

**Where can this GitHub App be installed?**

* Select **Only on this account** (recommended for private use)

* Or **Any account** (if you plan to make it public)

### 2.7 Create the App

1. Review all settings
2. Click **Create GitHub App**
3. Note down the **App ID** (you'll need this for environment variables)

## 3. Generate Private Key

### 3.1 Create Private Key

1. After creating the app, scroll down to **Private keys**
2. Click **Generate a private key**
3. A `.pem` file will be downloaded automatically
4. **Important**: Store this file securely - it cannot be regenerated

### 3.2 Prepare Private Key for Environment Variables

```bash
# Convert private key to base64 for environment variable
cat your-app-name.2024-01-01.private-key.pem | base64
```

Save the base64 output for your environment variables.

## 4. Install GitHub App

### 4.1 Install on Repository

1. Go to your GitHub App settings page
2. Click **Install App** in the left sidebar
3. Select your account
4. Choose **Selected repositories**
5. Select your Lamb Cottage repository
6. Click **Install**

### 4.2 Get Installation ID

After installation, note the Installation ID from the URL:
`https://github.com/settings/installations/12345678`
(The number `12345678` is your Installation ID)

## 5. Environment Variables Configuration

Add these environment variables to your Pages CMS deployment:

```env
# GitHub App Configuration
GITHUB_APP_ID=123456
GITHUB_APP_INSTALLATION_ID=12345678
GITHUB_APP_PRIVATE_KEY=LS0tLS1CRUdJTi... (base64 encoded private key)
GITHUB_WEBHOOK_SECRET=your-webhook-secret-here

# Repository Configuration
GITHUB_OWNER=your-username
GITHUB_REPO=lamb-cottage-2025
GITHUB_BRANCH=main

# Content Configuration
CONTENT_PATH=content
IMAGES_PATH=public/images
```

## 6. Webhook Endpoint Implementation

Pages CMS will automatically handle these webhook events:

### 6.1 Supported Events

* **push**: Sync content changes from repository

* **pull\_request**: Handle content review workflow

* **installation**: Manage app installation

* **issues**: Handle content management tasks

### 6.2 Webhook Security

Pages CMS automatically:

* Verifies webhook signatures using the webhook secret

* Validates GitHub App installation

* Processes only authorized events

## 7. Content Management Workflow

### 7.1 Direct Editing

1. User edits content through Pages CMS interface
2. Changes are committed directly to the repository
3. Webhook notifies CMS of the change
4. Content is automatically synced

### 7.2 Review Workflow (Optional)

1. User creates content changes
2. CMS creates a pull request
3. Admin reviews and approves changes
4. Changes are merged to main branch
5. Webhook triggers content sync

## 8. Testing GitHub App Integration

### 8.1 Test Webhook Delivery

1. Go to your GitHub App settings
2. Click **Advanced** tab
3. Check **Recent Deliveries**
4. Verify webhooks are being delivered successfully

### 8.2 Test Content Operations

1. Deploy Pages CMS with GitHub App configuration
2. Try editing content through the CMS interface
3. Verify changes appear in your GitHub repository
4. Check that webhook events are processed correctly

### 8.3 Debug Webhook Issues

```bash
# Check webhook delivery status
curl -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
     https://api.github.com/app/installations/INSTALLATION_ID
```

## 9. Security Best Practices

### 9.1 Private Key Security

* Store private key as environment variable only

* Never commit private key to version control

* Use base64 encoding for environment variables

* Rotate private key periodically

### 9.2 Webhook Security

* Always verify webhook signatures

* Use HTTPS for webhook URLs

* Keep webhook secret secure

* Monitor webhook delivery logs

### 9.3 Permissions

* Use minimal required permissions

* Regularly review app permissions

* Monitor app usage and access logs

* Remove unused installations

## 10. Troubleshooting

### 10.1 Common Issues

**Webhook not receiving events:**

* Check webhook URL is accessible

* Verify SSL certificate is valid

* Confirm webhook secret matches

* Check GitHub App installation status

**Authentication failures:**

* Verify App ID is correct

* Check private key format and encoding

* Confirm installation ID is accurate

* Ensure app has required permissions

**Content sync issues:**

* Check repository permissions

* Verify branch name is correct

* Confirm content path configuration

* Review webhook event logs

### 10.2 Debug Steps

**1. Test GitHub App Authentication:**

```bash
# Generate JWT token for testing
node -e "
console.log(require('jsonwebtoken').sign(
  { iss: 'YOUR_APP_ID', iat: Math.floor(Date.now() / 1000) },
  'YOUR_PRIVATE_KEY',
  { algorithm: 'RS256', expiresIn: '10m' }
));
"
```

**2. Test Installation Access:**

```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/app/installations
```

**3. Check Webhook Deliveries:**

1. Go to GitHub App settings
2. Click **Advanced** tab
3. Review **Recent Deliveries**
4. Check response codes and error messages

## 11. Advanced Configuration

### 11.1 Custom Content Paths

Configure custom paths for different content types:

```env
# Custom content organization
PAGES_PATH=content/pages
POSTS_PATH=content/posts
MEDIA_PATH=public/uploads
CONFIG_PATH=content/config
```

### 11.2 Branch Strategy

Configure different branches for different environments:

```env
# Multi-environment setup
GITHUB_BRANCH_PROD=main
GITHUB_BRANCH_STAGING=staging
GITHUB_BRANCH_DEV=development
```

### 11.3 Content Validation

Enable content validation before commits:

```env
# Content validation settings
VALIDATE_CONTENT=true
REQUIRE_REVIEW=true
AUTO_MERGE=false
```

## 12. Integration with Other Services

### 12.1 Vercel Integration

When deploying to Vercel, the GitHub App will:

* Trigger deployments on content changes

* Provide build-time content access

* Enable preview deployments for content changes

### 12.2 Cloudflare Pages Integration

When deploying to Cloudflare Pages:

* Configure build hooks for content updates

* Set up preview environments

* Enable automatic deployments

## 13. Monitoring and Analytics

### 13.1 Webhook Monitoring

* Monitor webhook delivery success rates

* Track response times

* Alert on failed deliveries

* Log webhook events for debugging

### 13.2 Content Analytics

* Track content edit frequency

* Monitor user activity

* Analyze content performance

* Generate usage reports

## 14. Next Steps

After completing GitHub App setup:

✅ **Completed**: GitHub App created and configured

**Next Steps**:

1. Set up Supabase database for user management
2. Configure Resend email service
3. Deploy Pages CMS with all integrations
4. Test complete workflow
5. Migrate existing content

## 15. Support Resources

* [GitHub Apps Documentation](https://docs.github.com/en/developers/apps)

* [GitHub Webhooks Guide](https://docs.github.com/en/developers/webhooks-and-events/webhooks)

* [GitHub API Reference](https://docs.github.com/en/rest)

* [Pages CMS Documentation](https://pagescms.org/docs)

***

**Important**: Keep your private key and webhook secret secure. Test the integration thoroughly before using in production.

## Quick Reference

### Required Environment Variables

```env
GITHUB_APP_ID=your-app-id
GITHUB_APP_INSTALLATION_ID=your-installation-id
GITHUB_APP_PRIVATE_KEY=your-base64-encoded-private-key
GITHUB_WEBHOOK_SECRET=your-webhook-secret
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repository-name
GITHUB_BRANCH=main
```

### Webhook Events to Subscribe

* push

* pull\_request

* issues

* installation

* installation\_repositories

### Required Permissions

* Contents: Read & Write

* Metadata: Read

* Pull requests: Read & Write

* Issues: Read & Write

* Email addresses: Read

