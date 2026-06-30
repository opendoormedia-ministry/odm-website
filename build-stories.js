'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = __dirname;
const POSTS_DIR  = path.join(ROOT, 'the-open-door', 'posts');
const OUT_DIR    = path.join(ROOT, 'the-open-door', 'stories');
const INDEX_FILE = path.join(ROOT, 'the-open-door', 'stories.html');

// ── Markdown helpers ──────────────────────────────────────────────────────────

function parseFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
    if (key) meta[key] = val;
  }
  return { meta, body: m[2] };
}

function escHtml(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(text) {
  return escHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code>$1</code>');
}

function mdToHtml(md) {
  return md.trim().split(/\n\n+/).map(block => {
    block = block.trim();
    if (!block) return '';
    if (/^### /.test(block)) return `<h3>${inline(block.slice(4))}</h3>`;
    if (/^## /.test(block))  return `<h2>${inline(block.slice(3))}</h2>`;
    if (/^# /.test(block))   return `<h1>${inline(block.slice(2))}</h1>`;
    if (/^> /.test(block)) {
      const inner = block.split('\n').map(l => inline(l.replace(/^> ?/, ''))).join('<br>');
      return `<blockquote>${inner}</blockquote>`;
    }
    if (/^[-*] /.test(block)) {
      const items = block.split('\n').map(l => `<li>${inline(l.replace(/^[-*] /, ''))}</li>`);
      return `<ul>${items.join('')}</ul>`;
    }
    return `<p>${inline(block.replace(/\n/g, ' '))}</p>`;
  }).filter(Boolean).join('\n');
}

function abbreviateAuthor(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return parts[0] + ' ' + parts[parts.length - 1][0] + '.';
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Shared HTML fragments ─────────────────────────────────────────────────────

const AMBIENT = `
  <div class="hub-lantern-layer" style="position:fixed;left:-60px;bottom:-80px;width:430px;height:430px;border-radius:50%;background:radial-gradient(closest-side,rgba(240,150,66,.28),rgba(207,90,40,.09),transparent 72%);filter:blur(16px);animation:odm-flicker 3.4s ease-in-out infinite;z-index:0;pointer-events:none;" aria-hidden="true"></div>
  <div style="position:fixed;inset:0;box-shadow:inset 0 0 170px 50px rgba(0,0,0,.62);pointer-events:none;z-index:0;" aria-hidden="true"></div>
  <div class="hub-lantern-layer" style="position:fixed;left:13%;bottom:24%;width:3px;height:3px;border-radius:50%;background:#f2a85a;box-shadow:0 0 8px 2px rgba(242,168,90,.6);animation:odm-drift 9s ease-in-out infinite;z-index:0;pointer-events:none;" aria-hidden="true"></div>
  <div class="hub-lantern-layer" style="position:fixed;left:21%;bottom:40%;width:2px;height:2px;border-radius:50%;background:#f2a85a;box-shadow:0 0 6px 2px rgba(242,168,90,.5);animation:odm-drift 12s ease-in-out 1.4s infinite;z-index:0;pointer-events:none;" aria-hidden="true"></div>`;

const NAV = `
  <nav class="hub-nav" aria-label="The Open Door navigation">
    <div class="hub-nav__brand">
      <a href="/the-open-door/" class="hub-nav__logo">
        <img src="/img/odm-logos/the-open-door.svg" alt="The Open Door">
      </a>
      <a href="/" class="hub-nav__return">← Return to Open Door Media</a>
    </div>
    <ul class="hub-nav__links">
      <li><a href="/the-open-door/stories.html" aria-current="page">Stories</a></li>
      <li><a href="/share-your-story/">Share Your Story</a></li>
      <li><span class="link-soon" aria-label="The Docudrama — coming soon">The Docudrama (coming soon)</span></li>
    </ul>
    <button id="hub-nav-toggle" class="hub-nav__toggle" aria-label="Open menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <div class="hub-nav__mobile-panel">
      <a href="/" class="hub-nav__mobile-return">← Return to Open Door Media</a>
      <a href="/the-open-door/stories.html" aria-current="page">Stories</a>
      <a href="/share-your-story/">Share Your Story</a>
      <span class="link-soon">The Docudrama (coming soon)</span>
    </div>
  </nav>`;

const FOOTER = `
  <footer class="hub-footer">
    <div class="hub-footer__inner">
      <a href="/the-open-door/" class="hub-footer__logo">
        <img src="/img/odm-logos/the-open-door.svg" alt="The Open Door">
      </a>
      <ul class="hub-footer__links">
        <li><a href="/the-open-door/stories.html">Stories</a></li>
        <li><a href="/share-your-story/">Share Your Story</a></li>
        <li><a href="/">Open Door Media</a></li>
      </ul>
    </div>
  </footer>`;

// ── Story page template ───────────────────────────────────────────────────────

function storyPageHtml(meta, bodyHtml, slug) {
  const title        = escHtml(meta.title  || 'A Story');
  const fullAuthor   = escHtml(meta.author || 'Anonymous');
  const displayAuthor = escHtml(abbreviateAuthor(meta.author || 'Anonymous'));
  const tagline      = escHtml(meta.tagline || '');
  const dateStr      = meta.date ? formatDate(meta.date) : '';
  const desc         = tagline || title;
  const pageUrl      = `https://opendoormedia.us/the-open-door/stories/${slug}.html`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — The Open Door</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${pageUrl}">
  <link rel="icon" href="/favicon.ico">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${title} — The Open Door">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="https://opendoormedia.us/img/og-image.jpg">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} — The Open Door">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="https://opendoormedia.us/img/og-image.jpg">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "${desc}",
    "author": { "@type": "Person", "name": "${fullAuthor}" },
    "datePublished": "${meta.date || ''}",
    "publisher": {
      "@type": "Organization",
      "name": "The Open Door — Open Door Media",
      "url": "https://opendoormedia.us/the-open-door/"
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "${pageUrl}" }
  }
  <\/script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <style>@view-transition { navigation: auto; }</style>
  <style>
    .story-page { position:relative; z-index:1; max-width:680px; margin:0 auto; padding:80px var(--sp-5) var(--sp-12); }
    .story-page__back { margin-bottom:var(--sp-6); }
    .story-page__header { margin-bottom:var(--sp-8); border-bottom:1px solid var(--hub-border); padding-bottom:var(--sp-6); }
    .story-page__eyebrow { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
    .story-page__author { font-family:'Montserrat',sans-serif; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--accent); }
    .story-page__date { font-size:12px; color:var(--hub-lo); }
    .story-page__title { color:var(--hub-hi); font-size:clamp(26px,4vw,42px); line-height:1.1; margin-bottom:12px; }
    .story-page__tagline { color:var(--hub-mid); font-size:17px; font-style:italic; line-height:1.5; }
    .story-page__body { color:var(--hub-mid); font-size:17px; line-height:1.8; }
    .story-page__body p { margin-bottom:1.4em; }
    .story-page__body h2 { color:var(--hub-hi); font-size:22px; margin:2em 0 .6em; }
    .story-page__body h3 { color:var(--hub-hi); font-size:18px; margin:1.6em 0 .5em; }
    .story-page__body blockquote { border-left:3px solid var(--accent); margin:1.5em 0; padding:.6em 0 .6em 1.2em; color:var(--hub-hi); font-style:italic; }
    .story-page__body ul { margin:0 0 1.4em 1.4em; }
    .story-page__body li { margin-bottom:.4em; }
    .story-page__body strong { color:var(--hub-hi); }
    .story-page__cta { margin-top:var(--sp-10); padding-top:var(--sp-8); border-top:1px solid var(--hub-border); text-align:center; }
    .story-page__cta p { color:var(--hub-mid); margin-bottom:var(--sp-4); }
  </style>
</head>
<body class="hub-page">
${AMBIENT}
${NAV}
  <main>
    <article class="story-page">
      <div class="story-page__back">
        <a href="/the-open-door/stories.html" class="hub-back-btn">← All Stories</a>
      </div>
      <header class="story-page__header">
        <div class="story-page__eyebrow">
          <span class="story-page__author">${displayAuthor}</span>
          ${dateStr ? `<span class="story-page__date">${dateStr}</span>` : ''}
        </div>
        <h1 class="story-page__title">${title}</h1>
        ${tagline ? `<p class="story-page__tagline">&ldquo;${tagline}&rdquo;</p>` : ''}
      </header>
      <div class="story-page__body">
        ${bodyHtml}
      </div>
      <div class="story-page__cta">
        <p>Has God changed your life too?</p>
        <a href="/share-your-story/" class="btn btn--primary">Share your story →</a>
      </div>
    </article>
  </main>
${FOOTER}
  <script src="/js/main.js"></script>
</body>
</html>`;
}

// ── Stories index template ────────────────────────────────────────────────────

function storiesIndexHtml(posts) {
  const cards = posts.map(({ meta, slug }) => {
    const title   = escHtml(meta.title  || 'Untitled');
    const author  = escHtml(abbreviateAuthor(meta.author || 'Anonymous'));
    const tagline = escHtml(meta.tagline || '');
    const dateStr = meta.date ? formatDate(meta.date) : '';
    return `
      <article class="story-card">
        <div class="story-card__meta">
          <span class="story-card__author">${author}</span>
          ${dateStr ? `<span class="story-card__date">${dateStr}</span>` : ''}
        </div>
        <h2 class="story-card__title">${title}</h2>
        ${tagline ? `<p class="story-card__tagline">&ldquo;${tagline}&rdquo;</p>` : ''}
        <a href="/the-open-door/stories/${slug}.html" class="story-card__link">Read story →</a>
      </article>`;
  }).join('\n');

  const emptyState = `<p class="stories-empty">No stories published yet. Be the first to share yours.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stories — The Open Door</title>
  <meta name="description" content="Real testimonies from real people — how God changed their lives, told in their own words.">
  <link rel="canonical" href="https://opendoormedia.us/the-open-door/stories.html">
  <link rel="icon" href="/favicon.ico">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://opendoormedia.us/the-open-door/stories.html">
  <meta property="og:title" content="Stories — The Open Door">
  <meta property="og:description" content="Real testimonies from real people — how God changed their lives, told in their own words.">
  <meta property="og:image" content="https://opendoormedia.us/img/og-image.jpg">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Stories — The Open Door">
  <meta name="twitter:description" content="Real testimonies from real people — how God changed their lives, told in their own words.">
  <meta name="twitter:image" content="https://opendoormedia.us/img/og-image.jpg">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <style>@view-transition { navigation: auto; }</style>
  <style>
    .stories-hero { position:relative; z-index:1; text-align:center; padding:var(--sp-12) var(--sp-5) var(--sp-8); }
    .stories-hero h1 { color:var(--hub-hi); font-size:clamp(30px,5vw,54px); line-height:1.08; margin-bottom:14px; }
    .stories-hero p  { color:var(--hub-mid); font-size:17px; max-width:500px; margin:0 auto var(--sp-6); }
    .stories-grid { position:relative; z-index:1; max-width:860px; margin:0 auto; padding:0 var(--sp-5) var(--sp-12); display:grid; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); gap:20px; justify-content:center; }
    @media (max-width:600px) {
      .stories-hero { padding: var(--sp-8) var(--sp-3) var(--sp-6); }
      .stories-hero p { font-size: 15px; }
      .stories-grid { grid-template-columns:1fr; padding-left:var(--sp-3); padding-right:var(--sp-3); padding-bottom:var(--sp-8); }
      .story-card { padding: 22px 20px; text-align: left; }
      .story-card__meta { justify-content: flex-start; }
      .story-card__author { font-size: 11px; }
      .story-card__title { font-size: 18px; }
      .story-card__tagline { font-size: 14px; }
      .story-card__link { font-size: 12px; padding-top: 10px; min-height: 44px; display:flex; align-items:center; justify-content: flex-start; }
    }
    .story-card { background:rgba(197,88,51,.05); border:1px solid var(--hub-border); border-radius:14px 14px 3px 14px; padding:28px 26px; display:flex; flex-direction:column; gap:10px; transition:border-color .2s; }
    .story-card:hover { border-color:rgba(197,88,51,.4); }
    .story-card__meta { display:flex; align-items:center; gap:12px; }
    .story-card__author { font-family:'Montserrat',sans-serif; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--accent); }
    .story-card__date { font-size:12px; color:var(--hub-lo); }
    .story-card__title { color:var(--hub-hi); font-size:20px; line-height:1.25; margin:0; text-align:left; }
    .story-card__tagline { color:var(--hub-mid); font-size:14px; font-style:italic; line-height:1.5; margin:0; }
    .story-card__link { margin-top:auto; padding-top:14px; font-family:'Montserrat',sans-serif; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--accent); text-decoration:none; transition:color .2s; }
    .story-card__link:hover { color:var(--hub-hi); }
    .stories-empty { text-align:center; color:var(--hub-lo); padding:var(--sp-12); grid-column:1/-1; }
  </style>
</head>
<body class="hub-page">
${AMBIENT}
${NAV}
  <main>
    <section class="stories-hero">
      <span class="eyebrow">Testimonies · The Library</span>
      <h1>Every story waiting <span class="accent-word">to be told.</span></h1>
      <p>Real testimonies from real people, in their own words.</p>
      <a href="/share-your-story/" class="btn btn--primary">Share your story →</a>
    </section>
    <div class="stories-grid">
      ${posts.length ? cards : emptyState}
    </div>
  </main>
${FOOTER}
  <script src="/js/main.js"></script>
</body>
</html>`;
}

// ── Build ─────────────────────────────────────────────────────────────────────

if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
if (!fs.existsSync(OUT_DIR))   fs.mkdirSync(OUT_DIR,   { recursive: true });

const mdFiles = fs.existsSync(POSTS_DIR)
  ? fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))
  : [];

const posts = mdFiles
  .map(file => {
    const src = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { meta, body } = parseFrontmatter(src);
    return { meta, body, slug: path.basename(file, '.md'), file };
  })
  .filter(p => p.meta.published !== 'false')
  .sort((a, b) => new Date(b.meta.date || 0) - new Date(a.meta.date || 0));

for (const post of posts) {
  const html = storyPageHtml(post.meta, mdToHtml(post.body), post.slug);
  fs.writeFileSync(path.join(OUT_DIR, post.slug + '.html'), html, 'utf8');
  console.log(`  ✓  stories/${post.slug}.html`);
}

fs.writeFileSync(INDEX_FILE, storiesIndexHtml(posts), 'utf8');
console.log(`  ✓  stories.html  (${posts.length} post${posts.length !== 1 ? 's' : ''})`);
