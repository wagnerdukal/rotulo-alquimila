"""
Servidor Almaderma — Python 3 puro, sem dependências externas.
    - Desenvolvimento: uso db/data.json 
    - Produção (Render): usa Supabase via variáveis de ambiente (SUPABASE_URL, SUPABASE_KEY) e ignora db/data.json
        SUPABASE_URL=https://xxx.supabase.co
        SUPABASE_KEY=sua-service-role-key
"""

import json, os, threading, time, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, urlencode

PORT         = int(os.environ.get("PORT", 4000))
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
USE_DB       = bool(SUPABASE_URL and SUPABASE_KEY)

# modo local: arquivo JSON
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR   = os.path.join(BASE_DIR, "db")
DB_PATH  = os.path.join(DB_DIR, "data.json")
PORT     = 4000

# ── Dados iniciais ─────────────────────────────────────────────────────
DADOS_INICIAIS = {
    "users": [
        {"id": 1, "nome": "Julio",               "email": "julio@almaderma.com",   "senha": "123456", "is_admin": False, "pode_visualizar": True,  "pode_check": False, "pode_editar": False, "pode_excluir": False, "pode_gerenciar_produtos": False, "ativo": True},
        {"id": 2, "nome": "Wagner Batista Rocha", "email": "wagner@almaderma.com",  "senha": "123456", "is_admin": True,  "pode_visualizar": True,  "pode_check": True,  "pode_editar": True,  "pode_excluir": True,  "pode_gerenciar_produtos": True,  "ativo": True},
        {"id": 3, "nome": "Administrador",        "email": "admin@almaderma.com",   "senha": "123456", "is_admin": True,  "pode_visualizar": True,  "pode_check": True,  "pode_editar": True,  "pode_excluir": True,  "pode_gerenciar_produtos": True,  "ativo": True},
    ],
    "products": [
        {"id": 1, "code": "12335", "name": "clonapure"},
        {"id": 2, "code": "12345", "name": "clonapure env"},
    ],
    "orders": [
        {"id": 1, "code": "12335", "product": "clonapure",     "qty": 12, "lot": "8485",  "mfg": "2026-06-10", "exp": "2026-06-25", "color": "Branco", "printed": False, "requester": "Wagner", "createdBy": "Wagner Batista Rocha", "createdAt": "2026-06-10T08:00:00"},
        {"id": 2, "code": "12335", "product": "clonapure",     "qty": 12, "lot": "54668", "mfg": "2026-06-10", "exp": "2026-06-26", "color": "Branco", "printed": False, "requester": "Wagner", "createdBy": "Wagner Batista Rocha", "createdAt": "2026-06-10T08:15:00"},
        {"id": 3, "code": "12335", "product": "clonapure",     "qty": 15, "lot": "65598", "mfg": "2026-06-10", "exp": "2026-06-25", "color": "Branco", "printed": False, "requester": "Wagner", "createdBy": "Wagner Batista Rocha", "createdAt": "2026-06-10T09:00:00"},
        {"id": 4, "code": "12345", "product": "clonapure env", "qty": 20, "lot": "45885", "mfg": "2026-06-10", "exp": "2026-09-24", "color": "Branco", "printed": False, "requester": "Wagner", "createdBy": "Wagner Batista Rocha", "createdAt": "2026-06-10T09:30:00"},
    ],
}

# ── Banco de dados JSON ────────────────────────────────────────────────
db_lock = threading.Lock()

os.makedirs(DB_DIR, exist_ok=True)
if not os.path.exists(DB_PATH):
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(DADOS_INICIAIS, f, ensure_ascii=False, indent=2)
    print("✔ Banco de dados criado em db/data.json")

