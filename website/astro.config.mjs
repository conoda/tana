import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [svelte()],
  output: 'static',

  build: {
    inlineStylesheets: 'auto'
  },

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: cloudflare()
});