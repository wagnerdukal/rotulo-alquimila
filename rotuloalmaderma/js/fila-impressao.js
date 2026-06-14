// ── Tooltip de hover ───────────────────────────────────────────────────
function OrderTooltip({ order }) {
  return (
    <div className="absolute z-50 left-0 top-full mt-1 w-64 rounded-xl shadow-xl border text-xs pointer-events-none"
      style={{ background: '#1e2d40', borderColor: 'rgba(255,255,255,0.1)', color: '#e2eaf4' }}>
      <div className="absolute -top-1.5 left-6 w-3 h-3 rotate-45"
        style={{ background: '#1e2d40', borderLeft: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5 pb-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <IconInfo />
          <span className="font-semibold" style={{ color: 'hsl(207,69%,70%)' }}>Informações do Pedido</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>Criado por</span>
          <span className="font-medium">{firstName(order.createdBy) || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>Data/hora</span>
          <span className="font-medium">{fmtDateTime(order.createdAt) || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>Solicitante</span>
          <span className="font-medium">{order.requester || '—'}</span>
        </div>
      </div>
    </div>
  );
}

// ── Modal Editar Pedido ────────────────────────────────────────────────
function EditOrderModal({ order, products, onSave, onClose }) {
  const [form,     setForm]    = React.useState({ ...order });
  const [salvando, setSalvando]= React.useState(false);
  const [erro,     setErro]    = React.useState('');

  async function handleSave() {
    setSalvando(true);
    setErro('');
    try {
      await onSave(form);
    } catch(err) {
      setErro(err.message || 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
          <h2 className="font-semibold text-lg">Editar Pedido</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><IconX /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código</label>
              <input type="text" value={form.code}
                onChange={e => {
                  const code = e.target.value;
                  const found = products.find(p => p.code === code);
                  setForm(f => ({ ...f, code, product: found ? found.name : f.product }));
                }}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Produto</label>
              <input type="text" value={form.product}
                onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" style={{ borderColor: S.border }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantidade</label>
              <input type="number" value={form.qty}
                onChange={e => setForm(f => ({ ...f, qty: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lote</label>
              <input type="text" value={form.lot}
                onChange={e => setForm(f => ({ ...f, lot: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fabricação</label>
              <input type="date" value={form.mfg}
                onChange={e => setForm(f => ({ ...f, mfg: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Validade</label>
              <input type="date" value={form.exp}
                onChange={e => setForm(f => ({ ...f, exp: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cor do Rótulo</label>
            <div className="flex gap-4">
              {['Transparente', 'Branco'].map(c => (
                <label key={c} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="editColor" value={c} checked={form.color === c}
                    onChange={() => setForm(f => ({ ...f, color: c }))} style={{ accentColor: S.primary }} />
                  <span className="text-sm">{c}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Solicitante</label>
            <input type="text" value={form.requester || ''}
              onChange={e => setForm(f => ({ ...f, requester: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} />
          </div>
          {erro && <p className="text-red-600 text-sm">{erro}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t" style={{ borderColor: S.border }}>
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: S.border }}>Cancelar</button>
          <button onClick={handleSave} disabled={salvando}
            className="flex-1 py-2 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: S.primary }}>
            {salvando ? <><IconSpinner/>Salvando...</> : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página: Fila de Impressão ──────────────────────────────────────────
function FilaImpressao({ currentUser, orders, onUpdateOrder, onDeleteOrder, products }) {
  const [editOrder, setEditOrder] = React.useState(null);
  const [hoveredId, setHoveredId] = React.useState(null);
  const [erro,      setErro]      = React.useState('');

  const total   = orders.length;
  const printed = orders.filter(o => o.printed).length;
  const pending = total - printed;

  const podeEditar  = currentUser.pode_editar  || currentUser.is_admin;
  const podeExcluir = currentUser.pode_excluir || currentUser.is_admin;
  const podeCheck   = currentUser.pode_check   || currentUser.is_admin;
  const temAcoes    = podeEditar || podeExcluir;

  async function togglePrinted(order) {
    if (!podeCheck) return;
    try { await onUpdateOrder({ ...order, printed: !order.printed }); }
    catch(err) { setErro(err.message); }
  }

  async function handleDelete(id) {
    if (!podeExcluir) return;
    if (!confirm('Deseja excluir este pedido?')) return;
    try { await onDeleteOrder(id); }
    catch(err) { setErro(err.message); }
  }

  async function handleSaveEdit(updated) {
    await onUpdateOrder(updated);
    setEditOrder(null);
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: S.fg }}>Fila de Impressão</h1>
        <p className="text-sm mt-1" style={{ color: S.fgMuted }}>Pedidos realizados e em andamento</p>
      </div>

      {erro && (
        <div className="mb-4 p-3 rounded-lg text-red-700 bg-red-50 border border-red-200 text-sm flex justify-between">
          {erro} <button onClick={() => setErro('')} className="ml-2 font-bold">×</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total',     value: total,   color: S.primary },
          { label: 'Pendentes', value: pending,  color: 'hsl(35,90%,50%)' },
          { label: 'Impressos', value: printed,  color: 'hsl(145,60%,40%)' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border p-5 text-center" style={{ borderColor: S.border }}>
            <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm mt-1" style={{ color: S.fgMuted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Farmacêutico */}
      <div className="mb-4 px-4 py-3 rounded-xl text-sm border bg-white flex items-center gap-2" style={{ borderColor: S.border }}>
        <span className="font-medium" style={{ color: S.fgMuted }}>Farmacêutico Responsável:</span>
        <span className="font-semibold" style={{ color: S.fg }}>{PHARMACIST}</span>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: S.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'hsl(210,40%,97%)', borderBottom: `1px solid ${S.border}` }}>
                {['Código','Produto','Qtd.','Lote','Fabricação','Validade','Cor','Impresso',
                  ...(temAcoes ? ['Ações'] : [])
                ].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: S.fgMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan="9" className="px-4 py-8 text-center" style={{ color: S.fgMuted }}>Nenhum pedido encontrado.</td></tr>
              )}
              {orders.map(o => (
                <tr key={o.id}
                  className="border-t hover:bg-blue-50 transition-colors"
                  style={{ borderColor: S.borderSub }}
                  onMouseEnter={() => setHoveredId(o.id)}
                  onMouseLeave={() => setHoveredId(null)}>

                  <td className="px-4 py-3 font-mono font-semibold relative" style={{ color: S.primary }}>
                    {o.code}
                    {hoveredId === o.id && <OrderTooltip order={o} />}
                  </td>
                  <td className="px-4 py-3 font-medium">{o.product}</td>
                  <td className="px-4 py-3">{o.qty}</td>
                  <td className="px-4 py-3 font-mono">{o.lot}</td>
                  <td className="px-4 py-3">{fmtDate(o.mfg)}</td>
                  <td className="px-4 py-3">{fmtDate(o.exp)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#f0f0f0', color: S.fgMuted }}>{o.color}</span>
                  </td>

                  <td className="px-4 py-3">
                    <button onClick={() => togglePrinted(o)} disabled={!podeCheck}
                      title={o.printed ? 'Desmarcar' : 'Marcar como impresso'}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${!podeCheck ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      style={{
                        borderColor: o.printed ? 'hsl(145,60%,40%)' : S.border,
                        background:  o.printed ? 'hsl(145,60%,40%)' : 'transparent',
                        color:       o.printed ? '#fff' : 'transparent',
                      }}>
                      {o.printed && <IconCheck />}
                    </button>
                  </td>

                  {temAcoes && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {podeEditar && (
                          <button onClick={() => setEditOrder(o)}
                            className="px-2.5 py-1 rounded-md text-xs font-medium border hover:bg-gray-50 flex items-center gap-1"
                            style={{ borderColor: S.border, color: S.fgMuted }}>
                            <Edit3 /> Editar
                          </button>
                        )}
                        {podeExcluir && (
                          <button onClick={() => handleDelete(o.id)}
                            className="px-2.5 py-1 rounded-md text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 flex items-center gap-1">
                            <Trash /> Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editOrder && (
        <EditOrderModal
          order={editOrder}
          products={products}
          onSave={handleSaveEdit}
          onClose={() => setEditOrder(null)}
        />
      )}
    </div>
  );
}
