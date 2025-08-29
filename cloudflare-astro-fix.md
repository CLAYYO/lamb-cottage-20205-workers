# Fixing Cloudflare Pages Not Recognising Astro Build

When Cloudflare Pages doesn't "recognise" an Astro app, it's almost
always one of these:

## Quick fix checklist

1.  **package.json**

    -   Make sure `astro` is listed (usually in `devDependencies`) and
        you have the scripts:

    ``` json
    {
      "scripts": {
        "dev": "astro dev",
        "build": "astro build",
        "preview": "astro preview"
      },
      "devDependencies": {
        "astro": "^4.0.0"
      }
    }
    ```

    Cloudflare's framework detection looks for `astro` + a `build`
    script.

2.  **Cloudflare Pages build settings**

    -   **Framework preset:** set to **Astro** (don't rely on auto if
        it's failing).
    -   **Build command:** `npm run build` (or `pnpm run build` /
        `yarn build`).
    -   **Build output directory:** `dist`
    -   **Root directory:** if your Astro app is in a subfolder
        (e.g. `apps/site`), set this accordingly in "Root directory".

3.  **Node & package manager**

    -   Astro requires modern Node. In Pages → Settings → Environment
        variables:
        -   `NODE_VERSION=20` (or `22` if you're on Astro that supports
            it).
    -   If you use **pnpm**/**yarn**, either:
        -   Add `"packageManager": "pnpm@X.Y.Z"` (or yarn) to
            `package.json`, **or**
        -   Set the Pages project to use that package manager
            explicitly.

4.  **astro.config.(ts\|mjs)**

    -   For a static site (most common), ensure either no `output` set
        or:

        ``` ts
        // astro.config.ts
        import { defineConfig } from 'astro/config';
        export default defineConfig({
          output: 'static'
        });
        ```

    -   If you **need SSR on Cloudflare Pages**, use the adapter:

        ``` ts
        import cloudflare from '@astrojs/cloudflare';
        export default defineConfig({
          output: 'server',
          adapter: cloudflare()
        });
        ```

        And confirm Pages Functions are enabled (Cloudflare will use the
        generated `functions/` from the adapter). If you don't need SSR,
        avoid setting `output: 'server'`.

5.  **Monorepo / subdir**

    -   If you're in a monorepo, Cloudflare may be building the repo
        root instead of your app folder. Set **Root directory** to the
        app folder and make sure a `package.json` is present there.
    -   If you use workspaces, ensure the workspace installs deps for
        the app (a lockfile accessible at the root or app).

6.  **Lockfile & installs**

    -   Keep one of `package-lock.json`, `pnpm-lock.yaml`, or
        `yarn.lock` checked in. Pages infers the package manager and
        versions from it.

7.  **Output folder mismatch**

    -   If you changed `outDir` in `astro.config`, set Cloudflare's
        **Build output directory** to match it.

------------------------------------------------------------------------

## What I'd check first (fastest path)

-   Open your repo's **package.json** and confirm
    `devDependencies.astro` exists and `scripts.build` is `astro build`.
-   In Cloudflare Pages:
    -   Framework preset: **Astro**
    -   Build command: **npm run build**
    -   Output dir: **dist**
    -   Root directory: set if your app isn't at the repo root.
    -   Add `NODE_VERSION=20` env var.

------------------------------------------------------------------------

If you paste your `package.json` and `astro.config.(ts|mjs)` here (and
tell me if it's in a subfolder), I'll pinpoint the exact change to make.
