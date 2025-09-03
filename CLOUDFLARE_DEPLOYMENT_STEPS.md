# Cloudflare Pages Deployment Steps for Lamb Cottage CMS

## Current Status
✅ Supabase database configured
✅ Resend email service configured
✅ GitHub App created
❌ GitHub App private key needs to be added
❌ Cloudflare Pages deployment pending

## Step 1: Complete GitHub App Configuration

### 1.1 Add the GitHub App Private Key
You need to add the base64-encoded private key to your environment variables:

1. Go to your GitHub App settings: https://github.com/settings/apps
2. Click on your "Lamb Cottage CMS" app
3. Scroll down to "Private keys" section
4. Click "Generate a private key" (if you haven't already)
5. Download the `.pem` file
6. Convert it to base64:
   ```bash
   cat path/to/your-private-key.pem | base64 | tr -d '\n'
   ```
7. Copy the base64 string and update your `.env.local` file:
   ```
   GITHUB_APP_PRIVATE_KEY=your_actual_base64_encoded_private_key_here
   ```

### 1.2 Get Installation ID
1. Install your GitHub App on your repository if you haven't already
2. Go to: https://github.com/settings/installations
3. Click "Configure" next to your app
4. Note the Installation ID from the URL (e.g., `/settings/installations/12345678`)
5. Add it to your environment variables:
   ```
   GITHUB_INSTALLATION_ID=12345678
   ```

## Step 2: Prepare for Cloudflare Pages Deployment

### 2.1 Update Next.js Configuration
The Pages CMS needs to be configured for Cloudflare Pages compatibility. Update the `next.config.mjs` file in the pages-cms-evaluation folder:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages compatibility
  experimental: {
    runtime: 'edge'
  },
  images: {
    unoptimized: true
  },
  // Environment variables for build
  env: {
    CUSTOM_KEY: 'my-value',
  },
}

export default nextConfig
```

### 2.2 Create Production Environment Variables File
Create a file with all the environment variables needed for Cloudflare Pages:

```env
# GitHub App Configuration
GITHUB_APP_ID=1889189
GITHUB_CLIENT_ID=Iv23lih0ogyX94Q1ZGRN
GITHUB_CLIENT_SECRET=447932d75f45dc687db2dd190d2df8073bae33eb
GITHUB_APP_PRIVATE_KEY=[YOUR_BASE64_PRIVATE_KEY]
GITHUB_WEBHOOK_SECRET=88c3adc521de16c5ead96a87e09ad126d569077a8bb350d67731c6f67fab0736
GITHUB_INSTALLATION_ID=[YOUR_INSTALLATION_ID]
GITHUB_OWNER=nickroberts
GITHUB_REPO=lamb-cottage-2025
GITHUB_BRANCH=main

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://okmefogqzhnivtnpqlrc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbWVmb2dxemhuaXZ0bnBxbHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODg0MDgsImV4cCI6MjA3MjQ2NDQwOH0.WRH1bN2qSxIt2YWMAfiFbTL0CevMAK_wjuMFPs78U-E
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbWVmb2dxemhuaXZ0bnBxbHJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg4ODQwOCwiZXhwIjoyMDcyNDY0NDA4fQ.oHAarmc-Exo9rhe2LLUJZbgXzDg3laDiNUXPbphgRiE

# Resend Email Configuration
RESEND_API_KEY=re_KfRMFBEi_5aSGr92JWFpZEhJAjcpforuJ
RESEND_FROM_EMAIL=noreply@lambcottage.co.uk

# Pages CMS Configuration (will be updated after deployment)
NEXTAUTH_URL=https://lamb-cottage-cms.pages.dev
NEXTAUTH_SECRET=88c3adc521de16c5ead96a87e09ad126d569077a8bb350d67731c6f67fab0736

# Site Configuration
SITE_URL=https://lambcottage.co.uk
SITE_NAME=Lamb Cottage
```

## Step 3: Deploy to Cloudflare Pages

### 3.1 Create Cloudflare Pages Project
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** in the left sidebar
3. Click **Create a project**
4. Select **Connect to Git**
5. Choose **GitHub** and authorize Cloudflare
6. Select your `pages-cms-evaluation` repository (or fork it first)

### 3.2 Configure Build Settings
- **Project name**: `lamb-cottage-cms`
- **Framework preset**: Next.js
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/` (or `/pages-cms-evaluation` if it's a subdirectory)
- **Node.js version**: 18.x

### 3.3 Add Environment Variables
In the Cloudflare Pages project settings, add all the environment variables from Step 2.2.

### 3.4 Deploy
1. Click **Save and Deploy**
2. Wait for the build to complete (5-10 minutes)
3. Note your deployment URL: `https://lamb-cottage-cms.pages.dev`

## Step 4: Update GitHub App Webhook URL

1. Go to your GitHub App settings
2. Update the **Webhook URL** to:
   ```
   https://lamb-cottage-cms.pages.dev/api/webhooks/github
   ```
3. Update the **User authorization callback URL** to:
   ```
   https://lamb-cottage-cms.pages.dev/api/auth/callback/github
   ```
4. Save the changes

## Step 5: Update Environment Variables

Update the following environment variables in Cloudflare Pages:
```
NEXTAUTH_URL=https://lamb-cottage-cms.pages.dev
```

## Step 6: Test the Deployment

1. Visit `https://lamb-cottage-cms.pages.dev`
2. Test GitHub OAuth login
3. Verify repository connection
4. Test content editing functionality
5. Make a test commit to verify webhooks work

## Step 7: Optional - Custom Domain

If you want to use a custom domain like `cms.lambcottage.co.uk`:

1. In Cloudflare Pages, go to **Custom domains**
2. Add `cms.lambcottage.co.uk`
3. Update DNS records as instructed
4. Update environment variables with the new domain
5. Update GitHub App URLs with the new domain

## Troubleshooting

### Common Issues:
1. **Build failures**: Check Node.js version and environment variables
2. **GitHub authentication issues**: Verify private key is correctly base64 encoded
3. **Webhook failures**: Ensure webhook URL is correctly set in GitHub App
4. **Database connection issues**: Verify Supabase credentials

### Next Steps After Deployment:
1. Test all CMS functionality
2. Migrate existing content
3. Set up monitoring and backups
4. Configure custom domain (optional)
5. Remove old admin system

---

**Ready to proceed?** Start with Step 1.1 to add your GitHub App private key, then we can move forward with the Cloudflare Pages deployment.