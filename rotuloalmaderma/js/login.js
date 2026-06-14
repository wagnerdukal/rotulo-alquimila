// ── Página de Login ────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email,    setEmail]    = React.useState('');
  const [senha,    setSenha]    = React.useState('');
  const [erro,     setErro]     = React.useState('');
  const [loading,  setLoading]  = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const user = await api('POST', '/api/login', { email, senha });
      onLogin(user);
    } catch (err) {
      setErro(err.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: S.bg }}>
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: S.primaryLight }}>
            <span className="text-2xl font-black" style={{ color: S.primary }}>💊</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: S.fgMuted }}>
            Alma<span style={{ color: S.primary }}>derma</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: S.fgMuted }}>Sistema de impressão de Rótulos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">E-mail</label>
            <input type="email" placeholder="seu@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input type="password" placeholder="••••••••" value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} required />
          </div>
          {erro && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: S.primary }}>
            {loading ? <><IconSpinner /> Entrando...</> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
