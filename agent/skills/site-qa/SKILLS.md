---
name: site-qa
repo: b12/site-qa
tagline: Check your whole site for broken or unfinished pieces.
category: library
description: |
  Use this skill when the user wants a quality check of their website: find
  broken links, unfinished sections, placeholder content, misconfigured
  forms, or general problems. Trigger phrases: "QA my site", "audit my
  site", "check my website", "review site quality", "is anything broken",
  "test my site", "site health check", "find issues", "check everything
  works", "before I publish/launch".

  This skill REPORTS issues and asks before fixing anything. For deep
  accessibility or SEO review, prefer the accessibility-audit or seo-audit
  skills if installed. For live in-browser testing (real clicks, form
  submissions, mobile rendering), prefer the agent-browser skill if
  installed.
---

<!-- Adapted from https://github.com/addyosmani/web-quality-skills (skills/web-quality-audit) by Addy Osmani, MIT licensed. Modified 2026. See LICENSE in this directory. -->

# Site QA

Comprehensive quality review of the website. Covers functionality, content completeness, and best practices, with light accessibility and SEO passes.

**This is an audit, not a repair job. NEVER change any file until the user explicitly confirms which findings to fix.**

## How it works

1. Analyze the project source for quality issues (read files; do NOT run builds, dev servers, or external tools)
2. Categorize findings by severity (Critical, High, Medium, Low)
3. Present a minimal prioritized report
4. Ask which issues the user wants fixed, then wait

Review every page in `src/pages/`, the shared layout(s), `Header.astro`/`Footer.astro`, interactive components, and `global.css`. If the user names specific pages, audit only those. Read `PROJECT_DESCRIPTION.md` to check content against the real business details.

## Audit categories

### Broken functionality

- **Dead internal links.** Every `href` to an internal path must resolve to a page in `src/pages/` (or a valid redirect). Anchor links must point to an existing section `id`, and use full page paths (`/about#team`, not `#team`).
- **Dynamic routes without `getStaticPaths()`.** Any `src/pages/**/[param].astro` file must export it, or the build fails.
- **Broken forms.** Every `<form>` must have a `data-form-id` attribute, no `action` attribute, and no custom fetch/submit JavaScript (submission is handled by `src/lib/forms.ts`). A `<form>` rendered inside a React island (`client:*`) never gets wired and silently fails. Success/error divs (`b12-form-done-*` / `b12-form-error-*`) must be siblings of the form.
- **Non-interactive islands.** React components that need JavaScript must have a `client:*` directive; interactive-looking components without one render dead.
- **Broken imports.** Imports referencing components or assets that do not exist.
- **JS errors waiting to happen.** Undefined variables in `<script>` blocks; browser APIs (`window`, `document`) referenced in Astro component frontmatter, which runs at build time, not in the browser.

### Missing B12 wiring

- Every page includes `<RequiredB12HeadScripts>` and `<RequiredB12FooterScripts>`.
- Every page has exactly one `<B12Link>` in the footer.
- Every `<section>` has an `id` (slugified section title).
- Images use B12 CDN URLs or local `public/` assets. Flag hotlinks to stock services (Unsplash, Pexels, placeholder.com, picsum) — these are placeholder leftovers.

### Content issues

- Placeholder or lorem-ipsum text, "TODO"/"coming soon" leftovers, template copy that was never customized
- Business details (name, phone, address, hours, email) inconsistent across pages or contradicting `PROJECT_DESCRIPTION.md`
- Outdated copyright year in the footer
- Empty or stub pages linked from navigation
- Dead social media links (pointing at the platform homepage or `#`)

### Best practices

**Modern standards:**
- Valid HTML structure: no duplicate `id`s on a page, properly nested elements
- Charset and viewport meta tags in the layout
- Descriptive `<title>` per page

**UX patterns:**
- Buttons do what they say; no misleading or inert CTAs
- External links open safely (`rel="noopener"` with `target="_blank"`)
- Mobile responsiveness: responsive Tailwind classes, no fixed widths that break small screens
- Theme consistency: semantic token classes (`bg-primary`, `text-muted-foreground`) rather than one-off hardcoded colors that drift from the design

### Light accessibility pass

- Images missing `alt`, form inputs missing labels, icon-only buttons missing `aria-label`

### Light SEO pass

- Pages missing unique title or meta description

If the accessibility-audit or seo-audit skill is installed and the site has notable issues in those areas, mention that a deeper dedicated audit is available instead of expanding these passes.

### Multilingual sites

Run this pass when the site shows more than one language or has `src/i18n/locales.json`:

- Languages switched by JavaScript on one URL, or several languages rendered in one page with some hidden, instead of a page per language under `/<locale>/` (High)
- `/` is a redirect or placeholder instead of the default language's content
- A page that exists in one language but not the others, or links that jump to another language
- `src/i18n/<locale>.json` dictionaries with different keys, or visible text, `alt`, `aria-label`, `<title>`, or meta description hardcoded in one language inside shared components
- Invalid language codes in `locales.json` or `<html lang>` (e.g., `ua` instead of `uk`)
- A language switcher that isn't plain links, is missing from the mobile menu, or has tap targets under 24×24 CSS px or noticeably smaller than the other header controls
- Fonts that lack an alphabet the copy uses (e.g., DM Sans or Poppins with Russian text)
- Headlines, nav items, or buttons with fixed widths or tight line-heights that the longest translation would overflow

Fixes follow the multilingual skill.

## Severity levels

| Level | Description |
|-------|-------------|
| **Critical** | Broken functionality visitors will hit (dead links, broken forms, build-breaking code) |
| **High** | Placeholder/wrong content, missing B12 wiring, misleading UI |
| **Medium** | Best-practice violations, responsiveness risks, light a11y/SEO findings |
| **Low** | Polish and consistency improvements |

## Report format

Keep the report MINIMAL. Group findings by severity, number them consecutively across the whole report, and use at most one line per finding: what is wrong plus where (file names, with a count when the same issue repeats). Merge repeats into a single numbered finding. Skip empty categories. No scores, no long explanations, no code snippets in the report.

Formatting: title the report EXACTLY as `### **Site QA**` — the `**` inside the heading is required, a plain `###` heading renders unbolded. Make category labels bold text (not headings), and ALWAYS leave a blank line between a category label and its findings; without it, lists that don't start at 1 render inline instead of as a list.

Example shape:

```
### **Site QA**

**Critical**

1. Nav links to /services but no such page exists (Header.astro)
2. Contact form has custom fetch logic, so submissions never reach B12 (ContactForm.tsx)

**High**

3. Hero image hotlinks Unsplash instead of a generated image (index.astro)
4. Footer copyright says 2024 (Footer.astro)

**Medium**

5. 4 images missing alt text (about.astro, gallery.astro)
```

If everything checks out, say the site looks healthy and mention one or two checks that passed. Note briefly that visual rendering and live behavior (actual clicks, real form submissions) are outside a static review.

## After the report

End by asking whether the user wants the issues fixed, for example: "Want me to fix all of these? Alternatively, you can tell me the numbers of specific recommendations to address." Then STOP and wait.

- Only fix the findings the user confirms, nothing else.
- Fix broken forms by following the forms skill contract; never invent custom submission logic.
- Replace placeholder images via the image generation tool, not stock photo links.
