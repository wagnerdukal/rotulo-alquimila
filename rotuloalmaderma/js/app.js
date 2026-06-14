// ── Componente raiz ────────────────────────────────────────────────────
function App() {
  const [currentUser, setCurrentUser] = React.useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ap_user')) || null; }
    catch { return null; }
  });
  const [page,     setPage]     = React.useState('fila');
  const [users,    setUsers]    = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [orders,   setOrders]   = React.useState([]);
  const [loading,  setLoading]  = React.useState(true);

  // Carrega dados do servidor ao montar
  React.useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    Promise.all([
      api('GET', '/api/users'),
      api('GET', '/api/products'),
      api('GET', '/api/orders'),
    ]).then(([u, p, o]) => {
      setUsers(u); setProducts(p); setOrders(o);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser]);

  // Redireciona se a página não for mais permitida
  React.useEffect(() => {
    if (!currentUser) return;
    const pages = paginasVisiveis(currentUser);
    if (!pages.includes(page)) setPage(pages[0] || 'fila');
  }, [currentUser, page]);

  function handleLogin(user) {
    sessionStorage.setItem('ap_user', JSON.stringify(user));
    setCurrentUser(user);
    setLoading(true);
    const pages = paginasVisiveis(user);
    setPage(pages[0] || 'fila');
  }

  function handleLogout() {
    sessionStorage.removeItem('ap_user');
    setCurrentUser(null);
    setUsers([]); setProducts([]); setOrders([]);
  }

  // ── Funções de pedidos ──────────────────────────────────────────────
  async function addOrder(order) {
    const novo = await api('POST', '/api/orders', order);
    setOrders(prev => [novo, ...prev]);
    return novo;
  }
  async function updateOrder(order) {
    const updated = await api('PUT', `/api/orders/${order.id}`, order);
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  }
  async function deleteOrder(id) {
    await api('DELETE', `/api/orders/${id}`);
    setOrders(prev => prev.filter(o => o.id !== id));
  }

  // ── Funções de produtos ─────────────────────────────────────────────
  async function addProduct(p) {
    const novo = await api('POST', '/api/products', p);
    setProducts(prev => [...prev, novo]);
    return novo;
  }
  async function deleteProduct(id) {
    await api('DELETE', `/api/products/${id}`);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  // ── Funções de usuários ─────────────────────────────────────────────
  async function saveUser(u) {
    let salvo;
    if (u.id && users.find(x => x.id === u.id)) {
      salvo = await api('PUT', `/api/users/${u.id}`, u);
      setUsers(prev => prev.map(x => x.id === salvo.id ? salvo : x));
      // Atualiza sessão se for o próprio usuário
      if (salvo.id === currentUser.id) {
        sessionStorage.setItem('ap_user', JSON.stringify(salvo));
        setCurrentUser(salvo);
      }
    } else {
      salvo = await api('POST', '/api/users', u);
      setUsers(prev => [...prev, salvo]);
    }
    return salvo;
  }
  async function deleteUser(id) {
    await api('DELETE', `/api/users/${id}`);
    setUsers(prev => prev.filter(u => u.id !== id));
  }
  async function toggleUserAtivo(id) {
    const u = users.find(x => x.id === id);
    if (!u) return;
    const updated = await api('PUT', `/api/users/${id}`, { ...u, ativo: !u.ativo });
    setUsers(prev => prev.map(x => x.id === id ? updated : x));
  }

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: S.bg }}>
      <div className="flex flex-col items-center gap-3">
        <IconSpinner />
        <p className="text-sm" style={{ color: S.fgMuted }}>Carregando dados...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: S.bg }}>
      <Navbar currentUser={currentUser} page={page} setPage={setPage} onLogout={handleLogout} />
      <main>
        {page === 'novo-pedido' && (
          <NovoPedido
            currentUser={currentUser}
            products={products}
            onAddOrder={addOrder}
          />
        )}
        {page === 'fila' && (
          <FilaImpressao
            currentUser={currentUser}
            orders={orders}
            onUpdateOrder={updateOrder}
            onDeleteOrder={deleteOrder}
            products={products}
          />
        )}
        {page === 'produtos' && (
          <GerenciarProdutos
            currentUser={currentUser}
            products={products}
            onAddProduct={addProduct}
            onDeleteProduct={deleteProduct}
          />
        )}
        {page === 'usuarios' && (
          <Usuarios
            currentUser={currentUser}
            users={users}
            onSaveUser={saveUser}
            onDeleteUser={deleteUser}
            onToggleAtivo={toggleUserAtivo}
          />
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
