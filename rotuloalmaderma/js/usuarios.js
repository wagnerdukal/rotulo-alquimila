// ── Modal Novo / Editar Usuário ────────────────────────────────────────
function UserModal({ user, onSave, onClose, currentUserId }) {
  const [form,     setForm]     = React.useState(user ? { ...user, senha: '' } : { ...FORM_INICIAL_USUARIO });
  const [salvando, setSalvando] = React.useState(false);
  const [erro,     setErro]     = React.useState('');

  const ehProprioUsuario = user && user.id === currentUserId;

  function toggle(key) { setForm(f => ({ ...f, [key]: !f[key] })); }

  function handleAdmin(val) {
    setForm(f => ({
      ...f,
      is_admin:                val,
      pode_visualizar:         val ? true : f.pode_visualizar,
      pode_check:              val ? true : f.pode_check,
      pode_editar:             val ? true : f.pode_editar,
      pode_excluir:            val ? true : f.pode_excluir,
      pode_gerenciar_produtos: val ? true : f.pode_gerenciar_produtos,
    }));
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.email.trim()) { setErro('Nome e e-mail são obrigatórios.'); return; }
    if (!user && !form.senha.trim()) { setErro('Informe uma senha para o novo usuário.'); return; }
    setSalvando(true); setErro('');
    try {
      // Admin sempre tem todas as permissões
      const dados = { ...form };
      if (dados.is_admin) {
        dados.pode_visualizar = dados.pode_check = dados.pode_editar =
        dados.pode_excluir = dados.pode_gerenciar_produtos = true;
      }
      await onSave(dados);
    } catch (err) {
      setErro(err.message || 'Erro ao salvar.');
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-2xl z-10" style={{ borderColor: S.border }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: S.primaryLight }}>
              <IconUser />
            </div>
            <h2 className="font-semibold text-base" style={{ color: S.fg }}>
              {user ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><IconX /></button>
        </div>

        <div className="p-5 space-y-5">

          {/* Dados básicos */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: S.fgMuted }}>Dados do usuário</p>
            <div>
              <label className="block text-sm font-medium mb-1">Nome completo</label>
              <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Nome do usuário"
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-mail</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@artpharma.com"
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Senha {user && <span className="font-normal text-xs ml-1" style={{ color: S.fgMuted }}>(vazio = não alterar)</span>}
              </label>
              <input type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                placeholder="••••••••"
                className="w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border }} />
            </div>
          </div>

          {/* Toggle Admin */}
          <div className="rounded-xl p-4 border transition-colors"
            style={{ borderColor: form.is_admin ? S.primary : S.border, background: form.is_admin ? S.primaryLight : S.muted }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <IconShield />
                <div>
                  <p className="text-sm font-semibold" style={{ color: S.fg }}>Administrador</p>
                  <p className="text-xs" style={{ color: S.fgMuted }}>Acesso total + gerencia usuários</p>
                </div>
              </div>
              <button type="button" onClick={() => !ehProprioUsuario && handleAdmin(!form.is_admin)} disabled={ehProprioUsuario}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${ehProprioUsuario ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                style={{ background: form.is_admin ? S.primary : 'hsl(210,30%,75%)' }}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_admin ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Permissões granulares */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: S.fgMuted }}>
              Permissões individuais
            </p>
            <div className="space-y-2">
              {PERMISSOES.map(p => {
                const ativo = form[p.key];
                const [textCls, bgCls] = p.cor.split(' ');
                return (
                  <label key={p.key}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all select-none ${form.is_admin ? 'opacity-50' : 'cursor-pointer hover:border-gray-300'}`}
                    style={{ borderColor: ativo && !form.is_admin ? S.primary : S.border }}
                    onClick={() => !form.is_admin && toggle(p.key)}>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${ativo ? bgCls : 'bg-gray-100'} ${ativo ? textCls : 'text-gray-400'}`}>
                        <PermIcon name={p.iconName} />
                      </span>
                      <span className="text-sm font-medium" style={{ color: S.fg }}>{p.label}</span>
                    </div>
                    <div className="w-5 h-5 rounded flex items-center justify-center border-2 transition-all"
                      style={{ borderColor: ativo ? S.primary : S.border, background: ativo ? S.primary : 'white' }}>
                      {ativo && (
                        <svg className="w-3 h-3" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="mt-3 p-3 rounded-xl text-xs space-y-1" style={{ background: S.muted, color: S.fgMuted }}>
              <p className="font-semibold mb-1" style={{ color: S.fg }}>Páginas liberadas por permissão:</p>
              <p>• <b>Visualizar </b> → Fila de Impressão</p>
              <p>• <b>Marcar</b> → Marcar Pedidos</p>
              <p>• <b>Editar Pedidos</b> → também libera Novo Pedido</p>
              <p>• <b>Gerenciar Produtos</b> → Adiciona Novos Produtos</p>
              <p>• <b>Administrador</b> → Tudo liberado + Cadastro de novo usuário</p>
            </div>
          </div>

          {/* Status ativo */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{ borderColor: S.border }}>
            <div>
              <p className="text-sm font-medium" style={{ color: S.fg }}>Usuário ativo</p>
              <p className="text-xs" style={{ color: S.fgMuted }}>Inativo não consegue fazer login</p>
            </div>
            <button type="button" disabled={ehProprioUsuario}
              onClick={() => !ehProprioUsuario && setForm(f => ({ ...f, ativo: !f.ativo }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ehProprioUsuario ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{ background: form.ativo ? S.primary : 'hsl(210,30%,75%)' }}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.ativo ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {erro && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t sticky bottom-0 bg-white rounded-b-2xl" style={{ borderColor: S.border }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-colors"
            style={{ borderColor: S.border, color: S.fg }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={salvando}
            className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: S.primary }}>
            {salvando ? <><IconSpinner/> Salvando...</> : 'Salvar usuário'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página: Usuários ───────────────────────────────────────────────────
function Usuarios({ currentUser, users, onSaveUser, onDeleteUser, onToggleAtivo }) {
  const [modal,    setModal]    = React.useState(null);
  const [salvando, setSalvando] = React.useState(false);

  if (!currentUser.is_admin) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: S.primaryLight }}>
          <IconShield />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: S.fg }}>Acesso restrito</h2>
        <p className="text-sm" style={{ color: S.fgMuted }}>Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  async function handleSave(u) {
    setSalvando(true);
    try {
      await onSaveUser(u);
      setModal(null);
    } catch(err) {
      throw err; // modal exibe o erro
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id) {
    if (id === currentUser.id) { alert('Você não pode excluir seu próprio usuário.'); return; }
    if (!confirm('Deseja excluir este usuário permanentemente?')) return;
    try { await onDeleteUser(id); }
    catch(err) { alert(err.message); }
  }

  // Tags de permissões do usuário na listagem
  function PermTags({ u }) {
    if (u.is_admin) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: S.primaryLight, color: S.primary }}>
          <IconShield /> Administrador
        </span>
      );
    }
    const ativas = PERMISSOES.filter(p => u[p.key]);
    if (ativas.length === 0)
      return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Sem permissões</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {ativas.map(p => {
          const [textCls, bgCls] = p.cor.split(' ');
          return (
            <span key={p.key} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${bgCls} ${textCls}`}>
              <PermIcon name={p.iconName} /> {p.label}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: S.fg }}>Gerenciar Usuários</h1>
          <p className="text-sm mt-1" style={{ color: S.fgMuted }}>Crie e gerencie acessos ao sistema</p>
        </div>
        <button onClick={() => setModal('new')}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ background: S.primary }}>
          <IconUser /> Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border" style={{ borderColor: S.border }}>
        {users.length === 0 && (
          <div className="px-4 py-8 text-center text-sm" style={{ color: S.fgMuted }}>Nenhum usuário cadastrado.</div>
        )}
        {users.map((u, i) => (
          <div key={u.id}
            className={`px-5 py-4 ${i > 0 ? 'border-t' : ''} hover:bg-gray-50 transition-colors`}
            style={{ borderColor: S.borderSub }}>
            <div className="flex items-start justify-between gap-4">
              {/* Avatar + info */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                  style={{ background: u.is_admin ? S.primary : 'hsl(213,40%,55%)' }}>
                  {(u.nome || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-sm" style={{ color: S.fg }}>{u.nome}</p>
                    {!u.ativo && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Inativo</span>}
                    {u.id === currentUser.id && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: S.muted, color: S.fgMuted }}>você</span>}
                  </div>
                  <p className="text-xs mb-2" style={{ color: S.fgMuted }}>{u.email}</p>
                  <PermTags u={u} />
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setModal(u)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border hover:bg-gray-100 transition-colors"
                  style={{ borderColor: S.border, color: S.fgMuted }}>
                  Editar
                </button>
                {u.id !== currentUser.id && (
                  <>
                    <button onClick={() => onToggleAtivo(u.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${u.ativo ? 'border-orange-200 text-orange-600 hover:bg-orange-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                      {u.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => handleDelete(u.id)}
                      className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <UserModal
          user={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
}
