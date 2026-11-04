import test from 'node:test';
import assert from 'node:assert/strict';
import { dateKey, parseDate, shiftDate, weekDays, selectTasks, validateTask } from '../core.js';

const task = { id: 'one', title: 'Preparar el día', date: '2026-11-04', time: '09:00', priority: 'alta', project: 'personal', notes: '', done: false };
test('Las fechas avanzan correctamente entre meses y años', () => {
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDate('2028-03-01', -1), '2028-02-29');
  assert.equal(dateKey(parseDate('2026-11-04')), '2026-11-04');
});
test('La semana comienza en lunes incluso al seleccionar domingo', () => {
  assert.deepEqual(weekDays('2026-11-08'), ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']);
});
test('Las vistas combinan fecha, estado, área y búsqueda', () => {
  const tasks = [task, { ...task, id: 'two', date: '2026-11-05', done: true }, { ...task, id: 'three', date: '2026-12-01', project: 'trabajo' }];
  assert.equal(selectTasks(tasks, { view: 'today', date: task.date }).length, 1);
  assert.equal(selectTasks(tasks, { view: 'week', date: task.date }).length, 2);
  assert.equal(selectTasks(tasks, { view: 'completed', date: task.date })[0].id, 'two');
  assert.equal(selectTasks(tasks, { view: 'projects', date: task.date, project: 'trabajo', query: 'PREPARAR' })[0].id, 'three');
  assert.equal(selectTasks(tasks, { view: 'week', date: task.date, filter: 'pendientes' }).length, 1);
});
test('La importación rechaza fechas imposibles, horas y campos inválidos', () => {
  assert.equal(validateTask(task), true);
  for (const change of [{ date: '2026-02-30' }, { time: '25:00' }, { title: '  ' }, { priority: 'urgente' }, { project: '<script>' }, { done: 'false' }, { notes: null }]) assert.equal(validateTask({ ...task, ...change }), false);
});
