// ── Constantes globais ─────────────────────────────────────────────────
const PHARMACIST = "Heloísa C. M. A. Gomes CRF: 50.330";

// Permissões granulares por usuário
const PERMISSOES = [
  { key: "pode_visualizar",          label: "Visualizar",           iconName: "Eye",      cor: "text-blue-600 bg-blue-50"    },
  { key: "pode_check",               label: "Marcar Impresso",      iconName: "CheckSquare", cor: "text-green-600 bg-green-50" },
  { key: "pode_editar",              label: "Editar Pedidos",        iconName: "Edit3",    cor: "text-amber-600 bg-amber-50"  },
  { key: "pode_excluir",             label: "Excluir Pedidos",       iconName: "Trash",    cor: "text-red-600 bg-red-50"      },
  { key: "pode_gerenciar_produtos",  label: "Gerenciar Produtos",    iconName: "Package",  cor: "text-purple-600 bg-purple-50"},
];

// Template para novo usuário
const FORM_INICIAL_USUARIO = {
  nome: "", email: "", senha: "",
  is_admin:                false,
  pode_visualizar:         true,
  pode_check:              false,
  pode_editar:             false,
  pode_excluir:            false,
  pode_gerenciar_produtos: false,
  ativo:                   true,
};

// ── Helpers ────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function fmtDateTime(iso) {
  if (!iso) return '';
  const dt = new Date(iso);
  return dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function firstName(fullName) {
  return (fullName || '').split(' ')[0];
}

// ── API helper ─────────────────────────────────────────────────────────
async function api(method, endpoint, body) {
  const opts = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  };
  const res = await fetch(endpoint, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro na requisição');
  return data;
}

// ── Paleta de cores ────────────────────────────────────────────────────
const S = {
  primary:      'hsl(207, 75%, 60%)',
  primaryLight: 'hsl(207,69%,92%)',
  bg:           'hsl(210,50%,96%)',
  fg:           'hsl(213,40%,18%)',
  fgMuted:      'hsl(207, 75%, 60%)',
  border:       'hsl(210,30%,88%)',
  borderSub:    'hsl(210,30%,92%)',
  muted:        'hsl(210,40%,94%)',
};

// ── Páginas visíveis por permissão ─────────────────────────────────────
function paginasVisiveis(user) {
  const pages = [];
  if (user.pode_editar             || user.is_admin) pages.push('novo-pedido');
  if (user.pode_visualizar         || user.is_admin) pages.push('fila');
  if (user.pode_gerenciar_produtos || user.is_admin) pages.push('produtos');
  if (user.is_admin)                                 pages.push('usuarios');
  return pages;
}
