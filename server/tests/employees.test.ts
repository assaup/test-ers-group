import type { Employee } from '@test-ers/shared';
import { describe, expect, it } from 'vitest';
import { DEMO_DEPARTMENTS } from '../src/db/seed';
import { escapeLike } from '../src/modules/employees/employees.repository';
import { createLoggedInApp } from './helpers';

function names(body: { items: Employee[] }) {
  return body.items.map((employee) => employee.fullName);
}

async function departmentId(
  agent: Awaited<ReturnType<typeof createLoggedInApp>>['agent'],
  name: string,
) {
  const res = await agent.get('/api/departments');
  const department = (res.body.items as { id: number; name: string }[]).find(
    (d) => d.name === name,
  );
  if (!department) throw new Error(`No department ${name}`);
  return department.id;
}

describe('GET /api/departments', () => {
  it('lists departments ordered by name', async () => {
    const { agent } = await createLoggedInApp();

    const res = await agent.get('/api/departments');

    expect(res.status).toBe(200);
    expect(res.body.items.map((d: { name: string }) => d.name)).toEqual(
      [...DEMO_DEPARTMENTS].sort(),
    );
    expect(res.body.items[0]).toEqual({ id: expect.any(Number), name: expect.any(String) });
  });
});

describe('GET /api/employees', () => {
  it('lists all employees with their department, ordered by full name', async () => {
    const { agent } = await createLoggedInApp();

    const res = await agent.get('/api/employees');

    expect(res.status).toBe(200);
    expect(names(res.body)).toEqual([
      'Иванова Анна Сергеевна',
      'Кузнецов Алексей Игоревич',
      'Петров Дмитрий Олегович',
      'Смирнова Ольга Викторовна',
      'Фёдорова Мария Андреевна',
    ]);
    expect(res.body.items[0]).toEqual({
      id: expect.any(Number),
      fullName: 'Иванова Анна Сергеевна',
      position: 'Руководитель отдела',
      department: { id: expect.any(Number), name: 'Разработка' },
    });
  });

  it.each([
    ['иван', ['Иванова Анна Сергеевна']],
    ['ИВАН', ['Иванова Анна Сергеевна']],
    ['дмитрий', ['Петров Дмитрий Олегович']],
    ['федор', ['Фёдорова Мария Андреевна']],
    ['Фёдор', ['Фёдорова Мария Андреевна']],
    ['  анна   сергеевна ', ['Иванова Анна Сергеевна']],
    [
      'ов',
      [
        'Иванова Анна Сергеевна',
        'Кузнецов Алексей Игоревич',
        'Петров Дмитрий Олегович',
        'Смирнова Ольга Викторовна',
        'Фёдорова Мария Андреевна',
      ],
    ],
    ['никого', []],
  ])('searches by full name: %j', async (search, expected) => {
    const { agent } = await createLoggedInApp();

    const res = await agent.get('/api/employees').query({ search });

    expect(names(res.body)).toEqual(expected);
  });

  it.each(['%', '_', '\\'])('treats %j literally instead of as a wildcard', async (search) => {
    const { agent } = await createLoggedInApp();

    const res = await agent.get('/api/employees').query({ search });

    expect(res.body.items).toEqual([]);
  });

  it('filters by department', async () => {
    const { agent } = await createLoggedInApp();
    const development = await departmentId(agent, 'Разработка');

    const res = await agent.get('/api/employees').query({ departmentId: development });

    expect(names(res.body)).toEqual(['Иванова Анна Сергеевна', 'Петров Дмитрий Олегович']);
  });

  it('combines search with the department filter', async () => {
    const { agent } = await createLoggedInApp();
    const development = await departmentId(agent, 'Разработка');
    const hr = await departmentId(agent, 'HR');

    const res = await agent
      .get('/api/employees')
      .query({ search: 'петр', departmentId: development });
    const otherDepartment = await agent
      .get('/api/employees')
      .query({ search: 'петр', departmentId: hr });

    expect(names(res.body)).toEqual(['Петров Дмитрий Олегович']);
    expect(otherDepartment.body.items).toEqual([]);
  });

  it('returns an empty list for a department without employees', async () => {
    const { agent } = await createLoggedInApp();
    const marketing = await departmentId(agent, 'Маркетинг');

    const res = await agent.get('/api/employees').query({ departmentId: marketing });

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('ignores empty filter values', async () => {
    const { agent } = await createLoggedInApp();

    const res = await agent.get('/api/employees?search=&departmentId=');

    expect(res.body.items).toHaveLength(5);
  });

  it('rejects an invalid department filter', async () => {
    const { agent } = await createLoggedInApp();

    const res = await agent.get('/api/employees').query({ departmentId: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/employees', () => {
  it('creates an employee that then shows up in the list and in search', async () => {
    const { agent } = await createLoggedInApp();
    const marketing = await departmentId(agent, 'Маркетинг');

    const res = await agent
      .post('/api/employees')
      .send({ fullName: '  Ёлкина   Вера  ', position: ' SMM-менеджер ', departmentId: marketing });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      employee: {
        id: expect.any(Number),
        fullName: 'Ёлкина Вера',
        position: 'SMM-менеджер',
        department: { id: marketing, name: 'Маркетинг' },
      },
    });
    const search = await agent.get('/api/employees').query({ search: 'елкина' });
    expect(names(search.body)).toEqual(['Ёлкина Вера']);
  });

  it('stores the normalized search column', async () => {
    const { agent, db } = await createLoggedInApp();

    const res = await agent
      .post('/api/employees')
      .send({ fullName: 'Ёлкина Вера', position: 'Стажёр', departmentId: 1 });

    const row = db
      .prepare('SELECT full_name_search FROM employees WHERE id = ?')
      .get(res.body.employee.id);
    expect(row?.full_name_search).toBe('елкина вера');
  });

  it('returns field errors when required fields are missing', async () => {
    const { agent } = await createLoggedInApp();

    const res = await agent.post('/api/employees').send({ fullName: '   ', position: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Проверьте правильность заполнения полей',
      fields: {
        fullName: 'Укажите ФИО',
        position: 'Укажите должность',
        departmentId: 'Выберите отдел',
      },
    });
  });

  it('rejects an unknown department', async () => {
    const { agent } = await createLoggedInApp();

    const res = await agent
      .post('/api/employees')
      .send({ fullName: 'Новый Сотрудник', position: 'Стажёр', departmentId: 999 });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ departmentId: 'Такого отдела нет' });
  });

  it('does not create anything on validation errors', async () => {
    const { agent } = await createLoggedInApp();

    await agent.post('/api/employees').send({ fullName: 'Без отдела', position: 'Стажёр' });

    expect((await agent.get('/api/employees')).body.items).toHaveLength(5);
  });
});

describe('escapeLike', () => {
  it('escapes LIKE wildcards and the escape character', () => {
    expect(escapeLike('100%_off\\')).toBe('100\\%\\_off\\\\');
  });
});
