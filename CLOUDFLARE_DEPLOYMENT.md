# Cloudflare Pages Deployment Configuration

This document outlines the correct Cloudflare Pages settings for deploying the Lamb Cottage 2025 Astro application.

**Note**: This project is configured for Cloudflare Pages (not Workers) for simpler deployment and better Astro integration.

**Important**: The `wrangler.toml` file is not used for Pages deployment - it's only for Workers. Pages deployment is configured through the Cloudflare Dashboard.

## Current Project Configuration

### Package.json ✅
- `astro` is correctly placed in `devDependencies`
- Build script is set to `astro build`
- All required scripts are present

### Astro Config ✅
- Using `output: 'server'` for SSR (required for API routes)
- Cloudflare adapter is properly configured
- Platform proxy enabled for local development

## Required Cloudflare Pages Settings

### Build Configuration
- **Framework preset:** Astro
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** (leave empty - project is at repo root)

### Environment Variables
Add these in Cloudflare Pages → Settings → Environment variables:

```
NODE_VERSION=20
```

### Build Settings Verification
1. Go to your Cloudflare Pages project
2. Navigate to Settings → Builds and deployments
3. Ensure the following settings:
   - Framework preset: **Astro**
   - Build command: **npm run build**
   - Build output directory: **dist**
   - Root directory: **(leave empty)**

### Package Manager
- The project uses npm (package-lock.json is present)
- Cloudflare will automatically detect this from the lockfile

## Why SSR Mode is Required

This application uses server-side functionality including:
- Authentication API routes (`/api/auth/*`)
- Content management API (`/api/content/*`)
- Image upload API (`/api/images/upload`)
- User management API (`/api/users/*`)
- Contact form API (`/api/contact`)
- Review integration API (`/api/reviews/*`)

Therefore, `output: 'server'` with the Cloudflare adapter is necessary.

## Recreating Cloudflare Pages Project (Recommended)

If Cloudflare keeps defaulting to "No Framework" instead of detecting Astro:

### Step 1: Create New Cloudflare Pages Project
1. Go to Cloudflare Dashboard → Pages
2. Click "Create application"
3. Choose "Connect to Git"
4. Select your repository: `lambcottage2025`
5. **IMPORTANT**: In "Set up builds and deployments":
   - **Framework preset**: Select **"Astro"** from dropdown
   - **Build command**: `npm run build` (auto-filled)
   - **Build output directory**: `dist` (auto-filled)
   - **Root directory**: (leave empty)

### Step 2: Configure Environment Variables
After project creation, go to Settings → Environment variables:
- Add `NODE_VERSION` = `20`

### Step 3: Deploy
- The first deployment should start automatically
- Monitor build logs for any issues

## Troubleshooting

If deployment still fails:

1. **Check build logs** for specific error messages
2. **Verify Node version** - ensure NODE_VERSION=20 is set
3. **Confirm framework preset** - should show "Astro" in project settings
4. **Verify build command** - should be exactly `npm run build`
5. **Check output directory** - should be `dist`
6. **Delete old project** - Remove the old Cloudflare Pages project to avoid conflicts

## Post-Deployment Verification

After successful deployment, test:
- [ ] Static pages load correctly
- [ ] API endpoints respond (test `/api/auth/csrf`)
- [ ] Image uploads work
- [ ] Authentication flow functions
- [ ] Content management works in admin panel

## Notes

- The application requires Cloudflare Pages Functions for SSR
- All API routes will be automatically deployed as Cloudflare Functions
- Static assets will be served from Cloudflare's CDN
- The `platformProxy` setting enables local development with Cloudflare bindings