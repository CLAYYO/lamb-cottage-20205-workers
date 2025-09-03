# Cloudflare Pages Deployment Guide - lambcottage2025

## Step 1: Create Cloudflare Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** in the left sidebar
3. Click **Create a project**
4. Select **Connect to Git**

## Step 2: Connect GitHub Repository

1. Select **GitHub** as your Git provider
2. If not already connected, authorize Cloudflare to access your GitHub account
3. Select the repository: **nickroberts/lamb-cottage-2025**
4. Click **Begin setup**

## Step 3: Configure Build Settings

**Project Name:** `lambcottage2025`

**Build Configuration:**
- **Framework preset:** Astro
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/` (leave empty)
- **Node.js version:** 18.x or higher

**Advanced Settings:**
- **Environment variables:** (Add all variables from Step 4)
- **Build timeout:** 30 minutes
- **Compatibility date:** 2024-01-01

## Step 4: Environment Variables

Add these environment variables in the Cloudflare Pages dashboard:

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://okmefogqzhnivtnpqlrc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbWVmb2dxemhuaXZ0bnBxbHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODg0MDgsImV4cCI6MjA3MjQ2NDQwOH0.WRH1bN2qSxIt2YWMAfiFbTL0CevMAK_wjuMFPs78U-E
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbWVmb2dxemhuaXZ0bnBxbHJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg4ODQwOCwiZXhwIjoyMDcyNDY0NDA4fQ.oHAarmc-Exo9rhe2LLUJZbgXzDg3laDiNUXPbphgRiE
```

### GitHub App Configuration
```
GITHUB_APP_ID=1889189
GITHUB_CLIENT_ID=Iv23lih0ogyX94Q1ZGRN
GITHUB_CLIENT_SECRET=447932d75f45dc687db2dd190d2df8073bae33eb
GITHUB_APP_PRIVATE_KEY=LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb3dJQkFBS0NBUUVBdVg4VGNqZGNGZGNOdVg2bGNZZkJDZG5DaEs3cXV2RmU5d05LRWg5akU1cURTYkR6VU1yZGhIeE0zLwo2NmZoVXNSeWFMSEhVWnk4YjM3RXBramVaaTM5Vmw3MG1KUThNZ0ZFRTFsbk1EZFhzUEJHUEVjMGkyWUpMRmg5CmJqQmxtMngxR1RQMUZkNGtpZG1KN2NFYmZhNlY2N3lyRUJQYmIzOGNlczVYYzFOMVRidXNrQzlJd0tNMXZ1K0MKK0NIOGVXeGxya05KcmppUmExc3dHYnN2RzU5SlpXblJTczdlNlFJREFRQUJBb0lCQUgxQjZaU3RWM2VSVWoycAp6citxaTJlamhGVFBrOXBCenBNZU9vemlkZ3J0S2MzYlhXYXd2cDZPbk1xaHVNTTk5OStwMU9kT1gxR09LS2psCm1hM2VTYmI0K1cyWThnRXBtNEJQU1VjOUs3UnRRcDZkelJUd3EzZU96eDJZTXVNbzdRYzZYZnlqYms4aGR5dHkKQ1gxWXpxNXhoWnEzdHg3ZHRkcFhGMDlFSGdvNUxKTWpMZkRlalhsM09FVW8xbWdac21pU1laTzUrWXFMRWpDNAp1MnlFY2lzZGI3NFFMZTZHQ0NIOHBYb1ZqdkVRK0RNWi8wQzlRQnR0Tk02QzllUnFubXA5VWxoeDJPOWtXWUtOCnN5SFBsUVExSXVuOENheXJvUmU3eHFiR3V6dVdHSWRKbmdobkVMWjEweHR4cERPbnlmNEdNSjF3RndWaExqZXUKcDFaUWlWRUNnWUVBOU1rMlJQRytObFVJQUZJdGY4VU15V3hFaHgwcHJTY3VBWEw3RDAvOWJJKy82R3dkSkVMRQpNRFJ6RnZqL1FwU0t1UTNWNkxMZ3VVS1V2WUxlbVBueTNocnlZT2hDSGxPQUtDK1FzeWVBOSt5dWpzcWNQMGg0CnVQRkZ3TzdxL2ZjTmtHeDBzc3lyN2ZaRkw1T3EyV1RZSitRY3BOUmdQQUxkZUZWaVAwMEEwcFVDZ1lFQTJNb0MKL3JycmJqWkRkdTFxTXJibHhMbWt4aXNTcm82SFROdHp6QjJlMnR2bTB1Z2xVYXNoaERuRGw4QUFCV3NZV3ZqNwpoQ2lRYjNkMDEyTkttQVQ2MFJ2TndZSFllV3hyeSsrbHBzR3NJSTUweWhKOUM3dExmYWRCYTN6RnRGNnFsV0RYCnh0NEVHWnZDamtCNDlYank1S284UWdmZDlMSmxyS3pIL0VtQk9nVUNnWUJvNUd2bjRUc2o1dzMxclVFbjloVkQKbnF4Q3hhRmRQR08vWlRqbDE5MzlqaCtyQmVENjc4MUg1c0hHZjA1S2hvSm5SK0Y0eEdYOW5PVkZ5L1Y4MGVaYgpmR3FPVWhnN0RJYm5NWEt0QW1tR1U1cDlQNTd5a3loLy80dG5ZRG04T0FoTThkeVQzWlp5OHN1MDFtOG9sc2oxClZ3OWJKbEpTaE52SU83Wk03NzlCZlFLQmdRQ24zWTBDS0VURE8xdDBMSlN1SG5lK3BDMldFV1pPNmlpVWQ5MnIKc1VmL21vV2F6STJSTnAwbVlRQTJja0xSNzBLVnR2UXpPcUhVM2tBSVJHZFBYWlBGOWV5V0tYQXhYYVgrN1Z0cwp5OHo0RExjY2ZjSjhJaFJyZ09ha1Q2SmJiMjVSYXdMS2g4SE8vcEJoVEVVZGR3RkYxUmdCM1V1ZUhjR2pPc3RFCmJMcDI3UUtCZ1FDVGZEdzlGRllFNWlzQkloL1FiWW5iU1hKMXYzdUw5SklVdEc3Mis2TC8yWWg5UTdjTmFsMmUKSVlyM2RZUzdldVdzcnZJRWNWNk82M011WHJpVy91UkdVR3Z4M0Mwa0xnbWJDdjY3OWk4dk9pVWNRekc2SHFDdwo2c0VpcGlOUlVycTJWcitFZEpRV2VKWVc2QmZ3WldWTit5TDdCSVhpWlA5aVVBWEJLZktvbnc9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQo=
GITHUB_WEBHOOK_SECRET=88c3adc521de16c5ead96a87e09ad126d569077a8bb350d67731c6f67fab0736
GITHUB_OWNER=nickroberts
GITHUB_REPO=lamb-cottage-2025
GITHUB_BRANCH=main
GITHUB_INSTALLATION_ID=84118502
```

