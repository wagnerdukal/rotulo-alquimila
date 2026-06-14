// ── Página: Novo Pedido ────────────────────────────────────────────────
function NovoPedido({ currentUser, products, onAddOrder }) {
  const empty = { code: '', productName: '', qty: '', lot: '', mfg: '', exp: '', color: 'Branco', requester: '' };
  const [form,      setForm]     = React.useState(empty);
  const [salvando,  setSalvando] = React.useState(false);
  const [success,   setSuccess]  = React.useState('');
  const [erro,      setErro]     = React.useState('');

  // Valida se o código existe nos produtos cadastrados
  const codigoValido  = form.code && products.find(p => p.code === form.code);
  const codigoDigitado = form.code.length > 0;

  function handleCodeChange(e) {
    const code  = e.target.value;
    const found = products.find(p => p.code === code);
    setErro('');
    setForm(f => ({ ...f, code, productName: found ? found.name : '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    // Validação: código deve existir no cadastro de produtos
    if (!codigoValido) {
      setErro(`Código "${form.code}" não encontrado. Cadastre o produto antes de criar um pedido.`);
      return;
    }

    setSalvando(true);
    try {
      await onAddOrder({
        code:      form.code,
        product:   form.productName,
        qty:       Number(form.qty),
        lot:       form.lot,
        mfg:       form.mfg,
        exp:       form.exp,
        color:     form.color,
        printed:   false,
        requester: form.requester,
        createdBy: currentUser.nome,
        createdAt: new Date().toISOString(),
      });
      setForm(empty);
      setSuccess('Pedido adicionado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setErro(err.message || 'Erro ao adicionar pedido.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: S.fg }}>Pedido de Impressão</h1>
        <p className="text-sm mt-1" style={{ color: S.fgMuted }}>Preencha os dados para solicitar a impressão do rótulo</p>
      </div>

      {success && (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 text-sm">
          <IconCheck /> {success}
        </div>
      )}
      {erro && (
        <div className="mb-4 p-3 rounded-lg text-red-700 bg-red-50 border border-red-200 text-sm">{erro}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: S.border }}>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código do Produto</label>
              <input
                type="text"
                placeholder="Digite o código..."
                value={form.code}
                onChange={handleCodeChange}
                className="w-full border rounded-lg px-3 py-2 text-sm transition-colors"
                style={{
                  borderColor: codigoDigitado
                    ? (codigoValido ? 'hsl(145,60%,45%)' : 'hsl(0,70%,55%)')
                    : S.border
                }}
                required
              />
              {/* Feedback imediato do código */}
              {codigoDigitado && (
                <p className={`text-xs mt-1 ${codigoValido ? 'text-green-600' : 'text-red-500'}`}>
                  {codigoValido
                    ? `✔ Produto encontrado: ${codigoValido.name}`
                    : '✘ Código não cadastrado em Produtos'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Produto</label>
              <input
                type="text"
                placeholder="Preenchido automaticamente..."
                value={form.productName}
                readOnly
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                style={{ borderColor: S.border }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantidade</label>
              <input type="number" placeholder="Informe a quantidade..." value={form.qty}
                onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }}
                required min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lote</label>
              <input type="text" placeholder="Digite o lote..." value={form.lot}
                onChange={e => setForm(f => ({ ...f, lot: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }}
                required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data de Fabricação</label>
              <input type="date" value={form.mfg}
                onChange={e => setForm(f => ({ ...f, mfg: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }}
                required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data de Validade</label>
              <input type="date" value={form.exp}
                onChange={e => setForm(f => ({ ...f, exp: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }}
                required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cor do Rótulo</label>
            <div className="flex gap-4">
              {['Transparente', 'Branco'].map(c => (
                <label key={c} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="color" value={c} checked={form.color === c}
                    onChange={() => setForm(f => ({ ...f, color: c }))} style={{ accentColor: S.fgMuted }} />
                  <span className="text-sm">{c}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Solicitante</label>
            <input type="text" placeholder="Digite seu nome..." value={form.requester}
              onChange={e => setForm(f => ({ ...f, requester: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Farmacêutico Responsável</label>
            <div className="px-3 py-2 rounded-lg text-sm bg-gray-50 border" style={{ borderColor: S.border, color: S.fg }}>
              {PHARMACIST}
            </div>
          </div>

          <button type="submit" disabled={salvando || !codigoValido}
            className="w-full py-2.5 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: S.primary }}>
            {salvando ? <><IconSpinner /> Salvando...</> : 'Adicionar Pedido'}
          </button>

        </form>
      </div>
    </div>
  );
}
