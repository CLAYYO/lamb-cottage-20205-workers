# Deployment Guide for Pages CMS

**Note**: This project now uses Cloudflare Pages for deployment. Please refer to [CLOUDFLARE_PAGES_DEPLOYMENT.md](./CLOUDFLARE_PAGES_DEPLOYMENT.md) for the current deployment instructions.

## Migration Notice

This guide has been superseded by the Cloudflare Pages deployment process. The new deployment platform offers:
- Better performance with global edge network
- Integrated with Cloudflare's security features
- Cost-effective pricing structure
- Enhanced compatibility with modern web frameworks

---

# Legacy Vercel Deployment Guide for Pages CMS

This guide will walk you through deploying Pages CMS to Vercel with all necessary environment variables and configurations.

## 1. Prerequisites

Before deploying, ensure you have completed:
- ✅ GitHub App setup
- ✅ Supabase database configuration
- ✅ Resend email service setup

## 2. Prepare Pages CMS Repository

### Step 1: Fork or Clone Pages CMS
1. Go to the [Pages CMS GitHub repository](https://github.com/pages-cms/pages-cms)
2. Click "Fork" to create your own copy
3. Or clone the repository to your GitHub account:
```bash
git clone https://github.com/pages-cms/pages-cms.git lamb-cottage-cms
cd lamb-cottage-cms
git remote set-url origin https://github.com/YOUR-USERNAME/lamb-cottage-cms.git
git push -u origin main
```

### Step 2: Install GitHub App on Repository
1. Go to your GitHub App settings (created in previous step)
2. Click "Install App" in the left sidebar
3. Select "Only select repositories"
4. Choose your `lamb-cottage-cms` repository
5. Click "Install"

## 3. Deploy to Vercel

### Step 1: Connect Vercel to GitHub
1. Go to [vercel.com](https://vercel.com)
2. Sign up or log in with your GitHub account
3. Click "New Project"
4. Import your `lamb-cottage-cms` repository
5. Configure project settings:
   - **Project Name**: `lamb-cottage-cms`
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Step 2: Configure Environment Variables
Before deploying, add all environment variables in Vercel:

1. In the Vercel project setup, scroll to "Environment Variables"
2. Add the following variables:

#### GitHub App Configuration
```env
GITHUB_APP_ID=123456
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
GITHUB_INSTALLATION_ID=12345678
GITHUB_WEBHOOK_SECRET=your-webhook-secret-here
```

#### Supabase Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project-id.supabase.co:5432/postgres
```

#### Resend Email Configuration
```env
RESEND_API_KEY=re_xxxxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@lambcottage.com
RESEND_FROM_NAME=Lamb Cottage
ADMIN_EMAIL=admin@lambcottage.com
```

#### NextAuth Configuration
```env
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-min
NEXTAUTH_URL=https://lamb-cottage-cms.vercel.app
```

#### Pages CMS Specific Configuration
```env
PAGES_CMS_REPO_OWNER=YOUR-GITHUB-USERNAME
PAGES_CMS_REPO_NAME=lamb-cottage-cms
PAGES_CMS_BRANCH=main
PAGES_CMS_CONTENT_PATH=content
```

### Step 3: Deploy
1. Click "Deploy" to start the deployment
2. Wait for the build to complete (usually 2-5 minutes)
3. Note your deployment URL: `https://lamb-cottage-cms.vercel.app`

## 4. Update GitHub App Webhook URL

### Step 1: Update Webhook Configuration
1. Go to your GitHub App settings
2. Click "General" in the left sidebar
3. Update the **Webhook URL** to:
   ```
   https://lamb-cottage-cms.vercel.app/api/webhooks/github
   ```
4. Click "Save changes"

### Step 2: Update Callback URLs
1. In the same GitHub App settings
2. Update **User authorization callback URL** to:
   ```
   https://lamb-cottage-cms.vercel.app/api/auth/callback/github
   ```
3. Update **Setup URL** to:
   ```
   https://lamb-cottage-cms.vercel.app/admin/setup
   ```
4. Click "Save changes"

## 5. Configure Custom Domain (Optional)

### Step 1: Add Custom Domain in Vercel
1. In your Vercel project dashboard, go to "Settings" > "Domains"
2. Add your custom domain: `cms.lambcottage.com`
3. Configure DNS records as instructed by Vercel

### Step 2: Update Environment Variables
1. Update `NEXTAUTH_URL` to your custom domain:
   ```env
   NEXTAUTH_URL=https://cms.lambcottage.com
   ```
2. Update GitHub App URLs to use custom domain

### Step 3: DNS Configuration
Add the following DNS records to your domain:
```
Type: CNAME
Name: cms
Value: cname.vercel-dns.com
```

## 6. Initial Setup and Testing

### Step 1: Access Pages CMS
1. Go to your deployment URL: `https://lamb-cottage-cms.vercel.app`
2. You should see the Pages CMS setup page
3. Follow the initial setup wizard

### Step 2: Create Admin User
1. Click "Sign up" or "Create Account"
2. Use your admin email address
3. Complete the registration process
4. In Supabase dashboard, update your user role to "admin"

### Step 3: Test Core Functionality
1. **Authentication**: Log in and out
2. **Content Creation**: Create a test page
3. **File Upload**: Upload a test image
4. **Email**: Test password reset functionality
5. **GitHub Integration**: Make a content change and verify it commits to GitHub

## 7. Production Configuration

### Step 1: Environment-Specific Settings
For production deployment, ensure:

```env
# Production settings
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

# Security settings
NEXTAUTH_SECRET=your-production-secret-different-from-dev

# Logging and monitoring
LOG_LEVEL=error
ENABLE_ANALYTICS=true
```

### Step 2: Security Hardening
1. **Environment Variables**: Use different secrets for production
2. **CORS**: Configure allowed origins in Supabase
3. **Rate Limiting**: Enable in Pages CMS settings
4. **HTTPS**: Ensure all URLs use HTTPS

### Step 3: Performance Optimization
1. **Caching**: Configure Vercel edge caching
2. **Images**: Set up image optimization
3. **Database**: Monitor Supabase performance
4. **CDN**: Use Vercel's global CDN

## 8. Monitoring and Maintenance

### Step 1: Set Up Monitoring
1. **Vercel Analytics**: Enable in project settings
2. **Supabase Monitoring**: Check database performance
3. **Email Delivery**: Monitor Resend dashboard
4. **Error Tracking**: Set up error logging

### Step 2: Regular Maintenance
1. **Updates**: Keep Pages CMS updated
2. **Backups**: Regular database backups
3. **Security**: Monitor for security updates
4. **Performance**: Regular performance audits

## 9. Troubleshooting

### Common Deployment Issues

**Build Failures**:
```bash
# Check build logs in Vercel dashboard
# Common fixes:
npm install  # Ensure dependencies are installed
npm run build  # Test build locally
```

**Environment Variable Issues**:
- Verify all required variables are set
- Check for typos in variable names
- Ensure secrets are properly escaped
- Redeploy after adding variables

**GitHub Integration Issues**:
- Verify GitHub App permissions
- Check webhook URL is correct
- Test webhook delivery in GitHub App settings
- Verify installation on correct repository

**Database Connection Issues**:
- Test Supabase connection string
- Check IP allowlist in Supabase (should allow all)
- Verify database credentials
- Test with service role key

### Debug Steps
1. **Check Vercel Function Logs**:
   - Go to Vercel dashboard > Functions
   - Check recent invocations and errors

2. **Test API Endpoints**:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

3. **Verify Environment Variables**:
   - Check Vercel project settings
   - Ensure all required variables are present
   - Test locally with same variables

## 10. Backup and Recovery

### Automated Backups
1. **Database**: Supabase automatic daily backups
2. **Code**: GitHub repository serves as backup
3. **Media**: Configure Supabase Storage backups
4. **Configuration**: Document all environment variables

### Recovery Procedures
1. **Database Recovery**: Use Supabase backup restoration
2. **Code Recovery**: Redeploy from GitHub
3. **Configuration Recovery**: Restore environment variables
4. **Domain Recovery**: Update DNS if needed

## 11. Scaling Considerations

### Vercel Limits (Hobby Plan)
- **Bandwidth**: 100GB/month
- **Function Executions**: 100GB-hours/month
- **Build Minutes**: 6,000 minutes/month

### Upgrade Triggers
- High traffic volumes
- Need for team collaboration
- Advanced analytics requirements
- Custom deployment configurations

## 12. Next Steps

✅ **Completed**: Pages CMS deployed to Vercel

**Next**: Migrate existing Lamb Cottage content to Pages CMS format

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Pages CMS Documentation](https://pagescms.org/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

---

**Important**: After deployment, update all webhook URLs and test the complete workflow from content creation to GitHub commits.