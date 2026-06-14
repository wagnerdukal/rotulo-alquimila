"""
Servidor Almaderma — Python 3 puro, sem dependências externas.
  - Desenvolvimento: usa db/data.json
  - Produção (Render): usa Supabase via variáveis de ambiente
      SUPABASE_URL=https://xxxx.supabase.co
      SUPABASE_KEY=sua-service-role-key
"""

import json, os, threading, time, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

PORT         = int(os.environ.get("PORT", 3000))
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
USE_DB       = bool(SUPABASE_URL and SUPABASE_KEY)

# ── Modo local: arquivo JSON ───────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR   = os.path.join(BASE_DIR, "db")
DB_PATH  = os.path.join(DB_DIR, "data.json")
db_lock  = threading.Lock()

DADOS_INICIAIS = {
    "users": [
        {"id":1,"nome":"Julio",               "email":"julio@almaderma.com",  "senha":"123456","is_admin":False,"pode_visualizar":True, "pode_check":False,"pode_editar":False,"pode_excluir":False,"pode_gerenciar_produtos":False,"ativo":True},
        {"id":2,"nome":"Wagner Batista Rocha","email":"wagner@almaderma.com", "senha":"123456","is_admin":True, "pode_visualizar":True, "pode_check":True, "pode_editar":True, "pode_excluir":True, "pode_gerenciar_produtos":True, "ativo":True},
        {"id":3,"nome":"Administrador",       "email":"admin@almaderma.com",  "senha":"123456","is_admin":True, "pode_visualizar":True, "pode_check":True, "pode_editar":True, "pode_excluir":True, "pode_gerenciar_produtos":True, "ativo":True},
    ],
    "products": [
        {"id":1,"code":"12335","name":"clonapure"},
        {"id":2,"code":"12345","name":"clonapure env"},
    ],
    "orders": [],
}

if not USE_DB:
    os.makedirs(DB_DIR, exist_ok=True)
    if not os.path.exists(DB_PATH):
        with open(DB_PATH, "w", encoding="utf-8") as f:
            json.dump(DADOS_INICIAIS, f, ensure_ascii=False, indent=2)

