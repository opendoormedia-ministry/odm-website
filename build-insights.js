'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = __dirname;
const POSTS_DIR  = path.join(ROOT, 'insights', 'posts');
const OUT_DIR    = path.join(ROOT, 'insights', 'guides');
const INDEX_FILE = path.join(ROOT, 'insights', 'index.html');

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
  return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function markup(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g,  '<strong>$1</strong>')
    .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g,      '<del>$1</del>')
    .replace(/`([^`]+)`/g,      '<code>$1</code>');
}

function inline(text) {
  // Tokenize images and links BEFORE HTML-escaping so URLs aren't mangled,
  // then apply markup() to each non-link/image segment.
  const tokens = [];
  let last = 0;
  const re = /(!?)\[([^\]]*)\]\((https?:\/\/[^)]*)\)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ t: 'text', v: text.slice(last, m.index) });
    tokens.push(m[1] === '!'
      ? { t: 'img',  alt: m[2], src:  m[3] }
      : { t: 'link', label: m[2], href: m[3] });
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ t: 'text', v: text.slice(last) });

  return tokens.map(tok => {
    if (tok.t === 'link') return `<a href="${escHtml(tok.href)}" target="_blank" rel="noopener noreferrer">${markup(escHtml(tok.label))}</a>`;
    if (tok.t === 'img')  return `<img src="${escHtml(tok.src)}" alt="${escHtml(tok.alt)}" loading="lazy">`;
    return markup(escHtml(tok.v));
  }).join('');
}

function mdToHtml(md) {
  // Pre-extract fenced code blocks before splitting — they may contain blank lines.
  const codeBlocks = [];
  md = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    codeBlocks.push({ lang: lang.trim(), code: code.replace(/\n$/, '') });
    return `\x00CODE${codeBlocks.length - 1}\x00`;
  });

  return md.trim().split(/\n\n+/).map(block => {
    block = block.trim();
    if (!block) return '';

    // Fenced code block placeholder
    const cm = block.match(/^\x00CODE(\d+)\x00$/);
    if (cm) {
      const { lang, code } = codeBlocks[+cm[1]];
      const cls = lang ? ` class="language-${escHtml(lang)}"` : '';
      return `<pre><code${cls}>${escHtml(code)}</code></pre>`;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(block)) return '<hr>';

    if (/^### /.test(block)) return `<h3>${inline(block.slice(4))}</h3>`;
    if (/^## /.test(block))  return `<h2>${inline(block.slice(3))}</h2>`;
    if (/^# /.test(block))   return `<h1>${inline(block.slice(2))}</h1>`;

    if (/^> /.test(block)) {
      const inner = block.split('\n').map(l => inline(l.replace(/^> ?/, ''))).join('<br>');
      return `<blockquote>${inner}</blockquote>`;
    }
    if (/^[-*] /.test(block)) {
      const items = block.split('\n').filter(l => /^[-*] /.test(l)).map(l => `<li>${inline(l.replace(/^[-*] /, ''))}</li>`);
      return `<ul>${items.join('')}</ul>`;
    }
    if (/^\d+\. /.test(block)) {
      const items = block.split('\n').filter(l => /^\d+\. /.test(l)).map(l => `<li>${inline(l.replace(/^\d+\. /, ''))}</li>`);
      return `<ol>${items.join('')}</ol>`;
    }
    return `<p>${inline(block.replace(/\n/g, ' '))}</p>`;
  }).filter(Boolean).join('\n');
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Shared fragments ──────────────────────────────────────────────────────────

const NAV = `
  <nav id="site-nav" class="navbar">
    <div class="navbar__inner">
      <a href="/" class="navbar__logo">
        <img src="/img/odm-logos/logo-header.svg" alt="Open Door Media">
      </a>
      <ul class="navbar__links">
        <li class="navbar__item--has-dropdown">
          <a href="/services/">Services</a>
          <ul class="navbar__dropdown">
            <li><a href="/services/website-design.html">Website Design</a></li>
            <li><a href="/services/video-production.html">Video Production</a></li>
            <li><a href="/services/digital-marketing.html">Digital Marketing</a></li>
          </ul>
        </li>
        <li><a href="/about.html">About</a></li>
        <li><a href="/contact.html">Contact</a></li>
        <li><a href="/contact.html" class="navbar__cta">Start a project</a></li>
      </ul>
      <button id="nav-toggle" class="navbar__toggle" aria-label="Open menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="navbar__mobile">
      <a href="/services/">Services</a>
      <a href="/services/website-design.html" class="navbar__mobile-sub">Website Design</a>
      <a href="/services/video-production.html" class="navbar__mobile-sub">Video Production</a>
      <a href="/services/digital-marketing.html" class="navbar__mobile-sub">Digital Marketing</a>
      <a href="/about.html">About</a>
      <a href="/contact.html">Contact</a>
      <a href="/contact.html" class="btn btn--primary btn--sm">Start a project</a>
    </div>
  </nav>`;

const FOOTER = `
  <footer class="footer">
    <div class="footer__inner">
      <a href="/" class="footer__logo">
        <img src="/img/odm-logos/logo-footer.svg" alt="Open Door Media">
      </a>
      <ul class="footer__links">
        <li><a href="/services/">Services</a></li>
        <li><a href="/about.html">About</a></li>
        <li><a href="/contact.html">Contact</a></li>
        <li><a href="/share-your-story/">Share Your Story</a></li>
      </ul>
      <address class="footer__nap">
        <a href="tel:+13162850517">+1 316-285-0517</a>
        <span aria-hidden="true">·</span>
        <a href="mailto:connect@opendoormedia.us">connect@opendoormedia.us</a>
        <span aria-hidden="true">·</span>
        <span>Wichita, KS</span>
        <span class="footer__copy">© 2026 Open Door Media · Proudly built in-house</span>
      </address>
    </div>
  </footer>`;

// ── Guide page template ───────────────────────────────────────────────────────

function guidePageHtml(meta, bodyHtml, slug) {
  const title    = escHtml(meta.title    || 'Guide');
  const author   = escHtml(meta.author   || 'Open Door Media');
  const category = escHtml(meta.category || '');
  const dateStr  = meta.date ? formatDate(meta.date) : '';
  const desc     = `${meta.title || 'Guide'} — A resource from Open Door Media.`;
  const pageUrl  = `https://opendoormedia.us/insights/guides/${slug}.html`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Insights | Open Door Media</title>
  <meta name="description" content="${escHtml(desc)}">
  <link rel="canonical" href="${pageUrl}">
  <link rel="icon" href="/favicon.ico">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${title} — Open Door Media Insights">
  <meta property="og:description" content="${escHtml(desc)}">
  <meta property="og:image" content="https://opendoormedia.us/img/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} — Open Door Media Insights">
  <meta name="twitter:description" content="${escHtml(desc)}">
  <meta name="twitter:image" content="https://opendoormedia.us/img/og-image.jpg">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "${escHtml(desc)}",
    "author": { "@type": "Organization", "name": "${author}" },
    "datePublished": "${meta.date || ''}",
    "publisher": {
      "@type": "Organization",
      "name": "Open Door Media",
      "url": "https://opendoormedia.us"
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "${pageUrl}" }
  }
  <\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .gp { max-width: 720px; margin: 0 auto; padding: 60px var(--sp-5) var(--sp-12); }
    .gp__back {
      display: inline-block; margin-bottom: var(--sp-6);
      font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 700;
      letter-spacing: 1px; text-transform: uppercase; color: var(--taupe); transition: color .2s;
    }
    .gp__back:hover { color: var(--accent); }
    .gp__header { margin-bottom: var(--sp-6); padding-bottom: var(--sp-5); border-bottom: 1px solid var(--hairline); }
    .gp__cat {
      display: inline-block; margin-bottom: 14px;
      padding: 3px 12px; border-radius: 99px;
      border: 1px solid var(--accent); color: var(--accent);
      font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700;
      letter-spacing: 1.5px; text-transform: uppercase;
    }
    .gp__title { font-size: clamp(26px, 4vw, 42px); line-height: 1.1; color: var(--ink); margin-bottom: 14px; }
    .gp__byline { font-size: 13px; color: var(--taupe); }
    .gp__body { margin-top: var(--sp-6); font-size: 16px; line-height: 1.85; }
    .gp__body p  { color: var(--taupe); margin-bottom: 1.4em; }
    .gp__body h2 { font-size: 22px; color: var(--ink); margin: 2em 0 .6em; }
    .gp__body h3 { font-size: 18px; color: var(--ink); margin: 1.6em 0 .5em; }
    .gp__body ul, .gp__body ol { margin: 0 0 1.4em 1.6em; }
    .gp__body li { color: var(--taupe); margin-bottom: .5em; }
    .gp__body strong { color: var(--ink); }
    .gp__body em { font-style: italic; }
    .gp__body code { background: var(--panel); border-radius: 4px; padding: 1px 6px; font-size: .88em; color: var(--ink); }
    .gp__body blockquote { border-left: 3px solid var(--accent); margin: 1.5em 0; padding: .6em 0 .6em 1.2em; color: var(--taupe); font-style: italic; }
    .gp__cta { margin-top: var(--sp-10); padding-top: var(--sp-6); border-top: 1px solid var(--hairline); }
    .gp__cta p { margin-bottom: var(--sp-3); }
    @media (max-width: 600px) { .gp { padding-top: var(--sp-8); } }
  </style>