def ler_db():
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def salvar_db(data):
    with db_lock:
        with open(DB_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

# ── Handler HTTP ───────────────────────────────────────────────────────
import time

class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # silencia logs do servidor

    def _send_json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, code, msg):
        self._send_json(code, {"erro": msg})

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(length)) if length else {}

    def _serve_file(self, path):
        if path == "/" or path == "":
            path = "/index.html"
        file_path = os.path.join(BASE_DIR, path.lstrip("/").replace("/", os.sep))
        if not os.path.isfile(file_path):
            self.send_response(404); self.end_headers(); return
        ext = os.path.splitext(file_path)[1]
        mime = {".html": "text/html", ".js": "application/javascript",
                ".css": "text/css", ".json": "application/json",
                ".ico": "image/x-icon"}.get(ext, "application/octet-stream")
        with open(file_path, "rb") as f:
            data = f.read()
        self.send_response(200)
        self.send_header("Content-Type", mime + "; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/users":
            db = ler_db()
            self._send_json(200, [{k: v for k, v in u.items() if k != "senha"} for u in db["users"]])
        elif path == "/api/products":
            self._send_json(200, ler_db()["products"])
        elif path == "/api/orders":
            self._send_json(200, ler_db()["orders"])
        else:
            self._serve_file(path)

    def do_POST(self):
        path = urlparse(self.path).path
        body = self._read_body()
        db   = ler_db()

        if path == "/api/login":
            user = next((u for u in db["users"] if u["email"] == body.get("email") and u["senha"] == body.get("senha") and u.get("ativo", True)), None)
            if not user:
                return self._send_error(401, "E-mail ou senha incorretos, ou usuário inativo.")
            self._send_json(200, {k: v for k, v in user.items() if k != "senha"})

        elif path == "/api/users":
            body["id"] = int(time.time() * 1000)
            db["users"].append(body)
            salvar_db(db)
            self._send_json(201, {k: v for k, v in body.items() if k != "senha"})

        elif path == "/api/products":
            if any(p["code"] == body.get("code") for p in db["products"]):
                return self._send_error(400, "Código já cadastrado.")
            body["id"] = int(time.time() * 1000)
            db["products"].append(body)
            salvar_db(db)
            self._send_json(201, body)

        elif path == "/api/orders":
            code = body.get("code", "")
            if not any(p["code"] == code for p in db["products"]):
                return self._send_error(400, f'Código "{code}" não cadastrado em Produtos.')
            body["id"] = int(time.time() * 1000)
            db["orders"].insert(0, body)
            salvar_db(db)
            self._send_json(201, body)

        else:
            self._send_error(404, "Rota não encontrada.")

    def do_PUT(self):
        parts = urlparse(self.path).path.split("/")
        body  = self._read_body()
        db    = ler_db()

        if len(parts) < 4:
            return self._send_error(400, "ID obrigatório.")

        resource = parts[2]   # users / products / orders
        rid      = int(parts[3])

        if resource == "users":
            idx = next((i for i, u in enumerate(db["users"]) if u["id"] == rid), -1)
            if idx == -1: return self._send_error(404, "Usuário não encontrado.")
            senha_atual = db["users"][idx]["senha"]
            db["users"][idx] = {**db["users"][idx], **body, "id": rid, "senha": body.get("senha") or senha_atual}
            salvar_db(db)
            self._send_json(200, {k: v for k, v in db["users"][idx].items() if k != "senha"})

        elif resource == "orders":
            idx = next((i for i, o in enumerate(db["orders"]) if o["id"] == rid), -1)
            if idx == -1: return self._send_error(404, "Pedido não encontrado.")
            db["orders"][idx] = {**db["orders"][idx], **body, "id": rid}
            salvar_db(db)
            self._send_json(200, db["orders"][idx])

        else:
            self._send_error(404, "Rota não encontrada.")

    def do_DELETE(self):
        parts = urlparse(self.path).path.split("/")
        db    = ler_db()

        if len(parts) < 4:
            return self._send_error(400, "ID obrigatório.")

        resource = parts[2]
        rid      = int(parts[3])

        if resource == "users":
            db["users"] = [u for u in db["users"] if u["id"] != rid]
        elif resource == "products":
            db["products"] = [p for p in db["products"] if p["id"] != rid]
        elif resource == "orders":
            db["orders"] = [o for o in db["orders"] if o["id"] != rid]
        else:
            return self._send_error(404, "Rota não encontrada.")

        salvar_db(db)
        self._send_json(200, {"ok": True})

# ── Iniciar ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    modo = "Supabase (Produção)" if USE_DB else "JSON local (Desenvolvimento)"
    server = HTTPServer(("", PORT), Handler)
       print(f"\n  ╔══════════════════════════════════╗")
    print(f"  ║   🏥  Rotulo Almaderma           ║")
    print(f"  ║   http://localhost:{PORT}          ║")
    print(f"  ║   Modo: {modo:<24}║")
    print(f"  ║   Ctrl+C para parar              ║")
    print(f"  ╚══════════════════════════════════╝\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Servidor encerrado.")