def ler_db():
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def salvar_db(data):
    with db_lock:
        with open(DB_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

# ── Modo produção: Supabase ────────────────────────────────────────────
def sb(method, table, body=None, query=""):
    url  = f"{SUPABASE_URL}/rest/v1/{table}{query}"
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else None
    req  = urllib.request.Request(url, data=data, method=method, headers={
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "return=representation",
    })
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw.strip() else []
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", errors="replace")
        try:    msg = json.loads(msg).get("message", msg)
        except: pass
        raise Exception(msg)

def _order_from_db(o):
    o = dict(o)
    o["createdBy"] = o.pop("created_by", o.get("createdBy", ""))
    o["createdAt"] = o.pop("created_at", o.get("createdAt", ""))
    return o

def _order_to_db(o):
    o = dict(o)
    o["created_by"] = o.pop("createdBy", o.get("created_by", ""))
    o["created_at"] = o.pop("createdAt", o.get("created_at", ""))
    o.pop("createdBy", None); o.pop("createdAt", None)
    return o

# ── Camada de dados ────────────────────────────────────────────────────
def db_get_users():
    if USE_DB: return sb("GET", "users", query="?select=*&order=id.asc")
    return ler_db()["users"]

def db_get_products():
    if USE_DB: return sb("GET", "products", query="?select=*&order=code.asc")
    return ler_db()["products"]

def db_get_orders():
    if USE_DB: return [_order_from_db(o) for o in sb("GET", "orders", query="?select=*&order=id.desc")]
    return ler_db()["orders"]

def db_login(email, senha):
    return next((u for u in db_get_users() if u["email"]==email and u["senha"]==senha and u.get("ativo",True)), None)

def db_create_user(u):
    u["id"] = int(time.time()*1000)
    if USE_DB:
        r = sb("POST", "users", body=u); return r[0] if r else u
    db = ler_db(); db["users"].append(u); salvar_db(db); return u

def db_update_user(uid, body):
    if USE_DB:
        current = sb("GET", "users", query=f"?id=eq.{uid}&select=senha")
        body["senha"] = body.get("senha") or (current[0]["senha"] if current else "")
        r = sb("PATCH", "users", body=body, query=f"?id=eq.{uid}"); return r[0] if r else body
    db = ler_db()
    idx = next((i for i,u in enumerate(db["users"]) if u["id"]==uid), -1)
    if idx==-1: raise Exception("Usuario nao encontrado.")
    db["users"][idx] = {**db["users"][idx], **body, "id":uid, "senha": body.get("senha") or db["users"][idx]["senha"]}
    salvar_db(db); return db["users"][idx]

def db_delete_user(uid):
    if USE_DB: sb("DELETE", "users", query=f"?id=eq.{uid}"); return
    db = ler_db(); db["users"] = [u for u in db["users"] if u["id"]!=uid]; salvar_db(db)

def db_create_product(p):
    if USE_DB:
        if sb("GET","products",query=f"?code=eq.{p['code']}&select=id"): raise Exception("Codigo ja cadastrado.")
    else:
        db = ler_db()
        if any(x["code"]==p["code"] for x in db["products"]): raise Exception("Codigo ja cadastrado.")
    p["id"] = int(time.time()*1000)
    if USE_DB:
        r = sb("POST","products",body=p); return r[0] if r else p
    db["products"].append(p); salvar_db(db); return p

def db_delete_product(pid):
    if USE_DB: sb("DELETE","products",query=f"?id=eq.{pid}"); return
    db = ler_db(); db["products"]=[x for x in db["products"] if x["id"]!=pid]; salvar_db(db)

def db_create_order(o):
    code = o.get("code","")
    if USE_DB:
        if not sb("GET","products",query=f"?code=eq.{code}&select=id"):
            raise Exception(f'Codigo "{code}" nao cadastrado em Produtos.')
    else:
        db = ler_db()
        if not any(p["code"]==code for p in db["products"]):
            raise Exception(f'Codigo "{code}" nao cadastrado em Produtos.')
    o["id"] = int(time.time()*1000)
    if USE_DB:
        r = sb("POST","orders",body=_order_to_db(o)); return _order_from_db(r[0]) if r else o
    db["orders"].insert(0, o); salvar_db(db); return o

def db_update_order(uid, body):
    if USE_DB:
        r = sb("PATCH","orders",body=_order_to_db(body),query=f"?id=eq.{uid}")
        return _order_from_db(r[0]) if r else body
    db = ler_db()
    idx = next((i for i,o in enumerate(db["orders"]) if o["id"]==uid),-1)
    if idx==-1: raise Exception("Pedido nao encontrado.")
    db["orders"][idx]={**db["orders"][idx],**body,"id":uid}; salvar_db(db)
    return db["orders"][idx]

def db_delete_order(uid):
    if USE_DB: sb("DELETE","orders",query=f"?id=eq.{uid}"); return
    db = ler_db(); db["orders"]=[o for o in db["orders"] if o["id"]!=uid]; salvar_db(db)

# ── Handler HTTP ───────────────────────────────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args): pass

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type",   "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers(); self.wfile.write(body)

    def _err(self, code, msg): self._json(code, {"erro": msg})

    def _body(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n)) if n else {}

    def _file(self, path):
        if path in ("/", ""): path = "/index.html"
        fp = os.path.join(BASE_DIR, path.lstrip("/").replace("/", os.sep))
        if not os.path.isfile(fp):
            self.send_response(404); self.end_headers(); return
        mime = {".html":"text/html",".js":"application/javascript",
                ".css":"text/css",".json":"application/json"
               }.get(os.path.splitext(fp)[1], "application/octet-stream")
        with open(fp, "rb") as f: data = f.read()
        self.send_response(200)
        self.send_header("Content-Type",   mime+"; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers(); self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin",  "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _route(self):
        return urlparse(self.path).path.rstrip("/").split("/")

    def do_GET(self):
        parts = self._route()
        try:
            if parts[1:3]==["api","users"]:    return self._json(200,[{k:v for k,v in u.items() if k!="senha"} for u in db_get_users()])
            if parts[1:3]==["api","products"]: return self._json(200, db_get_products())
            if parts[1:3]==["api","orders"]:   return self._json(200, db_get_orders())
        except Exception as e: return self._err(500, str(e))
        self._file(urlparse(self.path).path)

    def do_POST(self):
        parts = self._route(); body = self._body()
        try:
            if parts[1:3]==["api","login"]:
                user = db_login(body.get("email",""), body.get("senha",""))
                if not user: return self._err(401,"E-mail ou senha incorretos, ou usuario inativo.")
                return self._json(200,{k:v for k,v in user.items() if k!="senha"})
            if parts[1:3]==["api","users"]:
                u = db_create_user(body); return self._json(201,{k:v for k,v in u.items() if k!="senha"})
            if parts[1:3]==["api","products"]: return self._json(201, db_create_product(body))
            if parts[1:3]==["api","orders"]:   return self._json(201, db_create_order(body))
        except Exception as e: return self._err(400, str(e))
        self._err(404,"Rota nao encontrada.")

    def do_PUT(self):
        parts = self._route(); body = self._body()
        if len(parts)<4: return self._err(400,"ID obrigatorio.")
        rid = int(parts[3])
        try:
            if parts[2]=="users":  return self._json(200,{k:v for k,v in db_update_user(rid,body).items() if k!="senha"})
            if parts[2]=="orders": return self._json(200, db_update_order(rid,body))
        except Exception as e: return self._err(400, str(e))
        self._err(404,"Rota nao encontrada.")

    def do_DELETE(self):
        parts = self._route()
        if len(parts)<4: return self._err(400,"ID obrigatorio.")
        rid = int(parts[3])
        try:
            if parts[2]=="users":      db_delete_user(rid)
            elif parts[2]=="products": db_delete_product(rid)
            elif parts[2]=="orders":   db_delete_order(rid)
            else: return self._err(404,"Rota nao encontrada.")
            self._json(200,{"ok":True})
        except Exception as e: self._err(400, str(e))

# ── Iniciar ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    modo = "Supabase (producao)" if USE_DB else "JSON local (desenvolvimento)"
    server = HTTPServer(("", PORT), Handler)
    print(f"Almaderma rodando na porta {PORT} | Modo: {modo}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Servidor encerrado.")
