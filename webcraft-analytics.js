// Production-only measurement. QA tabs can opt out before any GA request is made.
(function () {
  const measurementId = 'G-4GJ9T13HPP';
  const production = location.protocol === 'https:' &&
    ['localwebcraft.com', 'www.localwebcraft.com'].includes(location.hostname);
  let disabled = !production;
  const testMode = new URLSearchParams(location.search).get('webcraft_test');
  if (testMode === '1') disabled = true;
  try {
    if (testMode === '1') sessionStorage.setItem('webcraft_test', '1');
    if (testMode === '0') sessionStorage.removeItem('webcraft_test');
    disabled = disabled || sessionStorage.getItem('webcraft_test') === '1';
  } catch (_) { /* The URL opt-out still applies when storage is unavailable. */ }
  try {
    disabled = disabled || localStorage.getItem('webcraft_analytics_disabled') === '1';
  } catch (_) { /* Storage restrictions must not interrupt the website. */ }
  window.webcraftAnalyticsEnabled = !disabled;
  if (disabled) {
    window['ga-disable-' + measurementId] = true;
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {send_page_view: false});
  let referrer = '';
  try {
    if (document.referrer) {
      const url = new URL(document.referrer);
      referrer = url.origin + url.pathname;
    }
  } catch (_) { /* Ignore invalid referrer strings. */ }
  window.gtag('event', 'page_view', {
    page_location: location.origin + location.pathname,
    page_title: document.title,
    page_referrer: referrer
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);
}());
