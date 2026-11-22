(() => {
  const library = document.querySelector('#guide-library');
  const controls = document.querySelector('.library-search');
  if (!library || !controls) return;

  const search = controls.querySelector('input');
  const clear = controls.querySelector('[data-clear]');
  const status = controls.querySelector('[data-result-summary]');
  const empty = library.querySelector('[data-empty]');
  const topicIndex = library.querySelector('[data-topic-index]');
  const sections = [...library.querySelectorAll('[data-library-section]')];
  const topics = sections.filter(section => section.matches('details')).map(element => ({
    element,
    count: element.querySelector('.library-count'),
    guides: [...element.querySelectorAll('[data-guide]')]
  }));
  const normalize = value => value.toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const guides = [...library.querySelectorAll('[data-guide]')].map(element => ({
    element,
    url: element.querySelector('a').getAttribute('href'),
    text: normalize(element.textContent + ' ' + element.closest('[data-topic]').dataset.topic)
  }));
  let previousOpen = null;

  function update() {
    const query = normalize(search.value);
    const terms = query ? query.split(' ') : [];
    const active = terms.length > 0;
    const results = new Set();

    if (active && !previousOpen) {
      previousOpen = new Set(topics.filter(topic => topic.element.open));
    }

    for (const guide of guides) {
      const matches = !active || (
        !results.has(guide.url) && terms.every(term => guide.text.includes(term))
      );
      guide.element.hidden = !matches;
      if (matches) results.add(guide.url);
    }

    for (const section of sections) {
      section.hidden = active && !section.querySelector('[data-guide]:not([hidden])');
    }
    for (const topic of topics) {
      if (active) topic.element.open = !topic.element.hidden;
      else if (previousOpen) topic.element.open = previousOpen.has(topic);
      topic.count.textContent = active
        ? topic.guides.filter(guide => !guide.hidden).length
        : topic.guides.length;
    }
    if (!active) previousOpen = null;

    topicIndex.hidden = active && topics.every(topic =>
      !topicIndex.contains(topic.element) || topic.element.hidden
    );
    empty.hidden = !active || results.size > 0;
    clear.hidden = !search.value;
    status.textContent = active
      ? `${results.size} ${results.size === 1 ? 'guide matches' : 'guides match'}.`
      : '';
  }

  search.addEventListener('input', update);
  clear.addEventListener('click', () => {
    search.value = '';
    update();
    search.focus();
  });

  function openTopic(hash) {
    if (!hash.startsWith('#topic-')) return;
    const target = document.getElementById(hash.slice(1));
    if (target?.matches('details.library-topic') && !target.hidden) target.open = true;
  }

  library.querySelector('.library-jumps').addEventListener('click', event => {
    const link = event.target.closest('a');
    if (link) openTopic(link.hash);
  });
  window.addEventListener('hashchange', () => openTopic(location.hash));
  openTopic(location.hash);
  controls.hidden = false;
})();
