export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDate(key) { return new Date(`${key}T12:00:00`); }
export function shiftDate(key, offset) {
  const date = parseDate(key);
  date.setDate(date.getDate() + offset);
  return dateKey(date);
}
export function weekDays(key) {
  const day = parseDate(key).getDay();
  const monday = shiftDate(key, -(day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => shiftDate(monday, i));
}
export function validateTask(task) {
  return task && typeof task.id === 'string' && typeof task.title === 'string' && task.title.trim().length > 0
    && task.title.length <= 180 && typeof task.done === 'boolean' && ['alta', 'media', 'baja'].includes(task.priority)
    && ['personal', 'trabajo', 'bienestar'].includes(task.project)
    && /^\d{4}-\d{2}-\d{2}$/.test(task.date) && !Number.isNaN(parseDate(task.date).valueOf())
    && dateKey(parseDate(task.date)) === task.date
    && typeof task.time === 'string' && (task.time === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(task.time))
    && typeof task.notes === 'string' && task.notes.length <= 2000;
}
export function selectTasks(tasks, { view, date, filter = 'todas', query = '', project = 'todos' }) {
  const week = weekDays(date);
  return tasks.filter(task => {
    const inView = view === 'completed' ? task.done : view === 'week' ? week.includes(task.date) : view === 'projects' ? true : task.date === date;
    return inView && (filter === 'todas' || (filter === 'pendientes' ? !task.done : task.done))
      && (project === 'todos' || task.project === project)
      && `${task.title} ${task.notes}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'));
  }).sort((a, b) => Number(a.done) - Number(b.done) || a.date.localeCompare(b.date) || (a.time || '99:99').localeCompare(b.time || '99:99'));
}
