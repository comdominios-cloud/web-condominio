import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  balance,
  fullName,
  isAdmin,
  passwordError,
  paymentRecords,
  selectResident,
  unitLabel,
  unitRecords,
} from '../src/utils/domain.js';

test('roles are assigned by the server; missing or resident roles are not admin', () => {
  assert.equal(isAdmin({ rol: 'ADMIN' }), true);
  assert.equal(isAdmin({ rol: 'administrador' }), true);
  assert.equal(isAdmin({ rol: 'RESIDENTE' }), false);
  assert.equal(isAdmin(null), false);
});
test('resident identity never falls back to an unrelated first row or ambiguous email', () => {
  const rows = [
    { id: 1, email: 'other@test.pe' },
    { id: 2, email: 'ME@test.pe' },
  ];
  assert.equal(selectResident(rows, { email: 'me@test.pe' }).id, 2);
  assert.equal(selectResident(rows, { email: 'missing@test.pe' }), null);
  assert.equal(selectResident(rows, { residente_id: 99, email: 'me@test.pe' }), null);
  assert.throws(() =>
    selectResident([...rows, { id: 3, email: 'me@test.pe' }], { email: 'me@test.pe' }),
  );
});
test('payments remain scoped even if the service ignores unidad_id', () => {
  const rows = [
    { id: 1, unidadId: 3, monto: 100, estado: 'PENDIENTE' },
    { id: 2, unidadId: 4, monto: 400 },
  ];
  const payments = [
    { cuotaId: 1, montoPagado: 40 },
    { cuotaId: 2, montoPagado: 400 },
  ];
  const quotas = unitRecords(rows, 3);
  assert.deepEqual(
    quotas.map((q) => q.id),
    [1],
  );
  assert.deepEqual(unitRecords(rows, null), []);
  assert.equal(paymentRecords(payments, quotas).length, 1);
  assert.equal(balance(quotas, paymentRecords(payments, quotas)), 60);
  assert.equal(balance([{ ...quotas[0], estado: 'PAGADA' }], []), 0);
});
test('password policy and human readable resident fields', () => {
  assert.ok(passwordError('1234567'));
  assert.equal(passwordError('12345678'), null);
  assert.ok(passwordError('ñ'.repeat(37)));
  assert.equal(unitLabel({ id: 1, codigo: 'A-101' }), 'A-101');
  assert.equal(fullName({ nombres: 'Ana', apellidos: 'Torres' }), 'Ana Torres');
});
test('AWS path, proxy and local direct URL contracts are preserved', async () => {
  const source = await readFile(new URL('../src/api/config.js', import.meta.url), 'utf8');
  for (const [mode, expected] of [
    ['path', 'https://api.example.test/auth/login'],
    ['proxy', '/api/usuarios/auth/login'],
    ['direct', 'https://api.example.test:9006/auth/login'],
  ]) {
    const env = { VITE_API_BASE_URL: 'https://api.example.test/', VITE_API_MODE: mode };
    const module = await import(
      'data:text/javascript;base64,' +
        Buffer.from(source.replace('import.meta.env', JSON.stringify(env))).toString('base64')
    );
    assert.equal(module.serviceUrl('usuarios', '/auth/login'), expected);
  }
});
