# WebCraft measurement and QA

Updated November 7, 2026.

## Production collection

All HTML pages use `/webcraft-analytics.js` before the deferred contact handler. It loads GA4 `G-4GJ9T13HPP` only on HTTPS `localwebcraft.com` or `www.localwebcraft.com`. Localhost, loopback addresses and other preview hosts do not create the Google tag or send page views. Page URLs and referrers exclude query strings and fragments. Existing consent behavior is unchanged; this release is not a consent-management implementation.

## Live-site QA

Begin a QA tab at `https://localwebcraft.com/?webcraft_test=1` before navigating. This suppresses analytics for that page and subsequent pages in the same tab via sessionStorage. To resume measurement in that tab, navigate to `https://localwebcraft.com/?webcraft_test=0`, or close the tab. If browser storage is unavailable, the URL opt-out applies to the current page only; use the local preview for a full walkthrough.

For a persistent staff-browser opt-out, set `localStorage.setItem('webcraft_analytics_disabled', '1')` in the production site's developer console, then reload before browsing. Remove it with `localStorage.removeItem('webcraft_analytics_disabled')` and reload when intentionally checking production tracking. This does not identify staff automatically on other browsers or devices.

## Inquiry interpretation

`webcraft_inquiry_received` fires once after the form provider confirms acceptance. Delivery to the intended inbox was separately verified during the earlier labeled test. The event is not proof of a qualified lead, booked job or revenue. GA4 key-event configuration has not been changed in this release.

The one inquiry event reported for October 31–November 6 coincides with the previously verified implementation test. Treat it as test-inclusive, not a confirmed customer lead. Historical records have not been deleted or reclassified. Record real inquiry qualification separately, and use the first complete post-release period as the clean baseline. Do not present the November 6 QA page-view spike as customer growth.

## Validation

`node --test scripts/test_analytics.cjs scripts/test_contact.cjs` exercises host/protocol restrictions, production page-view delivery and sanitization, staff opt-out, tab test mode and reset, storage errors, provider rejection, offline behavior, duplicate submissions, honeypot handling, analytics errors and older timeout support. Production measurement is tested at the script boundary without sending test leads or GA hits.

`python3 scripts/verify_site.py` checks every HTML page uses the guarded loader and has no unguarded Google tag. Browser QA also checks local pages contain no Google tag script.
