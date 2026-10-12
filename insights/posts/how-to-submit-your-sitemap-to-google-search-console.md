---
title: How to Submit Your Sitemap to Google Search Console
author: Open Door Media
date: 2026-10-12
category: Marketing
format: html
published: true
---

<p>Google Search Console is the free tool Google provides to help you understand how your site appears in search results. Submitting your sitemap tells Google exactly which pages exist on your site and speeds up how quickly new content gets indexed. This guide walks you through setting it up from scratch.</p>
<blockquote><strong>Note:</strong> This is different from Google Analytics. Analytics tracks who visits your site and what they do. Search Console handles the SEO side — indexing, search rankings, and making sure Google can find your pages.</blockquote>
<hr>
<h2>Part 1: Sign In to Google Search Console</h2>
<ol><li>Go to <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">search.google.com/search-console</a>.</li><li>Sign in with the same Google account you used for your Google Business Profile (or any Google account tied to your organization).</li><li>Click <strong>Start now</strong>.</li></ol>
<hr>
<h2>Part 2: Add Your Website as a Property</h2>
<p>Search Console calls each website a "property." You need to add yours before you can do anything else.</p>
<ol><li>In the top-left corner, click the property dropdown and select <strong>Add property</strong>.</li><li>You'll be offered two property types:<ul><li><strong>Domain</strong> — covers all versions of your site (http, https, www, non-www). Requires a DNS record change. Best for a complete picture, but more technical to set up.</li><li><strong>URL prefix</strong> — covers one specific URL (e.g., <code>https://yourdomain.com</code>). Easier to verify and recommended for most clients.</li></ul></li><li>Select <strong>URL prefix</strong>, enter your full website address (e.g., <code>https://yourdomain.com</code>), and click <strong>Continue</strong>.</li></ol>
<hr>
<h2>Part 3: Verify Ownership of Your Site</h2>
<p>Google needs to confirm you own the site before giving you access to its data. Several verification methods are available — use whichever fits your situation.</p>
<table><thead><tr><th>Method</th><th>How It Works</th><th>Best For</th></tr></thead><tbody><tr><td><strong>Google Tag Manager</strong></td><td>If GTM is already installed on your site, Google can verify ownership automatically — no changes needed.</td><td>Sites already using GTM (recommended if applicable)</td></tr><tr><td><strong>Google Analytics</strong></td><td>If GA4 is already linked to the same Google account, Google can verify through it.</td><td>Sites already using Google Analytics</td></tr><tr><td><strong>HTML meta tag</strong></td><td>Google gives you a small snippet of code to paste into your site's <code>&lt;head&gt;</code> tag.</td><td>Sites where you or your developer can edit the HTML</td></tr><tr><td><strong>HTML file upload</strong></td><td>Google provides a small file to upload to your server's root folder.</td><td>Sites with direct server/hosting access</td></tr><tr><td><strong>Domain name provider</strong></td><td>Add a TXT record to your DNS settings at your registrar (e.g., Cloudflare, GoDaddy).</td><td>Domain-type properties; requires DNS access</td></tr></tbody></table>
<blockquote><strong>Recommended:</strong> If your site already has Google Tag Manager or Google Analytics installed, select that method — Google will verify immediately with no additional steps. Open Door Media-built sites include GTM by default, so this is usually the fastest path.</blockquote>
<ol><li>Choose your verification method from the list and follow the on-screen instructions.</li><li>Once complete, click <strong>Verify</strong>. You should see a confirmation message. If verification fails, double-check that GTM or Analytics is publishing on your live site and try again.</li></ol>
<hr>
<h2>Part 4: Submit Your Sitemap</h2>
<p>A sitemap is a file (usually named <code>sitemap.xml</code>) that lists every page on your website. Submitting it helps Google discover and index your content faster.</p>
<blockquote><strong>Before you begin:</strong> Confirm that a sitemap exists on your site by visiting <code>https://yourdomain.com/sitemap.xml</code> in your browser. If you see a structured list of URLs, you're good. If you get a 404 error, your sitemap may not exist yet — let us know and we can create one for you.</blockquote>
<ol><li>In the left sidebar of Search Console, click <strong>Sitemaps</strong>.</li><li>In the <em>"Add a new sitemap"</em> field, type <code>sitemap.xml</code> (Search Console will automatically prepend your domain).</li><li>Click <strong>Submit</strong>.</li><li>The sitemap will appear in the list below with a status of <strong>Success</strong> once Google has processed it. This is usually immediate, though it can take a few minutes.</li></ol>
<blockquote><strong>Note:</strong> Submitting a sitemap doesn't guarantee instant indexing of every page — it just tells Google where to look. Full indexing typically takes anywhere from a few hours to a few days.</blockquote>
<hr>
<h2>Part 5: What to Check Next</h2>
<p>Once your property is verified and your sitemap is submitted, Search Console will begin collecting data. Here are the most useful sections to check over the coming weeks:</p>
<ul><li><strong>Overview</strong> — a summary of clicks, impressions, and any critical issues</li><li><strong>Performance → Search results</strong> — which search queries are bringing people to your site, and which pages rank</li><li><strong>Indexing → Pages</strong> — which pages Google has successfully indexed, and which have errors or warnings</li><li><strong>Experience</strong> — Core Web Vitals scores (page speed and usability signals that affect rankings)</li></ul>
<p>If you see any pages listed under <em>Why pages aren't indexed</em>, send us a screenshot and we can advise on next steps.</p>
<hr>
<h2>Quick Reference</h2>
<table><thead><tr><th>Item</th><th>Your Info</th></tr></thead><tbody><tr><td>Google account used</td><td><strong>[YOUR EMAIL ADDRESS]</strong></td></tr><tr><td>Property URL</td><td><strong>[YOUR WEBSITE URL]</strong></td></tr><tr><td>Verification method used</td><td><strong>[GTM / ANALYTICS / META TAG / FILE / DNS]</strong></td></tr><tr><td>Sitemap URL submitted</td><td><strong>[YOUR WEBSITE URL]/sitemap.xml</strong></td></tr></tbody></table>
<hr>
<p><em>Questions about this process? Reach out to <strong>help@opendoormedia.us</strong> and we'll walk you through it.</em></p>
