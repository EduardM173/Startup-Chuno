import { test, expect } from '@playwright/test';

test('HU-08 (CHUNO-09): Transferir fondos entre cuentas de ahorro propias del cliente', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  // 1. Iniciar sesión como cliente (Valeria)
  await page.goto('/');
  await page.getByLabel('Correo electrónico', { exact: true }).fill('valeria@chuno.demo');
  await page.getByLabel('Contraseña', { exact: true }).fill('Valeria2026!');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();

  await expect(page.getByRole('heading', { name: /Hola,\s*Valeria/i })).toBeVisible();

  // 2. Navegar a la vista de Transferencias
  await page.getByRole('button', { name: 'Transferencias', exact: true }).click();

  // 3. Verificar Encabezado de la sección
  await expect(page.locator('.tx-title')).toHaveText('Transferencias');
  await expect(page.locator('.tx-subtitle')).toHaveText('Envía dinero desde tus cuentas de ahorro.');

  // 4. Verificar Navegación interna (Sub-tabs) y botón Historial
  const tabPropias = page.getByRole('tab', { name: 'Cuentas propias' });
  const tabTerceros = page.getByRole('tab', { name: 'A terceros' });
  const tabOtros = page.getByRole('tab', { name: 'A otros bancos' });
  const btnHistory = page.locator('.tx-history-btn');

  await expect(tabPropias).toBeVisible();
  await expect(tabPropias).toHaveClass(/active/);
  await expect(tabTerceros).toBeVisible();
  await expect(tabOtros).toBeVisible();
  await expect(btnHistory).toBeVisible();

  // 5. Verificar estructura de 2 columnas principales
  await expect(page.locator('.tx-grid')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nueva transferencia' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Resumen de la transferencia' })).toBeVisible();

  // 6. Columna Izquierda: Selectores e Indicadores
  const selectOrigen = page.locator('#cuenta-origen');
  const selectDestino = page.locator('#cuenta-destino');
  const inputImporte = page.locator('#tx-importe');
  const inputConcepto = page.locator('#tx-concepto');
  const balanceIndicator = page.locator('.tx-balance-box');

  await expect(selectOrigen).toBeVisible();
  await expect(balanceIndicator).toContainText('Saldo disponible:');
  await expect(selectDestino).toBeVisible();
  await expect(inputImporte).toBeVisible();
  await expect(inputConcepto).toBeVisible();

  // Verificar que cuenta destino no incluya la cuenta origen seleccionada
  const origenVal = await selectOrigen.inputValue();
  const destinoOptions = await selectDestino.locator('option').all();
  for (const opt of destinoOptions) {
    const val = await opt.getAttribute('value');
    expect(val).not.toBe(origenVal);
  }

  // 7. Columna Derecha: Reactividad en tiempo real del Resumen
  await expect(page.locator('.tx-summary-list')).toContainText('Entre cuentas propias');
  await expect(page.locator('.tx-summary-list')).toContainText('Valeria Mamani Flores');

  // Ingresar importe de prueba
  await inputImporte.fill('85.50');
  await inputConcepto.fill('Ahorro para vacaciones');

  // Verificar actualización reactiva del importe y saldo estimado
  await expect(page.locator('.tx-highlight-row.crema')).toContainText('85,50');
  await expect(page.locator('.tx-highlight-row.verde')).toContainText('Saldo estimado de origen:');
  await expect(page.locator('.tx-info-banner')).toContainText('Revisa los datos antes de confirmar la transferencia.');

  // Botón Revisar transferencia habilitado
  const btnRevisar = page.locator('.tx-btn-solid', { hasText: 'Revisar transferencia' });
  await expect(btnRevisar).toBeEnabled();

  // 8. Abrir Modal de Confirmación
  await btnRevisar.click();
  const modal = page.locator('.modal');
  await expect(modal).toBeVisible();
  await expect(modal.getByRole('heading', { name: 'Confirmar transferencia entre cuentas' })).toBeVisible();
  await expect(modal).toContainText('Ahorro para vacaciones');
  await expect(modal).toContainText('85,50');

  // 9. Confirmar la transferencia
  const btnConfirmar = modal.locator('button', { hasText: 'Confirmar transferencia' });
  await btnConfirmar.click();

  // 10. Verificar comprobante verificable con estado CONFIRMADO
  await expect(page.getByRole('heading', { name: 'Comprobante de operación' })).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.receipt')).toContainText('85,50');
  await expect(page.locator('.receipt')).toContainText('CONFIRMADO');

  // Cerrar comprobante
  await page.getByRole('button', { name: 'Cerrar' }).last().click();

  // 11. Verificar navegación a Movimientos
  await btnHistory.click();
  await expect(page.getByRole('heading', { name: 'Mis movimientos' })).toBeVisible();

  // Verificar que se registren los movimientos con el concepto
  await expect(page.getByRole('cell', { name: 'Ahorro para vacaciones' }).first()).toBeVisible({ timeout: 5000 });

  // 12. Pie de página académico visible en la vista
  await page.getByRole('button', { name: 'Transferencias', exact: true }).click();
  await expect(page.locator('.tx-content-footer')).toContainText('Entorno académico · Datos de demostración');

  expect(errors).toEqual([]);
});
