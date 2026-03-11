#!/usr/bin/env node
/**
 * Post-build script for Expo web export.
 *
 * Fixes the <script> tag to use type="module" because the Metro bundle
 * contains import.meta usage (from Zustand devtools middleware).
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('[fix-web-build] dist/index.html not found');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf-8');

// Replace <script src="..." defer> with <script type="module" src="...">
html = html.replace(
  /<script src="([^"]+)" defer><\/script>/g,
  '<script type="module" src="$1"></script>'
);

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('[fix-web-build] Added type="module" to script tags in dist/index.html');
