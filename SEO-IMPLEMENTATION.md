# Local search implementation — November 6, 2026

## Published scope

- Five expanded service pages: web design, hosting, local SEO, Google Ads and analytics. Each explains scope, responsibilities, buying questions and related services, with links to all 24 existing community pages.
- Updated location headings, titles and descriptions across all 24 featured communities. Retained URLs, truthful remote-service disclosures, distinctive existing planning guides and established website pricing.
- Corrected heading hierarchy across all affected pages. The hero design concept is decorative copy, not a subsection of WebCraft's document.
- Consistent Organization identifier and service providers, with actual service coverage on each service page. No fabricated offices, reviews or client results.
- Preserved GA4 measurement ID and canonical URLs. Updated sitemap modification dates and CSS/JS asset versions.
- Progressive contact handler: Web3Forms confirmed success only, double-submit guard, retained input on failure, accessible status, native POST without JavaScript. Distinct `webcraft_inquiry_received` event carries only page path and form name. It is not automatically marked as a key event or imported to ads.

## Keyword ownership

`SEO-KEYWORD-MAP.csv` maps 120 initial service/location phrases to existing pages. These are a bounded research set, not every possible query. Web design variants map to city pages; hosting, SEO, Ads and GA4 variants map to detailed service pages with supporting city links. Close variants should share a page, not create a separate URL.

OpenSEO returned metrics for 12 phrases and no data for 108. Missing data is recorded as unknown, not zero. Estimates are US monthly searches for the exact phrase, not city-level traffic or future leads. Do not add overlapping variants into a demand total. Broader-service variants and real Search Console queries should guide the next research pass.

## First-party baseline

- Search Console page data: August 3–November 3, 2026, homepage only, 4 impressions and 0 clicks. Query rows were unavailable. This is too small a sample for a trend or an explanation of low click-through.
- Homepage and Cleveland page were indexed before these edits; homepage live fetch succeeded. Sitemap read successfully November 6 with 80 discovered URLs. Discovered does not mean indexed.
- Initial OpenSEO crawl covered 50 of 80 URLs and reported 10 informational heading-order issues. The local regression check covers heading order across all 80 public HTML pages.
- GA4 connected property 562167373, stream G-4GJ9T13HPP. Enhanced form measurement is enabled. Existing key events: close_convert_lead, qualify_lead, purchase. No key-event rows returned October 1–November 5. This does not establish that no server integrations exist.

## Verification

Run `python3 scripts/verify_site.py` with the local HTTP server on port 4173, `python3 scripts/verify_seo.py`, and `node --test scripts/test_contact.cjs`.

The contact tests cover accepted/rejected requests, network failures, double submission, spam honeypot, blocked analytics and browsers without AbortSignal.timeout. Real inbox delivery and arrival in GA4 require a live identifiable test. Native GA4 form_submit events must not be treated as confirmed successful inquiries.

## Ongoing work requiring real evidence

Review Search Console queries and landing pages after recrawling, alongside qualified inquiries. Improve existing pages before adding more city pages. Request indexing only for a small set of substantially changed priority URLs; do not repeatedly request the same URL.

Real case studies, project photos, team identity and customer feedback must come from the business. No invented portfolio items or statistics. A Google Business Profile should be used only if the business meets Google's in-person eligibility rules; an online-only service does not qualify merely because it serves a region.

Sources consulted: Google Search Central spam policies, helpful-content guidance and Organization structured data documentation; Web3Forms API and AJAX documentation. OpenSEO project c93c45a5-3589-4dd4-b883-fdd824a2bbe1 retains the research baseline and business context.

## Live verification

GitHub Pages deployed commit e6be435 successfully. Eleven live priority pages were checked for updated content, canonicals and horizontal overflow. Web3Forms accepted one labeled technical test (WEBCRAFT-SEO-20261106), and GA4 Realtime showed exactly one webcraft_inquiry_received event. Inbox delivery was not inspected. GA4 has no custom event definitions or event modification rules; unknown external server integrations remain unverified. The new event remains distinct and is not an advertising conversion.

A final live pass found 25 pages using an older script cache version. Their references were synchronized to the current confirmed-inquiry handler. Search Console continued to show the Cleveland URL as indexed, but a new recrawl request was not confirmed; no claim is made that Google has indexed the revised content.
