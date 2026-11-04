import { dateKey, parseDate, shiftDate, weekDays, validateTask, selectTasks } from './core.js';

const icons = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h1m6 0h1"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6m-6 4h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sparkles: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Zm7-1v4m-2-2h4"/>',
  'chevron-left': '<path d="m14 6-6 6 6 6"/>',
  'chevron-right': '<path d="m10 6 6 6-6 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  leaf: '<path d="M20 3C5 2 2 10 7 16c6 5 14 2 13-13Z"/><path d="m4 21 11-11"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  reset: '<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
  x: '<path d="m6 6 12 12M6 18 18 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  edit: '<path d="m15 5 4 4M4 20l5-1 12-12a2.8 2.8 0 0 0-4-4L5 15l-1 5Z"/>',
  trash: '<path d="M4 6h16M9 6V3h6v3m-9 0 1 15h10l1-15M10 10v7m4-7v7"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.sun}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const storageKey = 'dia-dashboard-v1';
const projectNames = { trabajo: 'Trabajo', personal: 'Personal', bienestar: 'Bienestar' };
const projectColors = { trabajo: 'purple', personal: 'orange', bienestar: 'green' };
const priorityNames = { alta: 'Alta', media: 'Media', baja: 'Baja' };
const state = { view: 'today', date: dateKey(), filter: 'todas', query: '', project: 'todos' };
let data = { tasks: [], intentions: {}, focusSessions: {} };
let storageAvailable = true;
let editingId = null;
let pendingDelete = null;
let toastTimeout;

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 4500);
}
function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(data)); storageAvailable = true; return true; }
  catch { storageAvailable = false; toast('No se pudo guardar en este navegador. Exporta una copia para conservar tus cambios.'); return false; }
}
function load() {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed.tasks) || !parsed.tasks.every(validateTask)) throw new Error('Datos inválidos');
    data = { tasks: parsed.tasks, intentions: validIntentions(parsed.intentions), focusSessions: validSessions(parsed.focusSessions) };
  } catch { storageAvailable = false; toast('No se pudieron leer tus datos. Puedes importar una copia de seguridad.'); }
}
function validIntentions(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, text]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && typeof text === 'string').map(([key, text]) => [key, text.slice(0, 300)]));
}
function validSessions(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, count]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isSafeInteger(count) && count >= 0));
}
const formatDate = (key, options) => parseDate(key).toLocaleDateString('es-ES', options);
function changeDate(date) { state.date = date; $('#date-picker').classList.remove('open'); render(); }