</head>
<body>
${NAV}
  <main>
    <article class="gp">
      <a href="/insights/" class="gp__back">← Back to Insights</a>
      <header class="gp__header">
        ${category ? `<span class="gp__cat">${category}</span>` : ''}
        <h1 class="gp__title">${title}</h1>
        <p class="gp__byline">${author}${dateStr ? ` · ${dateStr}` : ''}</p>
      </header>
      <div class="gp__body">
        ${bodyHtml}
      </div>
      <div class="gp__cta">
        <p>Have a question about this guide?</p>
        <a href="/contact.html" class="btn btn--primary">Get in touch →</a>
      </div>
    </article>
  </main>
${FOOTER}
  <script src="/js/main.js"></script>
</body>
</html>`;
}

// ── Insights index template ───────────────────────────────────────────────────

function insightsIndexHtml(posts) {
  const catSet = new Set();
  posts.forEach(p => { if (p.meta.category) catSet.add(p.meta.category); });
  const categories = [...catSet].sort();

  const cards = posts.map(({ meta, slug }) => {
    const title    = escHtml(meta.title    || 'Untitled');
    const author   = escHtml(meta.author   || 'Open Door Media');
    const category = escHtml(meta.category || '');
    const dateStr  = meta.date ? formatDate(meta.date) : '';
    const catAttr  = category ? ` data-category="${category}"` : '';
    return `
      <article class="ig-card"${catAttr}>
        ${category ? `<span class="ig-card__cat">${category}</span>` : ''}
        <h2 class="ig-card__title">${title}</h2>
        <p class="ig-card__meta">${author}${dateStr ? ` · ${dateStr}` : ''}</p>
        <a href="/insights/guides/${slug}.html" class="ig-card__link">Read guide →</a>
      </article>`;
  }).join('\n');

  const filterBtns = categories.map(c =>
    `<button class="ig-filter" data-cat="${escHtml(c)}">${escHtml(c)}</button>`
  ).join('\n        ');

  const hasFilters = categories.length > 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Insights — Open Door Media</title>
  <meta name="description" content="Guides and resources for our clients — from setting up GitHub and Cloudflare to tips on nonprofit marketing and better websites.">
  <link rel="canonical" href="https://opendoormedia.us/insights/">
  <link rel="icon" href="/favicon.ico">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://opendoormedia.us/insights/">
  <meta property="og:title" content="Insights — Open Door Media">
  <meta property="og:description" content="Guides and resources for our clients — from setting up GitHub and Cloudflare to tips on nonprofit marketing and better websites.">
  <meta property="og:image" content="https://opendoormedia.us/img/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Insights — Open Door Media">
  <meta name="twitter:description" content="Guides and resources from Open Door Media.">
  <meta name="twitter:image" content="https://opendoormedia.us/img/og-image.jpg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .ig-header {
      max-width: var(--max-w); margin: 0 auto;
      padding: 64px var(--sp-5) var(--sp-6);
      border-bottom: 1px solid var(--hairline);
    }
    .ig-header h1 { margin: 8px 0 12px; }
    .ig-header p  { max-width: 520px; }
    .ig-filters {
      display: flex; flex-wrap: wrap; gap: 8px;
      max-width: var(--max-w); margin: 0 auto;
      padding: var(--sp-5) var(--sp-5) var(--sp-3);
    }
    .ig-filter {
      background: none; border: 1px solid var(--hairline); border-radius: 99px;
      padding: 6px 16px; font-family: 'Montserrat', sans-serif; font-size: 10px;
      font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
      color: var(--taupe); cursor: pointer; transition: all .2s;
    }
    .ig-filter:hover { border-color: var(--accent); color: var(--accent); }
    .ig-filter.is-active { background: var(--accent); border-color: var(--accent); color: var(--paper); }
    .ig-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px; max-width: var(--max-w); margin: 0 auto;
      padding: var(--sp-3) var(--sp-5) var(--sp-12);
    }
    .ig-card {
      display: flex; flex-direction: column; gap: 10px;
      border: 1px solid var(--hairline); border-radius: 16px 16px 3px 16px;
      padding: 28px 26px; background: var(--paper);
      transition: border-color .2s, box-shadow .2s;
    }
    .ig-card:hover { border-color: rgba(197,88,51,.3); box-shadow: 0 4px 18px rgba(197,88,51,.06); }
    .ig-card.is-hidden { display: none; }
    .ig-card__cat {
      align-self: flex-start; border: 1px solid var(--accent); border-radius: 99px;
      padding: 2px 10px; font-family: 'Montserrat', sans-serif;
      font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
      color: var(--accent);
    }
    .ig-card__title { font-size: 20px; line-height: 1.25; color: var(--ink); margin: 0; }
    .ig-card__meta  { font-size: 12px; color: var(--taupe); margin: 0; }
    .ig-card__link {
      margin-top: auto; padding-top: 14px;
      font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 700;
      letter-spacing: 1px; text-transform: uppercase; color: var(--accent);
      transition: color .2s;
    }
    .ig-card__link:hover { color: var(--ink); }
    .ig-empty { grid-column: 1 / -1; text-align: center; padding: var(--sp-12) 0; color: var(--taupe); }
    @media (max-width: 600px) {
      .ig-header { padding: var(--sp-8) var(--sp-3) var(--sp-5); }
      .ig-filters { padding: var(--sp-4) var(--sp-3) var(--sp-2); }
      .ig-grid { grid-template-columns: 1fr; padding: var(--sp-3) var(--sp-3) var(--sp-8); }
    }
  </style>
</head>
<body>
${NAV}
  <main>
    <div class="ig-header">
      <span class="eyebrow">Resources · Insights</span>
      <h1>Guides &amp; resources.</h1>
      <p>Step-by-step guides for our clients, plus tips on marketing, websites, and growing your mission online.</p>
    </div>
    ${hasFilters ? `
    <div class="ig-filters">
      <button class="ig-filter is-active" data-cat="all">All</button>
      ${filterBtns}
    </div>` : ''}
    <div class="ig-grid" id="ig-grid">
      ${posts.length ? cards : '<p class="ig-empty">No guides published yet — check back soon.</p>'}
    </div>
  </main>
${FOOTER}
  <script src="/js/main.js"></script>
  ${hasFilters ? `<script>
  (function () {
    var filters = document.querySelectorAll('.ig-filter');
    var cards   = document.querySelectorAll('.ig-card');
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.dataset.cat;
        filters.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        cards.forEach(function (c) {
          c.classList.toggle('is-hidden', cat !== 'all' && c.dataset.category !== cat);
        });
      });
    });
  })();
  </script>` : ''}
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
  const html = guidePageHtml(post.meta, mdToHtml(post.body), post.slug);
  fs.writeFileSync(path.join(OUT_DIR, post.slug + '.html'), html, 'utf8');
  console.log(`  ✓  guides/${post.slug}.html`);
}

fs.writeFileSync(INDEX_FILE, insightsIndexHtml(posts), 'utf8');
console.log(`  ✓  insights/index.html  (${posts.length} guide${posts.length !== 1 ? 's' : ''})`);
