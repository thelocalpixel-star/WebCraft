document.querySelectorAll('input[name="source_page"]').forEach(el=>el.value=location.pathname);
document.querySelectorAll('a[href^="mailto:"],a[href^="tel:"]').forEach(link=>link.addEventListener('click',()=>{if(typeof gtag==='function')gtag('event',link.href.startsWith('tel:')?'phone_click':'email_click',{page_path:location.pathname});}));

// Native POST remains available when JavaScript or fetch is unavailable.
// This distinct event is not automatically marked as a GA4 key event: account-side
// integrations must be reconciled before using it for advertising or lead totals.
if (typeof fetch === 'function' && typeof FormData === 'function') {
  document.querySelectorAll('form[action="https://api.web3forms.com/submit"]').forEach(form => {
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[role="status"]');
    if (!button || !status) return;
    let pending = false;
    const label = button.textContent;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending || form.elements.namedItem('botcheck')?.checked) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      pending = true;
      button.disabled = true;
      button.textContent = 'Sending your inquiry…';
      form.setAttribute('aria-busy', 'true');
      status.textContent = 'Sending your inquiry…';
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
          ...(typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
            ? { signal: AbortSignal.timeout(20000) } : {})
        });
        const result = await response.json();
        if (!response.ok || result.success !== true) throw new Error('Submission not confirmed');
        // Never pass names, email addresses, city input or message text to analytics.
        // Isolate analytics errors so an accepted inquiry is not shown as a failure.
        try {
          if (typeof gtag === 'function') gtag('event', 'webcraft_inquiry_received', {
            page_path: location.pathname,
            form_name: 'project_inquiry'
          });
        } catch (_) { /* The inquiry succeeded even if analytics is blocked. */ }
        form.reset();
        const source = form.elements.namedItem('source_page');
        if (source) source.value = location.pathname;
        status.textContent = 'Your inquiry has been received. Thank you for telling us about your project.';
      } catch (_) {
        status.textContent = 'We could not confirm your inquiry was received. Your details are still here. Please email Hello@localwebcraft.com or call (423) 401-8663 before trying again.';
      } finally {
        pending = false;
        button.disabled = false;
        button.textContent = label;
        form.removeAttribute('aria-busy');
        status.setAttribute('tabindex', '-1');
        status.focus();
      }
    });
  });
}
