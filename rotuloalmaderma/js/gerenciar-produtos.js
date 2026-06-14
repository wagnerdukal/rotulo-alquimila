// ── Página: Gerenciar Produtos ─────────────────────────────────────────
function GerenciarProdutos({ currentUser, products, onAddProduct, onDeleteProduct }) {
  const [code,    setCode]    = React.useState('');
  const [name,    setName]    = React.useState('');
  const [search,  setSearch]  = React.useState('');
  const [salvando,setSalvando]= React.useState(false);
  const [msg,     setMsg]     = React.useState({ text: '', type: 'info' });

  const podeGerenciar = currentUser.pode_gerenciar_produtos || currentUser.is_admin;

  function showMsg(text, type = 'info') {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'info' }), 4000);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!podeGerenciar) return;
    setSalvando(true);
    try {
      await onAddProduct({ code, name });
      setCode(''); setName('');
      showMsg('Produto adicionado com sucesso!', 'success');
    } catch(err) {
      showMsg(err.message || 'Erro ao adicionar produto.', 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id) {
    if (!podeGerenciar) return;
    if (!confirm('Deseja excluir este produto?')) return;
    try {
      await onDeleteProduct(id);
    } catch(err) {
      showMsg(err.message || 'Erro ao excluir.', 'error');
    }
  }

  function handleImport(e) {
    if (!podeGerenciar) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const lines = ev.target.result.trim().split('\n');
      let added = 0, erros = 0;
      for (const line of lines) {
        const parts = line.split(/[,;]/);
        if (parts.length < 2) continue;
        const c = parts[0].trim().replace(/"/g, '');
        const n = parts[1].trim().replace(/"/g, '');
        if (!c || !n || c.toLowerCase() === 'codigo') continue;
        if (products.find(p => p.code === c)) continue;
        try {
          await onAddProduct({ code: c, name: n });
          added++;
        } catch { erros++; }
      }
      showMsg(`${added} importado(s)${erros ? `, ${erros} erro(s)` : ''}.`, added ? 'success' : 'error');
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const filtered = products.filter(p =>
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const msgCls = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error:   'bg-red-50 border-red-200 text-red-700',
    info:    'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: S.fg }}>Gerenciar Produtos</h1>
        <p className="text-sm mt-1" style={{ color: S.fgMuted }}>Cadastre ou importe produtos para o sistema</p>
      </div>

      {msg.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm border ${msgCls[msg.type]}`}>{msg.text}</div>
      )}

      {podeGerenciar && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Adicionar */}
          <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: S.border }}>
            <h2 className="font-semibold mb-4">Adicionar Produto</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <input type="text" placeholder="Código do produto" value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} required />
              <input type="text" placeholder="Nome do produto" value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} required />
              <button type="submit" disabled={salvando}
                className="w-full py-2 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ background: S.primary }}>
                {salvando ? <><IconSpinner/> Salvando...</> : 'Adicionar'}
              </button>
            </form>
          </div>

          {/* Importar */}
          <div className="bg-white rounded-2xl shadow-sm border p-5" style={{ borderColor: S.border }}>
            <h2 className="font-semibold mb-2">Importar Planilha</h2>
            <p className="text-xs mb-4" style={{ color: S.fgMuted }}>
              CSV com colunas: <code className="bg-gray-100 px-1 rounded">codigo</code> e <code className="bg-gray-100 px-1 rounded">nome</code>
            </p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: 'hsl(210,30%,78%)' }}>
              <span style={{ color: S.primary }}><IconUpload /></span>
              <span className="text-sm font-medium mt-2" style={{ color: S.primary }}>Selecionar arquivo</span>
              <span className="text-xs mt-1" style={{ color: S.fgMuted }}>CSV</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm border" style={{ borderColor: S.border }}>
        <div className="p-4 border-b" style={{ borderColor: S.border }}>
          <input type="text" placeholder="Buscar por código ou nome..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} />
        </div>
        <div className="px-4 py-2 text-xs" style={{ color: S.fgMuted }}>
          {filtered.length} produto(s) cadastrado(s)
        </div>
        {filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-sm" style={{ color: S.fgMuted }}>Nenhum produto encontrado.</div>
        )}
        {filtered.map(p => (
          <div key={p.id}
            className="flex items-center justify-between px-4 py-3 border-t hover:bg-gray-50 transition-colors"
            style={{ borderColor: S.borderSub }}>
            <div>
              <span className="font-mono font-semibold text-sm" style={{ color: S.primary }}>{p.code}</span>
              <span className="ml-3 text-sm" style={{ color: S.fg }}>{p.name}</span>
            </div>
            {podeGerenciar && (
              <button onClick={() => handleDelete(p.id)}
                className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                <Trash />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
