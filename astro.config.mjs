// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Custom domain — matches public/CNAME
  site: 'https://bisclay.com',

  // Pretty URLs: /rad/naziv/ instead of /rad/naziv.html
  build: {
    format: 'directory',
  },

  // Keep the output predictable for GitHub Pages
  trailingSlash: 'ignore',
});
