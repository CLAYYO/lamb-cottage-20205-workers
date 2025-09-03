// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    },
    imageService: 'compile'
  }),
  server: {
    port: 4321
  },
  vite: {
    ssr: {
      external: [
        'fs',
        'fs/promises', 
        'path',
        'crypto',
        'os',
        'util',
        'stream',
        'buffer',
        'url',
        'querystring'
      ]
    },
    define: {
      // Environment variables for Pages CMS
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.env.NEXTAUTH_URL': JSON.stringify(process.env.NEXTAUTH_URL),
      'process.env.NEXTAUTH_SECRET': JSON.stringify(process.env.NEXTAUTH_SECRET),
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(process.env.SUPABASE_SERVICE_ROLE_KEY),
      'process.env.GITHUB_APP_ID': JSON.stringify(process.env.GITHUB_APP_ID),
      'process.env.GITHUB_CLIENT_ID': JSON.stringify(process.env.GITHUB_CLIENT_ID),
      'process.env.GITHUB_CLIENT_SECRET': JSON.stringify(process.env.GITHUB_CLIENT_SECRET),
      'process.env.GITHUB_APP_PRIVATE_KEY': JSON.stringify(process.env.GITHUB_APP_PRIVATE_KEY),
      'process.env.GITHUB_WEBHOOK_SECRET': JSON.stringify(process.env.GITHUB_WEBHOOK_SECRET),
      'process.env.GITHUB_OWNER': JSON.stringify(process.env.GITHUB_OWNER),
      'process.env.GITHUB_REPO': JSON.stringify(process.env.GITHUB_REPO),
      'process.env.GITHUB_BRANCH': JSON.stringify(process.env.GITHUB_BRANCH),
      'process.env.GITHUB_INSTALLATION_ID': JSON.stringify(process.env.GITHUB_INSTALLATION_ID),
      'process.env.RESEND_API_KEY': JSON.stringify(process.env.RESEND_API_KEY),
      'process.env.RESEND_FROM_EMAIL': JSON.stringify(process.env.RESEND_FROM_EMAIL),
      'process.env.SITE_URL': JSON.stringify(process.env.SITE_URL),
      'process.env.SITE_NAME': JSON.stringify(process.env.SITE_NAME),
      // Legacy environment variables for backward compatibility
      'process.env.JWT_SECRET': JSON.stringify(process.env.JWT_SECRET || '00cc78b60c88df17451f40f1a3dceb509fcebe69962501a2edfd0fb4f0167750aca2471632577a3750f0ea37686a879978d13dc868ed1a40dcb6c662390b9d7f'),
      'process.env.ADMIN_PASSWORD_HASH': JSON.stringify(process.env.ADMIN_PASSWORD_HASH || '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
    }
  }
});
