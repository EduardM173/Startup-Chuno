import { test } from 'node:test';
import assert from 'node:assert/strict';
import Decimal from 'decimal.js';

const base = process.env.BASE_URL || 'http://localhost:8080';
const uid = () => crypto.randomUUID();

async function api(service, path, method = 'GET', body, token, expected = 200) {
  const r = await fetch(`${base}/api/${service}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const result = await r.json().catch(() => ({}));
  assert.equal(r.status, expected, `${method} ${service}${path} returned ${r.status}: ${JSON.stringify(result)}`);
  return result;
}

test('HU-08: Transferir fondos entre cuentas de ahorro propias del cliente', async t => {
  // 1. Authenticate as client with multiple accounts (Valeria)
  let customerToken;
  try {
    const r = await api('clientes', '/auth/login', 'POST', {
      email: 'valeria@chuno.demo',
      password: 'Temporal2026!'
    }, null, 200);
    if (r.user?.mustChangePassword) {
      await api('clientes', '/auth/password', 'POST', {
        current: 'Temporal2026!',
        password: 'Valeria2026!'
      }, r.token, 200);
      const loginRes = await api('clientes', '/auth/login', 'POST', {
        email: 'valeria@chuno.demo',
        password: 'Valeria2026!'
      }, null, 200);
      customerToken = loginRes.token;
    } else {
      customerToken = r.token;
    }
  } catch {
    const loginRes = await api('clientes', '/auth/login', 'POST', {
      email: 'valeria@chuno.demo',
      password: 'Valeria2026!'
    }, null, 200);
    customerToken = loginRes.token;
  }

  assert.ok(customerToken, 'Customer must be authenticated');

  // 2. Query customer's own active accounts
  const accounts = await api('cuentas', '/accounts', 'GET', undefined, customerToken, 200);
  const active = accounts.filter(a => a.status === 'ACTIVA');
  assert.ok(active.length >= 2, 'Cliente debe tener al menos dos cuentas propias activas');

  const origin = active[0];
  const dest = active[1];
  assert.notEqual(origin.id, dest.id, 'Las cuentas deben ser distintas');

  const originBefore = new Decimal(origin.balance);
  const destBefore = new Decimal(dest.balance);

  // 3. Criterio de aceptación 1: Validaciones de negocio
  await t.test('Rechazar transferencia a la misma cuenta', async () => {
    const res = await api('transferencias', '/transactions', 'POST', {
      key: uid(),
      accountId: origin.id,
      amount: '10.00',
      kind: 'PROPIA',
      destination: origin.id,
      reference: 'Misma cuenta',
      beneficiary: 'Valeria Mamani'
    }, customerToken, 201);
    assert.equal(res.status, 'RECHAZADO');
  });

  await t.test('Rechazar importe mayor al saldo disponible', async () => {
    const res = await api('transferencias', '/transactions', 'POST', {
      key: uid(),
      accountId: origin.id,
      amount: '9999999.00',
      kind: 'PROPIA',
      destination: dest.id,
      reference: 'Sobre saldo',
      beneficiary: 'Valeria Mamani'
    }, customerToken, 201);
    assert.equal(res.status, 'RECHAZADO');
  });

  await t.test('Rechazar importe no positivo (menor o igual a cero)', async () => {
    await api('transferencias', '/transactions', 'POST', {
      key: uid(),
      accountId: origin.id,
      amount: '0.00',
      kind: 'PROPIA',
      destination: dest.id,
      reference: 'Cero',
      beneficiary: 'Valeria Mamani'
    }, customerToken, 422);
  });

  // 4. Criterio de aceptación 2: Transferencia exitosa entre cuentas propias
  const transferAmount = '150.00';
  const concept = 'Ahorro personal';
  let transaction;

  await t.test('Ejecutar transferencia exitosa entre cuentas propias', async () => {
    const key = uid();
    transaction = await api('transferencias', '/transactions', 'POST', {
      key,
      accountId: origin.id,
      amount: transferAmount,
      kind: 'PROPIA',
      destination: dest.id,
      reference: concept,
      beneficiary: 'Valeria Mamani Flores'
    }, customerToken, 201);

    assert.equal(transaction.status, 'CONFIRMADO');
    assert.equal(transaction.kind, 'PROPIA');
    assert.equal(transaction.reference, concept);

    // Idempotencia: reintento con misma key y mismos datos
    const retry = await api('transferencias', '/transactions', 'POST', {
      key,
      accountId: origin.id,
      amount: transferAmount,
      kind: 'PROPIA',
      destination: dest.id,
      reference: concept,
      beneficiary: 'Valeria Mamani Flores'
    }, customerToken, 200);

    assert.equal(retry.id, transaction.id);
    assert.equal(retry.status, 'CONFIRMADO');
  });

  // 5. Criterio de aceptación 3: Reflejo en saldos y movimientos
  await t.test('Saldos reflejan débitos y créditos exactos', async () => {
    const updatedOrigin = await api('cuentas', `/accounts/${origin.id}`, 'GET', undefined, customerToken, 200);
    const updatedDest = await api('cuentas', `/accounts/${dest.id}`, 'GET', undefined, customerToken, 200);

    const originAfter = new Decimal(updatedOrigin.balance);
    const destAfter = new Decimal(updatedDest.balance);

    assert.equal(originAfter.toFixed(2), originBefore.minus(transferAmount).toFixed(2));
    assert.equal(destAfter.toFixed(2), destBefore.plus(transferAmount).toFixed(2));
  });

  await t.test('Movimientos registran DEBITO en origen y CREDITO en destino con concepto', async () => {
    const originMoves = await api('cuentas', `/accounts/${origin.id}/movements`, 'GET', undefined, customerToken, 200);
    const destMoves = await api('cuentas', `/accounts/${dest.id}/movements`, 'GET', undefined, customerToken, 200);

    const debitMove = originMoves.find(m => m.operationId === transaction.id);
    assert.ok(debitMove, 'Debe existir movimiento de débito en cuenta origen');
    assert.equal(debitMove.kind, 'DEBITO');
    assert.equal(new Decimal(debitMove.amount).abs().toFixed(2), transferAmount);
    assert.equal(debitMove.description, concept);

    const creditMove = destMoves.find(m => m.operationId === transaction.id);
    assert.ok(creditMove, 'Debe existir movimiento de crédito en cuenta destino');
    assert.equal(creditMove.kind, 'CREDITO');
    assert.equal(new Decimal(creditMove.amount).toFixed(2), transferAmount);
    assert.equal(creditMove.description, concept);
  });
});
