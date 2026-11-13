const models = window.NAVPROBE_REPLAYS;
const byId = id => document.getElementById(id);
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

function showRun(model, run) {
  for (const button of runs.children) {
    button.setAttribute('aria-pressed', String(button.dataset.run === run.id));
  }
  const video = element('video');
  video.src = run.video;
  video.controls = true;
  video.preload = 'none';
  video.playsInline = true;
  const replay = element('figure');
  replay.append(element('figcaption', 'RGB replay and trajectory'), video);
  const figure = element('figure');
  const image = element('img');
  image.src = run.judgementImage;
  image.alt = 'Judgement geometry for episode ' + run.episode;
  const link = element('a');
  link.href = run.judgementImage;
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
    list.append(element('li', check.outcome + ' · ' + words(check.type) + ' · ' + check.instruction_span));
  }
  checks.append(element('summary', 'Judgement results'), list);
  detail.replaceChildren(element('h2', runLabel(run)), element('p', run.instruction),
    element('p', outcome(run)), media, checks);
  history.replaceState(null, '', '?model=' + encodeURIComponent(model.id) + '&run=' + encodeURIComponent(run.id));
}

function render(requestedRun) {
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
    button.addEventListener('click', () => showRun(model, run));
    runs.append(button);
  }
  const active = matching.find(run => run.id === requestedRun) || matching[0];
  if (active) showRun(model, active);
  else detail.replaceChildren(element('p', 'No replays match the selected filters.'));
}

for (const model of models) modelSelect.add(new Option(model.name, model.id));
if (models.some(model => model.id === params.get('model'))) modelSelect.value = params.get('model');
for (const select of [modelSelect, scopeSelect, gradeSelect, srSelect]) {
  select.addEventListener('change', () => render());
}
render(params.get('run'));
