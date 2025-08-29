# Cloudflare Pages Deployment Configuration

This document outlines the correct Cloudflare Pages settings for deploying the Lamb Cottage 2025 Astro application.

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

## Troubleshooting

If deployment fails:

1. **Check build logs** for specific error messages
2. **Verify Node version** - ensure NODE_VERSION=20 is set
3. **Check framework detection** - ensure "Astro" is selected as framework
4. **Verify build command** - should be exactly `npm run build`
5. **Check output directory** - should be `dist`

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