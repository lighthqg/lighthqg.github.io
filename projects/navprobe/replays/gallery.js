(() => {
  const models = window.NAVPROBE_REPLAYS;
  const gallery = document.querySelector('[data-replay-gallery]');
  const assetBase = new URL('.', document.currentScript.src);
  const byId = name => gallery.querySelector('[data-replay="' + name + '"]');
  const modelSelect = byId('model');
  const scopeSelect = byId('scope');
  const gradeSelect = byId('grade');
  const srSelect = byId('sr');
  const runs = byId('runs');
  const detail = byId('detail');
  const params = new URLSearchParams(location.search);
  const title = value => value[0].toUpperCase() + value.slice(1).toLowerCase();
  const words = value => value.replaceAll('_', ' ').toLowerCase();
  const percent = value => value == null ? '—' : (100 * value).toFixed(1) + '%';

  function element(tag, value) {
    const node = document.createElement(tag);
    if (value != null) node.textContent = value;
    return node;
  }

  function runLabel(run) {
    const unit = run.scope === 'MICRO' ? ' · ' + run.id.split('_').slice(1).join(' ') : '';
    return 'Episode ' + run.episode + ' · ' + title(run.scope) + unit;
  }

  function outcome(run) {
    return [run.sr == null ? '' : 'SR ' + run.sr, title(run.grade)].filter(Boolean).join(' · ');
  }

  function showRun(model, run, updateLink) {
    for (const button of runs.children) {
      button.setAttribute('aria-pressed', String(button.dataset.run === run.id));
    }
    const video = element('video');
    video.src = new URL(run.video, assetBase).href;
    video.controls = true;
    video.preload = 'none';
    video.playsInline = true;
    const replay = element('figure');
    replay.append(element('figcaption', 'RGB replay and trajectory'), video);
    const figure = element('figure');
    const image = element('img');
    image.src = new URL(run.judgementImage, assetBase).href;
    image.loading = 'lazy';
    image.alt = 'Judgement geometry for episode ' + run.episode;
    const link = element('a');
    link.href = image.src;
    link.target = '_blank';
    link.rel = 'noopener';
    link.append(image);
    figure.append(element('figcaption', 'Judgement map · click to enlarge'), link);
    const media = element('div');
    media.className = 'run-media';
    media.append(replay, figure);
    const checks = element('details');
    const list = element('ul');
    for (const check of run.judgements) {
      list.append(element('li', check.id + ' · ' + check.outcome + ' · ' + words(check.type) + ' · ' + check.requirement));
    }
    checks.append(element('summary', 'Judgement results'), list);
    detail.replaceChildren(element('h2', runLabel(run)), element('p', run.instruction),
      element('p', outcome(run)));
    if (run.gradeExplanation) {
      const explanation = element('section');
      explanation.className = 'grade-explanation ' + run.grade.toLowerCase();
      explanation.append(element('h3', 'Why this run was rated ' + title(run.grade)),
        element('p', run.gradeExplanation));
      const failed = run.judgements.filter(check => check.reason);
      if (failed.length) {
        const reasons = element('ul');
        for (const check of failed) {
          const item = element('li');
          item.append(element('strong', check.id + ' · ' + title(check.type)),
            element('p', check.reason), element('small', check.requirement));
          reasons.append(item);
        }
        explanation.append(reasons);
      }
      detail.append(explanation);
    }
    detail.append(media, checks);
    if (updateLink) {
      const url = new URL(location.href);
      url.searchParams.set('model', model.id);
      url.searchParams.set('run', run.id);
      if (gallery.id) url.hash = gallery.id;
      history.replaceState(null, '', url);
    }
  }

  function render(requestedRun, updateLink = false) {
    const model = models.find(item => item.id === modelSelect.value);
    const matching = model.runs.filter(run =>
      (!scopeSelect.value || title(run.scope) === scopeSelect.value) &&
      (!gradeSelect.value || title(run.grade) === gradeSelect.value) &&
      (!srSelect.value || String(run.sr) === srSelect.value));
    const score = byId('score');
    const grades = scope => ['PERFECT', 'BAD', 'FAILED'].map(g => percent(model.grades[scope][g])).join(' / ');
    score.replaceChildren(element('strong', model.name + ' · full evaluation scorecard'),
      element('p', 'Whole SR ' + percent(model.wholeSR) + ' · Whole Perfect / Bad / Failed ' + grades('WHOLE')));
    if (model.grades.MICRO.PERFECT != null) {
      score.append(element('p', 'Micro Perfect / Bad / Failed ' + grades('MICRO')));
    }
    byId('count').textContent = matching.length + ' of ' + model.runs.length + ' selected runs';
    runs.replaceChildren();
    for (const run of matching) {
      const button = element('button', runLabel(run));
      button.type = 'button';
      button.dataset.run = run.id;
      button.append(element('small', outcome(run)));
      button.addEventListener('click', () => showRun(model, run, true));
      runs.append(button);
    }
    const active = matching.find(run => run.id === requestedRun) || matching[0];
    if (active) showRun(model, active, updateLink);
    else detail.replaceChildren(element('p', 'No replays match the selected filters.'));
  }

  for (const model of models) modelSelect.add(new Option(model.name, model.id));
  if (models.some(model => model.id === params.get('model'))) modelSelect.value = params.get('model');
  for (const select of [modelSelect, scopeSelect, gradeSelect, srSelect]) {
    select.addEventListener('change', () => render(undefined, true));
  }
  render(params.get('run'));
})();
