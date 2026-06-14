// ── Barra de navegação ─────────────────────────────────────────────────
function Navbar({ currentUser, page, setPage, onLogout }) {
  const pages = paginasVisiveis(currentUser);

  
  const ALL_ITEMS = [
    { id: 'novo-pedido', label: 'Novo Pedido' },
    { id: 'fila',        label: 'Fila de Impressão' },
    { id: 'produtos',    label: 'Gerenciar Produtos' },
    { id: 'usuarios',    label: 'Usuários' },
  ];

  const navItems = ALL_ITEMS.filter(i => pages.includes(i.id));

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-40" style={{ borderColor: S.border }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: S.primaryLight }}>
                <span className="text-xs font-black" style={{ color: S.primary }}>💊</span> 
              </div>
              <span className="font-black text-sm tracking-tight" style={{ color: S.fgMuted }}>
                Alm<span style={{ color: S.primary }}>quimila</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              {navItems.map(item => (
                <button key={item.id} onClick={() => setPage(item.id)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={page === item.id
                    ? { background: S.primary, color: '#fff' }
                    : { color: S.fgMuted }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold" style={{ color: S.fg }}>{currentUser.nome}</p>
              <p className="text-xs" style={{ color: S.primary }}>
                {currentUser.is_admin ? 'Administrador' : 'Usuário'}
              </p>
            </div>
            <button onClick={onLogout}
              className="text-xs px-3 py-1.5 rounded-md border font-medium hover:bg-gray-50 transition-colors"
              style={{ borderColor: S.border, color: S.fgMuted }}>
              Sair
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
