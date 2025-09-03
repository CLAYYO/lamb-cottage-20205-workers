# Cloudflare Pages Deployment Guide for Pages CMS

This guide provides step-by-step instructions for deploying Pages CMS to Cloudflare Pages instead of Vercel.

## 1. Prerequisites

- GitHub repository with Pages CMS code
- Cloudflare account (free tier available)
- GitHub App configured (see GITHUB_APP_SETUP.md)
- Supabase database setup (see SUPABASE_SETUP.md)
- Resend email service configured

## 2. Create Cloudflare Pages Project

### 2.1 Initial Setup
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** in the left sidebar
3. Click **Create a project**
4. Select **Connect to Git**
5. Choose **GitHub** and authorize Cloudflare to access your repositories
6. Select your Pages CMS repository

### 2.2 Build Configuration
Configure the following build settings:

| Setting | Value |
|---------|-------|
| **Framework preset** | Next.js |
| **Build command** | `npm run build` |
| **Build output directory** | `.next` |
| **Root directory** | `/` (or your project root) |
| **Node.js version** | 18.x or 20.x |

### 2.3 Environment Variables
Add the following environment variables in **Settings > Environment variables**:

#### GitHub App Configuration
```
GITHUB_APP_ID=your_app_id
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_PRIVATE_KEY=your_private_key_base64
GITHUB_INSTALLATION_ID=your_installation_id
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

#### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Resend Email Configuration
```
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
```

#### Pages CMS Configuration
```
NEXTAUTH_URL=https://your-pages-cms.pages.dev
NEXTAUTH_SECRET=your_nextauth_secret_32_chars_min
REPO_OWNER=your_github_username
REPO_NAME=your_repository_name
REPO_BRANCH=main
```

## 3. Custom Domain Setup (Optional)

### 3.1 Add Custom Domain
1. In your Cloudflare Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `cms.yourdomain.com`)
4. Follow the DNS configuration instructions

### 3.2 Update Environment Variables
After setting up a custom domain, update:
```
NEXTAUTH_URL=https://cms.yourdomain.com
```

## 4. Update GitHub App Webhook URL

### 4.1 Get Your Cloudflare Pages URL
Your deployment URL will be:
- **Default**: `https://your-project-name.pages.dev`
- **Custom domain**: `https://cms.yourdomain.com`

### 4.2 Update GitHub App Settings
1. Go to your GitHub App settings
2. Update the **Webhook URL** to:
   ```
   https://your-pages-cms-domain/api/webhooks/github
   ```
3. Save the changes

## 5. Cloudflare Pages Specific Configuration

### 5.1 Next.js Compatibility
Cloudflare Pages supports Next.js with some limitations:
- Static generation works fully
- Server-side rendering is supported via Edge Runtime
- Node.js APIs may have limitations

### 5.2 Build Optimization
Add to your `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for better Cloudflare Pages compatibility
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Disable server-side features that don't work on Cloudflare Pages
  experimental: {
    runtime: 'edge'
  }
}

module.exports = nextConfig
```

### 5.3 Functions Directory
For API routes, create a `functions` directory in your project root:
```
functions/
├── api/
│   ├── auth/
│   ├── content/
│   └── webhooks/
```

## 6. Deployment Process

### 6.1 Automatic Deployment
1. Push changes to your GitHub repository
2. Cloudflare Pages automatically triggers a build
3. Monitor the build process in the Cloudflare dashboard
4. Deployment completes in 2-5 minutes

### 6.2 Manual Deployment
1. Go to your Cloudflare Pages project
2. Click **Create deployment**
3. Select the branch to deploy
4. Click **Save and Deploy**

## 7. Post-Deployment Verification

### 7.1 Test Basic Functionality
1. Visit your Pages CMS URL
2. Test GitHub OAuth login
3. Verify repository connection
4. Test content editing and saving

### 7.2 Test Webhooks
1. Make a commit to your repository
2. Check if the webhook is received
3. Verify content updates are reflected

### 7.3 Monitor Logs
- Use Cloudflare Pages **Functions** tab to view logs
- Check for any runtime errors
- Monitor performance metrics

## 8. Troubleshooting

### 8.1 Common Issues

**Build Failures:**
- Check Node.js version compatibility
- Verify all environment variables are set
- Review build logs for specific errors

**Runtime Errors:**
- Ensure API routes are compatible with Edge Runtime
- Check for Node.js-specific APIs that need alternatives
- Verify environment variables are accessible

**GitHub Integration Issues:**
- Confirm webhook URL is correctly set
- Verify GitHub App permissions
- Check webhook secret configuration

### 8.2 Performance Optimization
- Enable Cloudflare caching for static assets
- Use Cloudflare Images for image optimization
- Configure appropriate cache headers

## 9. Cost Considerations

### 9.1 Cloudflare Pages Pricing
- **Free Tier**: 1 build per minute, 500 builds/month
- **Pro Plan**: $20/month for unlimited builds
- **Business/Enterprise**: Advanced features and support

### 9.2 Additional Services
- **Cloudflare Images**: $5/month for 100k transformations
- **Workers KV**: $0.50 per million reads
- **Custom domains**: Free with Cloudflare DNS

## 10. Migration from Vercel

If migrating from Vercel:
1. Export environment variables from Vercel
2. Update `next.config.js` for Cloudflare compatibility
3. Test all functionality in staging environment
4. Update DNS records to point to Cloudflare Pages
5. Monitor for any issues post-migration

## 11. Next Steps

After successful deployment:
1. Configure content migration (see CONTENT_MIGRATION.md)
2. Set up monitoring and alerts
3. Train team members on the new CMS
4. Plan legacy system removal

---

**Note**: This guide assumes you're using the latest version of Pages CMS. Some features may require specific configuration for Cloudflare Pages compatibility.