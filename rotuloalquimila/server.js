const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app     = express();
const PORT    = 4000;
const DB_DIR  = path.join(__dirname, 'db');
const DB_PATH = path.join(DB_DIR, 'data.json');

// ── Dados iniciais ─────────────────────────────────────────────────────
const DADOS_INICIAIS = {
  users: [
    { id: 1, nome: "Julio",               email: "julio@alquimila.com",   senha: "123456", is_admin: false, pode_visualizar: true,  pode_check: false, pode_editar: false, pode_excluir: false, pode_gerenciar_produtos: false, ativo: true },
    { id: 2, nome: "Wagner Batista Rocha",email: "wagner@alquimila.com",  senha: "123456", is_admin: true,  pode_visualizar: true,  pode_check: true,  pode_editar: true,  pode_excluir: true,  pode_gerenciar_produtos: true,  ativo: true },
    { id: 3, nome: "Administrador",       email: "admin@alquimila.com",   senha: "123456", is_admin: true,  pode_visualizar: true,  pode_check: true,  pode_editar: true,  pode_excluir: true,  pode_gerenciar_produtos: true,  ativo: true },
  ],
  products: [
    { id: 1, code: "12335", name: "clonapure" },
    { id: 2, code: "12345", name: "clonapure env" },
  ],
  orders: [
    { id: 1, code: "12335", product: "clonapure",     qty: 12, lot: "8485",  mfg: "2026-06-10", exp: "2026-06-25", color: "Branco", printed: false, requester: "Wagner", createdBy: "Wagner Batista Rocha", createdAt: "2026-06-10T08:00:00" },
    { id: 2, code: "12335", product: "clonapure",     qty: 12, lot: "54668", mfg: "2026-06-10", exp: "2026-06-26", color: "Branco", printed: false, requester: "Wagner", createdBy: "Wagner Batista Rocha", createdAt: "2026-06-10T08:15:00" },
    { id: 3, code: "12335", product: "clonapure",     qty: 15, lot: "65598", mfg: "2026-06-10", exp: "2026-06-25", color: "Branco", printed: false, requester: "Wagner", createdBy: "Wagner Batista Rocha", createdAt: "2026-06-10T09:00:00" },
    { id: 4, code: "12345", product: "clonapure env", qty: 20, lot: "45885", mfg: "2026-06-10", exp: "2026-09-24", color: "Branco", printed: false, requester: "Wagner", createdBy: "Wagner Batista Rocha", createdAt: "2026-06-10T09:30:00" },
  ],
};

// ── Banco de dados (arquivo JSON) ─────────────────────────────────────
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify(DADOS_INICIAIS, null, 2), 'utf-8');
  console.log('✔ Banco de dados criado em db/data.json');
}

function lerDB()       { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); }
function salvarDB(data){ fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8'); }

// ── Middleware ─────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(__dirname)); // serve index.html e pasta js/

// ── Login ──────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  const db   = lerDB();
  const user = db.users.find(u => u.email === email && u.senha === senha && u.ativo);
  if (!user) return res.status(401).json({ erro: 'E-mail ou senha incorretos, ou usuário inativo.' });
  const { senha: _, ...userSemSenha } = user; // não retorna a senha
  res.json(userSemSenha);
});

// ── Usuários ───────────────────────────────────────────────────────────
app.get('/api/users', (req, res) => {
  const db = lerDB();
  res.json(db.users.map(({ senha: _, ...u }) => u)); // sem senha
});

app.post('/api/users', (req, res) => {
  const db   = lerDB();
  const user = { ...req.body, id: Date.now() };
  db.users.push(user);
  salvarDB(db);
  const { senha: _, ...sem } = user;
  res.json(sem);
});

app.put('/api/users/:id', (req, res) => {
  const db  = lerDB();
  const id  = Number(req.params.id);
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  // Não sobrescreve senha se vier vazia
  const senhaNova = req.body.senha || db.users[idx].senha;
  db.users[idx] = { ...db.users[idx], ...req.body, senha: senhaNova, id };
  salvarDB(db);
  const { senha: _, ...sem } = db.users[idx];
  res.json(sem);
});

app.delete('/api/users/:id', (req, res) => {
  const db  = lerDB();
  const id  = Number(req.params.id);
  db.users  = db.users.filter(u => u.id !== id);
  salvarDB(db);
  res.json({ ok: true });
});

// ── Produtos ───────────────────────────────────────────────────────────
app.get('/api/products', (req, res) => res.json(lerDB().products));

app.post('/api/products', (req, res) => {
  const db = lerDB();
  if (db.products.find(p => p.code === req.body.code))
    return res.status(400).json({ erro: 'Código já cadastrado.' });
  const produto = { ...req.body, id: Date.now() };
  db.products.push(produto);
  salvarDB(db);
  res.json(produto);
});

app.delete('/api/products/:id', (req, res) => {
  const db      = lerDB();
  db.products   = db.products.filter(p => p.id !== Number(req.params.id));
  salvarDB(db);
  res.json({ ok: true });
});

// ── Pedidos ────────────────────────────────────────────────────────────
app.get('/api/orders', (req, res) => res.json(lerDB().orders));

app.post('/api/orders', (req, res) => {
  const db     = lerDB();
  // Valida se o código do produto existe
  if (!db.products.find(p => p.code === req.body.code))
    return res.status(400).json({ erro: `Código "${req.body.code}" não está cadastrado em Produtos.` });
  const pedido = { ...req.body, id: Date.now() };
  db.orders.unshift(pedido);
  salvarDB(db);
  res.json(pedido);
});

app.put('/api/orders/:id', (req, res) => {
  const db  = lerDB();
  const id  = Number(req.params.id);
  const idx = db.orders.findIndex(o => o.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Pedido não encontrado.' });
  db.orders[idx] = { ...db.orders[idx], ...req.body, id };
  salvarDB(db);
  res.json(db.orders[idx]);
});

app.delete('/api/orders/:id', (req, res) => {
  const db    = lerDB();
  db.orders   = db.orders.filter(o => o.id !== Number(req.params.id));
  salvarDB(db);
  res.json({ ok: true });
});

// ── Iniciar servidor ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════╗');
  console.log('  ║   🏥  Rotulo Alquimila           ║');
  console.log(`  ║   http://localhost:${PORT}          ║`);
  console.log('  ╚══════════════════════════════════╝');
  console.log('');
});
