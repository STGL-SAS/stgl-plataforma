-- Fase 6: módulo Documentos (ficha + OneDrive / Microsoft Graph)

create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id),
  nombre text not null,
  categoria text not null,
  tipo_documento text,
  es_carpeta boolean not null default false,
  onedrive_item_id text not null,
  onedrive_parent_id text,
  onedrive_path text,
  onedrive_web_url text,
  fecha date not null default current_date,
  observaciones text,
  metadata jsonb not null default '{}'::jsonb,
  creado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (onedrive_item_id)
);

create index if not exists idx_documentos_negocio on public.documentos(negocio_id);
create index if not exists idx_documentos_categoria on public.documentos(categoria);
create index if not exists idx_documentos_parent on public.documentos(onedrive_parent_id);

comment on table public.documentos is
  'Ficha de documento/carpeta. El archivo vive en OneDrive; onedrive_item_id es la referencia Graph.';
comment on column public.documentos.negocio_id is
  'Negocio dueño: HYDREX, HARDTECH, HANGARC, VIRTUALWAITER o STGL (general).';
comment on column public.documentos.categoria is
  'Texto libre (legal, factura, contrato, …) — sin catálogo cerrado.';

alter table public.documentos enable row level security;

create policy "documentos_select_authenticated" on public.documentos
  for select to authenticated using (true);
create policy "documentos_insert_authenticated" on public.documentos
  for insert to authenticated with check (true);
create policy "documentos_update_authenticated" on public.documentos
  for update to authenticated using (true);
create policy "documentos_delete_authenticated" on public.documentos
  for delete to authenticated using (true);

create trigger set_updated_at_documentos
  before update on public.documentos
  for each row execute function public.set_updated_at();

-- Tokens OAuth de la cuenta única OneDrive de STGL (service role only)
create table if not exists public.ms_graph_tokens (
  id int primary key default 1,
  access_token text,
  refresh_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

comment on table public.ms_graph_tokens is
  'Refresh/access token de la cuenta OneDrive de STGL. Solo service role — sin policies para authenticated.';

alter table public.ms_graph_tokens enable row level security;
-- Sin policies para authenticated a propósito.
