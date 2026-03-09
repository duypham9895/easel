# Bilingual Landing Page (EN/VI) — Design

**Issue:** EAS-19 | **Date:** 2026-03-09 | **Status:** Approved

## Goal
Add Vietnamese version of the landing page for GitHub Pages.

## Architecture
- Two HTML files: `landing/index.html` (EN) and `landing/vi/index.html` (VI)
- Shared CSS extracted into `landing/style.css`
- Shared JS extracted into `landing/script.js`
- No framework — pure static HTML, GitHub Pages compatible

## Language Switcher
- Flag icons (🇺🇸 / 🇻🇳) in the top-right of the nav bar
- EN page: 🇻🇳 flag links to `/vi/`
- VI page: 🇺🇸 flag links to `/`
- SVG or emoji flags — no external assets

## SEO
- `<html lang="vi">` on Vietnamese page
- Vietnamese `<title>` and `<meta name="description">`
- `<link rel="alternate" hreflang>` cross-references on both pages

## File Structure
```
landing/
├── index.html      (EN — CSS/JS extracted)
├── style.css       (shared styles)
├── script.js       (shared JS)
└── vi/
    └── index.html  (VI — translated copy)
```

## Path References
- EN: `href="style.css"`, `src="script.js"`
- VI: `href="../style.css"`, `src="../script.js"`
