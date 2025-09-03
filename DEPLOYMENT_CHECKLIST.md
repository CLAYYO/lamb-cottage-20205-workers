# Cloudflare Pages Deployment Checklist

## Pre-Deployment Setup ✅
- [x] GitHub App configured with all credentials
- [x] Supabase database connected
- [x] Resend email API configured
- [x] Environment variables prepared
- [x] Next.js configuration updated for static export
- [x] Build settings documented

## Cloudflare Pages Deployment Steps

### 1. Create Cloudflare Pages Project
- [ ] Login to Cloudflare Dashboard
- [ ] Navigate to Pages section
- [ ] Click "Create a project"
- [ ] Select "Connect to Git"
- [ ] Choose GitHub and authorize
- [ ] Select repository: `lamb-cottage-2025`

### 2. Configure Build Settings
- [ ] Project name: `lamb-cottage-cms`
- [ ] Production branch: `main`
- [ ] Framework preset: `Next.js (Static HTML Export)`
- [ ] Build command: `npm run build`
- [ ] Build output directory: `out`
- [ ] Root directory: `pages-cms-evaluation`
- [ ] Node.js version: `18` or `20`

### 3. Add Environment Variables
Copy from `CLOUDFLARE_ENV_VARIABLES.txt`:
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] GITHUB_APP_ID
- [ ] GITHUB_CLIENT_ID
- [ ] GITHUB_CLIENT_SECRET
- [ ] GITHUB_APP_PRIVATE_KEY
- [ ] GITHUB_WEBHOOK_SECRET
- [ ] GITHUB_OWNER
- [ ] GITHUB_REPO
- [ ] GITHUB_BRANCH
- [ ] GITHUB_INSTALLATION_ID
- [ ] RESEND_API_KEY
- [ ] RESEND_FROM_EMAIL
- [ ] NEXTAUTH_URL
- [ ] NEXTAUTH_SECRET
- [ ] SITE_URL
- [ ] SITE_NAME

### 4. Deploy Project
- [ ] Click "Save and Deploy"
- [ ] Monitor build logs for errors
- [ ] Verify deployment at `.pages.dev` URL
- [ ] Test basic functionality

### 5. Custom Domain Setup
- [ ] Go to "Custom domains" tab
- [ ] Click "Set up a custom domain"
- [ ] Enter: `lambcottage.co.uk`
- [ ] Verify DNS configuration
- [ ] Wait for SSL certificate provisioning
- [ ] Test `https://lambcottage.co.uk`

### 6. Post-Deployment Configuration
- [ ] Update GitHub App webhook URL to: `https://lambcottage.co.uk/api/webhooks/github`
- [ ] Test GitHub authentication
- [ ] Test content creation/editing
- [ ] Verify email notifications
- [ ] Test responsive design

### 7. Performance & Security
- [ ] Enable Cloudflare caching rules
- [ ] Configure security headers
- [ ] Set up analytics
- [ ] Configure uptime monitoring

## Troubleshooting Resources
- `CLOUDFLARE_PAGES_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `CLOUDFLARE_ENV_VARIABLES.txt` - Environment variables list
- Build logs in Cloudflare Pages dashboard
- GitHub App settings for webhook configuration

## Success Criteria
- [ ] CMS loads at `https://lambcottage.co.uk`
- [ ] GitHub authentication works
- [ ] Content can be created and edited
- [ ] Changes commit to GitHub repository
- [ ] Email notifications function (if configured)
- [ ] Site is responsive on all devices

---

**Next Steps After Deployment:**
1. Content migration from existing site
2. User training and documentation
3. Backup and monitoring setup
4. Performance optimization

**Support:** Refer to the deployment guide for detailed instructions and troubleshooting tips.