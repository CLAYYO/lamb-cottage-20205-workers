# Cloudflare Pages Deployment Guide for Pages CMS

This guide will walk you through deploying your Pages CMS to Cloudflare Pages with custom domain configuration.

## Prerequisites

✅ GitHub repository with Pages CMS code
✅ All environment variables configured in `.env.local`
✅ Cloudflare account with domain management access
✅ Domain `lambcottage.co.uk` managed by Cloudflare

## Step 1: Create Cloudflare Pages Project

1. **Login to Cloudflare Dashboard**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Navigate to **Pages** in the left sidebar

2. **Create New Project**
   - Click **"Create a project"**
   - Select **"Connect to Git"**
   - Choose **GitHub** as your Git provider
   - Authorize Cloudflare to access your GitHub account

3. **Select Repository**
   - Find and select your Pages CMS repository
   - Click **"Begin setup"**

## Step 2: Configure Build Settings

### Project Configuration
- **Project name**: `lamb-cottage-cms` (or your preferred name)
- **Production branch**: `main`

### Build Settings for Astro
- **Framework preset**: `Astro`
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave empty)

### Advanced Build Settings
- **Node.js version**: `18` or `20`
- **Environment variables**: (Configure in next step)

## Step 3: Environment Variables Configuration

Add the following environment variables in Cloudflare Pages:

### Supabase Configuration
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### GitHub App Configuration
```
GITHUB_APP_ID=your_app_id
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_APP_PRIVATE_KEY=your_base64_encoded_private_key
GITHUB_INSTALLATION_ID=84118502
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repository_name
GITHUB_BRANCH=main
```

### Resend Email Configuration
```
RESEND_API_KEY=your_resend_api_key
```

### NextAuth Configuration
```
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://lambcottage.co.uk
```

### Site Configuration
```
SITE_URL=https://lambcottage.co.uk
SITE_NAME=Lamb Cottage CMS
```

## Step 4: Deploy Project

1. **Review Configuration**
   - Verify all build settings are correct
   - Ensure all environment variables are added

2. **Deploy**
   - Click **"Save and Deploy"**
   - Wait for the initial build to complete (5-10 minutes)
   - Monitor build logs for any errors

3. **Verify Deployment**
   - Check the provided `.pages.dev` URL
   - Test basic CMS functionality

## Step 5: Custom Domain Configuration

### Add Custom Domain
1. **In Cloudflare Pages**
   - Go to your project dashboard
   - Click **"Custom domains"** tab
   - Click **"Set up a custom domain"**
   - Enter: `lambcottage.co.uk`
   - Click **"Continue"**

2. **DNS Configuration**
   - Cloudflare will automatically configure DNS records
   - Verify the CNAME record points to your Pages project
   - SSL certificate will be automatically provisioned

### Domain Verification
- Wait 5-15 minutes for DNS propagation
- Verify `https://lambcottage.co.uk` loads your CMS
- Check SSL certificate is active

## Step 6: Post-Deployment Configuration

### Update GitHub App Webhook URL
1. Go to GitHub App settings
2. Update webhook URL to: `https://lambcottage.co.uk/api/webhooks/github`
3. Verify webhook is receiving events

### Test CMS Functionality
- [ ] Login with GitHub authentication
- [ ] Create/edit content
- [ ] Verify file commits to repository
- [ ] Test email notifications (if configured)
- [ ] Check responsive design on mobile/desktop

## Step 7: Production Optimizations

### Performance
- Enable Cloudflare caching rules
- Configure appropriate cache headers
- Enable Brotli compression

### Security
- Review and configure security headers
- Set up rate limiting if needed
- Enable bot protection

### Monitoring
- Set up Cloudflare Analytics
- Configure uptime monitoring
- Set up error tracking

## Troubleshooting

### Common Build Issues
- **Node.js version mismatch**: Ensure Node 18+ is selected
- **Missing dependencies**: Check `package.json` includes all required packages
- **Environment variable errors**: Verify all variables are set correctly
- **Astro build errors**: Ensure Cloudflare adapter is properly configured in `astro.config.mjs`

### Runtime Issues
- **GitHub authentication fails**: Check GitHub App configuration
- **Database connection errors**: Verify Supabase credentials
- **Email sending fails**: Check Resend API key

### DNS Issues
- **Domain not resolving**: Wait for DNS propagation (up to 24 hours)
- **SSL certificate issues**: Check domain ownership verification
- **Mixed content warnings**: Ensure all resources use HTTPS

## Next Steps After Deployment

1. **Content Migration**
   - Import existing content structure
   - Set up content templates
   - Configure media management

2. **User Management**
   - Set up additional GitHub collaborators
   - Configure user roles and permissions
   - Test multi-user editing workflows

3. **Backup Strategy**
   - Configure automated backups
   - Set up content versioning
   - Test restore procedures

## Support Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Pages CMS Documentation](https://pagescms.org/docs/)

---

**Deployment Checklist:**
- [ ] Cloudflare Pages project created
- [ ] Build settings configured
- [ ] All environment variables added
- [ ] Initial deployment successful
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] GitHub webhook updated
- [ ] CMS functionality tested
- [ ] Performance optimized
- [ ] Monitoring configured

**Your Pages CMS will be live at: https://lambcottage.co.uk**