### Resend Email Configuration
```
RESEND_API_KEY=re_KfRMFBEi_5aSGr92JWFpZEhJAjcpforuJ
RESEND_FROM_EMAIL=noreply@lambcottage.co.uk
```

### NextAuth Configuration
```
NEXTAUTH_URL=https://lambcottage2025.pages.dev
NEXTAUTH_SECRET=88c3adc521de16c5ead96a87e09ad126d569077a8bb350d67731c6f67fab0736
```

### Site Configuration
```
SITE_URL=https://lambcottage2025.pages.dev
SITE_NAME=Lamb Cottage 2025
```

## Step 5: Deploy

1. Click **Save and Deploy**
2. Cloudflare will start building your project
3. Monitor the build process in the deployment logs
4. Once complete, you'll get a URL like: `https://lambcottage2025.pages.dev`

## Step 6: Verify Deployment

1. Visit your Cloudflare Pages URL
2. Test the CMS functionality:
   - Try logging in at `/admin`
   - Test content editing
   - Verify image uploads work
   - Check GitHub integration

## Step 7: Update GitHub App Webhook (After Deployment)

1. Go to your GitHub App settings
2. Update the webhook URL to: `https://lambcottage2025.pages.dev/api/github/webhook`
3. Save the changes

## Important Notes

- **Domain:** Using Cloudflare-provided domain for now (`lambcottage2025.pages.dev`)
- **Custom Domain:** Will be configured later after approval
- **Environment Variables:** All sensitive keys are configured
- **Build Settings:** Optimized for Astro with Cloudflare adapter

## Troubleshooting

- If build fails, check the deployment logs
- Ensure all environment variables are correctly set
- Verify the GitHub repository is accessible
- Check that the build command produces the `dist` directory

## Next Steps After Deployment

1. Test all CMS functionality
2. Update GitHub App webhook URL
3. Migrate content from existing site
4. Set up custom domain when approved
5. Configure DNS settings