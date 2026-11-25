import { useState, useEffect, useMemo } from 'react';
import { 
  Send, 
  History, 
  Info, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  LoaderCircle,
  Building2,
  Users
} from 'lucide-react';
import { api, type Row } from '../../api/client';
import { Modal, Receipt, Table, Form, type Field } from '../../components/UI';
import './transferencias.css';

export function formatBs(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'Bs. 0,00';
  return 'Bs. ' + num.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface TransferenciasProps {
  rows: Row[];
  accounts: Row[];
  admin: boolean;
  refresh: () => Promise<void>;
  notify: (m: string) => void;
  user?: Row | null;
  onNavigate?: (page: string) => void;
}

export function Transferencias({
  rows,
  accounts,
  admin,
  refresh,
  notify,
  user: initialUser,
  onNavigate
}: TransferenciasProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'propias' | 'terceros' | 'otros'>('propias');
  
  // Authenticated client info
  const [user, setUser] = useState<Row | null>(initialUser || null);
  useEffect(() => {
    if (!user) {
      api('clientes', '/me')
        .then(setUser)
        .catch(() => {});
    }
  }, [user]);

  // Active accounts for the current client
  const activeAccounts = useMemo(() => {
    return accounts.filter(a => a.status === 'ACTIVA');
  }, [accounts]);

  // Form State (Cuentas Propias)
  const [originId, setOriginId] = useState<string>('');
  const [destId, setDestId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [concept, setConcept] = useState<string>('');

  // Modals & async operations
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<Row | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Third party & Interbank state
  const [catalog, setCatalog] = useState<Row[]>([]);
  const [lookup, setLookup] = useState<Row | null>(null);
  const [preparedOther, setPreparedOther] = useState<Row | null>(null);

  useEffect(() => {
    if (activeTab !== 'propias') {
      api('transferencias', '/catalog')
        .then(setCatalog)
        .catch(e => notify(e.message));
    }
  }, [activeTab]);

  // Initialize selected origin and destination
  useEffect(() => {
    if (activeAccounts.length >= 1 && !originId) {
      setOriginId(activeAccounts[0].id);
    }
  }, [activeAccounts, originId]);

  useEffect(() => {
    if (activeAccounts.length >= 2 && (!destId || destId === originId)) {
      const other = activeAccounts.find(a => a.id !== originId);
      if (other) setDestId(other.id);
    }
  }, [originId, activeAccounts, destId]);

  // Current selected origin account object
  const originAccount = useMemo(() => {
    return activeAccounts.find(a => a.id === originId) || null;
  }, [activeAccounts, originId]);

  // Available destination accounts (must be active and exclude originId)
  const destAccounts = useMemo(() => {
    return activeAccounts.filter(a => a.id !== originId);
  }, [activeAccounts, originId]);

  // Current selected destination account object
  const destAccount = useMemo(() => {
    return destAccounts.find(a => a.id === destId) || null;
  }, [destAccounts, destId]);

  // Balances
  const availableOriginBalance = useMemo(() => {
    if (!originAccount) return 0;
    const bal = Number(originAccount.balance) || 0;
    const res = Number(originAccount.reserved) || 0;
    return Math.max(0, bal - res);
  }, [originAccount]);

  const numAmount = useMemo(() => {
    const val = parseFloat(amount);
    return isNaN(val) ? 0 : val;
  }, [amount]);

  const estimatedBalance = useMemo(() => {
    return Math.max(0, availableOriginBalance - numAmount);
  }, [availableOriginBalance, numAmount]);

  // Validation
  const hasMultipleAccounts = activeAccounts.length >= 2;
  const isAmountValid = numAmount > 0 && numAmount <= availableOriginBalance;
  const isAmountExceeded = numAmount > availableOriginBalance;
  const isValid = hasMultipleAccounts && originId && destId && originId !== destId && isAmountValid;

  // Beneficiary Name
  const beneficiaryName = useMemo(() => {
    if (user?.names && user?.surnames) {
      return `${user.names} ${user.surnames}`;
    }
    return 'Cliente titular';
  }, [user]);

  // Form actions
  const handleCancel = () => {
    setAmount('');
    setConcept('');
  };

  const handleConfirmTransfer = async () => {
    if (!isValid || !originAccount || !destAccount) return;
    setSubmitting(true);
    try {
      const payload = {
        key: crypto.randomUUID(),
        accountId: originId,
        amount: numAmount.toFixed(2),
        kind: 'PROPIA',
        destination: destId,
        reference: concept.trim() || 'Ahorro personal',
        beneficiary: beneficiaryName
      };

      const result = await api('transferencias', '/transactions', 'POST', payload);
      setShowConfirmModal(false);
      setReceipt(result);
      await refresh();
      handleCancel();
      if (result.status === 'CONFIRMADO') {
        notify('Transferencia realizada con éxito');
      } else {
        notify(`Transferencia en estado: ${result.status.toLowerCase()}`);
      }
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // If user is ADMIN, show the admin operations table
  if (admin) {
    return (
      <div className="tx-container">
        <div className="tx-header">
          <div className="tx-header-left">
            <div className="tx-header-icon">
              <Send size={24} color="#542333" />
            </div>
            <div>
              <h1 className="tx-title">Transferencias</h1>
              <p className="tx-subtitle">Supervisión administrativa de transferencias en el sistema.</p>
            </div>
          </div>
        </div>
        <Table
          rows={rows}
          columns={[
            ['createdAt', 'Fecha'],
            ['kind', 'Tipo'],
            ['amount', 'Importe'],
            ['status', 'Estado'],
            ['reference', 'Referencia / Concepto']
          ]}
          onSelect={setReceipt}
        />
        {receipt && (
          <Modal title="Comprobante verificable" onClose={() => setReceipt(null)}>
            <Receipt row={receipt} />
          </Modal>
        )}
      </div>
    );
  }

  // Fields for Third Party or Interbank
  const choices = activeAccounts.map(a => ({
    value: a.id,
    label: `${a.alias} · ${a.number} · ${formatBs(Number(a.balance) - Number(a.reserved))}`
  }));

  const otherFields: Field[] = activeTab === 'otros'
    ? [
        { name: 'provider', label: 'Banco destino', options: catalog.map(c => ({ value: c.id, label: c.name })) },
        { name: 'destination', label: 'Cuenta interbancaria de prueba (ej. 900000001)' }
      ]
    : [
        { name: 'destination', label: 'Número de cuenta destino CHUNO' }
      ];

  return (
    <div className="tx-container">
      {/* 1. Encabezado de la sección */}
      <div className="tx-header">
        <div className="tx-header-left">
          <div className="tx-header-icon">
            <Send size={24} color="#542333" />
          </div>
          <div>
            <h1 className="tx-title">Transferencias</h1>
            <p className="tx-subtitle">Envía dinero desde tus cuentas de ahorro.</p>
          </div>
        </div>
      </div>

      {/* 2. Sub-tabs de navegación interna y acceso rápido */}
      <div className="tx-nav-bar">
        <div className="tx-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'propias'}
            className={`tx-tab ${activeTab === 'propias' ? 'active' : ''}`}
            onClick={() => { setActiveTab('propias'); setLookup(null); setPreparedOther(null); }}
          >
            Cuentas propias
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'terceros'}
            className={`tx-tab ${activeTab === 'terceros' ? 'active' : ''}`}
            onClick={() => { setActiveTab('terceros'); setLookup(null); setPreparedOther(null); }}
          >
            A terceros
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'otros'}
            className={`tx-tab ${activeTab === 'otros' ? 'active' : ''}`}
            onClick={() => { setActiveTab('otros'); setLookup(null); setPreparedOther(null); }}
          >
            A otros bancos
          </button>
        </div>

        <button
          type="button"
          className="tx-history-btn"
          onClick={() => {
            if (onNavigate) {
              onNavigate('movimientos');
            } else {
              setShowHistoryModal(true);
            }
          }}
        >
          <History size={18} />
          <span>Historial de transferencias</span>
        </button>
      </div>

      {/* 3. Contenedor principal de la pestaña activa */}
      {activeTab === 'propias' ? (
        <div className="tx-grid">
          {/* Columna Izquierda — Tarjeta "Nueva transferencia" */}
          <div className="tx-card">
            <h2 className="tx-card-title">Nueva transferencia</h2>

            {!hasMultipleAccounts ? (
              <div className="tx-warning-card" role="alert">
                <AlertCircle size={24} />
                <div>
                  <strong>Cuentas insuficientes</strong>
                  <p>
                    Requieres al menos dos cuentas de ahorro activas para realizar transferencias entre cuentas propias. 
                    Actualmente cuentas con {activeAccounts.length} cuenta activa.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Cuenta de origen */}
                <div className="tx-form-group">
                  <label htmlFor="cuenta-origen">Cuenta de origen</label>
                  <select
                    id="cuenta-origen"
                    className="tx-select"
                    value={originId}
                    onChange={e => {
                      const newOrigin = e.target.value;
                      setOriginId(newOrigin);
                      if (destId === newOrigin) {
                        const nextOther = activeAccounts.find(a => a.id !== newOrigin);
                        setDestId(nextOther ? nextOther.id : '');
                      }
                    }}
                  >
                    {activeAccounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.alias || a.type || 'Cuenta de ahorro'} · {a.number}
                      </option>
                    ))}
                  </select>

                  {/* Indicador de saldo */}
                  <div className="tx-balance-box">
                    <span className="tx-balance-label">Saldo disponible:</span>
                    <span className="tx-balance-val">{formatBs(availableOriginBalance)}</span>
                  </div>
                </div>

                {/* Cuenta de destino */}
                <div className="tx-form-group">
                  <label htmlFor="cuenta-destino">Cuenta de destino</label>
                  <select
                    id="cuenta-destino"
                    className="tx-select"
                    value={destId}
                    onChange={e => setDestId(e.target.value)}
                  >
                    {destAccounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.alias || a.type || 'Cuenta de ahorro'} · {a.number}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Importe (Bs.) */}
                <div className="tx-form-group">
                  <label htmlFor="tx-importe">Importe (Bs.)</label>
                  <input
                    id="tx-importe"
                    type="number"
                    className="tx-input"
                    min="0.01"
                    max={availableOriginBalance > 0 ? availableOriginBalance : undefined}
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                  {isAmountExceeded && (
                    <span className="tx-field-error">
                      <AlertCircle size={15} /> El importe supera el saldo disponible ({formatBs(availableOriginBalance)}).
                    </span>
                  )}
                  {amount !== '' && numAmount <= 0 && (
                    <span className="tx-field-error">
                      <AlertCircle size={15} /> El importe debe ser mayor a Bs. 0,00.
                    </span>
                  )}
                </div>

                {/* Concepto */}
                <div className="tx-form-group">
                  <label htmlFor="tx-concepto">Concepto</label>
                  <input
                    id="tx-concepto"
                    type="text"
                    className="tx-input"
                    placeholder="Ej. Ahorro personal"
                    value={concept}
                    maxLength={80}
                    onChange={e => setConcept(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Columna Derecha — Tarjeta "Resumen de la transferencia" (reactiva en tiempo real) */}
          <div className="tx-card">
            <h2 className="tx-card-title">Resumen de la transferencia</h2>

            <div className="tx-summary-list">
              <div className="tx-summary-row">
                <span className="tx-summary-key">Tipo:</span>
                <span className="tx-summary-val">Entre cuentas propias</span>
              </div>
              <div className="tx-summary-row">
                <span className="tx-summary-key">Origen:</span>
                <span className="tx-summary-val">
                  {originAccount ? `${originAccount.number} · ${originAccount.alias || originAccount.type}` : '—'}
                </span>
              </div>
              <div className="tx-summary-row">
                <span className="tx-summary-key">Destino:</span>
                <span className="tx-summary-val">
                  {destAccount ? `${destAccount.number} · ${destAccount.alias || destAccount.type}` : '—'}
                </span>
              </div>
              <div className="tx-summary-row">
                <span className="tx-summary-key">Beneficiario:</span>
                <span className="tx-summary-val">{beneficiaryName}</span>
              </div>
            </div>

            {/* Fila destacada fondo crema (#F5EFE8) */}
            <div className="tx-highlight-row crema">
              <span>Importe a transferir:</span>
              <strong>{formatBs(numAmount)}</strong>
            </div>

            {/* Fila destacada fondo verde suave */}
            <div className="tx-highlight-row verde">
              <span>Saldo estimado de origen:</span>
              <strong>{formatBs(estimatedBalance)}</strong>
            </div>

            {/* Banner informativo */}
            <div className="tx-info-banner">
              <Info size={18} />
              <span>Revisa los datos antes de confirmar la transferencia.</span>
            </div>

            {/* Botones de acción al pie */}
            <div className="tx-actions-footer">
              <button
                type="button"
                className="tx-btn-outline"
                onClick={handleCancel}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="tx-btn-solid"
                disabled={!isValid || submitting}
                onClick={() => setShowConfirmModal(true)}
              >
                <span>Revisar transferencia</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Sub-pestañas: A terceros y A otros bancos */
        <div className="tx-card" style={{ maxWidth: '850px', margin: '0 auto', width: '100%' }}>
          <h2 className="tx-card-title">
            {activeTab === 'terceros' ? 'Transferencia a terceros CHUNO' : 'Transferencia interbancaria (SANDBOX)'}
          </h2>

          {!preparedOther ? (
            <>
              <Form
                key={activeTab}
                fields={otherFields}
                submit={activeTab === 'otros' ? 'Verificar cuenta y banco' : 'Verificar número de cuenta'}
                onSubmit={async b => {
                  if (activeTab === 'otros') {
                    const destBeneficiary = await api('transferencias', `/beneficiary?${new URLSearchParams({ bank: b.provider, account: b.destination })}`);
                    setLookup({ ...b, beneficiary: destBeneficiary.name });
                  } else {
                    const dest = await api('cuentas', `/beneficiary/${encodeURIComponent(b.destination)}`);
                    if (dest.own) throw new Error('Esta cuenta te pertenece. Selecciona la pestaña Cuentas propias.');
                    setLookup({ destination: dest.id, beneficiary: dest.beneficiary, number: dest.number });
                  }
                }}
              />

              {lookup && (
                <div className="tx-modal-box" style={{ marginTop: '20px' }}>
                  <h3 style={{ margin: '0 0 10px', color: '#542333' }}>Beneficiario verificado</h3>
                  <div className="tx-summary-row">
                    <span className="tx-summary-key">Beneficiario:</span>
                    <span className="tx-summary-val">{lookup.beneficiary}</span>
                  </div>
                  <div className="tx-summary-row">
                    <span className="tx-summary-key">Cuenta / Destino:</span>
                    <span className="tx-summary-val">{lookup.number || lookup.destination}</span>
                  </div>

                  <Form
                    key={lookup.destination}
                    fields={[
                      { name: 'accountId', label: 'Cuenta de origen', options: choices },
                      { name: 'amount', label: 'Importe (Bs.)', type: 'number', min: '0.01', step: '0.01' },
                      { name: 'reference', label: 'Concepto (opcional)', required: false }
                    ]}
                    submit="Revisar transferencia"
                    onSubmit={async b => {
                      setPreparedOther({
                        key: crypto.randomUUID(),
                        accountId: b.accountId,
                        amount: b.amount,
                        kind: activeTab === 'otros' ? 'INTERBANCARIA' : 'TERCERO',
                        destination: lookup.destination,
                        provider: lookup.provider || '',
                        reference: b.reference || '',
                        beneficiary: lookup.beneficiary || ''
                      });
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="tx-modal-body">
              <h3 style={{ margin: '0', color: '#542333' }}>Confirma los datos de la transferencia</h3>
              <div className="tx-modal-box">
                <div className="tx-summary-row">
                  <span className="tx-summary-key">Importe:</span>
                  <span className="tx-summary-val" style={{ color: '#943F56', fontSize: '1.2rem', fontWeight: 700 }}>
                    {formatBs(preparedOther.amount)}
                  </span>
                </div>
                <div className="tx-summary-row">
                  <span className="tx-summary-key">Beneficiario:</span>
                  <span className="tx-summary-val">{preparedOther.beneficiary}</span>
                </div>
                <div className="tx-summary-row">
                  <span className="tx-summary-key">Destino:</span>
                  <span className="tx-summary-val">{lookup?.number || preparedOther.destination}</span>
                </div>
                {preparedOther.reference && (
                  <div className="tx-summary-row">
                    <span className="tx-summary-key">Concepto:</span>
                    <span className="tx-summary-val">{preparedOther.reference}</span>
                  </div>
                )}
              </div>

              <div className="tx-modal-actions">
                <button type="button" className="tx-btn-outline" onClick={() => setPreparedOther(null)}>
                  Corregir datos
                </button>
                <button
                  type="button"
                  className="tx-btn-solid"
                  disabled={submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      const r = await api('transferencias', '/transactions', 'POST', preparedOther);
                      setPreparedOther(null);
                      setLookup(null);
                      setReceipt(r);
                      await refresh();
                      notify(`Transferencia: ${r.status.toLowerCase()}`);
                    } catch (e) {
                      notify((e as Error).message);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? 'Confirmando...' : 'Confirmar transferencia'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Pie de página del contenido */}
      <footer className="tx-content-footer">
        <span>Entorno académico · Datos de demostración</span>
      </footer>

      {/* Modal de confirmación final (Cuentas propias) */}
      {showConfirmModal && (
        <Modal
          title="Confirmar transferencia entre cuentas"
          onClose={() => !submitting && setShowConfirmModal(false)}
        >
          <div className="tx-modal-body">
            <p className="tx-modal-intro">
              Por favor revisa cuidadosamente los detalles antes de autorizar la transferencia de fondos entre tus cuentas.
            </p>

            <div className="tx-modal-box">
              <div className="tx-summary-row">
                <span className="tx-summary-key">Tipo de operación:</span>
                <span className="tx-summary-val">Entre cuentas propias</span>
              </div>
              <div className="tx-summary-row">
                <span className="tx-summary-key">Cuenta de origen:</span>
                <span className="tx-summary-val">
                  {originAccount ? `${originAccount.alias || originAccount.type} · ${originAccount.number}` : ''}
                </span>
              </div>
              <div className="tx-summary-row">
                <span className="tx-summary-key">Cuenta de destino:</span>
                <span className="tx-summary-val">
                  {destAccount ? `${destAccount.alias || destAccount.type} · ${destAccount.number}` : ''}
                </span>
              </div>
              <div className="tx-summary-row">
                <span className="tx-summary-key">Beneficiario:</span>
                <span className="tx-summary-val">{beneficiaryName}</span>
              </div>
              {concept.trim() && (
                <div className="tx-summary-row">
                  <span className="tx-summary-key">Concepto:</span>
                  <span className="tx-summary-val">{concept.trim()}</span>
                </div>
              )}
            </div>

            <div className="tx-highlight-row crema">
              <span>Importe a debitar:</span>
              <strong>{formatBs(numAmount)}</strong>
            </div>

            <div className="tx-highlight-row verde">
              <span>Saldo disponible resultante:</span>
              <strong>{formatBs(estimatedBalance)}</strong>
            </div>

            <div className="tx-modal-actions">
              <button
                type="button"
                className="tx-btn-outline"
                disabled={submitting}
                onClick={() => setShowConfirmModal(false)}
              >
                Volver y corregir
              </button>
              <button
                type="button"
                className="tx-btn-solid"
                disabled={submitting}
                onClick={handleConfirmTransfer}
              >
                {submitting ? (
                  <>
                    <LoaderCircle className="spin" size={17} />
                    <span>Procesando transferencia...</span>
                  </>
                ) : (
                  <span>Confirmar transferencia</span>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Comprobante / Recibo */}
      {receipt && (
        <Modal title="Comprobante de transferencia" onClose={() => setReceipt(null)}>
          <Receipt row={receipt} />
        </Modal>
      )}

      {/* Modal alternativo de Historial (si no se navega a movimientos) */}
      {showHistoryModal && (
        <Modal title="Historial de transferencias" onClose={() => setShowHistoryModal(false)}>
          <Table
            rows={rows}
            columns={[
              ['createdAt', 'Fecha'],
              ['kind', 'Tipo'],
              ['amount', 'Importe'],
              ['status', 'Estado'],
              ['reference', 'Concepto']
            ]}
            onSelect={r => {
              setShowHistoryModal(false);
              setReceipt(r);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
