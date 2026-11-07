# WebCraft measurement and QA

Updated November 7, 2026.

## Production collection

All HTML pages use `/webcraft-analytics.js` before the deferred contact handler. It loads GA4 `G-4GJ9T13HPP` only on HTTPS `localwebcraft.com` or `www.localwebcraft.com`. Localhost, loopback addresses and other preview hosts do not create the Google tag or send page views. Page URLs and referrers exclude query strings and fragments. Existing consent behavior is unchanged; this release is not a consent-management implementation.

## Live-site QA

Begin a QA tab at `https://localwebcraft.com/?webcraft_test=1` before navigating. This suppresses analytics for that page and subsequent pages in the same tab via sessionStorage. To resume measurement in that tab, navigate to `https://localwebcraft.com/?webcraft_test=0`, or close the tab. If browser storage is unavailable, the URL opt-out applies to the current page only; use the local preview for a full walkthrough.

For a persistent staff-browser opt-out, set `localStorage.setItem('webcraft_analytics_disabled', '1')` in the production site's developer console, then reload before browsing. Remove it with `localStorage.removeItem('webcraft_analytics_disabled')` and reload when intentionally checking production tracking. This does not identify staff automatically on other browsers or devices.

## Lead and contact reporting

In the WebCraft GA4 property, open **Reports → Acquisition → Traffic acquisition** and select `webcraft_inquiry_received` in the Key events column to see which sources and campaigns brought in confirmed inquiries. In **Reports → Engagement → Events**, compare the form steps. Use a GA4 exploration with **Page path and screen class** to compare service and city pages, and **Service interest**, **Inquiry form field**, or **Inquiry delivery error** to break down the relevant events.

| Event | What it measures |
| --- | --- |
| `webcraft_inquiry_received` | The form provider confirmed acceptance. This is the GA4 lead key event. |
| `webcraft_contact_cta_click` | A link to a WebCraft contact section was clicked. |
| `phone_click`, `email_click` | A phone or email link was clicked. |
| `webcraft_form_start` | The first interaction with a draft, or the first attempt from an autofilled form. Use this event for WebCraft form reporting. |
| `webcraft_form_attempt` | A valid submission reached the site's form handler. |
| `webcraft_form_validation_error` | Browser validation flagged a known field, once per field per draft. |
| `webcraft_form_delivery_error` | The site could not confirm provider acceptance. The recorded reason distinguishes rate limits, provider rejection, timeout and unconfirmed requests. |

Inquiry details still go through Web3Forms to the existing inbox. Analytics receives the page, a predefined service category and fixed field names or error reasons where relevant. The key event measures an accepted form submission. Check the inbox for delivery and record lead qualification and sales separately. Phone and email clicks measure intent; they do not indicate a completed call or a sent email. When the browser falls back to a native form post, the site cannot observe the provider's response for Analytics.

The inquiry event recorded October 31–November 6 coincides with the previously verified implementation test. Use a post-release date range when reporting real leads, and exclude the November 6 QA spike when comparing traffic.

## Validation

`node --test scripts/test_analytics.cjs scripts/test_contact.cjs` exercises host/protocol restrictions, production page-view delivery and sanitization, staff opt-out, tab test mode and reset, storage errors, the inquiry funnel, provider rejection, offline behavior, duplicate submissions, honeypot handling, analytics errors and older timeout support. Production measurement is tested at the script boundary without sending test leads or GA hits.

`python3 scripts/verify_site.py` checks every HTML page uses the guarded loader and has no unguarded Google tag. Browser QA also checks local pages contain no Google tag script.
