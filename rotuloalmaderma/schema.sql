-- Execute este SQL no Supabase: SQL Editor → New Query → cole e clique em Run
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                      bigint PRIMARY KEY,
  nome                    text NOT NULL,
  email                   text NOT NULL UNIQUE,
  senha                   text NOT NULL,
  is_admin                boolean DEFAULT false,
  pode_visualizar         boolean DEFAULT true,
  pode_check              boolean DEFAULT false,
  pode_editar             boolean DEFAULT false,
  pode_excluir            boolean DEFAULT false,
  pode_gerenciar_produtos boolean DEFAULT false,
  ativo                   boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS products (
  id   bigint PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id          bigint PRIMARY KEY,
  code        text,
  product     text,
  qty         integer,
  lot         text,
  mfg         text,
  exp         text,
  color       text,
  printed     boolean DEFAULT false,
  requester   text,
  created_by  text,
  created_at  text
);

-- Dados iniciais ────────────────────────────────────────────────────────────
INSERT INTO users (id,nome,email,senha,is_admin,pode_visualizar,pode_check,pode_editar,pode_excluir,pode_gerenciar_produtos,ativo) VALUES
  (1,'Julio',              'julio@artpharma.com',  '123456',false,true, false,false,false,false,true),
  (2,'Wagner Batista Rocha','wagner@artpharma.com','123456',true, true, true, true, true, true, true),
  (3,'Administrador',      'admin@artpharma.com',  '123456',true, true, true, true, true, true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id,code,name) VALUES
  (1,'12335','clonapure'),
  (2,'12345','clonapure env')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id,code,product,qty,lot,mfg,exp,color,printed,requester,created_by,created_at) VALUES
  (1,'12335','clonapure',    12,'8485', '2026-06-10','2026-06-25','Branco',false,'Wagner','Wagner Batista Rocha','2026-06-10T08:00:00'),
  (2,'12335','clonapure',    12,'54668','2026-06-10','2026-06-26','Branco',false,'Wagner','Wagner Batista Rocha','2026-06-10T08:15:00'),
  (3,'12335','clonapure',    15,'65598','2026-06-10','2026-06-25','Branco',false,'Wagner','Wagner Batista Rocha','2026-06-10T09:00:00'),
  (4,'12345','clonapure env',20,'45885','2026-06-10','2026-09-24','Branco',false,'Wagner','Wagner Batista Rocha','2026-06-10T09:30:00')
ON CONFLICT (id) DO NOTHING;

-- Desabilitar RLS (Row Level Security) para acesso via service key
ALTER TABLE users    DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders   DISABLE ROW LEVEL SECURITY;
