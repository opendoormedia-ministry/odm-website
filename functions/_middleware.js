// Cloudflare Pages Function middleware — Markdown content negotiation.
// When a request's Accept header includes text/markdown, returns a clean Markdown
// version of the page's main content instead of the full HTML page.
// All browser requests (text/html or no markdown preference) pass through unchanged.

export async function onRequest(context) {
  const { request, next } = context;

  const accept = request.headers.get('Accept') || '';
  if (!accept.includes('text/markdown')) {
    return next();
  }

  // Static assets have no useful Markdown representation — pass through unchanged.
  const { pathname } = new URL(request.url);
  const lastSegment = pathname.split('/').pop();
  if (lastSegment.includes('.') && !lastSegment.endsWith('.html')) {
    return next();
  }

  const response = await next();

  // Only transform successful HTML responses.
  if (!response.ok) return response;
  if (!(response.headers.get('Content-Type') || '').includes('text/html')) return response;

  const html = await response.text();

  // Extract page title from <head>.
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? decodeEntities(titleMatch[1].trim()) : '';

  // All boilerplate (nav, footer, head) lives outside <main>.
  // Extracting <main> content eliminates it entirely.
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (!mainMatch) {
    // No <main> element — return original unchanged.
    return new Response(html, { status: response.status, headers: response.headers });
  }

  // HTMLRewriter handles nested markup correctly for removing complex blocks.
  // Regex is used later for the simple line-by-line Markdown conversion.
  const cleaned = await new HTMLRewriter()
    .on('script',                    { element(el) { el.remove(); } })
    .on('style',                     { element(el) { el.remove(); } })
    .on('svg',                       { element(el) { el.remove(); } })
    .on('form',                      { element(el) { el.remove(); } })
    .on('nav',                       { element(el) { el.remove(); } })
    .on('[data-lottie]',             { element(el) { el.remove(); } })
    .on('.marquee-section',          { element(el) { el.remove(); } })
    .on('.contact-chat__window',     { element(el) { el.remove(); } })
    .on('.contact-chat__input-zone', { element(el) { el.remove(); } })
    .on('.faq-chat__window',         { element(el) { el.remove(); } })
    .on('.door-graphic',             { element(el) { el.remove(); } })
    .on('.service-subnav',           { element(el) { el.remove(); } })
    .transform(new Response(mainMatch[1], { headers: { 'Content-Type': 'text/html' } }))
    .text();

  return new Response(toMarkdown(cleaned, pageTitle), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept',
    },
  });
}

function toMarkdown(html, title) {
  let md = html;

  // 1. Inline elements first — convert before block processing so their
  //    text content survives later tag stripping.
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi,           '**$1**');
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi,         '_$1_');
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi,           '_$1_');

  // Links — skip protocol handlers (mailto:, tel:, sms:) — use plain text for those.
  md = md.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => {
    const text = stripTags(inner).trim();
    if (!text) return '';
    if (/^(mailto:|tel:|sms:)/.test(href)) return text;
    return '[' + text + '](' + href + ')';
  });

  // Images — keep alt text only.
  md = md.replace(/<img\b[^>]*\balt="([^"]*)"[^>]*>/gi, (_, alt) => alt.trim());
  md = md.replace(/<img\b[^>]*>/gi, '');

  md = md.replace(/<br\s*\/?>/gi, '\n');

  // 2. Block elements.
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => '\n\n# '    + clean(c) + '\n\n');
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => '\n\n## '   + clean(c) + '\n\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => '\n\n### '  + clean(c) + '\n\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, c) => '\n\n#### ' + clean(c) + '\n\n');

  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, c) => {
    return '\n\n' + clean(c).split('\n').filter(l => l.trim()).map(l => '> ' + l.trim()).join('\n') + '\n\n';
  });

  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, c) => {
    const items = [];
    c.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, item) => items.push('- ' + clean(item)));
    return '\n\n' + items.join('\n') + '\n\n';
  });

  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, c) => {
    let n = 1;
    const items = [];
    c.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, item) => items.push(n++ + '. ' + clean(item)));
    return '\n\n' + items.join('\n') + '\n\n';
  });

  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, c) => {
    const text = stripTags(c).trim();
    return text ? '\n\n' + text + '\n\n' : '';
  });

  // Buttons (FAQ question chips) — render as plain text lines.
  md = md.replace(/<button[^>]*>([\s\S]*?)<\/button>/gi, (_, c) => {
    const text = stripTags(c).trim();
    return text ? '\n' + text + '\n' : '';
  });

  // 3. Unwrap remaining structural/container elements.
  md = md.replace(/<\/?(div|section|article|aside|header|address|main|figure|figcaption|small|span)[^>]*>/gi, ' ');

  // 4. Decode HTML entities, strip any remaining tags, normalize whitespace.
  md = decodeEntities(md);
  md = md.replace(/<[^>]+>/g, '');
  md = md.replace(/[ \t]+/g, ' ');
  md = md.replace(/ *\n */g, '\n');
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.trim();

  return title ? '# ' + title + '\n\n' + md : md;
}

// Strip all HTML tags, collapsing the gap to a single space.
function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Strip tags, decode entities, and collapse whitespace — used for heading/list content.
function clean(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g,    '&')
    .replace(/&lt;/g,     '<')
    .replace(/&gt;/g,     '>')
    .replace(/&quot;/g,   '"')
    .replace(/&#39;/g,    "'")
    .replace(/&apos;/g,   "'")
    .replace(/&nbsp;/g,   ' ')
    .replace(/&middot;/g, '·')
    .replace(/&mdash;/g,  '—')
    .replace(/&ndash;/g,  '–')
    .replace(/&hellip;/g, '…')
    .replace(/&copy;/g,   '©')
    .replace(/&trade;/g,  '™')
    .replace(/&#(\d+);/gi,        (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
