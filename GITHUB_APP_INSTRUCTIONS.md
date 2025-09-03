# 🎯 PAGES CMS DEPLOYMENT - GITHUB APP SETUP

## ✅ Current Status
- Supabase Database: Connected
- Resend Email: Configured  
- Security Keys: Generated
- Pages CMS Environment: Ready

## 📋 NEXT STEP: Create GitHub App

### 1️⃣ Navigate to GitHub App Creation
Go to: https://github.com/settings/apps
Click **New GitHub App**

### 2️⃣ Fill in App Details
- **Name**: `Pages CMS - Lamb Cottage`
- **Description**: `Content management for Lamb Cottage`
- **Homepage URL**: `https://lambcottage.co.uk`
- **User authorization callback URL**: `https://your-cms.pages.dev/api/auth/callback`
- **Webhook URL**: `https://your-cms.pages.dev/api/webhooks/github`

### 3️⃣ Set Permissions
**Repository permissions:**
- Contents: **Read & Write**
- Metadata: **Read**
- Pull requests: **Read & Write**

### 4️⃣ Subscribe to Events
- ✅ Push
- ✅ Pull request  
- ✅ Installation

### 5️⃣ After Creation
1. **Generate private key** (download .pem file)
2. **Install app** on your Lamb Cottage repository
3. **Note these values:**
   - App ID (from app settings page)
   - Installation ID (from installation URL)
   - Client ID (from app settings)
   - Client Secret (generate if needed)
   - Webhook Secret (generate random string)

### 6️⃣ Convert Private Key
```bash
# Convert the downloaded .pem file to base64
cat your-app-name.*.private-key.pem | base64
```

## 🚀 Ready for Next Steps
Once you have all the GitHub App details, I'll help you:
1. Update the environment variables
2. Deploy to Cloudflare Pages
3. Test the CMS functionality
4. Migrate your content

---
**Need help?** Just let me know when you have the GitHub App created!