function render() {
  const today = dateKey();
  const dayTasks = data.tasks.filter(task => task.date === state.date);
  const done = dayTasks.filter(task => task.done).length;
  const pending = dayTasks.length - done;
  const progress = dayTasks.length ? Math.round(done / dayTasks.length * 100) : 0;
  const views = { today: 'Mi día', week: 'Esta semana', projects: 'Mis proyectos', completed: 'Completadas' };
  const titles = { today: state.date === today ? 'Hoy es un buen día' : 'Cada día, un nuevo paso', week: 'Tu semana, con perspectiva', projects: 'Cada cosa en su lugar', completed: 'Mira cuánto has avanzado' };
  const subtitles = { today: 'Despeja tu mente. Dale un lugar a lo que importa.', week: 'Haz espacio para tus planes, también para ti.', projects: 'Organiza tus tareas por las áreas de tu vida.', completed: 'Los pequeños logros también merecen celebrarse.' };
  const panelTitles = { today: state.date === today ? 'Tu plan de hoy' : 'Tu plan del día', week: 'Tu plan de la semana', projects: 'Tus tareas por área', completed: 'Lo que ya has hecho' };
  $('#breadcrumb-view').textContent = views[state.view];
  $('#page-title').innerHTML = `${titles[state.view]}<span>.</span>`;
  $('#page-subtitle').textContent = subtitles[state.view];
  $('#long-date').textContent = formatDate(state.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.querySelectorAll('[data-view]').forEach(button => { button.classList.toggle('active', button.dataset.view === state.view); if (button.dataset.view === state.view) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
  document.querySelectorAll('[data-filter]').forEach(button => { button.classList.toggle('active', button.dataset.filter === state.filter); button.setAttribute('aria-pressed', String(button.dataset.filter === state.filter)); });
  $('#stat-total').textContent = dayTasks.length;
  $('#stat-done').innerHTML = `${done} <span>/ ${dayTasks.length}</span>`;
  $('#stat-pending').textContent = pending;
  $('#stat-percent').innerHTML = `${progress}<span>%</span>`;
  $('#progress-ring').style.setProperty('--progress', `${progress * 3.6}deg`);
  $('#done-caption').textContent = done ? 'Cada pequeño logro cuenta' : 'Todo empieza con una tarea';
  $('#pending-caption').textContent = !dayTasks.length ? 'Haz espacio para tus planes' : pending ? `${dayTasks.filter(t => !t.done && t.priority === 'alta').length} con prioridad alta` : 'Todo listo. Disfruta de tu tiempo';
  $('#progress-caption').textContent = progress === 100 ? '¡Lo has conseguido!' : progress > 0 ? 'Vas por buen camino' : 'Vamos a por el primer paso';
  $('.stats-grid').setAttribute('aria-label', `Resumen del ${formatDate(state.date, { day: 'numeric', month: 'long' })}`);
  $('#today-count').textContent = data.tasks.filter(t => t.date === today && !t.done).length;
  for (const [project, id] of Object.entries({ trabajo: 'work-count', personal: 'personal-count', bienestar: 'wellness-count' })) $('#'+id).textContent = data.tasks.filter(t => t.project === project && !t.done).length;
  $('#date-label').textContent = state.date === today ? 'Hoy' : formatDate(state.date, { day: 'numeric', month: 'short' });
  $('#date-picker').value = state.date;
  $('#project-filter').hidden = state.view !== 'projects';
  $('#project-select').value = state.project;
  $('#task-panel-title').innerHTML = `${panelTitles[state.view]} <span id="task-total-badge">${selectTasks(data.tasks, { ...state, filter: 'todas', query: '' }).length}</span>`;
  $('#task-panel-caption').textContent = state.view === 'today' ? 'Un lugar para todas esas cosas que quieres hacer.' : state.view === 'week' ? 'Tus próximos pasos, de lunes a domingo.' : state.view === 'projects' ? 'Trabajo, personal y bienestar. Todo tiene su sitio.' : 'Un recordatorio de todo lo que eres capaz de hacer.';
  const tasks = selectTasks(data.tasks, state);
  $('#task-list').innerHTML = tasks.length ? tasks.map(taskHTML).join('') : emptyHTML();
  $('#list-summary').textContent = `${tasks.length} ${tasks.length === 1 ? 'tarea' : 'tareas'} · ${tasks.filter(t => !t.done).length} pendientes`;
  renderWeek();
  $('#daily-intention').value = data.intentions[state.date] || '';
  $('#note-status').textContent = storageAvailable ? 'Solo para ti. Se guarda al escribir.' : 'Guardado no disponible. Exporta tus datos.';
}
function taskHTML(task) {
  const showDate = state.view !== 'today';
  const title = escapeHTML(task.title);
  return `<article class="task-row ${task.done ? 'done' : ''}" data-id="${escapeHTML(task.id)}">
    <button class="task-check" data-action="toggle" aria-label="${task.done ? 'Marcar como pendiente' : 'Completar'}: ${title}" aria-pressed="${task.done}">${task.done ? icon('check') : ''}</button>
    <div class="task-content"><button class="task-name" data-action="edit" title="Editar tarea${task.notes ? ': ' + escapeHTML(task.notes) : ''}">${title}</button>
    <div class="task-meta"><span class="project-tag"><i class="dot ${projectColors[task.project]}"></i>${projectNames[task.project]}</span>${task.time ? `<span class="task-time">${icon('clock')}${task.time}</span>` : ''}${showDate ? `<span>${formatDate(task.date, { day: 'numeric', month: 'short' })}</span>` : ''}${task.notes ? '<span title="Esta tarea tiene notas">Con notas</span>' : ''}</div></div>
    <span class="task-priority ${task.priority}"><i></i>${priorityNames[task.priority]}</span>
    <div class="task-actions"><button class="icon-button" data-action="edit" aria-label="Editar: ${title}">${icon('edit')}</button><button class="icon-button delete-task" data-action="delete" aria-label="Eliminar: ${title}">${icon('trash')}</button></div>
    </article>`;
}
function emptyHTML() {
  const filtered = state.query || state.filter !== 'todas';
  const title = filtered ? 'No hay tareas que coincidan' : state.view === 'completed' ? 'Los logros empiezan con un paso' : 'Un lienzo en blanco para tus planes';
  const text = filtered ? 'Prueba con otra búsqueda o cambia los filtros.' : state.view === 'completed' ? 'Las tareas que completes aparecerán aquí.' : 'Añade tu primera tarea y deja que el día tome forma.';
  return `<div class="empty-state"><span>${icon(state.view === 'completed' ? 'check-circle' : 'leaf')}</span><h3>${title}</h3><p>${text}</p>${!filtered && state.view !== 'completed' ? '<button data-action="create">+ Crear mi primera tarea</button>' : ''}</div>`;
}
function renderWeek() {
  const days = weekDays(state.date);
  $('#month-label').textContent = formatDate(state.date, { month: 'long', year: 'numeric' });
  $('#week-days').innerHTML = days.map(day => {
    const count = data.tasks.filter(t => t.date === day && !t.done).length;
    const label = formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' });
    return `<button class="day-button ${day === state.date ? 'active' : ''} ${day === dateKey() ? 'today' : ''}" data-day="${day}" aria-label="${label}: ${count} tareas pendientes" aria-pressed="${day === state.date}"><small>${formatDate(day, { weekday: 'short' }).replace('.', '').slice(0, 1).toUpperCase()}</small><strong>${parseDate(day).getDate()}</strong><i class="day-dot" style="opacity:${count ? 1 : 0}"></i></button>`;
  }).join('');
  const weekTasks = data.tasks.filter(t => days.includes(t.date));
  const done = weekTasks.filter(t => t.done).length;
  $('#week-summary').innerHTML = weekTasks.length ? `<strong>${done} de ${weekTasks.length}</strong> tareas completadas esta semana. Cada paso cuenta.` : 'Tu semana está por escribir.<br><strong>Empieza con algo pequeño.</strong>';
}
function openTask(task = null) {
  editingId = task?.id || null;
  const form = $('#task-form');
  form.reset();
  $('#modal-title').textContent = task ? 'Editar tarea' : 'Nueva tarea';
  form.elements.title.value = task?.title || '';
  form.elements.date.value = task?.date || state.date;
  form.elements.time.value = task?.time || '';
  form.elements.priority.value = task?.priority || 'media';
  form.elements.project.value = task?.project || (state.project === 'todos' ? 'trabajo' : state.project);
  form.elements.notes.value = task?.notes || '';
  $('#task-dialog').showModal();
  $('#task-title').focus();
}
function setView(view, project = 'todos') {
  state.view = view; state.project = project; state.filter = 'todas'; state.query = '';
  $('#search').value = '';
  if (view === 'today') state.date = dateKey();
  render();
}
$('#new-task').addEventListener('click', () => openTask());
$('#add-task-row').addEventListener('click', () => openTask());
$('#close-dialog').addEventListener('click', () => $('#task-dialog').close());
$('#cancel-dialog').addEventListener('click', () => $('#task-dialog').close());
$('#task-form').addEventListener('submit', event => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  const existing = data.tasks.find(t => t.id === editingId);
  const task = { ...values, title: values.title.trim(), notes: values.notes.trim(), id: editingId || crypto.randomUUID(), done: existing?.done || false };
  if (!validateTask(task)) { toast('Revisa el título y la fecha de tu tarea.'); return; }
  if (existing) data.tasks[data.tasks.indexOf(existing)] = task;
  else data.tasks.push(task);
  const saved = save();
  $('#task-dialog').close();
  state.date = task.date;
  state.filter = 'todas'; state.query = ''; $('#search').value = '';
  if (state.view === 'completed' || (state.view === 'projects' && state.project !== 'todos' && state.project !== task.project)) state.view = 'today';
  render();
  if (saved) toast(existing ? 'Tarea actualizada.' : 'Un paso más cerca. Tarea añadida.');
});
$('#task-list').addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  if (button.dataset.action === 'create') { openTask(); return; }
  const task = data.tasks.find(t => t.id === button.closest('[data-id]').dataset.id);
  if (!task) return;
  if (button.dataset.action === 'toggle') {
    task.done = !task.done;
    const saved = save(); render();
    if (saved) toast(task.done ? '¡Un pequeño logro más! Bien hecho.' : 'Tarea marcada como pendiente.');
    const nextButton = [...document.querySelectorAll('.task-row')].find(el => el.dataset.id === task.id)?.querySelector('.task-check');
    nextButton?.focus({ preventScroll: true });
  } else if (button.dataset.action === 'edit') openTask(task);
  else { pendingDelete = task.id; $('#delete-dialog').showModal(); }
});
$('#delete-dialog').addEventListener('close', () => {
  if ($('#delete-dialog').returnValue === 'delete' && pendingDelete) {
    data.tasks = data.tasks.filter(t => t.id !== pendingDelete);
    const saved = save(); render(); if (saved) toast('Tarea eliminada.');
  }
  pendingDelete = null;
});
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => setView('projects', button.dataset.project)));
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { state.filter = button.dataset.filter; render(); }));
$('#project-select').addEventListener('change', event => { state.project = event.target.value; render(); });
$('#search').addEventListener('input', event => { state.query = event.target.value; render(); });
$('#prev-date').addEventListener('click', () => changeDate(shiftDate(state.date, state.view === 'week' ? -7 : -1)));
$('#next-date').addEventListener('click', () => changeDate(shiftDate(state.date, state.view === 'week' ? 7 : 1)));
$('#date-label').addEventListener('click', () => { $('#date-picker').classList.toggle('open'); if ($('#date-picker').classList.contains('open')) $('#date-picker').focus(); });
$('#date-picker').addEventListener('change', event => { if (event.target.value && !Number.isNaN(parseDate(event.target.value).valueOf())) changeDate(event.target.value); });
$('#week-days').addEventListener('click', event => { const button = event.target.closest('[data-day]'); if (button) { state.view = 'today'; changeDate(button.dataset.day); } });
$('#daily-intention').addEventListener('input', event => { data.intentions[state.date] = event.target.value; $('#note-status').textContent = save() ? 'Tu intención está guardada.' : 'No se ha podido guardar. Exporta tus datos.'; });
document.addEventListener('keydown', event => {
  if (event.key.toLowerCase() === 'n' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { event.preventDefault(); openTask(); }
});
$('#help-button').addEventListener('click', () => toast('Tus datos se guardan solo en este navegador. Exporta una copia para llevarlos a otro dispositivo.'));
$('#export-button').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ ...data, version: 1, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = `dia-copia-${dateKey()}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Copia de seguridad exportada.');
});
$('#import-button').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 5_000_000) throw new Error('Archivo demasiado grande');
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.tasks) || imported.tasks.length > 10000 || !imported.tasks.every(validateTask)) throw new Error('Formato no válido');
    // Merge by ID: importing a backup never removes current tasks or overwrites newer edits.
    const knownIds = new Set(data.tasks.map(t => t.id));
    let added = 0;
    for (const task of imported.tasks) if (!knownIds.has(task.id)) { data.tasks.push(task); knownIds.add(task.id); added++; }
    data.intentions = { ...validIntentions(imported.intentions), ...data.intentions };
    data.focusSessions = { ...validSessions(imported.focusSessions), ...data.focusSessions };
    const saved = save(); render();
    if (saved) toast(`${added} tareas importadas. Tus tareas actuales se han conservado.`);
  } catch { toast('No se pudo importar. Elige una copia JSON válida exportada desde día.'); }
  event.target.value = '';
});

// A deadline keeps the timer accurate even when the browser throttles background tabs.
const duration = 25 * 60;
let remaining = duration;
let deadline = null;
let interval = null;
function renderTimer() {
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');
  $('#timer').innerHTML = `${minutes}<span>:</span>${seconds}`;
  $('#timer-toggle').innerHTML = `${icon(deadline ? 'pause' : 'play')} ${deadline ? 'Pausar sesión' : remaining === duration ? 'Empezar sesión' : 'Continuar sesión'}`;
  document.title = deadline ? `${minutes}:${seconds} · Concentración — día.` : 'día. — Tu espacio personal';
}
function tick() {
  if (!deadline) return;
  remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  if (remaining === 0) {
    clearInterval(interval); deadline = null;
    data.focusSessions[dateKey()] = (data.focusSessions[dateKey()] || 0) + 1;
    const saved = save();
    if (saved) toast('¡Sesión completada! Respira y date un descanso.');
    $('#focus-status').textContent = `${data.focusSessions[dateKey()]} sesiones completadas hoy. Toca descansar.`;
    remaining = duration;
  }
  renderTimer();
}
$('#timer-toggle').addEventListener('click', () => {
  if (deadline) {
    tick(); clearInterval(interval); deadline = null;
    $('#focus-status').textContent = 'En pausa. Retoma cuando quieras.';
  } else {
    deadline = Date.now() + remaining * 1000;
    interval = setInterval(tick, 250);
    $('#focus-status').textContent = 'Una sola cosa. Este momento es para ti.';
  }
  renderTimer();
});
$('#timer-reset').addEventListener('click', () => { clearInterval(interval); deadline = null; remaining = duration; renderTimer(); $('#focus-status').textContent = '25 minutos para avanzar a tu ritmo'; });
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
window.addEventListener('beforeunload', event => { if (deadline || !storageAvailable) { event.preventDefault(); event.returnValue = ''; } });
load();
render();
renderTimer();
