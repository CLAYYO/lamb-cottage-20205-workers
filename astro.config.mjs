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
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.env.JWT_SECRET': JSON.stringify(process.env.JWT_SECRET || 'lamb-cottage-jwt-secret-key-2025-production-change-this'),
      'process.env.ADMIN_PASSWORD_HASH': JSON.stringify(process.env.ADMIN_PASSWORD_HASH || '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
    }
  }
});
