(function () {
  function track(eventName, details = {}) {
    try {
      if (typeof gtag === 'function') {
        gtag('event', eventName, {page_path: location.pathname, ...details});
      }
    } catch (_) {
      // Analytics must never interfere with an inquiry.
    }
  }

  document.querySelectorAll('input[name="source_page"]').forEach(field => {
    field.value = location.pathname;
  });

  document.querySelectorAll('a[href]').forEach(link => {
    let url;
    try {
      url = new URL(link.getAttribute('href'), location.href);
    } catch (_) {
      return;
    }
    if (url.protocol === 'tel:') {
      link.addEventListener('click', () => track('phone_click'));
    } else if (url.protocol === 'mailto:') {
      link.addEventListener('click', () => track('email_click'));
    } else if (url.origin === location.origin && url.hash === '#contact') {
      link.addEventListener('click', () => track('webcraft_contact_cta_click', {
        contact_page: url.pathname
      }));
    }
  });

  // Only fixed option labels and field names may enter Analytics.
  const serviceNames = new Map([
    ['Web design', 'web_design'],
    ['Web hosting', 'web_hosting'],
    ['Local SEO', 'local_seo'],
    ['Google Ads', 'google_ads'],
    ['Analytics', 'analytics'],
    ['A few things', 'multiple_services']
  ]);
  const formFields = new Set(['name', 'business_name', 'email', 'city', 'service', 'message']);
  const formDetails = {form_name: 'project_inquiry'};
  const canSubmitWithFetch = typeof fetch === 'function' && typeof FormData === 'function';

  document.querySelectorAll('form[action="https://api.web3forms.com/submit"]').forEach(form => {
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[role="status"]');
    let pending = false;
    let started = false;
    const invalidFields = new Set();
    const label = button?.textContent;

    function recordStart() {
      if (started || pending || form.elements.namedItem('botcheck')?.checked) return;
      started = true;
      track('webcraft_form_start', formDetails);
    }

    function recordInput(event) {
      if (formFields.has(event.target.name)) recordStart();
    }

    form.addEventListener('input', recordInput);
    form.addEventListener('change', recordInput);
    form.addEventListener('invalid', event => {
      const field = event.target.name;
      if (pending || form.elements.namedItem('botcheck')?.checked ||
          !formFields.has(field) || invalidFields.has(field)) return;
      invalidFields.add(field);
      track('webcraft_form_validation_error', {...formDetails, field_name: field});
    }, true);

    form.addEventListener('submit', async event => {
      if (pending || form.elements.namedItem('botcheck')?.checked) {
        event.preventDefault();
        return;
      }
      if (!form.checkValidity()) {
        event.preventDefault();
        form.reportValidity();
        return;
      }

      const service = serviceNames.get(form.elements.namedItem('service')?.value);
      const details = service ? {...formDetails, service_interest: service} : formDetails;
      recordStart();
      track('webcraft_form_attempt', details);
      // Native POST remains available. Only the fetch path can observe provider acceptance.
      if (!canSubmitWithFetch || !button || !status) return;
      event.preventDefault();
      pending = true;
      button.disabled = true;
      button.textContent = 'Sending your inquiry…';
      form.setAttribute('aria-busy', 'true');
      status.textContent = 'Sending your inquiry…';
      let accepted = false;
      let deliveryError = 'request_unconfirmed';
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: {'Content-Type': 'application/json', Accept: 'application/json'},
          body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
          ...(typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
            ? {signal: AbortSignal.timeout(20000)} : {})
        });
        if (!response.ok) {
          deliveryError = response.status === 429 ? 'rate_limited' : 'provider_rejected';
          throw new Error('Submission not confirmed');
        }
        const result = await response.json();
        if (result.success !== true) {
          deliveryError = 'provider_rejected';
          throw new Error('Submission not confirmed');
        }
        accepted = true;
      } catch (error) {
        track('webcraft_form_delivery_error', {
          ...details,
          error_type: error?.name === 'TimeoutError' ? 'timeout' : deliveryError
        });
        status.textContent = 'We could not confirm your inquiry was received. Your details are still here. Please email Hello@localwebcraft.com or call (423) 401-8663 before trying again.';
      } finally {
        pending = false;
        button.disabled = false;
        button.textContent = label;
        form.removeAttribute('aria-busy');
      }

      if (accepted) {
        track('webcraft_inquiry_received', details);
        form.reset();
        started = false;
        invalidFields.clear();
        const source = form.elements.namedItem('source_page');
        if (source) source.value = location.pathname;
        status.textContent = 'Your inquiry has been received. Thank you for telling us about your project.';
      }
      status.setAttribute('tabindex', '-1');
      status.focus();
    });
  });
}());
