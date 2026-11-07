# WebCraft growth sprint — November 7, 2026

## What the performance actually supports

Search Console's preliminary last-24-hour view, spanning November 6–7, showed 105 property impressions, 0 clicks and average position 55.9. These are early observations, not stable local rankings or proof of leads. Query rows can omit anonymized searches and need not reconcile to property/page totals. Searcher location is not established by a city in the query.

Page-filtered queries reviewed in that window:

- Maryville: `seo consultant maryville tn` — 1 impression, position 4; `professional seo services maryville tn` — 1, position 11. Also Shopify (2 impressions) and social-media queries (1) that do not establish a supported service offer.
- Cartersville: `website design cartersville ga` — 1, position 33; an unusual combined Acworth/Cartersville agency query — 1, position 4. Do not optimize around the anomalous combined phrase.
- Cleveland: `cleveland tennessee web development` — 1, position 2; `cleveland tn web development` — 1, position 3; `cleveland tn seo company` — 1, position 100.

Source: signed-in Search Console page/query filters for sc-domain:localwebcraft.com on November 7. A single impression can result from a narrow or personalized search; no page-one claim is made.

## Implemented

1. Guarded production analytics so local/preview QA no longer inflates the GA4 property. Added explicit live-site QA opt-outs. Historical test traffic is retained and documented in ANALYTICS-QA.md.
2. Improved three existing hiring pages with accurate search-result descriptions, concise package scope beside the CTA, a design-study link and relevant scope questions. No unsupported Shopify/social-media offer was added.
3. Created one original service-business design study. Field & Fence is explicitly fictional in the visible page and structured data. It demonstrates design decisions and an illustrative five-page scope, with no invented client, testimonial or outcome. Linked from the homepage, web-design page and priority location pages.
4. Expanded the existing domain/hosting ownership guide with a practical handoff checklist. Added a five-service guide index to Insights. No batch of city-swapped articles was created.
5. Prepared an external research document with 20 local accounts, qualification status, sources and five initial outreach drafts. Four accounts have concrete observations to validate, seven have fit without buying evidence and nine are held for verification. No outbound messages were sent; no unverified email list was uploaded. Prospect research is kept outside this public repository.

## Article decisions

| Service | Existing resource to improve/use | Next publication gate |
|---|---|---|
| Web design | Website cost worksheet and new design study | A real approved project or repeated buyer question that existing material cannot answer |
| Hosting/care | Expanded domain ownership guide and Dayton handoff checklist | An actual platform/migration question with a tested answer |
| Local SEO | Chattanooga SEO/Ads decision guide and local visibility guides | A recurring relevant query, indexing issue or factual business example |
| Google Ads | Dayton starter-budget guide and Atlanta landing-page brief | Real account evidence or an original usable planning example |
| Analytics | Cookeville acceptance test and tracking guide | A verified implementation problem with a reproducible test |

No fixed article quota per city or service. Existing city hiring pages should explain genuine coverage and link to the most useful shared resource. The next content priority is depth and verified evidence, not location-count expansion.

## Reviews, introductions and authority

Review and introduction drafts are in the local outreach pack for actual existing clients. No client contacts or approved testimonials were supplied. The user asked for a fictional display project, so an explicitly labeled concept was created instead of inventing client proof.

Business Profile eligibility is still unverified: the site describes remote delivery and the user has not confirmed in-person customer contact. No new profile, address, city office or review destination was invented. Reference: https://support.google.com/business/answer/3038177.

Cleveland/Bradley Chamber membership has directory/networking benefits: https://clevelandchamber.com/membership/membership-tiers-benefits/membership-benefits/. Evaluate participation for business value, not a purchased ranking guarantee. No membership was bought and no binding application submitted. Blount Chamber and Chattanooga Chamber are further relationship prospects only after geographic fit and commercial value are confirmed. No paid link placements were ordered.

## Next-week scorecard

Use matching closed periods after the measurement fix. Track nonbranded relevant query impressions/clicks, important indexed URLs, production organic landing sessions, non-test received inquiries, qualified conversations and follow-up. Report each service/location separately where data is sufficient. First distinguish real demand from QA and anomalous queries; do not forecast a lead count from one day of impressions.

## Guidance checked

- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- https://support.google.com/business/answer/3038177
- https://support.google.com/analytics/answer/10104470

Deployment, crawling, indexing and rankings are separate outcomes. The user’s prior instruction to push code without waiting for deployment remains in effect.

## Verification

- 18 analytics/contact tests passed, including production collection and local/test exclusions.
- All 86 public pages passed HTTP/static checks, canonical and sitemap parity, heading order and link checks.
- Browser checks passed on all 86 public pages at 320, 390, 800 and 1440px (344 page/viewport checks), with no document overflow, clipped headings/forms or Google tag script on the local preview.
- Independent review found no critical or important issues. The new concept was visually inspected on desktop and phone.
