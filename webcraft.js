document.querySelectorAll('input[name="source_page"]').forEach(el=>el.value=location.pathname);
document.querySelectorAll('a[href^="mailto:"],a[href^="tel:"]').forEach(link=>link.addEventListener('click',()=>{if(typeof gtag==='function')gtag('event',link.href.startsWith('tel:')?'phone_click':'email_click',{page_path:location.pathname});}));
