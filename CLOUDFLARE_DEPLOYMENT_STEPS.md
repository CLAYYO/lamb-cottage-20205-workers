# 🚀 Cloudflare Pages Deployment - Step by Step Guide

## Prerequisites Checklist ✅
- [x] GitHub repository: `https://github.com/CLAYYO/lambcottage2025.git`
- [x] All environment variables configured in `.env.local`
- [x] Pages CMS project structure ready
- [x] GitHub App configured with Installation ID

---

## Step 1: Access Cloudflare Pages Dashboard

1. **Login to Cloudflare**
   - Go to [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
   - Login with your Cloudflare account

2. **Navigate to Pages**
   - Click on "Pages" in the left sidebar
   - Click "Create a project" button

---

## Step 2: Connect GitHub Repository

1. **Connect to Git**
   - Select "Connect to Git"
   - Choose "GitHub" as your Git provider
   - Authorize Cloudflare to access your GitHub account if prompted

2. **Select Repository**
   - Find and select: `CLAYYO/lambcottage2025`
   - Click "Begin setup"

---

## Step 3: Configure Build Settings

**IMPORTANT: Use these exact settings for your Next.js project:**

```
Project name: lambcottage-cms
Production branch: main (or master)
Build command: npm run build
Build output directory: out
Root directory: / (leave empty)
```

**Environment Variables (Framework preset):**
- Framework preset: **Next.js (Static HTML Export)**
- Node.js version: **18** or higher

---

## Step 4: Add Environment Variables

**CRITICAL: Add ALL these environment variables in Cloudflare Pages:**

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### GitHub App Configuration
```
GITHUB_APP_ID=your-app-id
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_WEBHOOK_SECRET=your-webhook-secret
GITHUB_APP_PRIVATE_KEY=your-base64-encoded-private-key
GITHUB_INSTALLATION_ID=84118502
GITHUB_OWNER=CLAYYO
GITHUB_REPO=lambcottage2025
GITHUB_BRANCH=main
```

### Resend Email Configuration
```
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@lambcottage.co.uk
```

### NextAuth Configuration
```
NEXTAUTH_URL=https://lambcottage.co.uk
NEXTAUTH_SECRET=your-nextauth-secret
```

### Site Configuration
```
SITE_URL=https://lambcottage.co.uk
SITE_NAME=Lamb Cottage
```

**How to add variables:**
1. In build settings, scroll to "Environment variables"
2. Click "Add variable" for each one
3. Copy the exact values from your `.env.local` file

---

## Step 5: Deploy the Project

1. **Save and Deploy**
   - Click "Save and Deploy"
   - Wait for the build to complete (usually 2-5 minutes)
   - Monitor the build logs for any errors

2. **Verify Deployment**
   - Once complete, you'll get a temporary URL like: `https://lambcottage-cms.pages.dev`
   - Test this URL to ensure the site loads correctly

---

## Step 6: Configure Custom Domain

1. **Add Custom Domain**
   - In your Pages project, go to "Custom domains"
   - Click "Set up a custom domain"
   - Enter: `lambcottage.co.uk`

2. **DNS Configuration**
   - Cloudflare will provide DNS records to add
   - If your domain is already on Cloudflare, it will auto-configure
   - If not, add the provided CNAME record to your DNS provider

3. **SSL Certificate**
   - Cloudflare will automatically provision an SSL certificate
   - Wait for "Active" status (usually 5-15 minutes)

---

## Step 7: Update GitHub App Webhook

**IMPORTANT: After deployment, update your GitHub App webhook URL:**

1. Go to your GitHub App settings
2. Update webhook URL to: `https://lambcottage.co.uk/api/github/webhook`
3. Save the changes

---

## Step 8: Test CMS Functionality

1. **Access CMS**
   - Go to: `https://lambcottage.co.uk/admin`
   - Login with GitHub authentication

2. **Test Features**
   - Create a test blog post
   - Edit existing content
   - Verify file uploads work
   - Check email notifications

---

## Troubleshooting Common Issues

### Build Failures
- Check build logs in Cloudflare Pages dashboard
- Verify all environment variables are set correctly
- Ensure Node.js version is 18+

### Authentication Issues
- Verify GitHub App credentials
- Check webhook URL is correct
- Confirm Installation ID is accurate

### Domain Issues
- Verify DNS records are correct
- Wait for SSL certificate provisioning
- Check domain is not conflicting with other services

---

## Next Steps After Deployment

1. **Content Migration**
   - Import existing blog posts and pages
   - Update image paths and links
   - Configure SEO settings

2. **User Management**
   - Set up additional admin users
   - Configure user roles and permissions

3. **Monitoring**
   - Set up analytics
   - Configure error monitoring
   - Set up backup strategies

---

## Support Resources

- **Cloudflare Pages Docs**: [https://developers.cloudflare.com/pages/](https://developers.cloudflare.com/pages/)
- **Next.js Deployment**: [https://nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Pages CMS Documentation**: Check the project README

---

**🎉 Ready to deploy? Follow these steps carefully and your CMS will be live at https://lambcottage.co.uk!**